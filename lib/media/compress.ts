const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.9;

const PASSTHROUGH_TYPES = new Set(["image/gif", "image/svg+xml"]);

export type PreparedUpload = {
  file: File;
  width: number | null;
  height: number | null;
};

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")?.drawImage(image, 0, 0);
    return (await createImageBitmap(canvas)) as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function toWebpBitmap(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
  source?: { sx: number; sy: number; sw: number; sh: number },
): Promise<Blob> {
  const draw = (
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  ) => {
    if (source) {
      ctx.drawImage(
        bitmap,
        source.sx,
        source.sy,
        source.sw,
        source.sh,
        0,
        0,
        width,
        height,
      );
    } else {
      ctx.drawImage(bitmap, 0, 0, width, height);
    }
  };
  if (typeof OffscreenCanvas === "function") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (ctx) draw(ctx);
    return canvas.convertToBlob({ type: "image/webp", quality });
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob 失败"))),
      "image/webp",
      quality,
    );
  });
}

export type PrepareImageUploadOptions = {
  resize?: boolean;
  maxEdge?: number;
  squareCrop?: boolean;
  quality?: number;
};

async function probeBitmapDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await loadBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return null;
  }
}

export async function prepareImageUpload(
  file: File,
  options: PrepareImageUploadOptions = {},
): Promise<PreparedUpload> {
  const resize = options.resize ?? false;
  const maxEdge = options.maxEdge ?? MAX_EDGE;
  const squareCrop = options.squareCrop ?? false;
  const quality = options.quality ?? WEBP_QUALITY;

  if (!resize) {
    const dims = await probeBitmapDimensions(file);
    return {
      file,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    };
  }

  if (PASSTHROUGH_TYPES.has(file.type)) {
    const dims = await probeBitmapDimensions(file);
    return {
      file,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    };
  }

  if (!file.type.startsWith("image/")) {
    return { file, width: null, height: null };
  }

  try {
    const bitmap = await loadBitmap(file);
    const natural = { width: bitmap.width, height: bitmap.height };
    const side = squareCrop
      ? Math.min(bitmap.width, bitmap.height)
      : Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxEdge / side);
    const source = squareCrop
      ? {
          sx: (bitmap.width - side) / 2,
          sy: (bitmap.height - side) / 2,
          sw: side,
          sh: side,
        }
      : undefined;
    const width = Math.round((squareCrop ? side : bitmap.width) * scale);
    const height = Math.round((squareCrop ? side : bitmap.height) * scale);

    const blob = await toWebpBitmap(bitmap, width, height, quality, source);
    bitmap.close();

    if (!squareCrop && blob.size >= file.size) {
      return { file, width: natural.width, height: natural.height };
    }

    const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
    return {
      file: new File([blob], name, { type: "image/webp" }),
      width,
      height,
    };
  } catch (error) {
    console.warn("图片压缩失败，使用原文件上传:", error);
    return { file, width: null, height: null };
  }
}

export type UploadedMedia = {
  key: string;
  url: string;
  width: number | null;
  height: number | null;
};
