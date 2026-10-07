import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = db.prepare(`
      SELECT sl.*,
             f.name as file_name, f.mime_type as file_mime, f.file_size,
             fo.name as folder_name,
             u.display_name as creator_name
      FROM shared_links sl
      LEFT JOIN files f ON sl.file_id = f.id
      LEFT JOIN folders fo ON sl.folder_id = fo.id
      LEFT JOIN users u ON sl.created_by_user_id = u.id
      ORDER BY sl.created_at DESC
    `).all();

    return NextResponse.json({ links });
  } catch (error) {
    console.error("Share links GET error:", error);
    return NextResponse.json({ error: "Failed to fetch share links" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { file_id, folder_id, label } = body;

    if (!file_id && !folder_id) {
      return NextResponse.json({ error: "Either file_id or folder_id is required" }, { status: 400 });
    }

    const id = "sh_" + crypto.randomUUID().slice(0, 8);
    const token = crypto.randomBytes(8).toString("hex");

    db.prepare(`
      INSERT INTO shared_links (id, token, file_id, folder_id, created_by_user_id, label, view_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1)
    `).run(id, token, file_id || null, folder_id || null, user.id, label || "Shared Asset");

    const created = db.prepare("SELECT * FROM shared_links WHERE id = ?").get(id);

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
