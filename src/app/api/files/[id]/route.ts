import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, UPLOADS_DIR } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = db.prepare("SELECT * FROM files WHERE id = ?").get(id) as any;

    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Check permissions if private
    if (file.is_private) {
      const user = await getCurrentUser();
      if (!user || user.id !== file.uploaded_by_user_id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const filePath = path.join(UPLOADS_DIR, file.storage_path);
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File data missing on server", { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "1";

    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(file.original_name)}"`
      : `inline; filename="${encodeURIComponent(file.original_name)}"`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.mime_type || "application/octet-stream",
        "Content-Disposition": disposition,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return new NextResponse("Failed to stream file", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const file = db.prepare("SELECT * FROM files WHERE id = ?").get(id) as any;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from disk if exists
    const filePath = path.join(UPLOADS_DIR, file.storage_path);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete physical file:", err);
      }
    }

    db.prepare("DELETE FROM files WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
