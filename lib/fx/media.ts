import { mediaUrl } from "@/lib/media/url";

export function fxCoverUrl(coverKey: string | null): string | null {
  if (!coverKey) return null;
  const url = mediaUrl(coverKey);
  if (!url) return null;
  return /^(https?:)?\/\//.test(url) || url.startsWith("/") ? url : null;
}
