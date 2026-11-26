"use client";

import { useCallback, useMemo, useState } from "react";

import {
  loadMoreCommentsAction,
  type CommentSubmitState,
} from "@/lib/comments/actions";
import type { CommentPage, PublicComment } from "@/lib/comments/types";
import { fxCopy } from "@/lib/fx/copy";

import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

export type CommentThreadProps = {
  postId: string;
  postPath: string;
  initial: CommentPage;
};

type Item = { comment: PublicComment; pending: boolean };

function timeOf(comment: PublicComment): number {
  const value =
    comment.createdAt instanceof Date
      ? comment.createdAt
      : new Date(comment.createdAt);
  return value.getTime();
}

export function CommentThread({
  postId,
  postPath,
  initial,
}: CommentThreadProps) {
  const [page, setPage] = useState(initial);
  const [snapshot, setSnapshot] = useState(initial);
  if (snapshot !== initial) {
    setSnapshot(initial);
    setPage(initial);
  }

  const [locals, setLocals] = useState<Item[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { roots, replies, nextCursor } = page;

  const items = useMemo<Item[]>(() => {
    const serverIds = new Set(
      [...roots, ...replies].map((comment) => comment.id),
    );
    return [
      ...roots.map((comment) => ({ comment, pending: false })),
      ...replies.map((comment) => ({ comment, pending: false })),
      ...locals.filter((item) => !serverIds.has(item.comment.id)),
    ].sort((a, b) => timeOf(a.comment) - timeOf(b.comment));
  }, [roots, replies, locals]);

  const handleSubmitted = useCallback((state: CommentSubmitState) => {
    const created = state.created;
    if (!created) return;
    setLocals((prev) => [
      ...prev,
      {
        comment: {
          id: created.id,
          parentId: created.parentId,
          rootId: created.rootId,
          authorName: created.authorName,
          isAdmin: created.isAdmin,
          body: created.body,
          createdAt: new Date(created.createdAt),
        },
        pending: created.status !== "approved",
      },
    ]);
  }, []);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const next = await loadMoreCommentsAction(postId, nextCursor);
      if ("error" in next) {
        setError(next.error);
        return;
      }
      setPage((prev) => ({
        roots: [...prev.roots, ...next.roots],
        replies: [...prev.replies, ...next.replies],
        nextCursor: next.nextCursor,
        total: next.total,
      }));
    } catch {
      setError(fxCopy.commentNetworkError);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <div className="fx-comments-list-block">
        <h2 className="fx-comments-title">{fxCopy.discussion}</h2>

        {items.length > 0 ? (
          <ol className="fx-comment-list">
            {items.map(({ comment }) => (
              <li key={comment.id}>
                <CommentItem comment={comment} />
              </li>
            ))}
          </ol>
        ) : null}

        {error ? <p className="fx-comment-error">{error}</p> : null}

        {nextCursor ? (
          <div className="fx-comment-more">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void handleLoadMore()}
            >
              {loadingMore ? fxCopy.commentLoading : fxCopy.commentLoadMore}
            </button>
          </div>
        ) : null}
      </div>

      <CommentForm
        postId={postId}
        postPath={postPath}
        onSubmitted={handleSubmitted}
      />
    </>
  );
}
