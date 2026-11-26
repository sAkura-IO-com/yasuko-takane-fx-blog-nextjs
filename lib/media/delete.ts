import "server-only";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { assertSiteWritable } from "@/lib/site/writable";

import { requireMediaConfig } from "./config";
import { getS3Client } from "./s3";

export async function deleteMediaObject(key: string): Promise<void> {
  await assertSiteWritable();
  const { bucket } = requireMediaConfig();
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );
}
