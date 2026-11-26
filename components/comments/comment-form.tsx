"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  createCommentAction,
  type CommentSubmitState,
} from "@/lib/comments/actions";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_NAME_MAX_LENGTH,
} from "@/lib/comments/format";
import { COMMENT_HONEYPOT_FIELD } from "@/lib/comments/validate";
import { fxCopy } from "@/lib/fx/copy";
import { readNicknameCookie, writeNicknameCookie } from "@/lib/nickname-cookie";

export type CommentFormProps = {
  postId: string;
  postPath: string;
  onSubmitted?: (state: CommentSubmitState) => void;
};

export function CommentForm({
  postId,
  postPath,
  onSubmitted,
}: CommentFormProps) {
  const [state, formAction, pending] = useActionState<
    CommentSubmitState | null,
    FormData
  >(createCommentAction, null);

  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const handled = useRef<CommentSubmitState | null>(null);

  useEffect(() => {
    setNickname(readNicknameCookie());
  }, []);

  useEffect(() => {
    if (!state || handled.current === state || !state.ok) return;
    handled.current = state;
    setBody("");
    onSubmitted?.(state);
  }, [state, onSubmitted]);

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const canSend = Boolean(body.trim()) && !pending;

  function onSubmit() {
    if (nickname.trim()) writeNicknameCookie(nickname);
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="fx-comment-form">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="postPath" value={postPath} />

      <div className="fx-comment-honeypot" aria-hidden="true">
        <label>
          website
          <input
            type="text"
            name={COMMENT_HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="fx-comment-field">
        <span>{fxCopy.commentName}</span>
        <input
          name="name"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={COMMENT_NAME_MAX_LENGTH}
          autoComplete="nickname"
          className="fx-comment-input"
        />
      </label>

      <label className="fx-comment-field">
        <span>{fxCopy.commentBody}</span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={8}
          maxLength={COMMENT_MAX_LENGTH}
          className="fx-comment-textarea"
        />
      </label>

      <div className="fx-comment-form-actions">
        <button type="submit" className="fx-comment-submit" disabled={!canSend}>
          {pending ? fxCopy.commentSubmitting : fxCopy.commentSubmit}
        </button>
      </div>

      {fieldErrors.name ? (
        <p className="fx-comment-error">{fieldErrors.name}</p>
      ) : null}
      {fieldErrors.body ? (
        <p className="fx-comment-error">{fieldErrors.body}</p>
      ) : null}
      {state?.error ? <p className="fx-comment-error">{state.error}</p> : null}
      {state?.ok ? (
        <p className="fx-comment-success">
          {state.created?.status === "approved"
            ? fxCopy.commentPublished
            : fxCopy.commentPending}
        </p>
      ) : null}
    </form>
  );
}
