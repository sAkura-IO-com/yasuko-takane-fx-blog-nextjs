export const COMMENT_MAX_LENGTH = 2000;

export const COMMENT_NAME_MAX_LENGTH = 40;

export function commentExcerpt(body: string, maxLength = 160): string {
  const text = body.trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

const commentTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatCommentTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return commentTimeFormatter.format(date);
}
