import { fileExtensionFromName, isAllowedFileExtension } from "./files";

import { MEDIA_EXT_BY_MIME } from "./validate";

function extFromFilename(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && /^[a-z0-9]{1,8}$/.test(ext) ? ext : null;
}

export function generateMediaKey(
  filename: string,
  contentType: string,
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const ext =
    extFromFilename(filename) ?? MEDIA_EXT_BY_MIME[contentType] ?? "bin";
  return `library/${year}/${month}/${crypto.randomUUID()}.${ext}`;
}

export function generateFileKey(filename: string): string | null {
  const ext = fileExtensionFromName(filename);
  if (!ext || !isAllowedFileExtension(ext)) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `files/${year}/${month}/${crypto.randomUUID()}.${ext}`;
}
