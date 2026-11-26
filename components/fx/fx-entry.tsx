import { Suspense } from "react";

import {
  CommentSection,
  CommentSectionFallback,
} from "@/components/comments/comment-section";
import { ViewTracker } from "@/components/blog/view-tracker";
import type { PostWithTags, PublishedPostCard } from "@/lib/blog/db";
import { postPath } from "@/lib/content-types/paths";
import type { ContentTypeView } from "@/lib/content-types/types";
import {
  buildBlogPostingJsonLd,
  buildEntryBreadcrumbJsonLd,
} from "@/lib/seo/entry";
import { JsonLdScript } from "@/lib/seo/json-ld";

import { FxPostPager } from "./fx-post-pager";

export function FxEntry({
  type,
  post,
  html,
  cards,
  canonicalPath,
  showBreadcrumb = true,
}: {
  type: ContentTypeView;
  post: PostWithTags;
  html: string;
  cards: PublishedPostCard[];
  canonicalPath?: string;
  showBreadcrumb?: boolean;
}) {
  const postPathValue = postPath(type.slug, post.slug);
  const jsonPath = canonicalPath ?? postPathValue;

  return (
    <article className="fx-entry">
      <JsonLdScript
        data={buildBlogPostingJsonLd(type, post, { path: jsonPath })}
      />
      {showBreadcrumb ? (
        <JsonLdScript data={buildEntryBreadcrumbJsonLd(type, post)} />
      ) : null}

      <header className="fx-entry-header">
        <FxPostPager
          cards={cards}
          currentSlug={post.slug}
          typeSlug={type.slug}
        />
        <h1 className="fx-entry-title">{post.title}</h1>
      </header>

      <div className="fx-entry-body">
        <div
          className="ios-md fx-md"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <Suspense fallback={<CommentSectionFallback />}>
          <CommentSection postId={post.id} postPath={postPathValue} />
        </Suspense>
      </div>

      <ViewTracker slug={post.slug} />
    </article>
  );
}
