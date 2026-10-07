import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;

    const links = db.prepare(`
      SELECT sl.*,
             f.name as file_name, f.mime_type as file_mime, f.file_size,
             fo.name as folder_name,
             u.display_name as creator_name
      FROM shared_links sl
      LEFT JOIN files f ON sl.file_id = f.id
      LEFT JOIN folders fo ON sl.folder_id = fo.id
      LEFT JOIN users u ON sl.created_by_user_id = u.id
      WHERE sl.organization_id = ?
      ORDER BY sl.created_at DESC
    `).all(activeOrg.id);

    return NextResponse.json({ links });
  } catch (error) {
    console.error("Share links GET error:", error);
    return NextResponse.json({ error: "Failed to fetch share links" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { user, activeOrg } = context;
    const body = await req.json();
    const { file_id, folder_id, label } = body;

    if (!file_id && !folder_id) {
      return NextResponse.json({ error: "Either file_id or folder_id is required" }, { status: 400 });
    }

    // Verify file or folder belongs to active organization
    if (file_id) {
      const fileCheck = db.prepare("SELECT id FROM files WHERE id = ? AND organization_id = ?").get(file_id, activeOrg.id);
      if (!fileCheck) {
        return NextResponse.json({ error: "File not found or access denied in this organization" }, { status: 404 });
      }
    }

    if (folder_id) {
      const folderCheck = db.prepare("SELECT id FROM folders WHERE id = ? AND organization_id = ?").get(folder_id, activeOrg.id);
      if (!folderCheck) {
        return NextResponse.json({ error: "Folder not found or access denied in this organization" }, { status: 404 });
      }
    }

    const id = "sh_" + crypto.randomUUID().slice(0, 8);
    const token = crypto.randomBytes(8).toString("hex");

    db.prepare(`
      INSERT INTO shared_links (id, token, file_id, folder_id, created_by_user_id, label, view_count, is_active, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
    `).run(id, token, file_id || null, folder_id || null, user.id, label || "Shared Asset", activeOrg.id);

    const created = db.prepare("SELECT * FROM shared_links WHERE id = ? AND organization_id = ?").get(id, activeOrg.id);

    return NextResponse.json({
      success: true,
      share: created,
      token,
      url: `/share/${token}`,
    });
  } catch (error) {
    console.error("Share link POST error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
