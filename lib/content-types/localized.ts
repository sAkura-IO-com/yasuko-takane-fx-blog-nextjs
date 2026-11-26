import { notesIndexSeo, postsIndexSeo } from "@/lib/seo/copy";

import type { ContentTypeView } from "./types";

const systemCopy: Record<string, Partial<ContentTypeView>> = {
  article: {
    name: "記事",
    singularName: "記事",
    description: postsIndexSeo.description,
    seoTitle: postsIndexSeo.title,
    seoDescription: postsIndexSeo.description,
    crumbName: "記事",
    articleSection: "投資ブログ",
  },
  note: {
    name: "ノート",
    singularName: "ノート",
    description: notesIndexSeo.description,
    seoTitle: notesIndexSeo.title,
    seoDescription: notesIndexSeo.description,
    crumbName: "ノート",
    articleSection: "ノート",
  },
};

export function localizeContentType(type: ContentTypeView): ContentTypeView {
  if (!type.isSystem) return type;
  const copy = systemCopy[type.key];
  return copy ? { ...type, ...copy } : type;
}
