import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import { assertSiteWritable } from "@/lib/site/writable";
import { comment, contentType, post } from "@/db/schema";

import type { CommentPage, CommentStatus, PublicComment } from "./types";

export type { CommentPage, CommentStatus, PublicComment } from "./types";

const PUBLIC_COLUMNS = {
  id: comment.id,
  parentId: comment.parentId,
  rootId: comment.rootId,
  authorName: comment.authorName,
  isAdmin: comment.isAdmin,
  body: comment.body,
  createdAt: comment.createdAt,
} as const;

type PublicRow = {
  id: string;
  parentId: string | null;
  rootId: string | null;
  authorName: string;
  isAdmin: boolean;
  body: string;
  createdAt: Date;
};

function toPublicComment(row: PublicRow): PublicComment {
  return {
    id: row.id,
    parentId: row.parentId,
    rootId: row.rootId,
    authorName: row.authorName,
    isAdmin: row.isAdmin,
    body: row.body,
    createdAt: row.createdAt,
  };
}

export const COMMENT_ROOT_PAGE_SIZE = 20;

export type CommentCursor = { createdAt: Date; id: string };

export function encodeCommentCursor(cursor: CommentCursor): string {
  return `${cursor.createdAt.toISOString()}|${cursor.id}`;
}

export function decodeCommentCursor(value: unknown): CommentCursor | null {
  if (typeof value !== "string") return null;
  const [iso, id] = value.split("|");
  if (!iso || !id) return null;
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id };
}

export async function listApprovedComments(
  postId: string,
  options: { cursor?: CommentCursor | null; limit?: number } = {},
): Promise<CommentPage> {
  const limit = options.limit ?? COMMENT_ROOT_PAGE_SIZE;
  const cursor = options.cursor ?? null;

  const roots = await db
    .select(PUBLIC_COLUMNS)
    .from(comment)
    .where(
      and(
        eq(comment.postId, postId),
        eq(comment.status, "approved"),
        isNull(comment.rootId),
        cursor
          ? or(
              lt(comment.createdAt, cursor.createdAt),
              and(
                eq(comment.createdAt, cursor.createdAt),
                lt(comment.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(comment.createdAt), desc(comment.id))
    .limit(limit + 1);

  const hasMore = roots.length > limit;
  const page = hasMore ? roots.slice(0, limit) : roots;
  const last = page.at(-1);

  const replies = page.length
    ? await db
        .select(PUBLIC_COLUMNS)
        .from(comment)
        .where(
          and(
            eq(comment.status, "approved"),
            inArray(
              comment.rootId,
              page.map((row) => row.id),
            ),
          ),
        )
        .orderBy(asc(comment.createdAt), asc(comment.id))
    : [];

  const [totals] = await db
    .select({ total: count() })
    .from(comment)
    .where(and(eq(comment.postId, postId), eq(comment.status, "approved")));

  return {
    roots: page.map(toPublicComment),
    replies: replies.map(toPublicComment),
    nextCursor:
      hasMore && last
        ? encodeCommentCursor({ createdAt: last.createdAt, id: last.id })
        : null,
    total: Number(totals?.total ?? 0),
  };
}

export type CreateCommentInput = {
  postId: string;
  parentId: string | null;
  authorName: string;
  isAdmin: boolean;
  body: string;
  status: CommentStatus;
  ip: string;
  userAgent: string | null;
};

export async function createCommentRecord(input: CreateCommentInput): Promise<{
  id: string;
  parentId: string | null;
  rootId: string | null;
  createdAt: Date;
}> {
  await assertSiteWritable();
  let rootId: string | null = null;

  if (input.parentId) {
    const [parent] = await db
      .select({
        id: comment.id,
        rootId: comment.rootId,
        postId: comment.postId,
      })
      .from(comment)
      .where(eq(comment.id, input.parentId))
      .limit(1);
    if (!parent || parent.postId !== input.postId) {
      throw new Error("被回复的评论不存在");
    }
    rootId = parent.rootId ?? parent.id;
  }

  const [row] = await db
    .insert(comment)
    .values({
      postId: input.postId,
      parentId: input.parentId,
      rootId,
      authorName: input.authorName,
      isAdmin: input.isAdmin,
      body: input.body,
      status: input.status,
      ip: input.ip,
      userAgent: input.userAgent,
      reviewedAt: input.status === "approved" ? new Date() : null,
    })
    .returning({
      id: comment.id,
      parentId: comment.parentId,
      rootId: comment.rootId,
      createdAt: comment.createdAt,
    });

  if (!row) throw new Error("评论写入失败");
  return row;
}

export async function loadCommentParentContext(parentId: string): Promise<{
  postId: string;
  postSection: string;
  postSlug: string;
} | null> {
  const [row] = await db
    .select({
      postId: comment.postId,
      postSection: contentType.slug,
      postSlug: post.slug,
    })
    .from(comment)
    .innerJoin(post, eq(post.id, comment.postId))
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(eq(comment.id, parentId))
    .limit(1);
  return row ?? null;
}

export async function setCommentStatus(
  id: string,
  status: CommentStatus,
  reviewerUserId: string | null,
): Promise<{ postId: string } | null> {
  await assertSiteWritable();
  const rows = await db
    .update(comment)
    .set({
      status,
      reviewedAt: new Date(),
      reviewedByUserId: reviewerUserId,
    })
    .where(eq(comment.id, id))
    .returning({ id: comment.id, postId: comment.postId });
  return rows[0] ?? null;
}

export async function deleteCommentRecord(
  id: string,
): Promise<{ postId: string } | null> {
  await assertSiteWritable();
  const rows = await db
    .delete(comment)
    .where(eq(comment.id, id))
    .returning({ id: comment.id, postId: comment.postId });
  return rows[0] ?? null;
}

export type CommentCounts = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

export async function countCommentsByPost(
  postId?: string,
): Promise<CommentCounts> {
  const rows = await db
    .select({ status: comment.status, total: count() })
    .from(comment)
    .where(postId ? eq(comment.postId, postId) : undefined)
    .groupBy(comment.status);

  const totals: CommentCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  };
  for (const row of rows) {
    const status = row.status === "spam" ? "rejected" : row.status;
    totals[status] += Number(row.total);
    totals.total += Number(row.total);
  }
  return totals;
}

export type AdminCommentRow = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  postSection: string;
  postStatus: "draft" | "published" | "archived";
  parentId: string | null;
  rootId: string | null;
  authorName: string;
  isAdmin: boolean;
  body: string;
  status: CommentStatus;
  createdAt: Date;
};

function adminSelection() {
  return {
    id: comment.id,
    postId: comment.postId,
    postTitle: post.title,
    postSlug: post.slug,
    postSection: contentType.slug,
    postStatus: post.status,
    parentId: comment.parentId,
    rootId: comment.rootId,
    authorName: comment.authorName,
    isAdmin: comment.isAdmin,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
  } as const;
}

export async function listCommentsForAdmin(options: {
  status?: CommentStatus;
  statuses?: CommentStatus[];
  postId?: string;
  postIds?: string[];
  since?: Date;
  limit?: number;
}): Promise<AdminCommentRow[]> {
  const statuses = [
    ...(options.status ? [options.status] : []),
    ...(options.statuses ?? []),
  ];
  const postIds = [
    ...(options.postId ? [options.postId] : []),
    ...(options.postIds ?? []),
  ];

  return db
    .select(adminSelection())
    .from(comment)
    .innerJoin(post, eq(post.id, comment.postId))
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(
      and(
        statuses.length > 0 ? inArray(comment.status, statuses) : undefined,
        postIds.length > 0 ? inArray(comment.postId, postIds) : undefined,
        options.since ? gte(comment.createdAt, options.since) : undefined,
      ),
    )
    .orderBy(desc(comment.createdAt))
    .limit(options.limit ?? 100);
}
