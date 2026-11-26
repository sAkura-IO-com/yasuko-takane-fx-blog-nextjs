import "server-only";

import type { Root, RootContent } from "hast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

import { rehypeDemoteHeadings } from "@/lib/blog/rehype-demote-headings";

const URL_ATTRIBUTES: Record<string, readonly string[]> = {
  a: ["href"],
  img: ["src"],
  source: ["src"],
  video: ["src", "poster"],
  audio: ["src"],
};

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "section",
  "article",
  "blockquote",
  "li",
  "ul",
  "ol",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "table",
  "tr",
  "td",
  "th",
  "figure",
  "figcaption",
  "br",
  "hr",
]);

const SKIP_TEXT_TAGS = new Set(["script", "style", "svg"]);

function absolutizeUrls(node: Root | RootContent, baseUrl: string): void {
  if (node.type === "element") {
    const attributes = URL_ATTRIBUTES[node.tagName];
    if (attributes) {
      for (const name of attributes) {
        const value = node.properties[name];
        if (typeof value === "string") {
          node.properties[name] = toAbsoluteUrl(value, baseUrl);
        }
      }
    }
  }
  if ("children" in node) {
    for (const child of node.children) {
      absolutizeUrls(child, baseUrl);
    }
  }
}

function toAbsoluteUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function hastToText(node: Root | RootContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element" && SKIP_TEXT_TAGS.has(node.tagName)) return "";
  if (!("children" in node)) return "";

  const text = node.children.map(hastToText).join("");
  return node.type === "element" && BLOCK_TAGS.has(node.tagName)
    ? `${text} `
    : text;
}

export async function renderMarkdownForFeed(
  source: string,
  baseUrl: string,
): Promise<{ html: string; text: string }> {
  if (!source.trim()) return { html: "", text: "" };

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeDemoteHeadings)
    .use(() => (tree: Root) => absolutizeUrls(tree, baseUrl))
    .use(rehypeStringify, { allowDangerousHtml: true });

  const tree = await processor.run(processor.parse(source));

  return {
    html: processor.stringify(tree),
    text: hastToText(tree).replace(/\s+/g, " ").trim(),
  };
}
