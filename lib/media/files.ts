export const FILE_MAX_MB = 50;
export const FILE_MAX_BYTES = FILE_MAX_MB * 1024 * 1024;

export const FILE_MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odp: "application/vnd.oasis.opendocument.presentation",
  epub: "application/epub+zip",
  mobi: "application/x-mobipocket-ebook",
  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8",
  log: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  jsonc: "application/json",
  yaml: "application/yaml",
  yml: "application/yaml",
  toml: "application/toml",
  ini: "text/plain; charset=utf-8",
  conf: "text/plain; charset=utf-8",
  cfg: "text/plain; charset=utf-8",
  xml: "application/xml",
  sql: "application/sql",
  ics: "text/calendar; charset=utf-8",
  html: "text/plain; charset=utf-8",
  htm: "text/plain; charset=utf-8",
  css: "text/plain; charset=utf-8",
  scss: "text/plain; charset=utf-8",
  js: "text/plain; charset=utf-8",
  mjs: "text/plain; charset=utf-8",
  cjs: "text/plain; charset=utf-8",
  jsx: "text/plain; charset=utf-8",
  ts: "text/plain; charset=utf-8",
  tsx: "text/plain; charset=utf-8",
  vue: "text/plain; charset=utf-8",
  py: "text/plain; charset=utf-8",
  go: "text/plain; charset=utf-8",
  rs: "text/plain; charset=utf-8",
  java: "text/plain; charset=utf-8",
  kt: "text/plain; charset=utf-8",
  swift: "text/plain; charset=utf-8",
  c: "text/plain; charset=utf-8",
  h: "text/plain; charset=utf-8",
  cpp: "text/plain; charset=utf-8",
  hpp: "text/plain; charset=utf-8",
  cs: "text/plain; charset=utf-8",
  php: "text/plain; charset=utf-8",
  rb: "text/plain; charset=utf-8",
  lua: "text/plain; charset=utf-8",
  sh: "text/plain; charset=utf-8",
  bash: "text/plain; charset=utf-8",
  zsh: "text/plain; charset=utf-8",
  bat: "text/plain; charset=utf-8",
  cmd: "text/plain; charset=utf-8",
  ps1: "text/plain; charset=utf-8",
  srt: "application/x-subrip",
  vtt: "text/vtt",
  ass: "text/plain; charset=utf-8",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  ico: "image/x-icon",
  psd: "image/vnd.adobe.photoshop",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  eot: "application/vnd.ms-fontobject",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  opus: "audio/opus",
  wma: "audio/x-ms-wma",
  aiff: "audio/aiff",
  mid: "audio/midi",
  midi: "audio/midi",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  flv: "video/x-flv",
  m4v: "video/x-m4v",
  wmv: "video/x-ms-wmv",
  zip: "application/zip",
  tar: "application/x-tar",
  gz: "application/gzip",
  tgz: "application/gzip",
  bz2: "application/x-bzip2",
  xz: "application/x-xz",
  zst: "application/zstd",
  "7z": "application/x-7z-compressed",
  rar: "application/vnd.rar",
  iso: "application/x-iso9660-image",
  cab: "application/vnd.ms-cab-compressed",
  jar: "application/java-archive",
  apk: "application/vnd.android.package-archive",
  exe: "application/octet-stream",
  msi: "application/octet-stream",
  dmg: "application/octet-stream",
  pkg: "application/octet-stream",
  appimage: "application/octet-stream",
  bin: "application/octet-stream",
  deb: "application/vnd.debian.binary-package",
  rpm: "application/x-rpm",
  wasm: "application/wasm",
};

export const FILE_ALLOWED_EXTENSIONS: readonly string[] =
  Object.keys(FILE_MIME_BY_EXT);

export const FILE_ACCEPT = [
  ...FILE_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`),
  ...new Set(Object.values(FILE_MIME_BY_EXT).map((mime) => mime.split(";")[0])),
].join(",");

const EXT_PATTERN = /^[a-z0-9]{1,8}$/;

export function fileExtensionFromName(filename: string): string | null {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  return EXT_PATTERN.test(ext) ? ext : null;
}

export function isAllowedFileExtension(ext: string): boolean {
  return Object.hasOwn(FILE_MIME_BY_EXT, ext);
}

export function fileMimeFromName(filename: string): string | null {
  const ext = fileExtensionFromName(filename);
  if (!ext || !isAllowedFileExtension(ext)) return null;
  return FILE_MIME_BY_EXT[ext] ?? null;
}

export function fileNameFromKey(key: string): string {
  return key.split("/").pop() ?? key;
}

export function fileExtFromKey(key: string): string | null {
  return fileExtensionFromName(fileNameFromKey(key));
}

export type FileCategory =
  | "pdf"
  | "doc"
  | "sheet"
  | "slide"
  | "archive"
  | "image"
  | "audio"
  | "video"
  | "code"
  | "text"
  | "other";

const CATEGORY_BY_EXT: Record<string, FileCategory> = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  rtf: "doc",
  odt: "doc",
  xls: "sheet",
  xlsx: "sheet",
  ods: "sheet",
  csv: "sheet",
  ppt: "slide",
  pptx: "slide",
  odp: "slide",
  zip: "archive",
  tar: "archive",
  gz: "archive",
  tgz: "archive",
  bz2: "archive",
  xz: "archive",
  zst: "archive",
  "7z": "archive",
  rar: "archive",
  iso: "archive",
  cab: "archive",
  jar: "archive",
  apk: "archive",
  epub: "archive",
  mobi: "archive",
  bmp: "image",
  tif: "image",
  tiff: "image",
  heic: "image",
  ico: "image",
  psd: "image",
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  ogg: "audio",
  flac: "audio",
  aac: "audio",
  opus: "audio",
  wma: "audio",
  aiff: "audio",
  mid: "audio",
  midi: "audio",
  mp4: "video",
  webm: "video",
  mov: "video",
  mkv: "video",
  avi: "video",
  flv: "video",
  m4v: "video",
  wmv: "video",
  json: "code",
  jsonc: "code",
  yaml: "code",
  yml: "code",
  toml: "code",
  ini: "code",
  conf: "code",
  cfg: "code",
  xml: "code",
  sql: "code",
  html: "code",
  htm: "code",
  css: "code",
  scss: "code",
  js: "code",
  mjs: "code",
  cjs: "code",
  jsx: "code",
  ts: "code",
  tsx: "code",
  vue: "code",
  py: "code",
  go: "code",
  rs: "code",
  java: "code",
  kt: "code",
  swift: "code",
  c: "code",
  h: "code",
  cpp: "code",
  hpp: "code",
  cs: "code",
  php: "code",
  rb: "code",
  lua: "code",
  sh: "code",
  bash: "code",
  zsh: "code",
  bat: "code",
  cmd: "code",
  ps1: "code",
  txt: "text",
  md: "text",
  log: "text",
  ics: "text",
  srt: "text",
  vtt: "text",
  ass: "text",
};

export function fileCategoryFromKey(key: string): FileCategory {
  const ext = fileExtFromKey(key);
  return (ext && CATEGORY_BY_EXT[ext]) || "other";
}

export function validateFileUploadInput(input: {
  filename: unknown;
  size: unknown;
}): string | null {
  const { filename, size } = input;

  if (typeof filename !== "string" || filename.trim().length === 0) {
    return "缺少文件名";
  }
  if (filename.length > 255) {
    return "文件名过长";
  }
  const ext = fileExtensionFromName(filename);
  if (!ext) {
    return "文件缺少可识别的扩展名";
  }
  if (!isAllowedFileExtension(ext)) {
    return `不支持 .${ext} 格式`;
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return "文件大小无效";
  }
  if (size > FILE_MAX_BYTES) {
    return `文件不能超过 ${FILE_MAX_MB}MB`;
  }
  return null;
}

export function fileContentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
