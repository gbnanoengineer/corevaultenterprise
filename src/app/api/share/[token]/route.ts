import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAssetBuffer } from "@/lib/storage";
import path from "path";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const link = db.prepare(`
      SELECT sl.*,
             f.name as file_name, f.original_name as file_orig_name, f.mime_type as file_mime, f.file_size, f.storage_path,
             fo.name as folder_name,
             u.display_name as creator_name
      FROM shared_links sl
      LEFT JOIN files f ON sl.file_id = f.id
      LEFT JOIN folders fo ON sl.folder_id = fo.id
      LEFT JOIN users u ON sl.created_by_user_id = u.id
      WHERE sl.token = ? AND sl.is_active = 1
    `).get(token) as any;

    if (!link) {
      return NextResponse.json({ error: "Share link not found or has been revoked" }, { status: 404 });
    }

    // Increment view count
    db.prepare("UPDATE shared_links SET view_count = view_count + 1 WHERE id = ?").run(link.id);

    // If this is a folder share link: get all files in this folder
    let folderFiles: any[] = [];
    if (link.folder_id) {
      folderFiles = db.prepare(`
        SELECT id, name, original_name, mime_type, file_size, created_at
        FROM files
        WHERE folder_id = ?
        ORDER BY name ASC
      `).all(link.folder_id);
    }

    // If this is a file share link: provide preview content if applicable
    let previewData: any = null;
    if (link.file_id && link.storage_path) {
      const buffer = await getAssetBuffer(link.storage_path);
      if (buffer) {
        const ext = path.extname(link.file_orig_name || link.file_name).toLowerCase();
        const mime = link.file_mime || "";

        if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext)) {
          previewData = { type: "image", url: `/api/share/${token}/file/${link.file_id}` };
        } else if (mime === "application/pdf" || ext === ".pdf") {
          previewData = { type: "pdf", url: `/api/share/${token}/file/${link.file_id}` };
        } else if ([".xlsx", ".xls", ".csv"].includes(ext)) {
          const workbook = XLSX.read(buffer, { type: "buffer" });
          const sheets: Record<string, any[]> = {};
          workbook.SheetNames.forEach((name) => {
            sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" });
          });
          previewData = { type: "excel", sheetNames: workbook.SheetNames, sheets };
        } else if (ext === ".docx") {
          const result = await mammoth.convertToHtml({ buffer });
          previewData = { type: "word", html: result.value };
        } else if (mime.startsWith("text/") || [".json", ".js", ".ts", ".py", ".md", ".txt", ".yml", ".yaml"].includes(ext)) {
          previewData = { type: "code", content: buffer.toString("utf-8"), ext };
        }
      }
    }

    return NextResponse.json({
      link: {
        id: link.id,
        token: link.token,
        label: link.label,
        creatorName: link.creator_name,
        created_at: link.created_at,
        viewCount: link.view_count + 1,
        isFile: !!link.file_id,
        isFolder: !!link.folder_id,
        fileName: link.file_name,
        fileSize: link.file_size,
        mimeType: link.file_mime,
        folderName: link.folder_name,
      },
      folderFiles,
      previewData,
      downloadUrl: link.file_id ? `/api/share/${token}/file/${link.file_id}` : null,
    });
  } catch (error) {
    console.error("Share access error:", error);
    return NextResponse.json({ error: "Failed to access shared resource" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const { token } = await params;
    const result = db.prepare("DELETE FROM shared_links WHERE token = ? AND organization_id = ?").run(token, activeOrg.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Share link not found or access denied in this organization" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke share link error:", error);
    return NextResponse.json({ error: "Failed to revoke link" }, { status: 500 });
  }
}
