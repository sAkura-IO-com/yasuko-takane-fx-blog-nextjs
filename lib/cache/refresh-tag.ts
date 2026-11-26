import "server-only";

import { revalidateTag, updateTag } from "next/cache";

export type CacheRefresh = "action" | "outside";

export function refreshCacheTag(tag: string, context: CacheRefresh): void {
  if (context === "action") {
    updateTag(tag);
    revalidateTag(tag, "max");
    return;
  }
  revalidateTag(tag, { expire: 0 });
}
