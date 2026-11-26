import type { PublishedPostCard } from "@/lib/blog/db";
import { readingTimeLabel } from "@/lib/blog/slug";
import { formatFxDate } from "@/lib/fx/format";

export function FxPostMeta({ post }: { post: PublishedPostCard }) {
  return (
    <div className="fx-post-meta">
      {post.publishedAt ? (
        <time dateTime={post.publishedAt.toISOString()}>
          {formatFxDate(post.publishedAt)}
        </time>
      ) : null}
      {post.wordCount > 0 ? (
        <span>{readingTimeLabel(post.wordCount)}</span>
      ) : null}
    </div>
  );
}
