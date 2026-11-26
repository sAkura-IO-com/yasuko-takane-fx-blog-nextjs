"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { cacheTags } from "@/lib/blog/cache-tags";
import { scheduleContentChange } from "@/lib/content-change/schedule";
import {
  createPostRecord,
  deletePostRecord,
  getPostById,
  updatePostRecord,
  type PostInput,
  type PostStatus,
} from "@/lib/blog/db";
import { getContentTypeByKey } from "@/lib/content-types/db";
import { requireOwner } from "@/lib/blog/owner";
import { renderMarkdown } from "@/lib/blog/markdown";
import { parsePublishedAtFormValue } from "@/lib/blog/published-at";
import { isValidSlug } from "@/lib/blog/slug";
import { asString } from "@/lib/strings";

function invalidatePosts(slugs: string[]) {
  updateTag(cacheTags.posts);
  updateTag(cacheTags.contentTypes);
  updateTag(cacheTags.metrics);
  revalidateTag(cacheTags.posts, "max");
  revalidateTag(cacheTags.contentTypes, "max");
  for (const slug of slugs) {
    if (!slug) continue;
    updateTag(cacheTags.post(slug));
    revalidateTag(cacheTags.post(slug), "max");
  }
}

function readPostInput(
  formData: FormData,
): (Omit<PostInput, "typeId"> & { typeKey: string }) | { error: string } {
  const title = asString(formData.get("title")).trim();
  const slug = asString(formData.get("slug")).trim();
  const excerpt = asString(formData.get("excerpt")).trim();
  const content = asString(formData.get("content"));
  const coverKey = asString(formData.get("coverKey")).trim();
  const coverWidthRaw = asString(formData.get("coverWidth")).trim();
  const coverHeightRaw = asString(formData.get("coverHeight")).trim();
  const coverWidth = coverWidthRaw ? Number(coverWidthRaw) : null;
  const coverHeight = coverHeightRaw ? Number(coverHeightRaw) : null;
  const status = asString(formData.get("status") ?? "draft") as PostStatus;
  const typeKey = asString(
    formData.get("typeKey") || formData.get("kind") || "article",
  );
  const tagNames = asString(formData.get("tags"))
    .split(/[,，]/)
    .map((name) => name.trim())
    .filter(Boolean);
  const publishedAtRaw = asString(formData.get("publishedAt")).trim();
  let publishedAt: Date | undefined;
  if (publishedAtRaw) {
    const parsed = parsePublishedAtFormValue(publishedAtRaw);
    if ("error" in parsed) return { error: parsed.error };
    publishedAt = parsed.date;
  }

  if (!title) return { error: "请填写标题" };
  if (!slug) return { error: "请填写 slug" };
  if (!isValidSlug(slug)) {
    return { error: "slug 只能包含小写字母、数字和连字符" };
  }
  if (!["draft", "published", "archived"].includes(status)) {
    return { error: "无效的文章状态" };
  }
  if (!typeKey) return { error: "请选择分类" };

  return {
    title,
    slug,
    excerpt,
    content,
    coverKey: coverKey || null,
    coverWidth:
      coverKey &&
      coverWidth != null &&
      Number.isFinite(coverWidth) &&
      coverWidth > 0
        ? coverWidth
        : null,
    coverHeight:
      coverKey &&
      coverHeight != null &&
      Number.isFinite(coverHeight) &&
      coverHeight > 0
        ? coverHeight
        : null,
    typeKey,
    status,
    tagNames,
    publishedAt,
  };
}

export type PostFormState = {
  error?: string;
  ok?: true;
  savedSlug?: string;
} | null;

export async function renderMarkdownPreviewAction(
  content: string,
): Promise<string> {
  await requireOwner("/admin/posts");
  return renderMarkdown(content);
}

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const session = await requireOwner("/admin/posts/new");
  const input = readPostInput(formData);
  if ("error" in input) return { error: input.error };
  const type = await getContentTypeByKey(input.typeKey);
  if (!type?.enabled) return { error: "无效的内容分类" };

  const row = await createPostRecord(session.user.id, {
    ...input,
    typeId: type.id,
  });
  invalidatePosts([row.slug]);
  scheduleContentChange({
    entity: "post",
    operation: "create",
    wasLive: false,
    isLive: row.status === "published",

    newSection: type.slug,
    newSlug: row.slug,
  });
  redirect(`/admin/posts/${row.id}`);
}

export async function updatePostAction(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireOwner(`/admin/posts/${id}`);
  const current = await getPostById(id);
  if (!current) return { error: "文章不存在" };

  const input = readPostInput(formData);
  if ("error" in input) return { error: input.error };
  const type = await getContentTypeByKey(input.typeKey);
  if (!type?.enabled) return { error: "无效的内容分类" };

  const row = await updatePostRecord(id, { ...input, typeId: type.id });
  if (!row) return { error: "保存失败" };
  invalidatePosts([current.slug, row.slug]);

  scheduleContentChange({
    entity: "post",
    operation: "update",
    wasLive: current.status === "published",
    isLive: row.status === "published",

    oldSection: current.typeSlug,
    newSection: type.slug,
    oldSlug: current.slug,
    newSlug: row.slug,
  });

  return { ok: true, savedSlug: row.slug };
}

export async function deletePostAction(id: string) {
  await requireOwner("/admin/posts");
  const current = await getPostById(id);
  const row = await deletePostRecord(id);
  if (row) {
    invalidatePosts([row.slug]);
    scheduleContentChange({
      entity: "post",
      operation: "delete",
      wasLive: current?.status === "published",
      isLive: false,
      oldSection: current?.typeSlug ?? "posts",
      oldSlug: row.slug,
    });
  }
  redirect("/admin/posts");
}
