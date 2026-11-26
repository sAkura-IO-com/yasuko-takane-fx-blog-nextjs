"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2Icon } from "lucide-react";
import useSWRInfinite from "swr/infinite";
import { toast } from "sonner";

import { IosLightbox } from "@/components/ios/ios-lightbox";
import { Checkbox } from "@/components/motion/checkbox";
import { FileGrid } from "@/components/media/file-grid";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaMultiSelectButton } from "@/components/media/media-multi-select-button";
import {
  MediaUploadButton,
  MediaUploadNotice,
  useMediaUpload,
} from "@/components/media/media-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { deleteMediaObjects } from "@/lib/media/client";
import { FILE_MAX_MB } from "@/lib/media/files";
import type {
  MediaBatchDeleteResult,
  MediaListResult,
  MediaObject,
} from "@/lib/media/types";
import type { MediaScope } from "@/lib/media/url";
import { cn } from "@/lib/utils";

type MediaLibraryProps = {
  mode: "browse" | "pick";
  scope?: MediaScope;
  onSelect?: (media: MediaObject) => void;
  selectedKey?: string | null;
  multiple?: boolean;
  multipleOn?: boolean;
  onMultipleChange?: (on: boolean) => void;
  pickOrder?: ReadonlyMap<string, number>;
  onTogglePick?: (media: MediaObject) => void;
  onPickUploaded?: (items: MediaObject[]) => void;
  isInserted?: (media: MediaObject) => boolean;
};

const fetcher = async (url: string): Promise<MediaListResult> => {
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? "读取图片列表失败");
  }
  return data as MediaListResult;
};

const NO_KEYS: ReadonlySet<string> = new Set();

function fileNameOf(key: string): string {
  return key.split("/").pop() ?? key;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function reportDeleteResult(
  result: MediaBatchDeleteResult,
  noun: string,
  unit: string,
) {
  if (
    result.deleted.length === 0 &&
    result.blocked.length === 0 &&
    result.failed.length === 0
  ) {
    toast.error(`没有删除任何${noun}，请重试`);
    return;
  }
  if (result.blocked.length === 0 && result.failed.length === 0) {
    toast.success(`已删除 ${result.deleted.length} ${unit}${noun}`);
    return;
  }

  const parts: string[] = [];
  if (result.deleted.length > 0) {
    parts.push(`已删除 ${result.deleted.length} ${unit}`);
  }
  if (result.blocked.length > 0) {
    const only = result.blocked.length === 1 ? result.blocked[0] : null;
    if (only && only.references.length > 0) {
      parts.push(`仍被引用无法删除：${only.references.join("、")}`);
    } else {
      const names = result.blocked
        .slice(0, 3)
        .map((item) => fileNameOf(item.key))
        .join("、");
      const suffix = result.blocked.length > 3 ? " 等" : "";
      parts.push(
        `${result.blocked.length} ${unit}仍被引用无法删除（${names}${suffix}）`,
      );
    }
  }
  if (result.failed.length > 0) {
    parts.push(`${result.failed.length} ${unit}删除失败，请重试`);
  }
  toast.warning(parts.join("；"));
}

export function MediaLibrary({
  mode,
  scope = "library",
  onSelect,
  selectedKey,
  multiple = false,
  multipleOn = false,
  onMultipleChange,
  pickOrder,
  onTogglePick,
  onPickUploaded,
  isInserted,
}: MediaLibraryProps) {
  const isFiles = scope === "files";
  const noun = isFiles ? "文件" : "图片";
  const unit = isFiles ? "个" : "张";
  const [selecting, setSelecting] = useState(false);
  const [selectedKeys, setSelectedKeys] =
    useState<ReadonlySet<string>>(NO_KEYS);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [optimizeSize, setOptimizeSize] = useState(true);
  const [dragging, setDragging] = useState(false);
  const dropDepth = useRef(0);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<MediaListResult>((index, previous) => {
      if (previous && !previous.nextCursor) return null;
      const params = new URLSearchParams({ sort: "recent" });
      if (scope !== "library") params.set("scope", scope);
      if (previous?.nextCursor) params.set("cursor", previous.nextCursor);
      return `/api/media?${params.toString()}`;
    }, fetcher);

  const items = data?.flatMap((page) => page.items) ?? [];
  const hasNextPage = Boolean(data?.at(-1)?.nextCursor);
  const previewIndex = previewKey
    ? items.findIndex((media) => media.key === previewKey)
    : -1;
  const pickKeys = useMemo(
    () => (selectedKey ? new Set([selectedKey]) : NO_KEYS),
    [selectedKey],
  );
  const pickedKeys = useMemo(() => {
    if (!multipleOn || !pickOrder) return NO_KEYS;
    return new Set(pickOrder.keys());
  }, [multipleOn, pickOrder]);
  const multiPicking = mode === "pick" && multipleOn;
  const activeKeys =
    mode === "pick" ? (multiPicking ? pickedKeys : pickKeys) : selectedKeys;
  const allSelected =
    items.length > 0 && items.every((media) => selectedKeys.has(media.key));

  const upload = useMediaUpload(
    { optimizeSize: isFiles ? false : optimizeSize, scope },
    (uploaded) => {
      void mutate();
      if (mode !== "pick" || uploaded.length === 0) return;
      if (multipleOn) {
        onPickUploaded?.(uploaded);
      } else {
        const latest = uploaded.at(-1);
        if (latest) onSelect?.(latest);
      }
    },
  );

  const startUploadRef = useRef(upload.start);
  useEffect(() => {
    startUploadRef.current = upload.start;
  });

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])];
      if (files.length === 0 || isEditableTarget(event.target)) return;
      event.preventDefault();
      void startUploadRef.current(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function handleCopyLink(media: MediaObject) {
    try {
      await navigator.clipboard.writeText(media.url);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败");
    }
  }

  function toggleSelecting() {
    setSelecting((value) => !value);
    setSelectedKeys(NO_KEYS);
  }

  function toggleSelect(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function togglePickByKey(key: string) {
    const media = items.find((item) => item.key === key);
    if (media) onTogglePick?.(media);
  }

  function toggleSelectAll() {
    setSelectedKeys(allSelected ? NO_KEYS : new Set(items.map((m) => m.key)));
  }

  function requestDelete(media: MediaObject) {
    setPendingDelete([media.key]);
  }

  function openPreview(media: MediaObject) {
    setPreviewKey(media.key);
  }

  async function handleDelete() {
    const keys = pendingDelete ?? [];
    if (keys.length === 0) return;
    setDeleting(true);
    try {
      const result = await deleteMediaObjects(keys, scope);
      reportDeleteResult(result, noun, unit);
      const removed = new Set(result.deleted);
      setSelectedKeys(
        (prev) => new Set([...prev].filter((key) => !removed.has(key))),
      );
      setPendingDelete(null);
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <MediaUploadButton
            scope={scope}
            disabled={upload.uploading}
            onFiles={upload.start}
          />
          {isFiles ? null : (
            <Checkbox
              checked={optimizeSize}
              onCheckedChange={setOptimizeSize}
              disabled={upload.uploading}
              label="启用尺寸优化"
              aria-describedby="media-optimize-size-hint"
            />
          )}
        </div>
        {mode === "browse" ? (
          <MediaMultiSelectButton
            pressed={selecting}
            onPressedChange={() => toggleSelecting()}
          />
        ) : multiple ? (
          <MediaMultiSelectButton
            pressed={multipleOn}
            onPressedChange={(next) => onMultipleChange?.(next)}
          />
        ) : null}
      </div>

      {mode === "browse" && selecting ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium">
            已选 {selectedKeys.size} / {items.length}
          </span>
          <Button size="xs" variant="ghost" onClick={toggleSelectAll}>
            {allSelected ? "取消全选" : "全选"}
          </Button>
          <Button
            size="xs"
            variant="destructive"
            className="ms-auto"
            disabled={selectedKeys.size === 0 || deleting}
            onClick={() => setPendingDelete([...selectedKeys])}
          >
            <Trash2Icon data-icon="inline-start" />
            删除所选
          </Button>
        </div>
      ) : null}
      <MediaUploadNotice
        progress={upload.progress}
        result={upload.result}
        unit={unit}
        onClear={upload.clearResult}
      />

      {isFiles ? (
        <p className="text-xs text-muted-foreground">
          单个文件最大 {FILE_MAX_MB}MB，右键卡片可复制链接。
        </p>
      ) : (
        <p
          id="media-optimize-size-hint"
          className="text-xs text-muted-foreground"
        >
          最长边缩至 1600px 并转 WebP；需要原图时取消勾选。
        </p>
      )}

      {error ? (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error instanceof Error ? error.message : `读取${noun}列表失败`}
        </p>
      ) : null}

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          dropDepth.current += 1;
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dropDepth.current -= 1;
          if (dropDepth.current <= 0) setDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          dropDepth.current = 0;
          setDragging(false);

          void upload.start([...event.dataTransfer.files]);
        }}
        className={cn(
          "rounded-xl border border-dashed p-3 transition-colors",
          dragging && "border-ring bg-muted/40",
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner /> 加载中…
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {isFiles
              ? "还没有文件，可拖到这里或 Ctrl+V 上传。"
              : "还没有图片，可拖到这里或 Ctrl+V 上传。"}
          </p>
        ) : isFiles ? (
          <FileGrid
            items={items}
            selectedKeys={activeKeys}
            selecting={(mode === "browse" && selecting) || multiPicking}
            selectionOrder={multiPicking ? pickOrder : undefined}
            isInserted={isInserted}
            onToggleSelect={multiPicking ? togglePickByKey : toggleSelect}
            onSelect={mode === "pick" && !multiPicking ? onSelect : undefined}
            onCopyLink={mode === "browse" ? handleCopyLink : undefined}
            onDelete={mode === "browse" ? requestDelete : undefined}
          />
        ) : (
          <MediaGrid
            items={items}
            selectedKeys={activeKeys}
            selecting={(mode === "browse" && selecting) || multiPicking}
            selectionOrder={multiPicking ? pickOrder : undefined}
            isInserted={isInserted}
            onToggleSelect={multiPicking ? togglePickByKey : toggleSelect}
            onSelect={
              mode === "pick" && !multiPicking
                ? onSelect
                : mode === "browse"
                  ? openPreview
                  : undefined
            }
            onCopyLink={mode === "browse" ? handleCopyLink : undefined}
            onDelete={mode === "browse" ? requestDelete : undefined}
          />
        )}
      </div>

      {hasNextPage ? (
        <Button
          variant="outline"
          disabled={isValidating}
          onClick={() => setSize(size + 1)}
        >
          {isValidating ? <Spinner data-icon="inline-start" /> : null}
          加载更多
        </Button>
      ) : null}

      {mode === "browse" && !isFiles ? (
        <IosLightbox
          images={items.map((media) => ({
            src: media.url,
            alt: fileNameOf(media.key),
          }))}
          index={previewIndex < 0 ? 0 : previewIndex}
          open={previewIndex >= 0}
          onOpenChange={(open) => {
            if (!open) setPreviewKey(null);
          }}
          onIndexChange={(index) => {
            setPreviewKey(items[index]?.key ?? null);
          }}
          label="查看图片"
        />
      ) : null}

      {mode === "browse" ? (
        <Dialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {pendingDelete && pendingDelete.length > 1
                  ? `删除选中的 ${pendingDelete.length} ${unit}${noun}？`
                  : `删除这${unit === "个" ? "个" : "张"}${noun}？`}
              </DialogTitle>
              <DialogDescription>
                {isFiles
                  ? "删除后无法恢复。被文章引用的文件不会被删除。"
                  : "删除后无法恢复。仍被引用的图片不会被删除。"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                取消
              </Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? <Spinner data-icon="inline-start" /> : null}
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
