import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, UPLOADS_DIR } from "@/lib/db";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = db.prepare("SELECT * FROM files WHERE id = ?").get(id) as any;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check permission if private
    if (file.is_private) {
      const user = await getCurrentUser();
      if (!user || user.id !== file.uploaded_by_user_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const filePath = path.join(UPLOADS_DIR, file.storage_path);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File data missing on server" }, { status: 404 });
    }

    const ext = path.extname(file.original_name).toLowerCase();
    const mime = file.mime_type || "";

    // 1. Images
    if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"].includes(ext)) {
      return NextResponse.json({
        type: "image",
        file,
        url: `/api/files/${file.id}`,
      });
    }

    // 2. PDF
    if (mime === "application/pdf" || ext === ".pdf") {
      return NextResponse.json({
        type: "pdf",
        file,
        url: `/api/files/${file.id}`,
      });
    }

    // 3. Excel Spreadsheets (.xlsx, .xls, .csv)
    if (
      [".xlsx", ".xls", ".csv"].includes(ext) ||
      mime.includes("spreadsheetml") ||
      mime.includes("excel") ||
      mime.includes("csv")
    ) {
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheets: Record<string, any[]> = {};

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        // Convert to array of arrays (rows)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        sheets[sheetName] = rows;
      });

      return NextResponse.json({
        type: "excel",
        file,
        sheetNames: workbook.SheetNames,
        sheets,
      });
    }

    // 4. Word Documents (.docx)
    if (ext === ".docx") {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.convertToHtml({ buffer });
      return NextResponse.json({
        type: "word",
        file,
        html: result.value,
        messages: result.messages,
      });
    }

    // 5. Code & Text Files
    const codeExtensions: Record<string, string> = {
      ".json": "json",
      ".js": "javascript",
      ".ts": "typescript",
      ".tsx": "typescript",
      ".jsx": "javascript",
      ".py": "python",
      ".md": "markdown",
      ".txt": "plaintext",
      ".html": "html",
      ".css": "css",
      ".scss": "scss",
      ".yml": "yaml",
      ".yaml": "yaml",
      ".sql": "sql",
      ".sh": "bash",
      ".env": "properties",
      ".xml": "xml",
      ".csv": "csv",
    };

    if (codeExtensions[ext] || mime.startsWith("text/")) {
      const content = fs.readFileSync(filePath, "utf-8");
      return NextResponse.json({
        type: "code",
        file,
        content,
        language: codeExtensions[ext] || "plaintext",
      });
    }

    // 6. PowerPoint Presentation (.pptx, .ppt)
    if ([".pptx", ".ppt"].includes(ext)) {
      return NextResponse.json({
        type: "presentation",
        file,
        message: "PowerPoint Presentation document ready for viewing and download.",
        downloadUrl: `/api/files/${file.id}?download=1`,
      });
    }

    // Fallback: Generic document
    return NextResponse.json({
      type: "generic",
      file,
      downloadUrl: `/api/files/${file.id}?download=1`,
    });
  } catch (error) {
    console.error("File preview error:", error);
    return NextResponse.json({ error: "Failed to parse preview" }, { status: 500 });
  }
}
