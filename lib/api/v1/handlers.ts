import { connection } from "next/server";

import {
  cachedPublishedPost,
  cachedPublishedPostCards,
} from "@/lib/blog/cached";
import {
  cachedContentTypeByKey,
  cachedContentTypeBySlug,
  cachedEnabledContentTypes,
} from "@/lib/content-types/cached";
import type { ContentTypeView } from "@/lib/content-types/types";
import { isValidSlug } from "@/lib/blog/slug";
import { decodeCommentCursor, listApprovedComments } from "@/lib/comments/db";
import { submitPublicComment } from "@/lib/comments/submit";
import { homeProfile } from "@/lib/home/content";
import {
  absoluteUrl,
  siteAboutMd,
  siteContentUpdatedAt,
  siteName,
  siteNowMd,
  siteSubtitle,
  siteUrl,
} from "@/lib/site";

import { jsonError, jsonOk, jsonRateLimited, jsonWrite } from "./http";
import {
  decodeTimestampCursor,
  paginateByTimestamp,
  parsePageLimit,
} from "./pagination";
import {
  maxUpdatedAt,
  serializeComment,
  serializeCreatedComment,
  serializePostDetail,
  serializePostSummary,
} from "./serialize";

function kindLabel(type: ContentTypeView | null, typeKey: string): string {
  return type?.singularName ?? (typeKey === "note" ? "笔记" : "文章");
}

async function requireEnabledType(typeKey: string) {
  const type = await cachedContentTypeByKey(typeKey);
  if (!type?.enabled) return null;
  return type;
}

export async function getCatalog(request: Request) {
  const base = absoluteUrl("/api/v1");
  const types = await cachedEnabledContentTypes();
  const article = types.find((type) => type.key === "article");
  const note = types.find((type) => type.key === "note");
  const postsSlug = article?.slug ?? "posts";
  const notesSlug = note?.slug ?? "notes";
  const extras = types.filter(
    (type) => type.key !== "article" && type.key !== "note",
  );
  const resources: Record<string, unknown> = {
    feed: `${base}/feed`,
    profile: `${base}/profile`,
    posts: `${base}/${postsSlug}`,
    post: `${base}/${postsSlug}/{slug}`,
    postComments: `${base}/${postsSlug}/{slug}/comments`,
    notes: `${base}/${notesSlug}`,
    note: `${base}/${notesSlug}/{slug}`,
    noteComments: `${base}/${notesSlug}/{slug}/comments`,
  };
  if (extras.length > 0) {
    resources.content = Object.fromEntries(
      types.map((type) => [
        type.slug,
        {
          list: `${base}/content/${type.slug}`,
          item: `${base}/content/${type.slug}/{slug}`,
          comments: `${base}/content/${type.slug}/{slug}/comments`,
        },
      ]),
    );
  }
  const body = {
    version: "v1" as const,
    site: {
      name: siteName,
      url: siteUrl(),
    },
    resources,
  };
  return jsonOk(request, body, {
    etagSeed: `catalog:${siteUrl()}:${types.map((type) => type.slug).join(",")}`,
  });
}

export async function getFeed(request: Request) {
  const types = await cachedEnabledContentTypes();
  const extras = types.filter(
    (type) => type.key !== "article" && type.key !== "note",
  );
  const [articles, notes, ...extraLists] = await Promise.all([
    cachedPublishedPostCards("article"),
    cachedPublishedPostCards("note"),
    ...extras.map((type) => cachedPublishedPostCards(type.key)),
  ]);

  const updatedAt = maxUpdatedAt([
    ...articles.map((item) => item.updatedAt),
    ...notes.map((item) => item.updatedAt),
    ...extraLists.flat().map((item) => item.updatedAt),
  ]);

  const counts: Record<string, number> = {
    posts: articles.length,
    notes: notes.length,
  };
  const latest: Record<string, ReturnType<typeof serializePostSummary>[]> = {
    posts: articles.slice(0, 5).map(serializePostSummary),
    notes: notes.slice(0, 5).map(serializePostSummary),
  };
  extras.forEach((type, index) => {
    const items = extraLists[index] ?? [];
    counts[type.slug] = items.length;
    latest[type.slug] = items.slice(0, 5).map(serializePostSummary);
  });

  const body = {
    version: "v1" as const,
    site: {
      name: siteName,
      title: siteName,
      description: siteSubtitle,
      url: siteUrl(),
      updatedAt: updatedAt?.toISOString() ?? null,
    },
    counts,
    latest,
  };

  return jsonOk(request, body, {
    updatedAt,
    etagSeed: `feed:${updatedAt?.toISOString() ?? "none"}:${articles.length}:${notes.length}`,
  });
}

export async function getProfile(request: Request) {
  const updatedAt = siteContentUpdatedAt;
  const body = {
    name: homeProfile.name,
    role: homeProfile.role,
    bio: homeProfile.bio,
    links: homeProfile.links,
    site: {
      name: siteName,
      title: siteName,
      subtitle: siteSubtitle,
      description: siteSubtitle,
      url: siteUrl(),
    },
    aboutMd: siteAboutMd,
    nowMd: siteNowMd,
    updatedAt: updatedAt.toISOString(),
  };

  return jsonOk(request, body, {
    updatedAt,
    etagSeed: `profile:${updatedAt.toISOString()}`,
  });
}

export async function getContentCollection(request: Request, slug: string) {
  const type = await cachedContentTypeBySlug(slug);
  if (!type?.enabled) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }
  return getPostList(request, type.key);
}

export async function getContentItem(
  request: Request,
  slug: string,
  postSlug: string,
) {
  const type = await cachedContentTypeBySlug(slug);
  if (!type?.enabled) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }
  return getPostDetail(request, postSlug, type.key);
}

export async function getContentComments(
  request: Request,
  slug: string,
  postSlug: string,
) {
  const type = await cachedContentTypeBySlug(slug);
  if (!type?.enabled) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }
  return getPostComments(request, postSlug, type.key);
}

export async function postContentComment(
  request: Request,
  slug: string,
  postSlug: string,
) {
  const type = await cachedContentTypeBySlug(slug);
  if (!type?.enabled) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }
  return postPostComment(request, postSlug, type.key);
}

export async function getPostList(request: Request, typeKey: string) {
  const { searchParams } = new URL(request.url);
  const limit = parsePageLimit(searchParams.get("limit"));
  const cursorRaw = searchParams.get("cursor");
  const cursor = cursorRaw ? decodeTimestampCursor(cursorRaw) : null;
  if (cursorRaw && !cursor) {
    return jsonError(request, 400, "invalid_cursor", "cursor 无效");
  }

  const type = await requireEnabledType(typeKey);
  if (!type) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }

  const items = await cachedPublishedPostCards(typeKey);
  const { page, nextCursor } = paginateByTimestamp(items, cursor, limit);
  const updatedAt = maxUpdatedAt(items.map((item) => item.updatedAt));

  return jsonOk(
    request,
    {
      items: page.map(serializePostSummary),
      nextCursor,
      total: items.length,
      limit,
    },
    {
      updatedAt,
      etagSeed: `${typeKey}:${updatedAt?.toISOString() ?? "none"}:${items.length}:${cursorRaw ?? ""}:${limit}`,
    },
  );
}

export async function getPostDetail(
  request: Request,
  slug: string,
  typeKey: string,
) {
  if (!isValidSlug(slug)) {
    return jsonError(request, 400, "invalid_slug", "slug 格式无效");
  }

  const type = await requireEnabledType(typeKey);
  if (!type) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }

  const data = await cachedPublishedPost(slug, typeKey);
  if (!data) {
    return jsonError(
      request,
      404,
      "not_found",
      `${kindLabel(type, typeKey)}不存在`,
    );
  }

  const body = serializePostDetail(data.post);
  return jsonOk(request, body, {
    updatedAt: data.post.updatedAt,
    etagSeed: `${typeKey}:${slug}:${data.post.updatedAt.toISOString()}`,
  });
}

export async function getPostComments(
  request: Request,
  slug: string,
  typeKey: string,
) {
  if (!isValidSlug(slug)) {
    return jsonError(request, 400, "invalid_slug", "slug 格式无效");
  }

  const type = await requireEnabledType(typeKey);
  if (!type) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }

  const data = await cachedPublishedPost(slug, typeKey);
  if (!data) {
    return jsonError(
      request,
      404,
      "not_found",
      `${kindLabel(type, typeKey)}不存在`,
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = parsePageLimit(searchParams.get("limit"));
  const cursorRaw = searchParams.get("cursor");
  const cursor = cursorRaw ? decodeCommentCursor(cursorRaw) : null;
  if (cursorRaw && !cursor) {
    return jsonError(request, 400, "invalid_cursor", "cursor 无效");
  }

  const page = await listApprovedComments(data.post.id, { cursor, limit });
  const body = {
    roots: page.roots.map(serializeComment),
    replies: page.replies.map(serializeComment),
    nextCursor: page.nextCursor,
    total: page.total,
    limit,
  };

  const stamp = maxUpdatedAt([
    ...page.roots.map((item) => item.createdAt),
    ...page.replies.map((item) => item.createdAt),
    data.post.updatedAt,
  ]);

  return jsonOk(request, body, {
    updatedAt: stamp,
    etagSeed: `comments:${typeKey}:${slug}:${page.total}:${cursorRaw ?? ""}:${limit}:${stamp?.toISOString() ?? "none"}`,
  });
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function postPostComment(
  request: Request,
  slug: string,
  typeKey: string,
) {
  await connection();

  if (!isValidSlug(slug)) {
    return jsonError(request, 400, "invalid_slug", "slug 格式无效");
  }

  const type = await requireEnabledType(typeKey);
  if (!type) {
    return jsonError(request, 404, "not_found", "分类不存在");
  }

  const data = await cachedPublishedPost(slug, typeKey);
  if (!data) {
    return jsonError(
      request,
      404,
      "not_found",
      `${kindLabel(type, typeKey)}不存在`,
    );
  }

  const payload = await request.json().catch(() => null);
  if (!isJsonObject(payload)) {
    return jsonError(request, 400, "invalid_input", "请求正文必须是 JSON 对象");
  }

  const result = await submitPublicComment({
    postId: data.post.id,
    parentId: payload.parentId,

    name: payload.name,
    body: payload.body,
    honeypot: payload.website,
    requestHeaders: request.headers,
  });

  if (!result.ok) {
    if (result.rateLimited) {
      return jsonRateLimited(request, result.retryAfterSeconds);
    }
    if (result.fieldErrors) {
      const message =
        result.fieldErrors.body ?? result.fieldErrors.name ?? "评论内容无效";
      return jsonError(request, 400, "invalid_input", message, {
        fields: result.fieldErrors,
      });
    }
    if (result.error === "被回复的评论不存在") {
      return jsonError(request, 400, "invalid_input", result.error);
    }
    return jsonError(
      request,
      500,
      "internal",
      result.error ?? "评论提交失败，请稍后再试",
    );
  }

  return jsonWrite(request, serializeCreatedComment(result.created));
}
