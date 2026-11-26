import { COMMENT_MAX_LENGTH, COMMENT_NAME_MAX_LENGTH } from "./format";

export const COMMENT_NAME_MIN_LENGTH = 1;

export const COMMENT_HONEYPOT_FIELD = "website";

export type CommentFormInput = {
  name: unknown;
  body: unknown;
  honeypot: unknown;
};

export type CommentFormErrors = {
  name?: string;
  body?: string;
};

export type CommentFormValues = {
  name: string;
  body: string;
  bot: boolean;
};

export function normalizeCommentName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (name.length < COMMENT_NAME_MIN_LENGTH) return null;
  if (name.length > COMMENT_NAME_MAX_LENGTH) return null;
  return name;
}

export function normalizeCommentBody(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, COMMENT_MAX_LENGTH);
}

export function validateCommentForm(
  input: CommentFormInput,
):
  | { ok: true; values: CommentFormValues }
  | { ok: false; errors: CommentFormErrors } {
  const honeypot =
    typeof input.honeypot === "string" ? input.honeypot.trim() : "";
  const name = normalizeCommentName(input.name);
  const body = normalizeCommentBody(input.body);

  if (honeypot) {
    return {
      ok: true,
      values: { name: name ?? "", body, bot: true },
    };
  }

  const errors: CommentFormErrors = {};
  if (!name) {
    errors.name = `ニックネームは1〜${COMMENT_NAME_MAX_LENGTH}文字で入力してください`;
  }
  if (!body) errors.body = "コメントを入力してください";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    values: { name: name as string, body, bot: false },
  };
}
