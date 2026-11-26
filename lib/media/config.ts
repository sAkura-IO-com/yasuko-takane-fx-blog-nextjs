import "server-only";

export type MediaConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

const ENV_NAMES = {
  accountId: "R2_ACCOUNT_ID",
  accessKeyId: "R2_ACCESS_KEY_ID",
  secretAccessKey: "R2_SECRET_ACCESS_KEY",
  bucket: "R2_BUCKET",
  publicBaseUrl: "R2_PUBLIC_BASE_URL",
} as const;

function readMediaConfig(): MediaConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(
    /\/+$/,
    "",
  );
  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicBaseUrl
  ) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

export function requireMediaConfig(): MediaConfig {
  const config = readMediaConfig();
  if (config) return config;

  const missing = Object.entries(ENV_NAMES)
    .filter(([, name]) => !process.env[name]?.trim())
    .map(([, name]) => name);
  throw new Error(
    `R2 图片库未配置：缺少环境变量 ${missing.join("、")}（参考 .env.example）`,
  );
}
