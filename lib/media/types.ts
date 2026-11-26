export type MediaObject = {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
  contentType: string | null;
  width?: number | null;
  height?: number | null;
};

export type MediaListResult = {
  items: MediaObject[];
  nextCursor: string | null;
};

export type MediaBatchDeleteResult = {
  deleted: string[];
  blocked: { key: string; references: string[] }[];
  failed: string[];
};
