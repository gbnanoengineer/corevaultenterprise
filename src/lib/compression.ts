import sharp from "sharp";
import path from "path";

export interface CompressionResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  mimeType: string;
  fileName: string;
  wasCompressed: boolean;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"];

/**
 * Optimizes and compresses incoming assets before storing into cloud buckets or disk.
 * - Converts raster images to modern high-efficiency WebP (quality 82, max 2048px)
 * - Strips EXIF metadata for privacy and minimal payload
 * - Preserves documents (PDF, Excel, Word, Code) intact for syntax/preview accuracy
 */
export async function compressAsset(
  originalBuffer: Buffer,
  originalFileName: string,
  originalMimeType: string
): Promise<CompressionResult> {
  const originalSize = originalBuffer.length;
  const ext = path.extname(originalFileName).toLowerCase();
  const isImage = IMAGE_EXTENSIONS.includes(ext) || originalMimeType.startsWith("image/");
  const isSvg = ext === ".svg" || originalMimeType.includes("svg");

  if (isImage && !isSvg) {
    try {
      // Process image using sharp
      let pipeline = sharp(originalBuffer).rotate(); // auto-orient based on EXIF before stripping

      const metadata = await pipeline.metadata();

      // Resize if dimension exceeds 2048px to prevent huge 20MB phone camera uploads
      if ((metadata.width && metadata.width > 2048) || (metadata.height && metadata.height > 2048)) {
        pipeline = pipeline.resize(2048, 2048, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert to WebP with balanced 82 quality
      const compressedBuffer = await pipeline
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      // Only use compressed buffer if it actually saves space
      if (compressedBuffer.length < originalSize) {
        const baseName = path.basename(originalFileName, ext);
        const newFileName = `${baseName}.webp`;
        const savings = Math.round(((originalSize - compressedBuffer.length) / originalSize) * 100);

        return {
          buffer: compressedBuffer,
          originalSize,
          compressedSize: compressedBuffer.length,
          savingsPercent: savings,
          mimeType: "image/webp",
          fileName: newFileName,
          wasCompressed: true,
        };
      }
    } catch (err) {
      console.warn("Sharp compression error, using original buffer:", err);
    }
  }

  // Fallback / Non-image: return original buffer
  return {
    buffer: originalBuffer,
    originalSize,
    compressedSize: originalSize,
    savingsPercent: 0,
    mimeType: originalMimeType,
    fileName: originalFileName,
    wasCompressed: false,
  };
}
