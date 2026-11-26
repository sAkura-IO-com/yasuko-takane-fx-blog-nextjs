"use client";

import { useRef, useState } from "react";
import { TriangleAlertIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  uploadMediaFiles,
  type MediaUploadProgress,
  type MediaUploadResult,
} from "@/lib/media/client";
import {
  FILE_ACCEPT,
  fileExtensionFromName,
  isAllowedFileExtension,
} from "@/lib/media/files";
import type { MediaObject } from "@/lib/media/types";
import type { MediaScope } from "@/lib/media/url";

const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml";

export function useMediaUpload(
  options: { optimizeSize: boolean; scope?: MediaScope },
  onUploaded: (uploaded: MediaObject[]) => void,
) {
  const [progress, setProgress] = useState<MediaUploadProgress | null>(null);
  const [result, setResult] = useState<MediaUploadResult | null>(null);

  const uploading = progress !== null;
  const isFiles = options.scope === "files";
  const noun = isFiles ? "文件" : "图片";
  const unit = isFiles ? "个" : "张";

  async function start(files: File[]) {
    if (files.length === 0 || uploading) return;
    const accepted = isFiles
      ? files.filter((file) => {
          const ext = fileExtensionFromName(file.name);
          return ext !== null && isAllowedFileExtension(ext);
        })
      : files.filter((file) => file.type.startsWith("image/"));
    if (accepted.length === 0) {
      toast.error(isFiles ? "只能上传支持的文件格式" : "只能上传图片");
      return;
    }
    if (accepted.length < files.length) {
      toast.error(
        `${files.length - accepted.length} ${unit}${noun}格式不支持，已跳过`,
      );
    }

    setResult(null);
    setProgress({ done: 0, total: accepted.length, active: [], failed: [] });

    const outcome = await uploadMediaFiles(accepted, {
      resize: isFiles ? false : options.optimizeSize,
      scope: isFiles ? "files" : "library",
      onProgress: setProgress,
    });

    setProgress(null);
    setResult(outcome);

    if (outcome.uploaded.length > 0) {
      toast.success(`已上传 ${outcome.uploaded.length} ${unit}${noun}`);
      onUploaded(outcome.uploaded);
    }
    if (outcome.failed.length > 0) {
      toast.error(`${outcome.failed.length} ${unit}${noun}上传失败`);
    }
  }

  return {
    start,
    uploading,
    progress,
    result,
    clearResult: () => setResult(null),
  };
}

export function MediaUploadButton({
  disabled,
  onFiles,
  scope = "library",
}: {
  disabled: boolean;
  onFiles: (files: File[]) => void;
  scope?: MediaScope;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isFiles = scope === "files";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={isFiles ? FILE_ACCEPT : MEDIA_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
      <Button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {isFiles ? "上传文件" : "上传图片"}
      </Button>
    </>
  );
}

export function MediaUploadNotice({
  progress,
  result,
  onClear,
  unit = "张",
}: {
  progress: MediaUploadProgress | null;
  result: MediaUploadResult | null;
  onClear: () => void;
  unit?: string;
}) {
  const [failedOpen, setFailedOpen] = useState(false);

  if (progress) {
    const percent =
      progress.total > 0
        ? Math.round((progress.done / progress.total) * 100)
        : 0;

    return (
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Spinner className="size-3.5" />
            已完成 {progress.done}/{progress.total}
          </span>
          <span className="text-muted-foreground tabular-nums">{percent}%</span>
        </div>
        <Progress value={percent} />
        {progress.active.length > 0 ? (
          <p className="truncate text-xs text-muted-foreground">
            正在上传：{progress.active.join("、")}
          </p>
        ) : null}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span>
          成功 {result.uploaded.length} {unit}
        </span>
        {result.failed.length > 0 ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 font-medium text-destructive underline-offset-4 hover:underline"
            onClick={() => setFailedOpen((open) => !open)}
          >
            <TriangleAlertIcon className="size-3.5" />
            失败 {result.failed.length} {unit}
          </button>
        ) : null}
        <Button
          size="icon-xs"
          variant="ghost"
          className="ms-auto"
          aria-label="清除上传结果"
          onClick={onClear}
        >
          <XIcon />
        </Button>
      </div>

      {failedOpen && result.failed.length > 0 ? (
        <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto border-t pt-2">
          {result.failed.map((item) => (
            <li key={item.name} className="flex gap-2">
              <span className="max-w-40 truncate font-medium">{item.name}</span>
              <span className="text-muted-foreground">{item.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
