"use client";

import { useState } from "react";
import { ImagePlusIcon } from "lucide-react";

import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import { Button } from "@/components/ui/button";
import type { MediaObject } from "@/lib/media/types";

async function probeImageSize(
  url: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      return { width: image.naturalWidth, height: image.naturalHeight };
    }
  } catch {}
  return null;
}

export function MediaField({
  name,
  widthName,
  heightName,
  id,
  initialKey,
  initialUrl,
  initialWidth,
  initialHeight,
  onChange,
}: {
  name: string;
  widthName?: string;
  heightName?: string;
  id?: string;
  initialKey?: string | null;
  initialUrl?: string | null;
  initialWidth?: number | null;
  initialHeight?: number | null;
  onChange?: (next: { key: string; url: string }) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [value, setValue] = useState(initialKey ?? "");
  const [url, setUrl] = useState(initialUrl ?? (initialKey ? initialKey : ""));
  const [width, setWidth] = useState(
    initialWidth != null ? String(initialWidth) : "",
  );
  const [height, setHeight] = useState(
    initialHeight != null ? String(initialHeight) : "",
  );

  async function applyMedia(media: MediaObject) {
    setValue(media.key);
    setUrl(media.url);
    if (media.width && media.height) {
      setWidth(String(media.width));
      setHeight(String(media.height));
    } else {
      const dims = await probeImageSize(media.url);
      setWidth(dims ? String(dims.width) : "");
      setHeight(dims ? String(dims.height) : "");
    }
    onChange?.({ key: media.key, url: media.url });
  }

  function clearMedia() {
    setValue("");
    setUrl("");
    setWidth("");
    setHeight("");
    onChange?.({ key: "", url: "" });
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} id={id} value={value} />
      {widthName ? (
        <input type="hidden" name={widthName} value={width} />
      ) : null}
      {heightName ? (
        <input type="hidden" name={heightName} value={height} />
      ) : null}
      {url ? (
        // oxlint-disable-next-line nextjs/no-img-element
        <img
          src={url}
          alt="已选图片"
          className="h-28 w-44 rounded-lg border bg-muted object-cover"
        />
      ) : (
        <div className="flex h-28 w-44 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
          <ImagePlusIcon className="size-6" />
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
        >
          从图片库选择
        </Button>
        {value ? (
          <Button type="button" variant="ghost" onClick={clearMedia}>
            清除
          </Button>
        ) : null}
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        used={[value, url].filter(Boolean)}
        onSelect={(media) => void applyMedia(media)}
      />
    </div>
  );
}
