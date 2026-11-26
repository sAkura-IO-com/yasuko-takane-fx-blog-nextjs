import { postPath } from "@/lib/content-types/paths";

import type { CommentStatus } from "./types";

export type AdminCommentView = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  postSection: string;
  parentId: string | null;
  rootId: string | null;
  authorName: string;
  isAdmin: boolean;
  excerpt: string;
  status: CommentStatus;
  createdAt: string;
};

export function postHrefFor(
  row: Pick<AdminCommentView, "postSection" | "postSlug">,
): string {
  return postPath(row.postSection, row.postSlug);
}
