"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loader, type Monaco } from "@monaco-editor/react";
import { ImagesIcon, PaperclipIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { MarkdownBody } from "@/components/blog/markdown-body";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { renderMarkdownPreviewAction } from "@/lib/blog/actions";
import "@/lib/monaco/loader";
import {
  uploadPastedFiles,
  type MediaUploadProgress,
  type PastedUploadItem,
  type PastedUploadResult,
} from "@/lib/media/client";
import { fileNameFromKey } from "@/lib/media/files";
import { collectMediaRefs } from "@/lib/media/match";
import type { MediaObject } from "@/lib/media/types";
import { isFilesKey } from "@/lib/media/url";
import { cn } from "@/lib/utils";

function defineMonacoThemes(monaco: Monaco) {
  monaco.editor.defineTheme("ska-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#0a0a0a",
      "editorLineNumber.foreground": "#a3a3a3",
      "editor.lineHighlightBackground": "#f5f5f5",
      "editor.selectionBackground": "#e5e5e5",
      "editorCursor.foreground": "#0a0a0a",
    },
  });
  monaco.editor.defineTheme("ska-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0a0a0a",
      "editor.foreground": "#fafafa",
      "editorLineNumber.foreground": "#737373",
      "editor.lineHighlightBackground": "#262626",
      "editor.selectionBackground": "#404040",
      "editorCursor.foreground": "#fafafa",
    },
  });
}

type StandaloneEditor = ReturnType<Monaco["editor"]["create"]>;

const EDITOR_OPTIONS = {
  language: "markdown",
  wordWrap: "on",
  minimap: { enabled: false },
  lineNumbers: "off",
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontSize: 13.5,
  padding: { top: 12, bottom: 12 },
} as const;

type EditorView = "both" | "editor" | "preview";

function useMonacoInstance(): Monaco | null {
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loader
      .init()
      .then((instance) => {
        if (!cancelled) setMonaco(instance);
      })
      .catch((error) => {
        if (error?.type !== "cancelation") {
          console.error("Monaco initialization error:", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return monaco;
}

function initialView(): EditorView {
  if (typeof window !== "undefined" && window.innerWidth < 1024) {
    return "editor";
  }
  return "both";
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeLinkText(value: string): string {
  return value.replace(/[[\]\\]/g, (char) => `\\${char}`);
}

function buildImageMarkup(media: MediaObject, alt: string): string {
  const dimAttrs =
    media.width && media.height
      ? ` width="${media.width}" height="${media.height}"`
      : "";
  return `<img src="${escapeAttribute(media.url)}" alt="${escapeAttribute(alt)}"${dimAttrs} loading="lazy" decoding="async">`;
}

function buildFileMarkup(media: MediaObject, text: string): string {
  return `[${escapeLinkText(text)}](${media.url})`;
}

function pastedMarkup(items: PastedUploadItem[]): string {
  return items
    .map((item) =>
      isFilesKey(item.key)
        ? buildFileMarkup(item, item.sourceName)
        : buildImageMarkup(item, item.sourceName),
    )
    .join("\n\n");
}

function reportPastedResult(result: PastedUploadResult) {
  const parts: string[] = [];
  if (result.uploaded.length > 0) {
    parts.push(`已插入 ${result.uploaded.length} 项`);
  }
  if (result.failed.length > 0) {
    const detail = result.failed
      .map((item) => `${item.name}（${item.message}）`)
      .join("、");
    parts.push(`${result.failed.length} 项上传失败：${detail}`);
  }
  if (result.skipped.length > 0) {
    parts.push(`${result.skipped.join("、")} 格式不支持，已跳过`);
  }
  if (parts.length === 0) return;

  const message = parts.join("；");
  if (result.failed.length > 0 || result.skipped.length > 0) {
    toast.warning(message);
  } else {
    toast.success(message);
  }
}

async function insertPastedFiles(
  editor: StandaloneEditor,
  monaco: Monaco,
  files: File[],
  resolveEditor: () => StandaloneEditor | null,
  onProgress: (state: MediaUploadProgress | null) => void,
): Promise<void> {
  const selection = editor.getSelection();
  if (!selection) return;

  const anchor = editor.createDecorationsCollection([
    {
      range: selection,
      options: {
        description: "ska-paste-anchor",
        stickiness:
          monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    },
  ]);

  let result: PastedUploadResult;
  try {
    result = await uploadPastedFiles(files, { onProgress });
  } finally {
    onProgress(null);
  }

  const text = pastedMarkup(result.uploaded);
  if (text) {
    const target = resolveEditor();
    if (!target || !target.getModel()) {
      toast.warning("上传已完成，但编辑器已关闭，没能插入正文");
    } else {
      const sameEditor = target === editor;
      const range =
        (sameEditor ? anchor.getRange(0) : null) ?? target.getSelection();
      if (sameEditor) anchor.clear();
      if (range) {
        target.pushUndoStop();
        target.executeEdits("paste-upload", [{ range, text }]);
        target.focus();
      }
    }
  }

  reportPastedResult(result);
}

export function PostEditor({
  initialMarkdown,
  onMarkdownChange,
  className,
}: {
  initialMarkdown: string;
  onMarkdownChange?: (markdown: string) => void;
  className?: string;
}) {
  const monaco = useMonacoInstance();
  const { resolvedTheme } = useTheme();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<StandaloneEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const markdownRef = useRef(initialMarkdown);
  const themeRef = useRef(resolvedTheme);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [view, setView] = useState<EditorView>(initialView);
  const [pasteProgress, setPasteProgress] =
    useState<MediaUploadProgress | null>(null);
  const autoNarrow = useRef(false);

  useEffect(() => {
    markdownRef.current = markdown;
    onMarkdownChange?.(markdown);
  }, [markdown, onMarkdownChange]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (!media.matches) {
        setView((prev) => {
          if (prev !== "both") return prev;
          autoNarrow.current = true;
          return "editor";
        });
      } else if (autoNarrow.current) {
        autoNarrow.current = false;
        setView((prev) => (prev === "editor" ? "both" : prev));
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void renderMarkdownPreviewAction(markdown)
        .then((html) => {
          if (!cancelled) setPreviewHtml(html);
        })
        .catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [markdown]);

  useEffect(() => {
    const container = rootRef.current;
    if (!monaco || !container) return;

    monacoRef.current = monaco;
    defineMonacoThemes(monaco);

    const editor = monaco.editor.create(container, {
      ...EDITOR_OPTIONS,
      value: markdownRef.current,
      theme: themeRef.current === "dark" ? "ska-dark" : "ska-light",
    });
    editorRef.current = editor;

    const changeDisposable = editor.onDidChangeModelContent(() => {
      setMarkdown(editor.getValue());
    });
    const actionDisposable = editor.addAction({
      id: "ska.insert-image",
      label: "插入图片（从图片库）",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 10,
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyI,
      ],
      run: () => setPickerOpen(true),
    });
    const fileActionDisposable = editor.addAction({
      id: "ska.insert-file",
      label: "插入文件（从文件库）",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 11,
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      ],
      run: () => setFilePickerOpen(true),
    });

    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])];
      if (files.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      void insertPastedFiles(
        editor,
        monaco,
        files,
        () => editorRef.current,
        setPasteProgress,
      );
    };
    container.addEventListener("paste", onPaste, true);

    return () => {
      container.removeEventListener("paste", onPaste, true);
      changeDisposable.dispose();
      actionDisposable.dispose();
      fileActionDisposable.dispose();
      editor.dispose();
      editorRef.current = null;
      monacoRef.current = null;
      container.replaceChildren();
    };
  }, [monaco]);

  useEffect(() => {
    themeRef.current = resolvedTheme;
    monaco?.editor.setTheme(
      resolvedTheme === "dark" ? "ska-dark" : "ska-light",
    );
  }, [monaco, resolvedTheme]);

  function insertText(source: string, text: string) {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    const position = editor?.getPosition();
    if (!editor || !monacoInstance || !position) return;
    editor.pushUndoStop();
    editor.executeEdits(source, [
      {
        range: new monacoInstance.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        ),
        text,
      },
    ]);
    editor.focus();
  }

  function insertImage(media: MediaObject) {
    insertText(
      "media-picker",
      buildImageMarkup(media, fileNameFromKey(media.key)),
    );
  }

  function insertImages(items: MediaObject[]) {
    if (items.length === 0) return;
    insertText(
      "media-picker",
      items
        .map((media) => buildImageMarkup(media, fileNameFromKey(media.key)))
        .join("\n"),
    );
  }

  function insertFile(media: MediaObject) {
    insertText(
      "file-picker",
      buildFileMarkup(media, fileNameFromKey(media.key)),
    );
  }

  function insertFiles(items: MediaObject[]) {
    if (items.length === 0) return;
    insertText(
      "file-picker",
      items
        .map((media) => buildFileMarkup(media, fileNameFromKey(media.key)))
        .join("\n"),
    );
  }

  const usedRefs = useMemo(() => collectMediaRefs(markdown), [markdown]);

  return (
    <div className={cn("flex flex-col gap-2 lg:min-h-0", className)}>
      <input type="hidden" name="content" value={markdown} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
          >
            <ImagesIcon data-icon="inline-start" />
            从图片库插入
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFilePickerOpen(true)}
          >
            <PaperclipIcon data-icon="inline-start" />
            插入文件
          </Button>
          {pasteProgress ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
              正在上传 {pasteProgress.done}/{pasteProgress.total}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              可 Ctrl+V 粘贴上传
            </span>
          )}
        </div>
        <ToggleGroup
          size="sm"
          value={[view]}
          onValueChange={(next) => {
            const value = next[0];
            if (value === "both" || value === "editor" || value === "preview") {
              setView(value);
            }
          }}
        >
          <ToggleGroupItem value="both">双栏</ToggleGroupItem>
          <ToggleGroupItem value="editor">编辑器</ToggleGroupItem>
          <ToggleGroupItem value="preview">预览</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        className={cn(
          "grid min-h-0 gap-2 lg:flex-1",
          view === "both" ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        <div
          className={cn(
            "h-[70svh] min-h-0 overflow-hidden rounded-lg border lg:h-full",
            view === "preview" && "hidden",
          )}
        >
          {monaco ? (
            <div ref={rootRef} className="h-full" />
          ) : (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner data-icon="inline-start" />
              加载编辑器…
            </div>
          )}
        </div>
        <div
          className={cn(
            "h-[70svh] min-h-0 overflow-y-auto rounded-lg border bg-card px-4 py-3 [--md-pre-bg:var(--muted)] lg:h-full",
            view === "editor" && "hidden",
          )}
        >
          {previewHtml ? (
            <MarkdownBody html={previewHtml} />
          ) : (
            <p className="text-sm text-muted-foreground">预览生成中…</p>
          )}
        </div>
      </div>
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        used={usedRefs}
        onSelect={insertImage}
        onSelectMany={insertImages}
      />
      <MediaPickerDialog
        open={filePickerOpen}
        onOpenChange={setFilePickerOpen}
        scope="files"
        multiple
        used={usedRefs}
        onSelect={insertFile}
        onSelectMany={insertFiles}
      />
    </div>
  );
}
