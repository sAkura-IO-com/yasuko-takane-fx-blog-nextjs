import "server-only";

import { revalidateTag, updateTag } from "next/cache";

import { cacheTags } from "@/lib/blog/cache-tags";
import { clientIpFromHeaders } from "@/lib/http/ip";

import { createCommentRecord } from "./db";
import { isCommentUuid } from "./id";
import type { CommentStatus, CreatedCommentView } from "./types";
import { takeCommentQuota } from "./quota";
import { validateCommentForm } from "./validate";

export type SubmitPublicCommentInput = {
  postId: string;
  parentId: unknown;
  name: unknown;
  body: unknown;
  honeypot: unknown;
  requestHeaders: Headers;
};

export type SubmitPublicCommentResult =
  | { ok: true; bot: true; created: CreatedCommentView }
  | { ok: true; bot: false; created: CreatedCommentView }
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string>;
      rateLimited?: false;
    }
  | {
      ok: false;
      rateLimited: true;
      retryAfterSeconds: number;
      error: string;
    };

export function invalidateComments(postId: string) {
  updateTag(cacheTags.comments(postId));
  revalidateTag(cacheTags.comments(postId), "max");
}

function previewCreatedComment(input: {
  parentId: string | null;
  authorName: string;
  body: string;
}): CreatedCommentView {
  return {
    id: crypto.randomUUID(),
    parentId: input.parentId,
    rootId: input.parentId,
    authorName: input.authorName || "ゲスト",
    isAdmin: false,
    body: input.body,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
}

export async function submitPublicComment(
  input: SubmitPublicCommentInput,
): Promise<SubmitPublicCommentResult> {
  const ip = clientIpFromHeaders(input.requestHeaders);
  const quota = takeCommentQuota(ip);
  if (!quota.ok) {
    return {
      ok: false,
      rateLimited: true,
      retryAfterSeconds: quota.retryAfterSeconds,
      error: "コメントが多すぎます。しばらくしてからお試しください",
    };
  }

  if (!isCommentUuid(input.postId)) {
    return {
      ok: false,
      error: "ページの有効期限が切れました。再読み込みしてください",
    };
  }

  const parsed = validateCommentForm({
    name: input.name,
    body: input.body,
    honeypot: input.honeypot,
  });
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };

  const { name, body, bot } = parsed.values;
  const parentId = isCommentUuid(input.parentId) ? input.parentId : null;

  if (bot) {
    return {
      ok: true,
      bot: true,
      created: previewCreatedComment({ parentId, authorName: name, body }),
    };
  }

  const status: CommentStatus = "pending";

  try {
    const created = await createCommentRecord({
      postId: input.postId,
      parentId,
      authorName: name,
      isAdmin: false,
      body,
      status,
      ip,
      userAgent: input.requestHeaders.get("user-agent")?.slice(0, 255) ?? null,
    });

    return {
      ok: true,
      bot: false,
      created: {
        id: created.id,
        parentId: created.parentId,
        rootId: created.rootId,
        authorName: name,
        isAdmin: false,
        body,
        createdAt: created.createdAt.toISOString(),
        status,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "被回复的评论不存在") {
      return { ok: false, error: "返信先のコメントが見つかりません" };
    }
    console.error("[comments] create failed:", error);
    return {
      ok: false,
      error: "コメントを送信できませんでした。しばらくしてからお試しください",
    };
  }
}
