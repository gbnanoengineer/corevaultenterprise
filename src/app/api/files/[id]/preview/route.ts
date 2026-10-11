import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAssetBuffer } from "@/lib/storage";
import path from "path";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import JSZip from "jszip";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, activeOrg } = context;
    const { id } = await params;
    const file = db.prepare("SELECT * FROM files WHERE id = ? AND organization_id = ?").get(id, activeOrg.id) as any;

    if (!file) {
      return NextResponse.json({ error: "File not found or access denied in this organization" }, { status: 404 });
    }

    // Check permission if private
    if (file.is_private && user.id !== file.uploaded_by_user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buffer = await getAssetBuffer(file.storage_path);
    if (!buffer) {
      return NextResponse.json({ error: "File data missing in storage" }, { status: 404 });
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
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheets: Record<string, any[]> = {};
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      });

      return NextResponse.json({
        type: "excel",
        file,
        sheetNames: workbook.SheetNames,
        sheets,
        data: sheets,
      });
    }

    // 4. Word Documents (.docx)
    if (ext === ".docx" || mime.includes("wordprocessingml")) {
      const docxResult = await mammoth.convertToHtml(
        { buffer },
        {
          convertImage: mammoth.images.imgElement((image) => {
            return image.read("base64").then((imageBuffer) => ({
              src: `data:${image.contentType};base64,${imageBuffer}`,
            }));
          }),
        }
      );
      return NextResponse.json({
        type: "word",
        file,
        html: docxResult.value,
      });
    }

    // 5. PowerPoint Presentations (.pptx)
    if (ext === ".pptx" || mime.includes("presentationml")) {
      try {
        const zip = await JSZip.loadAsync(buffer);
        const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f));
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
          return numA - numB;
        });

        const slides = [];
        for (let i = 0; i < slideFiles.length; i++) {
          const xml = await zip.files[slideFiles[i]].async("text");
          const textMatches = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)).map((m) => m[1]);
          const cleanTexts = textMatches
            .map((t) => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim())
            .filter(Boolean);

          const title = cleanTexts[0] || `Slide ${i + 1}`;
          const content = cleanTexts.slice(1);

          slides.push({
            slideNumber: i + 1,
            title,
            content,
          });
        }

        return NextResponse.json({
          type: "presentation",
          file,
          slideCount: slides.length,
          slides,
        });
      } catch (err: any) {
        console.warn("PPTX parse fallback:", err.message);
      }
    }

    // 6. Code & Plain Text Documents
    const codeExtensions = [
      ".txt", ".json", ".js", ".ts", ".jsx", ".tsx",
      ".html", ".css", ".scss", ".md", ".py", ".sql",
      ".sh", ".yaml", ".yml", ".env", ".xml", ".log"
    ];
    if (codeExtensions.includes(ext) || mime.startsWith("text/")) {
      const textContent = buffer.toString("utf-8");
      return NextResponse.json({
        type: "code",
        file,
        content: textContent,
        language: ext.replace(".", "") || "text",
      });
    }

    // Fallback binary / unsupported format
    return NextResponse.json({
      type: "unsupported",
      file,
      url: `/api/files/${file.id}`,
    });
  } catch (error) {
    console.error("Preview generation error:", error);
    return NextResponse.json({ error: "Failed to generate file preview" }, { status: 500 });
  }
}
