import type { S3ClientConfig } from "@aws-sdk/client-s3";

export function resolveR2Endpoint(accountId: string): string {
  const override = process.env.R2_ENDPOINT?.trim();
  if (override) return override.replace(/\/+$/, "");
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function resolveR2PublicEndpoint(accountId: string): string {
  const override = process.env.R2_PUBLIC_ENDPOINT?.trim();
  if (override) return override.replace(/\/+$/, "");
  return resolveR2Endpoint(accountId);
}

export function r2ForcePathStyle(): boolean {
  const flag = process.env.R2_FORCE_PATH_STYLE?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function resolveR2Region(): string {
  const region = process.env.R2_REGION?.trim();
  if (region) return region;
  return process.env.R2_ENDPOINT?.trim() ? "us-east-1" : "auto";
}

export function r2ClientOptions(
  input: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
  },
  options: { endpoint?: string } = {},
): S3ClientConfig {
  return {
    region: resolveR2Region(),
    endpoint: options.endpoint ?? resolveR2Endpoint(input.accountId),
    credentials: {
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
    },
    forcePathStyle: r2ForcePathStyle(),
  };
}