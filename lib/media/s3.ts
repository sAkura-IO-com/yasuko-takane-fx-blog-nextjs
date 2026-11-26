import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

import { requireMediaConfig } from "./config";
import {
  resolveR2Endpoint,
  resolveR2PublicEndpoint,
  r2ClientOptions,
} from "./s3-options";

let client: S3Client | undefined;
let presignClient: S3Client | undefined;

export function getS3Client(): S3Client {
  if (client) return client;
  const { accountId, accessKeyId, secretAccessKey } = requireMediaConfig();
  client = new S3Client(
    r2ClientOptions({ accountId, accessKeyId, secretAccessKey }),
  );
  return client;
}

export function getPresignS3Client(): S3Client {
  if (presignClient) return presignClient;
  const { accountId, accessKeyId, secretAccessKey } = requireMediaConfig();
  const publicEndpoint = resolveR2PublicEndpoint(accountId);
  if (publicEndpoint === resolveR2Endpoint(accountId)) return getS3Client();
  presignClient = new S3Client(
    r2ClientOptions(
      { accountId, accessKeyId, secretAccessKey },
      { endpoint: publicEndpoint },
    ),
  );
  return presignClient;
}