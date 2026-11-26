export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;

export const MEDIA_MIME_WHITELIST = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;

export const MEDIA_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export function isAllowedMediaMime(mime: string): boolean {
  return (MEDIA_MIME_WHITELIST as readonly string[]).includes(mime);
}

export function validateUploadInput(
  input: {
    filename: unknown;
    contentType: unknown;
    size: unknown;
  },
  options: { allowedMimes?: readonly string[] } = {},
): string | null {
  const { filename, contentType, size } = input;
  const allowed = options.allowedMimes ?? MEDIA_MIME_WHITELIST;

  if (typeof filename !== "string" || filename.trim().length === 0) {
    return "缺少文件名";
  }
  if (filename.length > 255) {
    return "文件名过长";
  }
  if (typeof contentType !== "string" || !allowed.includes(contentType)) {
    const labels = allowed.map((mime) => MEDIA_EXT_BY_MIME[mime] ?? mime);
    return `仅支持图片格式：${labels.join(" / ")}`;
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return "文件大小无效";
  }
  if (size > MEDIA_MAX_BYTES) {
    return "图片不能超过 10MB";
  }
  return null;
}
