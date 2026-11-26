"use client";

import type { ReactNode } from "react";

import type { PublicComment } from "@/lib/comments/types";

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

function renderBody(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(URL_RE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(
      <a key={key} href={match[0]} rel="nofollow ugc noopener" target="_blank">
        {match[0]}
      </a>,
    );
    key += 1;
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function CommentItem({ comment }: { comment: PublicComment }) {
  return (
    <article className="fx-comment">
      <div className="fx-comment-gutter" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fx/heart.svg" alt="" className="fx-comment-heart" />
        <span className="fx-comment-line" />
      </div>

      <div className="fx-comment-main">
        <div className="fx-comment-name">{comment.authorName}</div>
        <div className="fx-comment-body">{renderBody(comment.body)}</div>
      </div>
    </article>
  );
}
