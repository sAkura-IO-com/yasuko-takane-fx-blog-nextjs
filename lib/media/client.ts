import {
  prepareImageUpload,
  type PrepareImageUploadOptions,
  type UploadedMedia,
} from "@/lib/media/compress";
import {
  fileExtensionFromName,
  isAllowedFileExtension,
} from "@/lib/media/files";
import type { MediaBatchDeleteResult, MediaObject } from "@/lib/media/types";
import type { MediaScope } from "@/lib/media/url";
import { MEDIA_EXT_BY_MIME } from "@/lib/media/validate";

type UploadEndpoints = { presign: string; complete: string };

const UPLOAD_ENDPOINTS: Record<"library" | "files", UploadEndpoints> = {
  library: {
    presign: "/api/media/upload",
    complete: "/api/media/upload/complete",
  },
  files: {
    presign: "/api/files/upload",
    complete: "/api/files/upload/complete",
  },
};

async function runPresignedUpload(
  uploadFile: File,
  endpoints: UploadEndpoints,
  label = "图片",
): Promise<{ key: string; url: string }> {
  const res = await fetch(endpoints.presign, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: uploadFile.name,
      contentType: uploadFile.type,
      size: uploadFile.size,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? "获取上传凭证失败");
  }

  const cacheControl =
    typeof data.cacheControl === "string" && data.cacheControl
      ? data.cacheControl
      : "public, max-age=31536000, immutable";

  const contentType =
    typeof data.contentType === "string" && data.contentType
      ? data.contentType
      : uploadFile.type;

  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    body: uploadFile,
    headers: {
      "content-type": contentType,
      "cache-control": cacheControl,
    },
  });
  if (!put.ok) {
    throw new Error(`上传到${label}存储失败`);
  }

  const finalize = await fetch(endpoints.complete, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      key: data.key,
      contentType,
    }),
  });
  if (!finalize.ok) {
    const finalizeData = await finalize.json().catch(() => null);
    throw new Error(finalizeData?.error ?? `写入${label}缓存元数据失败`);
  }

  return { key: data.key, url: data.publicUrl };
}

export async function uploadMediaFile(
  file: File,
  options: PrepareImageUploadOptions & { scope?: "library" | "files" } = {},
): Promise<UploadedMedia> {
  if (options.scope === "files") {
    const { key, url } = await runPresignedUpload(
      file,
      UPLOAD_ENDPOINTS.files,
      "文件",
    );
    return { key, url, width: null, height: null };
  }

  const prepared = await prepareImageUpload(file, options);
  const { key, url } = await runPresignedUpload(
    prepared.file,
    UPLOAD_ENDPOINTS.library,
  );
  return { key, url, width: prepared.width, height: prepared.height };
}

const DEFAULT_UPLOAD_CONCURRENCY = 3;

export type MediaUploadProgress = {
  done: number;
  total: number;
  active: string[];
  failed: { name: string; message: string }[];
};

export type MediaUploadResult = {
  uploaded: MediaObject[];
  failed: { name: string; message: string }[];
};

function toMediaObject(file: File, uploaded: UploadedMedia): MediaObject {
  return {
    key: uploaded.key,
    url: uploaded.url,
    size: file.size,
    lastModified: new Date().toISOString(),
    contentType: file.type,
    width: uploaded.width,
    height: uploaded.height,
  };
}

export async function uploadMediaFiles(
  files: File[],
  options: {
    resize?: boolean;
    scope?: "library" | "files";
    concurrency?: number;
    onProgress?: (state: MediaUploadProgress) => void;
    signal?: AbortSignal;
  } = {},
): Promise<MediaUploadResult> {
  const total = files.length;
  if (total === 0) return { uploaded: [], failed: [] };

  const concurrency = Math.max(
    1,
    Math.min(options.concurrency ?? DEFAULT_UPLOAD_CONCURRENCY, total),
  );
  const uploaded: MediaObject[] = [];
  const failed: { name: string; message: string }[] = [];
  const active = new Map<number, string>();
  let done = 0;
  let nextIndex = 0;

  const report = () => {
    options.onProgress?.({
      done,
      total,
      active: [...active.values()],
      failed: [...failed],
    });
  };

  report();

  const worker = async () => {
    while (nextIndex < total) {
      if (options.signal?.aborted) return;
      const index = nextIndex++;
      const file = files[index];
      if (!file) continue;

      active.set(index, file.name);
      report();
      try {
        const result = await uploadMediaFile(file, {
          resize: options.resize,
          scope: options.scope,
        });
        uploaded.push(toMediaObject(file, result));
      } catch (error) {
        failed.push({
          name: file.name,
          message: error instanceof Error ? error.message : "上传失败",
        });
      } finally {
        active.delete(index);
        done += 1;
        report();
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return { uploaded, failed };
}

export type PastedUploadItem = MediaObject & {
  sourceName: string;
};

export type PastedUploadResult = {
  uploaded: PastedUploadItem[];
  failed: { name: string; message: string }[];
  skipped: string[];
};

type PastedFilePlan = { file: File; scope: "library" | "files" };

function pastedFileName(file: File, index: number): string | null {
  const name = file.name.trim();
  if (name) return name;
  const ext = MEDIA_EXT_BY_MIME[file.type];
  return ext ? `paste-${Date.now()}-${index + 1}.${ext}` : null;
}

function pastedFileLabel(file: File): string {
  return file.name.trim() || file.type || "未命名内容";
}

function planPastedFile(file: File, index: number): PastedFilePlan | null {
  const name = pastedFileName(file, index);
  if (!name) return null;
  const named =
    name === file.name ? file : new File([file], name, { type: file.type });

  if (named.type.startsWith("image/")) return { file: named, scope: "library" };
  const ext = fileExtensionFromName(named.name);
  if (ext && isAllowedFileExtension(ext))
    return { file: named, scope: "files" };
  return null;
}

export async function uploadPastedFiles(
  files: File[],
  options: { onProgress?: (state: MediaUploadProgress) => void } = {},
): Promise<PastedUploadResult> {
  const plans = files.map(planPastedFile);
  const skipped = files
    .filter((_, index) => !plans[index])
    .map(pastedFileLabel);
  const queue = plans.filter((plan): plan is PastedFilePlan => plan !== null);

  const total = queue.length;
  if (total === 0) return { uploaded: [], failed: [], skipped };

  const uploaded: PastedUploadItem[] = [];
  const failed: { name: string; message: string }[] = [];
  const active = new Map<number, string>();
  let done = 0;

  const report = () => {
    options.onProgress?.({
      done,
      total,
      active: [...active.values()],
      failed: [...failed],
    });
  };

  report();

  for (let start = 0; start < total; start += DEFAULT_UPLOAD_CONCURRENCY) {
    const chunk = queue.slice(start, start + DEFAULT_UPLOAD_CONCURRENCY);
    const settled = await Promise.all(
      chunk.map(async (plan, offset) => {
        const index = start + offset;
        active.set(index, plan.file.name);
        report();
        try {
          const result = await uploadMediaFile(plan.file, {
            resize: plan.scope === "library",
            scope: plan.scope,
          });
          return { plan, result } as const;
        } catch (error) {
          failed.push({
            name: plan.file.name,
            message: error instanceof Error ? error.message : "上传失败",
          });
          return null;
        } finally {
          active.delete(index);
          done += 1;
          report();
        }
      }),
    );

    for (const item of settled) {
      if (!item) continue;
      uploaded.push({
        ...toMediaObject(item.plan.file, item.result),
        sourceName: item.plan.file.name,
      });
    }
  }

  return { uploaded, failed, skipped };
}

export async function deleteMediaObjects(
  keys: string[],
  scope: MediaScope = "library",
): Promise<MediaBatchDeleteResult> {
  const res = await fetch("/api/media/batch-delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keys, scope }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? "删除失败");
  }
  return data as MediaBatchDeleteResult;
}
