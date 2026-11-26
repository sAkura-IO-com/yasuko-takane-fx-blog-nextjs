export const MEDIA_PREFIX = "library/";
export const FILES_PREFIX = "files/";

export function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function isMediaKey(value: string): boolean {
  return value.startsWith(MEDIA_PREFIX) && !value.includes("..");
}

export function isFilesKey(value: string): boolean {
  if (!value.startsWith(FILES_PREFIX) || value.includes("..")) return false;
  return /^files\/\d{4}\/\d{2}\/[^/]+\.[a-z0-9]{1,8}$/.test(value);
}

export type MediaScope = "library" | "files";

export function isMediaScope(value: unknown): value is MediaScope {
  return value === "library" || value === "files";
}

export function scopePrefix(scope: MediaScope): string {
  if (scope === "files") return FILES_PREFIX;
  return MEDIA_PREFIX;
}

export function isKeyInScope(scope: MediaScope, key: string): boolean {
  if (scope === "files") return isFilesKey(key);
  return isMediaKey(key);
}

export function mediaUrl(key: string): string {
  if (isExternalUrl(key)) return key;
  const base = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  return base ? `${base}/${key}` : key;
}
