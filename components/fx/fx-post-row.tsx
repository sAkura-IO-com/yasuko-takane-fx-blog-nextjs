import Link from "next/link";

import type { PublishedPostCard } from "@/lib/blog/db";
import { postPath } from "@/lib/content-types/paths";
import { fxCoverUrl } from "@/lib/fx/media";

import { FxPostMeta } from "./fx-post-meta";

export function FxPostRow({ post }: { post: PublishedPostCard }) {
  const href = postPath(post.typeSlug, post.slug);
  const cover = fxCoverUrl(post.coverKey);
  const titleId = `post-row-${post.typeSlug}-${post.slug}`;

  return (
    <article className="fx-post-row">
      <div className="fx-post-row-body">
        <Link
          href={href}
          className="fx-post-row-link"
          aria-labelledby={titleId}
        >
          <FxPostMeta post={post} />
          <h2 id={titleId} className="fx-post-row-title">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="fx-post-row-excerpt">{post.excerpt}</p>
          ) : null}
        </Link>
        {post.tags.length > 0 ? (
          <div className="fx-post-row-footer">
            <ul className="fx-tag-chips" aria-label="タグ">
              {post.tags.map((tag) => (
                <li key={tag.slug}>
                  <Link href={`/tag/${tag.slug}`} className="fx-tag-chip">
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <Link
        href={href}
        className="fx-post-row-media"
        tabIndex={-1}
        aria-hidden="true"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            width={post.coverWidth ?? undefined}
            height={post.coverHeight ?? undefined}
          />
        ) : (
          <div className="fx-dot-pattern" />
        )}
      </Link>
    </article>
  );
}
