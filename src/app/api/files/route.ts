import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, UPLOADS_DIR } from "@/lib/db";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId"); // null or folder string id
    const search = searchParams.get("search");

    // Fetch folders
    let folderQuery = `
      SELECT f.*, u.display_name as owner_name,
             (SELECT COUNT(*) FROM files WHERE folder_id = f.id) as file_count
      FROM folders f
      LEFT JOIN users u ON f.owner_user_id = u.id
      WHERE (f.is_private = 0 OR f.owner_user_id = ?)
    `;
    const folderParams: any[] = [user.id];

    if (folderId) {
      folderQuery += ` AND f.parent_id = ?`;
      folderParams.push(folderId);
    } else {
      folderQuery += ` AND f.parent_id IS NULL`;
    }

    const folders = db.prepare(folderQuery).all(...folderParams);

    // Fetch files
    let fileQuery = `
      SELECT f.*, u.display_name as uploaded_by_name,
             (SELECT token FROM shared_links WHERE file_id = f.id AND is_active = 1 LIMIT 1) as share_token
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE (f.is_private = 0 OR f.uploaded_by_user_id = ?)
    `;
    const fileParams: any[] = [user.id];

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

    // Current folder info if inside a folder
    let currentFolder = null;
    let breadcrumbs: any[] = [];
    if (folderId) {
      currentFolder = db.prepare("SELECT * FROM folders WHERE id = ?").get(folderId) as any;
      if (currentFolder) {
        breadcrumbs.push({ id: currentFolder.id, name: currentFolder.name });
        let parentId = currentFolder.parent_id;
        while (parentId) {
          const parent = db.prepare("SELECT id, name, parent_id FROM folders WHERE id = ?").get(parentId) as any;
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const uploadedFile = formData.get("file") as File | null;
    const folderId = (formData.get("folderId") as string) || null;
    const isPrivate = formData.get("isPrivate") === "true" || formData.get("isPrivate") === "1" ? 1 : 0;

    if (!uploadedFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = uploadedFile.name;
    const mimeType = uploadedFile.type || "application/octet-stream";
    const extension = path.extname(originalName).toLowerCase();

    // STRICT CHECK: Disallow audio files per user's explicit rule
    const audioExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".wma", ".opus"];
    if (mimeType.startsWith("audio/") || audioExtensions.includes(extension)) {
      return NextResponse.json(
        { error: "Audio files are strictly not permitted in this vault. Supported formats: PDF, Word, Excel, PowerPoint, Images, and Code documents." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    const fileId = "file_" + crypto.randomUUID().slice(0, 10);
    const storageFileName = `${fileId}_${path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storageFilePath = path.join(UPLOADS_DIR, storageFileName);

    fs.writeFileSync(storageFilePath, buffer);

    db.prepare(`
      INSERT INTO files (id, name, original_name, mime_type, file_size, storage_path, folder_id, uploaded_by_user_id, is_private)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fileId,
      originalName,
      originalName,
      mimeType,
      buffer.length,
      storageFileName,
      folderId,
      user.id,
      isPrivate
    );

    const created = db.prepare(`
      SELECT f.*, u.display_name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE f.id = ?
    `).get(fileId);

    return NextResponse.json({ success: true, file: created });
  } catch (error) {
    console.error("Files POST error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
