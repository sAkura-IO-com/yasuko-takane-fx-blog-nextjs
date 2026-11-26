import "server-only";

import { CopyObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { assertSiteWritable } from "@/lib/site/writable";

import { requireMediaConfig } from "./config";
import { getPresignS3Client, getS3Client } from "./s3";

export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function createPresignedPutUrl(
  key: string,
  contentType: string,
  options: { contentLength?: number } = {},
): Promise<string> {
  await assertSiteWritable();
  const { bucket } = requireMediaConfig();
  const contentLength = options.contentLength;
  return getSignedUrl(
    getPresignS3Client(),
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: MEDIA_CACHE_CONTROL,
      ...(contentLength ? { ContentLength: contentLength } : {}),
    }),
    {
      expiresIn: 600,
      ...(contentLength
        ? { signableHeaders: new Set(["content-length"]) }
        : {}),
    },
  );
}

export async function finalizeUploadedObject(
  key: string,
  contentType: string,
  options: { contentDisposition?: string } = {},
): Promise<void> {
  await assertSiteWritable();
  const { bucket } = requireMediaConfig();
  await getS3Client().send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: key,
      CopySource: `${bucket}/${key}`,
      ContentType: contentType,
      CacheControl: MEDIA_CACHE_CONTROL,
      MetadataDirective: "REPLACE",
      ...(options.contentDisposition
        ? { ContentDisposition: options.contentDisposition }
        : {}),
    }),
  );
}
