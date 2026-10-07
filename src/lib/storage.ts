import fs from "fs";
import path from "path";
import { db, UPLOADS_DIR } from "./db";
import {
  isS3Configured,
  uploadToS3,
  downloadFromS3,
  deleteFromS3,
  deleteMultipleFromS3,
  S3_BUCKET_NAME,
} from "./s3";

export interface StoredAsset {
  storagePath: string;
  isCloudBucket: boolean;
  bucketName?: string;
}

/**
 * Saves asset to S3-compatible cloud bucket (e.g. Cloudflare R2, MinIO, AWS S3)
 * or local disk with mirror sync.
 */
export async function saveAsset(
  buffer: Buffer,
  storageFileName: string,
  mimeType: string
): Promise<StoredAsset> {
  // Always write local copy for instant streaming and offline durability
  const localFilePath = path.join(UPLOADS_DIR, storageFileName);
  fs.writeFileSync(localFilePath, buffer);

  let isCloudBucket = false;

  // Upload to S3-compatible cloud bucket if configured
  if (isS3Configured) {
    const uploaded = await uploadToS3(storageFileName, buffer, mimeType);
    if (uploaded) {
      isCloudBucket = true;
    }
  }

  return {
    storagePath: storageFileName,
    isCloudBucket,
    bucketName: isCloudBucket ? S3_BUCKET_NAME : undefined,
  };
}

/**
 * Retrieves asset buffer from local disk or S3 bucket.
 */
export async function getAssetBuffer(storageFileName: string): Promise<Buffer | null> {
  const localFilePath = path.join(UPLOADS_DIR, storageFileName);

  if (fs.existsSync(localFilePath)) {
    return fs.readFileSync(localFilePath);
  }

  // Attempt pull from S3 bucket if local copy is missing
  if (isS3Configured) {
    try {
      const buffer = await downloadFromS3(storageFileName);
      if (buffer) {
        fs.writeFileSync(localFilePath, buffer);
        return buffer;
      }
    } catch (err) {
      console.error("Error retrieving asset from S3 bucket:", err);
    }
  }

  return null;
}

/**
 * On-Delete Cleanup: Deletes file from both S3 bucket and local disk.
 */
export async function deleteAsset(storageFileName: string): Promise<boolean> {
  let cleaned = false;

  // 1. Delete from local disk
  const localFilePath = path.join(UPLOADS_DIR, storageFileName);
  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
      cleaned = true;
    } catch (err) {
      console.error("Failed to delete local physical file:", err);
    }
  }

  // 2. Delete from S3-compatible bucket
  if (isS3Configured) {
    try {
      const s3Deleted = await deleteFromS3(storageFileName);
      if (s3Deleted) cleaned = true;
    } catch (err) {
      console.error("Failed to delete asset from S3 bucket:", err);
    }
  }

  return cleaned;
}

/**
 * Batch On-Delete Cleanup for multiple assets (e.g. cascading folder deletion)
 */
export async function deleteMultipleAssets(storageFileNames: string[]): Promise<number> {
  let count = 0;

  // Local disk deletions
  for (const fileName of storageFileNames) {
    const localFilePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        count++;
      } catch (err) {
        console.error("Failed to delete local file:", err);
      }
    }
  }

  // Batch delete from S3 bucket
  if (isS3Configured) {
    try {
      await deleteMultipleFromS3(storageFileNames);
    } catch (err) {
      console.error("Failed to bulk delete from S3 bucket:", err);
    }
  }

  return count;
}

/**
 * Automated Expiry Cleanup:
 * Checks for files whose expires_at timestamp has passed,
 * deletes their S3 bucket objects & local files, and removes their records.
 */
export async function purgeExpiredFiles(): Promise<number> {
  try {
    const expiredFiles = db
      .prepare(
        "SELECT id, storage_path, name FROM files WHERE expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now')"
      )
      .all() as any[];

    if (expiredFiles.length === 0) return 0;

    for (const file of expiredFiles) {
      if (file.storage_path) {
        await deleteAsset(file.storage_path);
      }
      db.prepare("DELETE FROM shared_links WHERE file_id = ?").run(file.id);
      db.prepare("DELETE FROM files WHERE id = ?").run(file.id);
    }

    console.log(`Auto-purged ${expiredFiles.length} expired files and bucket assets.`);
    return expiredFiles.length;
  } catch (err) {
    console.error("Error purging expired files:", err);
    return 0;
  }
}
