import { NextResponse } from "next/server";

import { requireOwnerApiJson } from "@/lib/blog/owner";
import { deleteMediaObject } from "@/lib/media/delete";
import {
  FILE_MAX_BYTES,
  FILE_MAX_MB,
  fileContentDisposition,
  fileNameFromKey,
  fileMimeFromName,
} from "@/lib/media/files";
import { statMediaObject } from "@/lib/media/list";
import { finalizeUploadedObject } from "@/lib/media/upload";
import { isFilesKey, mediaUrl } from "@/lib/media/url";

export async function POST(request: Request) {
  const auth = await requireOwnerApiJson();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const key = String(body?.key ?? "").trim();
  if (!isFilesKey(key)) {
    return NextResponse.json({ error: "无效的对象 key" }, { status: 400 });
  }

  const contentType = fileMimeFromName(key);
  if (!contentType) {
    return NextResponse.json({ error: "文件类型不支持" }, { status: 400 });
  }

  try {
    const stat = await statMediaObject(key);
    if (!stat || stat.size <= 0) {
      await deleteMediaObject(key).catch(() => {});
      return NextResponse.json(
        { error: "上传的内容为空，请重试" },
        { status: 400 },
      );
    }
    if (stat.size > FILE_MAX_BYTES) {
      await deleteMediaObject(key).catch(() => {});
      return NextResponse.json(
        { error: `文件不能超过 ${FILE_MAX_MB}MB` },
        { status: 400 },
      );
    }

    await finalizeUploadedObject(key, contentType, {
      contentDisposition: fileContentDisposition(fileNameFromKey(key)),
    });
    return NextResponse.json({ ok: true, url: mediaUrl(key) });
  } catch (error) {
    console.error("[files] finalize upload failed:", error);
    return NextResponse.json(
      { error: "写入文件元数据失败，请重试" },
      { status: 500 },
    );
  }
}
