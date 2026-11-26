import "server-only";

import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { contentType, post } from "@/db/schema";

import { toContentTypeView } from "./map";
import type { ContentTypeView } from "./types";

export async function listContentTypes(): Promise<ContentTypeView[]> {
  const rows = await db
    .select()
    .from(contentType)
    .orderBy(asc(contentType.sortOrder), asc(contentType.createdAt));
  return rows.map(toContentTypeView);
}

export async function getContentTypeByKey(key: string) {
  const [row] = await db
    .select()
    .from(contentType)
    .where(eq(contentType.key, key))
    .limit(1);
  return row ? toContentTypeView(row) : null;
}

export async function countPostsForType(typeId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(post)
    .where(eq(post.typeId, typeId));
  return Number(row?.value ?? 0);
}

export async function countPublishedPostsForType(typeId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(post)
    .where(and(eq(post.typeId, typeId), eq(post.status, "published")));
  return Number(row?.value ?? 0);
}
