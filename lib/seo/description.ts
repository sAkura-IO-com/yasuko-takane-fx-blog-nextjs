export const META_DESCRIPTION_MAX = 160;
export const META_DESCRIPTION_MIN_EXCERPT = 40;

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\|/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function clampMetaDescription(
  text: string,
  max = META_DESCRIPTION_MAX,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;

  const budget = max - 1;
  const slice = normalized.slice(0, budget);
  const punctuation = Math.max(
    slice.lastIndexOf("。"),
    slice.lastIndexOf("！"),
    slice.lastIndexOf("？"),
    slice.lastIndexOf("；"),
    slice.lastIndexOf("、"),
  );
  const comma = Math.max(slice.lastIndexOf("，"), slice.lastIndexOf(","));
  const space = slice.lastIndexOf(" ");
  const minBreak = Math.floor(budget * 0.6);

  if (punctuation >= minBreak) {
    return slice.slice(0, punctuation + 1);
  }
  const soft = Math.max(comma, space);
  const cut = soft >= minBreak ? slice.slice(0, soft) : slice;
  return `${cut.trimEnd()}…`;
}

export function seoDescription(input: {
  excerpt?: string | null;
  body?: string | null;
  fallback: string;
}): string {
  const excerpt = input.excerpt?.trim() ?? "";
  const bodyText = input.body ? markdownToPlainText(input.body) : "";
  const source =
    excerpt.length >= META_DESCRIPTION_MIN_EXCERPT
      ? excerpt
      : bodyText || excerpt || input.fallback;
  return clampMetaDescription(source) || input.fallback;
}
