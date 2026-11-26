import "server-only";

import { cacheLife, cacheTag, revalidatePath } from "next/cache";

import { cacheTags } from "@/lib/blog/cache-tags";
import { refreshCacheTag } from "@/lib/cache/refresh-tag";

import { getSiteState } from "./state";

export async function readSiteFlags() {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.siteState);
  const state = await getSiteState();
  if (!state.persisted) {
    return { initialized: true, maintenance: false };
  }
  return {
    initialized: state.initialized,
    maintenance: state.maintenance,
  };
}

export function invalidateSiteFlags() {
  refreshCacheTag(cacheTags.siteState, "action");
  // 首次部署的 build 跑在空库上，redirect("/setup") 会被写进各站点路由的预渲染产物，
  // 仅失效 site-state 标签不足以替换这些产物，必须整棵树重渲染。
  revalidatePath("/", "layout");
}
