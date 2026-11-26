import { NextResponse } from "next/server";

import { findMediaReferencesFor } from "@/lib/blog/db";
import { requireOwnerApiJson } from "@/lib/blog/owner";
import { deleteMediaObject } from "@/lib/media/delete";
import type { MediaBatchDeleteResult } from "@/lib/media/types";
import {
  isKeyInScope,
  isMediaScope,
  mediaUrl,
  type MediaScope,
} from "@/lib/media/url";

const MAX_BATCH_KEYS = 200;

function readKeys(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const keys: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    keys.push(item);
  }
  return keys;
}

export async function POST(request: Request) {
  const auth = await requireOwnerApiJson();
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    keys?: unknown;
    scope?: unknown;
  } | null;
  const keys = readKeys(body?.keys);
  const scope: MediaScope = isMediaScope(body?.scope) ? body.scope : "library";

  if (!keys || keys.length === 0) {
    return NextResponse.json({ error: "没有可删除的图片" }, { status: 400 });
  }
  if (keys.some((key) => !isKeyInScope(scope, key))) {
    return NextResponse.json({ error: "包含无效的图片 key" }, { status: 400 });
  }

  const unique = [...new Set(keys)];
  if (unique.length > MAX_BATCH_KEYS) {
    return NextResponse.json(
      { error: `一次最多删除 ${MAX_BATCH_KEYS} 张图片` },
      { status: 400 },
    );
  }

  try {
    const references = await findMediaReferencesFor(unique, mediaUrl);
    const blocked = unique
      .filter((key) => (references[key]?.length ?? 0) > 0)
      .map((key) => ({
        key,
        references: (references[key] ?? []).map((ref) => ref.label),
      }));
    const deletable = unique.filter(
      (key) => (references[key]?.length ?? 0) === 0,
    );

    const settled = await Promise.allSettled(
      deletable.map((key) => deleteMediaObject(key)),
    );

    const deleted: string[] = [];
    const failed: string[] = [];
    settled.forEach((result, index) => {
      const key = deletable[index];
      if (!key) return;
      if (result.status === "fulfilled") deleted.push(key);
      else failed.push(key);
    });

    const payload: MediaBatchDeleteResult = { deleted, blocked, failed };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[media] batch delete failed:", error);
    return NextResponse.json(
      { error: "批量删除失败，请稍后重试" },
      { status: 500 },
    );
  }
}
