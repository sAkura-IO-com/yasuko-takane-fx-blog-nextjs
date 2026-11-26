import { cachedApprovedComments } from "@/lib/comments/cached";
import { fxCopy } from "@/lib/fx/copy";

import "./comments.css";
import { CommentThread } from "./comment-thread";

export type CommentSectionProps = {
  postId: string;
  postPath: string;
};

export async function CommentSection({
  postId,
  postPath,
}: CommentSectionProps) {
  const initial = await cachedApprovedComments(postId);

  return (
    <section
      className="fx-comments"
      id="comments"
      aria-label={fxCopy.discussion}
    >
      <CommentThread postId={postId} postPath={postPath} initial={initial} />
    </section>
  );
}

export function CommentSectionFallback() {
  return (
    <section className="fx-comments" aria-hidden="true">
      <h2 className="fx-comments-title">{fxCopy.discussion}</h2>
      <p className="fx-comment-loading">{fxCopy.commentLoading}</p>
    </section>
  );
}
