import { indexPath } from "@/lib/content-types/paths";
import type { ContentTypeView } from "@/lib/content-types/types";

export type FxNavItem = {
  href: string;
  label: string;
};

export function buildFxNav(types: ContentTypeView[]): FxNavItem[] {
  return types
    .filter((type) => type.enabled && type.showInNav)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((type) => ({
      href: indexPath(type.slug),
      label:
        type.key === "article"
          ? "記事一覧"
          : type.key === "note"
            ? "ノート"
            : type.name,
    }));
}
