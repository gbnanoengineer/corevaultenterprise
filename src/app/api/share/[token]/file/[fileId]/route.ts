import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAssetBuffer } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ token: string; fileId: string }> }) {
  try {
    const { token, fileId } = await params;

    // Verify token exists and is active
    const link = db.prepare("SELECT * FROM shared_links WHERE token = ? AND is_active = 1").get(token) as any;
    if (!link) {
      return new NextResponse("Invalid or expired share link", { status: 404 });
    }

    // Verify the file is either the direct shared file or belongs to the shared folder
    const file = db.prepare("SELECT * FROM files WHERE id = ?").get(fileId) as any;
    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    const isAuthorized =
      link.file_id === fileId ||
      (link.folder_id && file.folder_id === link.folder_id);

    if (!isAuthorized) {
      return new NextResponse("Unauthorized access to this file", { status: 403 });
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
    console.error("Public file download error:", error);
    return new NextResponse("Download failed", { status: 500 });
  }
}
