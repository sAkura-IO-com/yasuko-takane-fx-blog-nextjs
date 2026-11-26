import type { ContentTypeView } from "./types";

export type SectionListCopy = {
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  noMatchTitle: string;
};

export function sectionIndexDocumentTitle(
  type: Pick<ContentTypeView, "name" | "seoTitle">,
) {
  return type.seoTitle.trim() || type.name;
}

export function sectionListCopy(type: ContentTypeView): SectionListCopy {
  const isNote = type.layout === "note";
  return {
    searchPlaceholder: `${type.name}を検索`,
    emptyTitle: `${type.name}はまだありません`,
    emptyDescription: isNote
      ? "最初のノートが公開されると、ここに表示されます。"
      : "最初の記事が公開されると、ここに表示されます。",
    noMatchTitle: `一致する${type.name}がありません`,
  };
}
