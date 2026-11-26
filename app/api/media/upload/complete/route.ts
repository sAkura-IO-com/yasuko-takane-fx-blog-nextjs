import { NextResponse } from "next/server";

import { requireOwnerApiJson } from "@/lib/blog/owner";
import { finalizeUploadedObject } from "@/lib/media/upload";
import { isMediaKey } from "@/lib/media/url";
import { validateUploadInput } from "@/lib/media/validate";

export async function POST(request: Request) {
  const auth = await requireOwnerApiJson();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const key = String(body?.key ?? "").trim();
  const contentType = String(body?.contentType ?? "").trim();

  if (!isMediaKey(key)) {
    return NextResponse.json({ error: "无效的对象 key" }, { status: 400 });
  }

  const invalid = validateUploadInput({
    filename: key.split("/").pop() ?? "image.webp",
    contentType,
    size: 1,
  });
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    await finalizeUploadedObject(key, contentType);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[media] finalize upload failed:", error);
    return NextResponse.json(
      { error: "写入缓存元数据失败，请重试" },
      { status: 500 },
    );
  }
}
