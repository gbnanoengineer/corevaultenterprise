import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMultipleAssets } from "@/lib/storage";
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
    const folderId = searchParams.get("id");

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID required" }, { status: 400 });
    }

    // ON-DELETE RECURSIVE CLEANUP: Collect all descendant folders & files
    const allFolderIds: string[] = [folderId];
    let toCheck = [folderId];

    while (toCheck.length > 0) {
      const currentId = toCheck.pop();
      const children = db.prepare("SELECT id FROM folders WHERE parent_id = ?").all(currentId) as any[];
      for (const child of children) {
        allFolderIds.push(child.id);
        toCheck.push(child.id);
      }
    }

    // Find all files in these folders
    const placeholders = allFolderIds.map(() => "?").join(",");
    const filesToDelete = db.prepare(
      `SELECT storage_path FROM files WHERE folder_id IN (${placeholders})`
    ).all(...allFolderIds) as any[];

    const storagePaths = filesToDelete.map((f) => f.storage_path).filter(Boolean);

    // Delete bucket objects and physical files
    if (storagePaths.length > 0) {
      await deleteMultipleAssets(storagePaths);
    }

    // Delete files and folders records
    db.prepare(`DELETE FROM files WHERE folder_id IN (${placeholders})`).run(...allFolderIds);
    db.prepare(`DELETE FROM shared_links WHERE folder_id IN (${placeholders})`).run(...allFolderIds);
    db.prepare(`DELETE FROM folders WHERE id IN (${placeholders})`).run(...allFolderIds);

    return NextResponse.json({
      success: true,
      cleanedFilesCount: storagePaths.length,
      message: `Deleted folder and cleaned ${storagePaths.length} bucket assets.`,
    });
  } catch (error) {
    console.error("Folders DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
