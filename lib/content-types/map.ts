import type { ContentType } from "@/db/schema";

import type { ContentTypeView } from "./types";

export function toContentTypeView(row: ContentType): ContentTypeView {
  return {
    id: row.id,
    key: row.key,
    slug: row.slug,
    name: row.name,
    singularName: row.singularName,
    description: row.description,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    crumbName: row.crumbName,
    articleSection: row.articleSection,
    icon: row.icon,
    sortOrder: row.sortOrder,
    layout: row.layout,
    showInNav: row.showInNav,
    showOnHome: row.showOnHome,
    homeFeaturedCount: row.homeFeaturedCount,

    markdownExport: row.markdownExport,
    enabled: row.enabled,
    isSystem: row.isSystem,
  };
}
