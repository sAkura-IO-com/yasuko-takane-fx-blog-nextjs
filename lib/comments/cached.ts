import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/lib/blog/cache-tags";

import { listApprovedComments } from "./db";
import type { CommentPage } from "./types";

export async function cachedApprovedComments(
  postId: string,
): Promise<CommentPage> {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.comments(postId));
  return listApprovedComments(postId);
}
