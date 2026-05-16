import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Minimal R2 uploader for the seed script. Mirrors apps/web/lib/r2.ts but
// stays self-contained so packages/db has no dependency on the web app.
function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (check apps/web/.env.local)`);
  return v;
}

const accountId = env("R2_ACCOUNT_ID");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
  },
});

export async function uploadToR2(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: env("R2_BUCKET_NAME"),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}
