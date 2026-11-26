"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireOwner } from "@/lib/blog/owner";
import { postPath } from "@/lib/content-types/paths";
import { clientIpFromHeaders } from "@/lib/http/ip";
import { asString } from "@/lib/strings";

import {
  COMMENT_ROOT_PAGE_SIZE,
  createCommentRecord,
  decodeCommentCursor,
  deleteCommentRecord,
  listApprovedComments,
  loadCommentParentContext,
  setCommentStatus,
} from "./db";
import { COMMENT_MAX_LENGTH } from "./format";
import { isCommentUuid } from "./id";
import { invalidateComments, submitPublicComment } from "./submit";
import type { CommentPage, CreatedCommentView } from "./types";

export type CommentSubmitState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  created?: CreatedCommentView;
};

export async function createCommentAction(
  _prev: CommentSubmitState | null,
  formData: FormData,
): Promise<CommentSubmitState> {
  const result = await submitPublicComment({
    postId: asString(formData.get("postId")),
    parentId: formData.get("parentId"),
    name: formData.get("name"),
    body: formData.get("body"),
    honeypot: formData.get("website"),
    requestHeaders: await headers(),
  });

  if (!result.ok) {
    if (result.rateLimited) return { error: result.error };
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }
  if (result.bot) return { ok: true };
  return { ok: true, created: result.created };
}

export async function loadMoreCommentsAction(
  postId: string,
  cursor: string | null,
): Promise<CommentPage | { error: string }> {
  if (!isCommentUuid(postId)) return { error: "パラメータが不正です" };
  try {
    return await listApprovedComments(postId, {
      cursor: decodeCommentCursor(cursor),
      limit: COMMENT_ROOT_PAGE_SIZE,
    });
  } catch (error) {
    console.error("[comments] load more failed:", error);
    return {
      error: "読み込みに失敗しました。もう一度お試しください",
    };
  }
}

export async function approveCommentAction(id: string): Promise<void> {
  const session = await requireOwner("/admin/comments");
  if (!isCommentUuid(id)) return;
  const changed = await setCommentStatus(id, "approved", session.user.id);
  revalidatePath("/admin/comments");
  if (changed) {
    invalidateComments(changed.postId);
  }
}

export async function rejectCommentAction(id: string): Promise<void> {
  const session = await requireOwner("/admin/comments");
  if (!isCommentUuid(id)) return;
  const changed = await setCommentStatus(id, "rejected", session.user.id);
  revalidatePath("/admin/comments");
  if (changed) invalidateComments(changed.postId);
}

export async function deleteCommentAction(id: string): Promise<void> {
  await requireOwner("/admin/comments");
  if (!isCommentUuid(id)) return;
  const deleted = await deleteCommentRecord(id);
  revalidatePath("/admin/comments");
  if (deleted) invalidateComments(deleted.postId);
}

export async function replyCommentAction(
  _prev: CommentSubmitState | null,
  formData: FormData,
): Promise<CommentSubmitState> {
  const session = await requireOwner("/admin/comments");

  const parentId = asString(formData.get("parentId"));
  const body = asString(formData.get("body"))
    .trim()
    .slice(0, COMMENT_MAX_LENGTH);
  if (!isCommentUuid(parentId)) return { error: "被回复的评论不存在" };
  if (!body) return { error: "写点什么再回复" };

  const target = await loadCommentParentContext(parentId);
  if (!target) return { error: "被回复的评论不存在" };

  try {
    await createCommentRecord({
      postId: target.postId,
      parentId,
      authorName: session.user.name ?? "管理员",
      isAdmin: true,
      body,
      status: "approved",
      ip: clientIpFromHeaders(await headers()),
      userAgent: null,
    });

    invalidateComments(target.postId);
    revalidatePath("/admin/comments");
    revalidatePath(postPath(target.postSection, target.postSlug));

    return { ok: true };
  } catch (error) {
    console.error("[comments] admin reply failed:", error);
    return { error: "回复失败，请稍后再试" };
  }
}
