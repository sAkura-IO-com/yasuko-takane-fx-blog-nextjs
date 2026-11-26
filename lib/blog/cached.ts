import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/lib/blog/cache-tags";
import {
  getPublishedPostBySlug,
  listPublishedPostBodies,
  listPublishedPostCards,
  listPublishedPostCardsByTag,
  listPublishedPostMetas,
  listTags,
  type PublishedPostBody,
  type PublishedPostMeta,
} from "@/lib/blog/db";
import { renderMarkdown } from "@/lib/blog/markdown";

export async function cachedPublishedPostCards(typeKey = "article") {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.posts, cacheTags.contentTypes);
  return listPublishedPostCards(typeKey);
}

export async function cachedTags() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.posts);
  return listTags();
}

export async function cachedPublishedPostCardsByTag(tagSlug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.posts);
  return listPublishedPostCardsByTag(tagSlug);
}

export async function cachedPublishedPostMetas(
  typeKey?: string,
): Promise<PublishedPostMeta[]> {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.posts, cacheTags.contentTypes);
  return listPublishedPostMetas(typeKey);
}

export async function cachedPublishedPostBodies(
  typeKey?: string,
): Promise<PublishedPostBody[]> {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.posts, cacheTags.contentTypes);
  return listPublishedPostBodies(typeKey);
}

export async function cachedPublishedPost(slug: string, typeKey?: string) {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.posts, cacheTags.contentTypes, cacheTags.post(slug));

  const article = await getPublishedPostBySlug(slug, typeKey);
  if (!article) return null;

  const html = await renderMarkdown(article.content);
  return { post: article, html };
}
