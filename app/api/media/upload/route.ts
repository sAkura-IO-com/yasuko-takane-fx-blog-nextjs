import { NextResponse } from "next/server";

import { requireOwnerApiJson } from "@/lib/blog/owner";
import { generateMediaKey } from "@/lib/media/keys";
import { createPresignedPutUrl, MEDIA_CACHE_CONTROL } from "@/lib/media/upload";
import { validateUploadInput } from "@/lib/media/validate";
import { mediaUrl } from "@/lib/media/url";

export async function POST(request: Request) {
  const auth = await requireOwnerApiJson();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const input = {
    filename: body?.filename,
    contentType: body?.contentType,
    size: body?.size,
  };
  const invalid = validateUploadInput(input);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const { filename, contentType } = input as {
    filename: string;
    contentType: string;
  };

  try {
    const key = generateMediaKey(filename, contentType);
    const uploadUrl = await createPresignedPutUrl(key, contentType);
    return NextResponse.json({
      key,
      uploadUrl,
      publicUrl: mediaUrl(key),
      cacheControl: MEDIA_CACHE_CONTROL,
    });
  } catch (error) {
    console.error("[media] presign failed:", error);
    return NextResponse.json(
      { error: "生成上传凭证失败，请检查 R2 配置" },
      { status: 500 },
    );
  }
}
