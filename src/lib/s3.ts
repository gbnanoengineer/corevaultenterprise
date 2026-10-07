import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const S3_ENDPOINT = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL;
const S3_REGION = process.env.S3_REGION || "auto";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "expense-vault-assets";
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === "true" || !!S3_ENDPOINT?.includes("minio");

export const isS3Configured = Boolean(
  S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET_NAME
);

let s3Client: S3Client | null = null;

if (isS3Configured) {
  try {
    s3Client = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID!,
        secretAccessKey: S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: S3_FORCE_PATH_STYLE,
    });
    console.log(`S3-compatible bucket client initialized for bucket: ${S3_BUCKET_NAME}`);
  } catch (err) {
    console.warn("Failed to initialize S3 client:", err);
  }
}

export async function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<boolean> {
  if (!s3Client || !isS3Configured) return false;
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `vault/${key}`,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return true;
  } catch (err) {
    console.error(`Error uploading ${key} to S3 bucket:`, err);
    return false;
  }
}

export async function downloadFromS3(key: string): Promise<Buffer | null> {
  if (!s3Client || !isS3Configured) return null;
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `vault/${key}`,
      })
    );
    if (!response.Body) return null;
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (err) {
    console.error(`Error downloading ${key} from S3 bucket:`, err);
    return null;
  }
}

export async function deleteFromS3(key: string): Promise<boolean> {
  if (!s3Client || !isS3Configured) return false;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `vault/${key}`,
      })
    );
    return true;
  } catch (err) {
    console.error(`Error deleting ${key} from S3 bucket:`, err);
    return false;
  }
}

export async function deleteMultipleFromS3(keys: string[]): Promise<number> {
  if (!s3Client || !isS3Configured || keys.length === 0) return 0;
  try {
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: S3_BUCKET_NAME,
        Delete: {
          Objects: keys.map((k) => ({ Key: `vault/${k}` })),
          Quiet: true,
        },
      })
    );
    return keys.length;
  } catch (err) {
    console.error("Error bulk deleting from S3 bucket:", err);
    return 0;
  }
}

export { S3_BUCKET_NAME, s3Client };
