export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function highlightMatches(text: string, query: string): string {
  const escaped = escapeHtml(text);
  const needle = escapeHtml(query.trim());
  if (!needle) return escaped;
  const pattern = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escaped.replace(
    new RegExp(pattern, "gi"),
    (match) => `<mark>${match}</mark>`,
  );
}
