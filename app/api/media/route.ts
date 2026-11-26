import { NextResponse } from "next/server";

import { findMediaReferences } from "@/lib/blog/db";
import { requireOwnerApiJson } from "@/lib/blog/owner";
import { deleteMediaObject } from "@/lib/media/delete";
import { listMedia } from "@/lib/media/list";
import {
  isMediaKey,
  isMediaScope,
  mediaUrl,
  type MediaScope,
  scopePrefix,
} from "@/lib/media/url";

export async function GET(request: Request) {
  const auth = await requireOwnerApiJson();
  if (auth.error) return auth.error;

  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor") ?? undefined;
  const sort = params.get("sort") === "recent" ? "recent" : undefined;
  const scopeParam = params.get("scope");
  const scope: MediaScope = isMediaScope(scopeParam) ? scopeParam : "library";
  try {
    return NextResponse.json(
      await listMedia({ prefix: scopePrefix(scope), cursor, sort }),
    );
  } catch (error) {
    console.error("[media] list failed:", error);
    return NextResponse.json(
      { error: "读取图片列表失败，请检查 R2 配置" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireOwnerApiJson();
  if (auth.error) return auth.error;

  const key = new URL(request.url).searchParams.get("key");
  if (!key || !isMediaKey(key)) {
    return NextResponse.json({ error: "无效的图片 key" }, { status: 400 });
  }

  try {
    const references = await findMediaReferences(key, mediaUrl(key));
    if (references.length > 0) {
      return NextResponse.json(
        {
          error: `图片仍被引用，请先解除：${references.map((ref) => ref.label).join("、")}`,
          references,
        },
        { status: 409 },
      );
    }
    await deleteMediaObject(key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[media] delete failed:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 },
    );
  }
}
