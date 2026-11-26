import "server-only";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { transformerStyleToClass } from "@shikijs/transformers";

import { rehypeDemoteHeadings } from "@/lib/blog/rehype-demote-headings";
import { rehypeImgSize } from "@/lib/blog/rehype-img-size";
import { rehypeMermaid } from "@/lib/blog/rehype-mermaid";

const shikiStyleToClass = transformerStyleToClass({ classPrefix: "shiki-h-" });

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeDemoteHeadings)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, {
    behavior: "wrap",
    properties: { className: ["md-heading-link"] },
  })
  .use(rehypeExternalLinks, {
    target: "_blank",
    rel: ["noopener", "noreferrer"],
  })
  .use(rehypeMermaid)
  .use(rehypePrettyCode, {
    theme: {
      light: "github-light-default",
      dark: "github-dark-default",
    },
    keepBackground: false,
    transformers: [shikiStyleToClass],
  })
  .use(rehypeImgSize)
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdown(source: string): Promise<string> {
  if (!source.trim()) return "";
  const file = await processor.process(source);
  return `<style>${shikiStyleToClass.getCSS()}</style>${String(file)}`;
}
