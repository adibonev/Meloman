import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = requireEnv("R2_ACCOUNT_ID");
const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");

export const R2_BUCKET = requireEnv("R2_BUCKET_NAME");

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const DEFAULT_EXPIRES_IN_SECONDS = 300;

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = DEFAULT_EXPIRES_IN_SECONDS,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn });
}

export async function getDownloadUrl(
  key: string,
  expiresIn = DEFAULT_EXPIRES_IN_SECONDS,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  return getSignedUrl(r2, command, { expiresIn });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
