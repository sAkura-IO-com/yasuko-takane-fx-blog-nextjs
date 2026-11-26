"use client";

import { useMemo, useState } from "react";

import { MediaLibrary } from "@/components/media/media-library";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveMediaUsed, type MediaUsedInput } from "@/lib/media/match";
import type { MediaObject } from "@/lib/media/types";
import type { MediaScope } from "@/lib/media/url";

const COPY: Record<MediaScope, { title: string; description: string }> = {
  library: { title: "选择图片", description: "选择一张图片。" },

  files: { title: "选择文件", description: "选择一个文件。" },
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  onSelectMany,
  scope = "library",
  multiple = false,
  used,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaObject) => void;
  onSelectMany?: (media: MediaObject[]) => void;
  scope?: MediaScope;
  multiple?: boolean;
  used?: MediaUsedInput;
}) {
  const [selected, setSelected] = useState<MediaObject | null>(null);
  const [multi, setMulti] = useState(false);
  const [ordered, setOrdered] = useState<MediaObject[]>([]);
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setSelected(null);
      setMulti(false);
      setOrdered([]);
    }
  }

  const isInserted = useMemo(() => resolveMediaUsed(used), [used]);
  const pickOrder = useMemo(() => {
    if (!multi) return undefined;
    return new Map(ordered.map((item, index) => [item.key, index + 1]));
  }, [multi, ordered]);

  function handleMultipleChange(next: boolean) {
    setMulti(next);
    setOrdered([]);
    setSelected(null);
  }

  function togglePicked(media: MediaObject) {
    setOrdered((prev) => {
      const exists = prev.some((item) => item.key === media.key);
      if (exists) return prev.filter((item) => item.key !== media.key);
      return [...prev, media];
    });
  }

  function addUploaded(items: MediaObject[]) {
    setOrdered((prev) => {
      const keys = new Set(prev.map((item) => item.key));
      const next = [...prev];
      for (const item of items) {
        if (keys.has(item.key)) continue;
        keys.add(item.key);
        next.push(item);
      }
      return next;
    });
  }

  function confirmOne() {
    if (!selected) return;
    onSelect(selected);
    onOpenChange(false);
  }

  function confirmMany() {
    if (ordered.length === 0) return;
    const items = ordered;
    if (onSelectMany) onSelectMany(items);
    else {
      for (const item of items) onSelect(item);
    }
    setOrdered([]);
  }

  const copy = COPY[scope];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {copy.description}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <MediaLibrary
            mode="pick"
            scope={scope}
            selectedKey={multi ? null : (selected?.key ?? null)}
            onSelect={setSelected}
            multiple={multiple}
            multipleOn={multi}
            onMultipleChange={handleMultipleChange}
            pickOrder={pickOrder}
            onTogglePick={togglePicked}
            onPickUploaded={addUploaded}
            isInserted={isInserted}
          />
        </div>
        <DialogFooter>
          {multiple && multi ? (
            <Button
              type="button"
              disabled={ordered.length === 0}
              onClick={confirmMany}
            >
              插入 {ordered.length} 项
            </Button>
          ) : (
            <Button type="button" disabled={!selected} onClick={confirmOne}>
              确认选择
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
