import {
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { resolveR2Region } from "../lib/media/s3-options";

const endpoint = process.env.R2_ENDPOINT?.trim();
const bucket = process.env.R2_BUCKET?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const forcePathStyle = ["1", "true", "yes"].includes(
  (process.env.R2_FORCE_PATH_STYLE ?? "").trim().toLowerCase(),
);

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  console.warn("[storage-init] 缺少 R2_* 配置，跳过桶初始化");
  process.exit(0);
}

const client = new S3Client({
  region: resolveR2Region(),
  endpoint,
  forcePathStyle,
  credentials: { accessKeyId, secretAccessKey },
});

async function createBucket() {
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`[storage-init] 已创建桶 ${bucket}`);
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name !== "BucketAlreadyOwnedByYou" && name !== "BucketAlreadyExists") {
      throw error;
    }
  }
}

async function allowPublicRead() {
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      }),
    }),
  );
  console.log(`[storage-init] 已开启桶 ${bucket} 的公开读取`);
}

async function allowBrowserUpload() {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  console.log(`[storage-init] 已配置桶 ${bucket} 的 CORS`);
}

await createBucket();
try {
  await allowPublicRead();
} catch (error) {
  console.warn("[storage-init] 设置公开读取失败：", error);
}
try {
  await allowBrowserUpload();
} catch (error) {
  console.warn("[storage-init] 设置 CORS 失败：", error);
}
console.log(`[storage-init] 桶 ${bucket} 已就绪`);
