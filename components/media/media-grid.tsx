"use client";

import { LinkIcon, Trash2Icon } from "lucide-react";

import { Checkbox } from "@/components/motion/checkbox";
import {
  MediaInsertedBadge,
  MediaSelectionIndex,
  mediaCardLabel,
} from "@/components/media/media-card-marks";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { MediaObject } from "@/lib/media/types";

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileName(key: string): string {
  return key.split("/").pop() ?? key;
}

export function MediaGrid({
  items,
  selectedKeys,
  selecting,
  onSelect,
  onToggleSelect,
  onCopyLink,
  onDelete,
  isInserted,
  selectionOrder,
}: {
  items: MediaObject[];
  selectedKeys?: ReadonlySet<string>;
  selecting?: boolean;
  onSelect?: (media: MediaObject) => void;
  onToggleSelect?: (key: string) => void;
  onCopyLink?: (media: MediaObject) => void;
  onDelete?: (media: MediaObject) => void;
  isInserted?: (media: MediaObject) => boolean;
  selectionOrder?: ReadonlyMap<string, number>;
}) {
  const hasMenu = Boolean(onCopyLink || onDelete);
  const selectable = Boolean(selecting && onToggleSelect);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((media) => {
        const selected = selectedKeys?.has(media.key) ?? false;
        const name = fileName(media.key);
        const inserted = isInserted?.(media) ?? false;
        const order = selectable ? selectionOrder?.get(media.key) : undefined;
        return (
          <ContextMenu key={media.key} disabled={!hasMenu}>
            <ContextMenuTrigger className="relative">
              <button
                type="button"
                aria-label={mediaCardLabel(name, inserted, order)}
                aria-pressed={selectable ? selected : undefined}
                onClick={() => {
                  if (selectable) onToggleSelect?.(media.key);
                  else onSelect?.(media);
                }}
                className={cn(
                  "group flex w-full flex-col gap-1.5 rounded-xl border p-2 text-left transition-colors outline-none",
                  selected
                    ? "border-ring ring-3 ring-ring/50"
                    : "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                {/* oxlint-disable-next-line nextjs/no-img-element */}
                <img
                  src={media.url}
                  alt={name}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg bg-muted object-cover"
                />
                <span className="w-full truncate text-xs" title={name}>
                  {name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(media.size)}
                  {media.lastModified
                    ? ` · ${new Date(media.lastModified).toLocaleDateString()}`
                    : ""}
                </span>
              </button>
              {selectable ? (
                <Checkbox
                  checked={selected}
                  aria-label={`选择 ${name}`}
                  className="absolute start-1.5 top-1.5 z-10"
                  onCheckedChange={() => onToggleSelect?.(media.key)}
                />
              ) : null}
              {order ? <MediaSelectionIndex index={order} /> : null}
              {inserted ? <MediaInsertedBadge /> : null}
            </ContextMenuTrigger>
            {hasMenu ? (
              <ContextMenuContent>
                {onCopyLink ? (
                  <ContextMenuItem onClick={() => onCopyLink(media)}>
                    <LinkIcon />
                    复制链接
                  </ContextMenuItem>
                ) : null}
                {onDelete ? (
                  <ContextMenuItem
                    variant="destructive"
                    onClick={() => onDelete(media)}
                  >
                    <Trash2Icon />
                    删除
                  </ContextMenuItem>
                ) : null}
              </ContextMenuContent>
            ) : null}
          </ContextMenu>
        );
      })}
    </div>
  );
}
