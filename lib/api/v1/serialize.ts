import type { PublishedPostCard } from "@/lib/blog/db";
import { postPath } from "@/lib/blog/paths";
import type {
  CommentStatus,
  CreatedCommentView,
  PublicComment,
} from "@/lib/comments/types";
import { mediaUrl } from "@/lib/media/url";
import { absoluteUrl } from "@/lib/site";

export type PublicCover = {
  url: string;
  width: number | null;
  height: number | null;
};

export type PublicTag = {
  slug: string;
  name: string;
};

export type PublicPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  kind: string;
  path: string;
  url: string;
  cover: PublicCover | null;
  publishedAt: string | null;
  updatedAt: string;
  wordCount: number;
  viewCount: number;
  tags: PublicTag[];
};

export type PublicPostDetail = PublicPostSummary & {
  body: {
    format: "markdown";
    markdown: string;
  };
};

export type PublicApiComment = {
  id: string;
  parentId: string | null;
  rootId: string | null;
  authorName: string;
  isAdmin: boolean;
  body: string;
  createdAt: string;
};

export type PublicApiCreatedComment = PublicApiComment & {
  status: CommentStatus;
};

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

type PostSummarySource = Pick<
  PublishedPostCard,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "typeKey"
  | "typeSlug"
  | "coverKey"
  | "coverWidth"
  | "coverHeight"
  | "publishedAt"
  | "updatedAt"
  | "wordCount"
  | "viewCount"
  | "tags"
>;

export function serializePostSummary(
  post: PostSummarySource,
): PublicPostSummary {
  const path = postPath(post.typeSlug, post.slug);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    kind: post.typeKey,
    path,
    url: absoluteUrl(path),
    cover: post.coverKey
      ? {
          url: mediaUrl(post.coverKey),
          width: post.coverWidth,
          height: post.coverHeight,
        }
      : null,
    publishedAt: iso(post.publishedAt),
    updatedAt: post.updatedAt.toISOString(),
    wordCount: post.wordCount,
    viewCount: post.viewCount,
    tags: post.tags.map((tag) => ({ slug: tag.slug, name: tag.name })),
  };
}

export function serializePostDetail(
  post: PostSummarySource & { content: string },
): PublicPostDetail {
  return {
    ...serializePostSummary(post),
    body: {
      format: "markdown",
      markdown: post.content,
    },
  };
}

export function serializeComment(comment: PublicComment): PublicApiComment {
  return {
    id: comment.id,
    parentId: comment.parentId,
    rootId: comment.rootId,
    authorName: comment.authorName,
    isAdmin: comment.isAdmin,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function serializeCreatedComment(
  comment: CreatedCommentView,
): PublicApiCreatedComment {
  return {
    id: comment.id,
    parentId: comment.parentId,
    rootId: comment.rootId,
    authorName: comment.authorName,
    isAdmin: comment.isAdmin,
    body: comment.body,
    createdAt: comment.createdAt,
    status: comment.status,
  };
}

export function maxUpdatedAt(
  dates: Array<Date | null | undefined>,
): Date | null {
  let latest: Date | null = null;
  for (const date of dates) {
    if (!date) continue;
    if (!latest || date.getTime() > latest.getTime()) latest = date;
  }
  return latest;
}
