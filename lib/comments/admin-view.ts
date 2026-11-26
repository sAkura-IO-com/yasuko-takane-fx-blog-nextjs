import "server-only";

import type { AdminCommentRow } from "./db";
import { commentExcerpt } from "./format";
import type { AdminCommentView } from "./view";

export function toAdminCommentView(row: AdminCommentRow): AdminCommentView {
  return {
    id: row.id,
    postId: row.postId,
    postTitle: row.postTitle,
    postSlug: row.postSlug,
    postSection: row.postSection,
    parentId: row.parentId,
    rootId: row.rootId,
    authorName: row.authorName,
    isAdmin: row.isAdmin,
    excerpt: commentExcerpt(row.body, 120),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
