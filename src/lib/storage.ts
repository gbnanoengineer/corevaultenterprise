import fs from "fs";
import path from "path";
import { UPLOADS_DIR } from "./db";
import { isFirebaseConfigured, storageBucket } from "./firebase";

export interface StoredAsset {
  storagePath: string;
  isCloudBucket: boolean;
  publicUrl?: string;
}

/**
 * Saves asset to Firebase Cloud Storage Bucket or local disk with mirror sync.
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
  let publicUrl: string | undefined = undefined;

  // Upload to Firebase Storage Bucket if configured
  if (isFirebaseConfigured && storageBucket) {
    try {
      const file = storageBucket.file(`vault/${storageFileName}`);
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            uploadedAt: new Date().toISOString(),
          },
        },
        resumable: false,
      });

      isCloudBucket = true;
      // Get public URL or signed bucket URL
      publicUrl = `https://storage.googleapis.com/${storageBucket.name}/vault/${storageFileName}`;
    } catch (err) {
      console.warn("Failed to upload to Firebase Bucket, falling back to local storage:", err);
    }
  }

  return {
    storagePath: storageFileName,
    isCloudBucket,
    publicUrl,
  };
}

/**
 * Retrieves asset buffer from local disk or cloud bucket.
 */
export async function getAssetBuffer(storageFileName: string): Promise<Buffer | null> {
  const localFilePath = path.join(UPLOADS_DIR, storageFileName);

  if (fs.existsSync(localFilePath)) {
    return fs.readFileSync(localFilePath);
  }

  // Attempt pull from Firebase Cloud Storage bucket if local is missing
  if (isFirebaseConfigured && storageBucket) {
    try {
      const file = storageBucket.file(`vault/${storageFileName}`);
      const [exists] = await file.exists();
      if (exists) {
        const [downloadedBuffer] = await file.download();
        // Cache locally for fast subsequent reads
        fs.writeFileSync(localFilePath, downloadedBuffer);
        return downloadedBuffer;
      }
    } catch (err) {
      console.error("Error retrieving asset from cloud bucket:", err);
    }
  }

  return null;
}

/**
 * On-Delete Cleanup: Deletes file from both Firebase Cloud Bucket and local storage disk.
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

  // 2. Delete from Firebase Cloud Storage Bucket
  if (isFirebaseConfigured && storageBucket) {
    try {
      const file = storageBucket.file(`vault/${storageFileName}`);
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
        cleaned = true;
      }
    } catch (err) {
      console.error("Failed to delete asset from Firebase Cloud Storage bucket:", err);
    }
  }

  return cleaned;
}

/**
 * Batch On-Delete Cleanup for multiple assets (e.g. when deleting a folder with all its files)
 */
export async function deleteMultipleAssets(storageFileNames: string[]): Promise<number> {
  let count = 0;
  for (const fileName of storageFileNames) {
    const ok = await deleteAsset(fileName);
    if (ok) count++;
  }
  return count;
}
