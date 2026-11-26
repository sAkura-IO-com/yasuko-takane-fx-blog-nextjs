import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/lib/blog/cache-tags";

import { listContentTypes } from "./db";
import { localizeContentType } from "./localized";

export async function cachedContentTypes() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.contentTypes);
  const types = await listContentTypes();
  return types.map(localizeContentType);
}

export async function cachedContentTypeBySlug(slug: string) {
  const types = await cachedContentTypes();
  return types.find((type) => type.slug === slug) ?? null;
}

export async function cachedContentTypeByKey(key: string) {
  const types = await cachedContentTypes();
  return types.find((type) => type.key === key) ?? null;
}

export async function cachedEnabledContentTypes() {
  const types = await cachedContentTypes();
  return types.filter((type) => type.enabled);
}
