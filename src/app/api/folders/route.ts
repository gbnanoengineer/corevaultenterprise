import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, parent_id = null, is_private = 0 } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const id = "folder_" + crypto.randomUUID().slice(0, 8);
    const ownerUserId = is_private ? user.id : null;

    db.prepare(`
      INSERT INTO folders (id, name, parent_id, is_private, owner_user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), parent_id || null, is_private ? 1 : 0, ownerUserId);

    const folder = db.prepare("SELECT * FROM folders WHERE id = ?").get(id);

    return NextResponse.json({ success: true, folder });
  } catch (error) {
    console.error("Folders POST error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Folder ID required" }, { status: 400 });
    }

    db.prepare("DELETE FROM folders WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Folders DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
