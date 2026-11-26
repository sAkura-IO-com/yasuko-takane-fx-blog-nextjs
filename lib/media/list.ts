import "server-only";

import { HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

import { requireMediaConfig } from "./config";
import { getS3Client } from "./s3";
import type { MediaListResult, MediaObject } from "./types";
import { mediaUrl } from "./url";

export const MEDIA_PAGE_SIZE = 60;

const LIST_PAGE_SIZE = 1000;

export type MediaSort = "key" | "recent";

type ListedObject = { Key: string; Size?: number; LastModified?: Date };

function isListedObject(object: { Key?: string }): object is ListedObject {
  return Boolean(object.Key);
}

function toMediaObject(object: ListedObject): MediaObject {
  return {
    key: object.Key,
    url: mediaUrl(object.Key),
    size: object.Size ?? 0,
    lastModified: object.LastModified?.toISOString() ?? null,
    contentType: null,
  };
}

async function listObjects(
  prefix: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<{ objects: ListedObject[]; nextCursor: string | null }> {
  const { bucket } = requireMediaConfig();
  const response = await getS3Client().send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: options.limit ?? MEDIA_PAGE_SIZE,
      ContinuationToken: options.cursor || undefined,
    }),
  );

  return {
    objects: (response.Contents ?? [])
      .filter(isListedObject)
      .filter((object) => !object.Key.startsWith("_backups/")),
    nextCursor: response.IsTruncated
      ? (response.NextContinuationToken ?? null)
      : null,
  };
}

async function listAllObjects(prefix: string): Promise<ListedObject[]> {
  const objects: ListedObject[] = [];
  let cursor: string | undefined;

  do {
    const page = await listObjects(prefix, {
      cursor,
      limit: LIST_PAGE_SIZE,
    });
    objects.push(...page.objects);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return objects;
}

export async function statMediaObject(
  key: string,
): Promise<{ size: number; contentType: string | null } | null> {
  const { bucket } = requireMediaConfig();
  try {
    const response = await getS3Client().send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      size: response.ContentLength ?? 0,
      contentType: response.ContentType ?? null,
    };
  } catch {
    return null;
  }
}

export async function listMedia(
  options: {
    prefix?: string;
    cursor?: string;
    limit?: number;
    sort?: MediaSort;
  } = {},
): Promise<MediaListResult> {
  const prefix = options.prefix ?? "library/";
  const limit = options.limit ?? MEDIA_PAGE_SIZE;

  if (options.sort === "recent") {
    const objects = await listAllObjects(prefix);
    objects.sort(
      (a, b) =>
        (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0) ||
        a.Key.localeCompare(b.Key),
    );

    const start = Math.max(0, Number(options.cursor ?? 0) || 0);
    const page = objects.slice(start, start + limit);
    return {
      items: page.map(toMediaObject),
      nextCursor:
        start + page.length < objects.length
          ? String(start + page.length)
          : null,
    };
  }

  const { objects, nextCursor } = await listObjects(prefix, {
    cursor: options.cursor,
    limit,
  });
  return { items: objects.map(toMediaObject), nextCursor };
}
