export const CONTENT_TYPE_ICONS = [
  "text.page",
  "newspaper",
  "sparkles",
  "tag.fill",
  "photo.fill",
  "clock",
  "safari",
  "link",
  "info.circle",
  "gear",
] as const;

export function isContentTypeIcon(
  value: string,
): value is (typeof CONTENT_TYPE_ICONS)[number] {
  return (CONTENT_TYPE_ICONS as readonly string[]).includes(value);
}
