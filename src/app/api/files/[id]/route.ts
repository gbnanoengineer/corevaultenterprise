import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAssetBuffer, deleteAsset } from "@/lib/storage";

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

    const buffer = await getAssetBuffer(file.storage_path);
    if (!buffer) {
      return new NextResponse("File data missing in storage", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "1";

    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(file.original_name)}"`
      : `inline; filename="${encodeURIComponent(file.original_name)}"`;

    return new NextResponse(new Uint8Array(buffer), {
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

    // ON-DELETE CLEANUP: Delete asset from Cloud Storage Bucket and local storage
    if (file.storage_path) {
      await deleteAsset(file.storage_path);
    }

    // Remove any shared links associated with this file
    db.prepare("DELETE FROM shared_links WHERE file_id = ?").run(id);

    // Delete record from database
    db.prepare("DELETE FROM files WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "File and bucket asset deleted successfully" });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
