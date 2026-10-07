import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { compressAsset } from "@/lib/compression";
import { saveAsset, purgeExpiredFiles } from "@/lib/storage";
import path from "path";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { user, activeOrg } = context;
    const orgId = activeOrg.id;

    // Auto-purge any files whose retention expiry period has lapsed
    await purgeExpiredFiles();

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");

    // Fetch folders belonging strictly to active organization
    let folderQuery = `
      SELECT f.*, u.display_name as owner_name,
             (SELECT COUNT(*) FROM files WHERE folder_id = f.id AND organization_id = ?) as file_count
      FROM folders f
      LEFT JOIN users u ON f.owner_user_id = u.id
      WHERE f.organization_id = ? AND (f.is_private = 0 OR f.owner_user_id = ?)
    `;
    const folderParams: any[] = [orgId, orgId, user.id];

    if (folderId) {
      folderQuery += ` AND f.parent_id = ?`;
      folderParams.push(folderId);
    } else {
      folderQuery += ` AND f.parent_id IS NULL`;
    }

    const folders = db.prepare(folderQuery).all(...folderParams);

    // Fetch files belonging strictly to active organization
    let fileQuery = `
      SELECT f.*, u.display_name as uploaded_by_name,
             (SELECT token FROM shared_links WHERE file_id = f.id AND is_active = 1 LIMIT 1) as share_token
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE f.organization_id = ? AND (f.is_private = 0 OR f.uploaded_by_user_id = ?)
    `;
    const fileParams: any[] = [orgId, user.id];

    if (search) {
      fileQuery += ` AND (f.name LIKE ? OR f.original_name LIKE ?)`;
      fileParams.push(`%${search}%`, `%${search}%`);
    } else if (folderId) {
      fileQuery += ` AND f.folder_id = ?`;
      fileParams.push(folderId);
    } else {
      fileQuery += ` AND f.folder_id IS NULL`;
    }

    fileQuery += ` ORDER BY f.created_at DESC`;

    const files = db.prepare(fileQuery).all(...fileParams);

    // Current folder info and breadcrumbs
    let currentFolder = null;
    let breadcrumbs: any[] = [];
    if (folderId) {
      currentFolder = db.prepare("SELECT * FROM folders WHERE id = ? AND organization_id = ?").get(folderId, orgId) as any;
      if (currentFolder) {
        breadcrumbs.push({ id: currentFolder.id, name: currentFolder.name });
        let parentId = currentFolder.parent_id;
        while (parentId) {
          const parent = db.prepare("SELECT id, name, parent_id FROM folders WHERE id = ? AND organization_id = ?").get(parentId, orgId) as any;
          if (parent) {
            breadcrumbs.unshift({ id: parent.id, name: parent.name });
            parentId = parent.parent_id;
          } else {
            break;
          }
        }
      }
    }

    return NextResponse.json({
      folders,
      files,
      currentFolder,
      breadcrumbs,
    });
  } catch (error) {
    console.error("Files GET error:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { user, activeOrg } = context;
    const orgId = activeOrg.id;

    const formData = await req.formData();
    const uploadedFile = formData.get("file") as File | null;
    const folderId = (formData.get("folderId") as string) || null;
    const isPrivate = formData.get("isPrivate") === "true" || formData.get("isPrivate") === "1" ? 1 : 0;
    const expiryDays = formData.get("expiryDays") as string | null;
    const customExpiryDate = formData.get("customExpiryDate") as string | null;

    if (!uploadedFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify folder belongs to active org if specified
    if (folderId) {
      const folderCheck = db.prepare("SELECT id FROM folders WHERE id = ? AND organization_id = ?").get(folderId, orgId);
      if (!folderCheck) {
        return NextResponse.json({ error: "Invalid target folder or access denied." }, { status: 403 });
      }
    }

    const originalName = uploadedFile.name;
    const rawMimeType = uploadedFile.type || "application/octet-stream";
    const extension = path.extname(originalName).toLowerCase();

    // STRICT AUDIO RESTRICTION
    const audioExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".wma", ".opus"];
    if (rawMimeType.startsWith("audio/") || audioExtensions.includes(extension)) {
      return NextResponse.json(
        { error: "Audio files are strictly not permitted in this vault. Supported formats: PDF, Word, Excel, PowerPoint, Images, and Code documents." },
        { status: 400 }
      );
    }

    // Calculate expiry date if set
    let expiresAt: string | null = null;
    if (customExpiryDate) {
      expiresAt = customExpiryDate;
    } else if (expiryDays && expiryDays !== "never") {
      const days = parseInt(expiryDays, 10);
      if (!isNaN(days) && days > 0) {
        const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        expiresAt = d.toISOString().replace("T", " ").substring(0, 19);
      }
    }

    const rawBuffer = Buffer.from(await uploadedFile.arrayBuffer());

    // ASSET COMPRESSION PIPELINE: compress images with Sharp WebP
    const compressed = await compressAsset(rawBuffer, originalName, rawMimeType);

    const fileId = "file_" + crypto.randomUUID().slice(0, 10);
    const storageFileName = `${fileId}_${path.basename(compressed.fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // S3 CLOUD BUCKET & LOCAL DISK PERSISTENCE
    const stored = await saveAsset(compressed.buffer, storageFileName, compressed.mimeType);

    db.prepare(`
      INSERT INTO files (id, name, original_name, mime_type, file_size, storage_path, folder_id, uploaded_by_user_id, is_private, expires_at, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fileId,
      compressed.fileName,
      originalName,
      compressed.mimeType,
      compressed.compressedSize,
      stored.storagePath,
      folderId,
      user.id,
      isPrivate,
      expiresAt,
      orgId
    );

    const created = db.prepare(`
      SELECT f.*, u.display_name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE f.id = ? AND f.organization_id = ?
    `).get(fileId, orgId);

    return NextResponse.json({
      success: true,
      file: created,
      compression: {
        wasCompressed: compressed.wasCompressed,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        savingsPercent: compressed.savingsPercent,
      },
      isCloudBucket: stored.isCloudBucket,
      expiresAt,
    });
  } catch (error) {
    console.error("Files POST error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
