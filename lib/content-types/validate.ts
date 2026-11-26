import { isValidSlug } from "@/lib/blog/slug";

import { isContentTypeIcon } from "./icons";
import type { ContentLayout } from "./types";

const SYSTEM_SECTION_SLUGS = new Set(["posts", "notes"]);

export type ContentTypeInput = {
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
};

export type ContentTypeConflict = {
  keys: string[];
  slugs: string[];
};

export function validateContentTypeInput(
  input: ContentTypeInput,
  options: {
    mode: "create" | "update";

    conflicts: ContentTypeConflict;
    slugLocked: boolean;
    keyLocked: boolean;
    previous?: { key: string; slug: string };
  },
): string | null {
  if (!input.name.trim()) return "请填写名称";
  if (!input.singularName.trim()) return "请填写单数名称";
  if (!input.crumbName.trim()) return "请填写面包屑名称";
  if (!input.articleSection.trim()) return "请填写分区名称";
  if (!input.seoTitle.trim()) return "请填写 SEO 标题";
  if (!input.seoDescription.trim()) return "请填写 SEO 描述";
  if (!isValidSlug(input.key)) {
    return "内部标识只能包含小写字母、数字和连字符";
  }
  if (!isValidSlug(input.slug)) {
    return "地址只能包含小写字母、数字和连字符";
  }
  if (
    SYSTEM_SECTION_SLUGS.has(input.slug) &&
    input.slug !== options.previous?.slug
  ) {
    return `「${input.slug}」是系统分类的地址，不能用作自建分类`;
  }
  if (!isContentTypeIcon(input.icon)) return "请选择菜单图标";
  if (input.layout !== "article" && input.layout !== "note") {
    return "请选择版式";
  }
  if (!Number.isInteger(input.sortOrder)) return "排序必须是整数";
  if (
    !Number.isInteger(input.homeFeaturedCount) ||
    input.homeFeaturedCount < 0
  ) {
    return "首页条数必须是非负整数";
  }

  if (
    options.keyLocked &&
    options.previous &&
    input.key !== options.previous.key
  ) {
    return "内部标识不能修改";
  }
  if (
    options.slugLocked &&
    options.previous &&
    input.slug !== options.previous.slug
  ) {
    return "已有已发布内容，地址不能修改";
  }
  if (options.conflicts.keys.includes(input.key)) return "内部标识已被占用";
  if (options.conflicts.slugs.includes(input.slug)) return "这个地址已被占用";
  return null;
}
