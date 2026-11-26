export type ContentLayout = "article" | "note";

export type ContentTypeView = {
  id: string;
  key: string;
  slug: string;
  name: string;
  singularName: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  crumbName: string;
  articleSection: string;
  icon: string;
  sortOrder: number;
  layout: ContentLayout;
  showInNav: boolean;
  showOnHome: boolean;
  homeFeaturedCount: number;

  markdownExport: boolean;
  enabled: boolean;
  isSystem: boolean;
};

export function sectionLabel(type: Pick<ContentTypeView, "articleSection">) {
  return type.articleSection;
}

export function crumbLabel(type: Pick<ContentTypeView, "crumbName">) {
  return type.crumbName;
}
