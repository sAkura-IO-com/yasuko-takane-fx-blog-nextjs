import { NextResponse } from "next/server";

import { requireOwnerApiJson } from "@/lib/blog/owner";
import { fileMimeFromName, validateFileUploadInput } from "@/lib/media/files";
import { generateFileKey } from "@/lib/media/keys";
import { createPresignedPutUrl, MEDIA_CACHE_CONTROL } from "@/lib/media/upload";
import { mediaUrl } from "@/lib/media/url";

export async function POST(request: Request) {
  const auth = await requireOwnerApiJson();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const input = { filename: body?.filename, size: body?.size };
  const invalid = validateFileUploadInput(input);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const key = generateFileKey(String(input.filename));
  const contentType = key ? fileMimeFromName(key) : null;
  if (!key || !contentType) {
    return NextResponse.json({ error: "文件类型不支持" }, { status: 400 });
  }

  try {
    const uploadUrl = await createPresignedPutUrl(key, contentType);
    return NextResponse.json({
      key,
      uploadUrl,
      publicUrl: mediaUrl(key),
      contentType,
      cacheControl: MEDIA_CACHE_CONTROL,
    });
  } catch (error) {
    console.error("[files] presign failed:", error);
    return NextResponse.json(
      { error: "生成上传凭证失败，请检查 R2 配置" },
      { status: 500 },
    );
  }
}
