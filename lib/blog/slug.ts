import { pinyin } from "pinyin-pro";

const SLUG_MAX = 80;

export function slugifyTitle(title: string): string {
  const raw = pinyin(title, { toneType: "none", type: "array" })
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);

  return raw || "post";
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

const CODE_LINE_UNITS = 10;

function countCodeLines(markdown: string): number {
  const blocks = markdown.match(/```[\s\S]*?```/g) ?? [];
  let lines = 0;
  for (const block of blocks) {
    const body = block.replace(/^```[^\n]*\n?/, "").replace(/```\s*$/, "");
    lines += body.split("\n").filter((line) => line.trim()).length;
  }
  return lines;
}

export function countWords(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~=|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cjk =
    prose.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g)
      ?.length ?? 0;
  const rest = prose
    .replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, " ")
    .trim();
  const latin = rest ? rest.split(/\s+/).filter(Boolean).length : 0;
  return cjk + latin + countCodeLines(markdown) * CODE_LINE_UNITS;
}

export function readingTimeLabel(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 400));
  return `${minutes} 分で読めます`;
}
