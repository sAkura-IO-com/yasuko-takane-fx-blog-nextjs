export const CONFIG_TEXTAREA_MAX_CHARS = 12000;

export function normalizeConfigText(raw: string): string {
  return raw.replace(/\r\n?/g, "\n").trim();
}

export function checkConfigText(value: string): string | null {
  const length = Array.from(normalizeConfigText(value)).length;
  if (length > CONFIG_TEXTAREA_MAX_CHARS) {
    return `内容过长（${length} 字），最多 ${CONFIG_TEXTAREA_MAX_CHARS} 字`;
  }
  return null;
}

export function configPreview(value: string, max = 120): string {
  const flat = value.replace(/\s+/g, " ").trim();
  if (!flat) return "（未配置）";
  const chars = Array.from(flat);
  const head = chars.length > max ? `${chars.slice(0, max).join("")}…` : flat;
  return `${head}（共 ${Array.from(value.trim()).length} 字）`;
}
