"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { contentType } from "@/db/schema";
import { cacheTags } from "@/lib/blog/cache-tags";
import { requireOwner } from "@/lib/blog/owner";
import { assertSiteWritable } from "@/lib/site/writable";
import { asString } from "@/lib/strings";

import {
  countPostsForType,
  countPublishedPostsForType,
  listContentTypes,
} from "./db";
import { indexPath } from "./paths";
import type { ContentTypeInput } from "./validate";
import { validateContentTypeInput } from "./validate";

function invalidateContentTypes(slugs: string[] = []) {
  updateTag(cacheTags.contentTypes);
  updateTag(cacheTags.posts);
  revalidateTag(cacheTags.contentTypes, "max");
  revalidateTag(cacheTags.posts, "max");
  revalidatePath("/", "layout");
  revalidatePath("/(site)/posts", "page");
  revalidatePath("/(site)/posts/[slug]", "page");
  revalidatePath("/(site)/notes", "page");
  revalidatePath("/(site)/notes/[slug]", "page");
  revalidatePath("/(site)/c/[slug]", "page");
  revalidatePath("/(site)/c/[slug]/[postSlug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/rss.xml");
  for (const slug of slugs) {
    if (!slug || slug.includes("/")) continue;
    revalidatePath(indexPath(slug));
    revalidatePath(`/api/v1/content/${slug}`);
  }
}

function readFlag(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "on" || value === "1" || value === "true";
}

function readInput(formData: FormData): ContentTypeInput {
  return {
    key: asString(formData.get("key")).trim(),
    slug: asString(formData.get("slug")).trim(),
    name: asString(formData.get("name")).trim(),
    singularName: asString(formData.get("singularName")).trim(),
    description: asString(formData.get("description")).trim(),
    seoTitle: asString(formData.get("seoTitle")).trim(),
    seoDescription: asString(formData.get("seoDescription")).trim(),
    crumbName: asString(formData.get("crumbName")).trim(),
    articleSection: asString(formData.get("articleSection")).trim(),
    icon: asString(formData.get("icon")).trim(),
    sortOrder: Number(asString(formData.get("sortOrder")).trim() || "0"),
    layout:
      asString(formData.get("layout")).trim() === "note" ? "note" : "article",
    showInNav: readFlag(formData, "showInNav"),
    showOnHome: readFlag(formData, "showOnHome"),
    homeFeaturedCount: Number(
      asString(formData.get("homeFeaturedCount")).trim() || "0",
    ),

    markdownExport: true,
    enabled: readFlag(formData, "enabled"),
  };
}

async function conflictsFor(excludeId?: string) {
  const rows = await listContentTypes();
  const others = rows.filter((row) => row.id !== excludeId);
  return {
    keys: others.map((row) => row.key),
    slugs: others.map((row) => row.slug),
  };
}

export type ContentTypeFormState = { error?: string; ok?: true } | null;

export async function createContentTypeAction(
  _prev: ContentTypeFormState,
  formData: FormData,
): Promise<ContentTypeFormState> {
  await assertSiteWritable();
  await requireOwner("/admin/writing/types");
  const input = readInput(formData);
  const error = validateContentTypeInput(input, {
    mode: "create",
    conflicts: await conflictsFor(),
    slugLocked: false,
    keyLocked: false,
  });
  if (error) return { error };

  await db.insert(contentType).values({
    ...input,
    isSystem: false,
  });
  invalidateContentTypes([input.slug]);
  redirect("/admin/writing/types");
}

export async function updateContentTypeAction(
  id: string,
  _prev: ContentTypeFormState,
  formData: FormData,
): Promise<ContentTypeFormState> {
  await assertSiteWritable();
  await requireOwner("/admin/writing/types");
  const [current] = await db
    .select()
    .from(contentType)
    .where(eq(contentType.id, id))
    .limit(1);
  if (!current) return { error: "分类不存在" };

  const input = readInput(formData);
  const published = await countPublishedPostsForType(id);
  const slugLocked = current.isSystem || published > 0;
  const error = validateContentTypeInput(
    { ...input, key: current.key },
    {
      mode: "update",
      conflicts: await conflictsFor(id),
      slugLocked,
      keyLocked: true,
      previous: { key: current.key, slug: current.slug },
    },
  );
  if (error) return { error };

  await db
    .update(contentType)
    .set({
      ...input,
      key: current.key,
      slug: slugLocked ? current.slug : input.slug,
      isSystem: current.isSystem,
    })
    .where(eq(contentType.id, id));
  invalidateContentTypes([current.slug, input.slug]);
  return { ok: true };
}

export async function deleteContentTypeAction(formData: FormData) {
  await assertSiteWritable();
  await requireOwner("/admin/writing/types");
  const id = asString(formData.get("id"));
  const [current] = await db
    .select()
    .from(contentType)
    .where(eq(contentType.id, id))
    .limit(1);
  if (!current) redirect("/admin/writing/types");
  if (current.isSystem) {
    redirect("/admin/writing/types?error=system");
  }
  const used = await countPostsForType(id);
  if (used > 0) {
    redirect("/admin/writing/types?error=occupied");
  }
  await db
    .delete(contentType)
    .where(and(eq(contentType.id, id), eq(contentType.isSystem, false)));
  invalidateContentTypes([current.slug]);
  redirect("/admin/writing/types");
}

export async function reorderContentTypesAction(
  orderedIds: string[],
): Promise<ContentTypeFormState> {
  await assertSiteWritable();
  await requireOwner("/admin/writing/types");
  if (
    !Array.isArray(orderedIds) ||
    orderedIds.some((id) => typeof id !== "string" || !id)
  ) {
    return { error: "排序数据无效" };
  }

  const rows = await db.select({ id: contentType.id }).from(contentType);
  const existing = new Set(rows.map((row) => row.id));
  const incoming = new Set(orderedIds);
  if (
    orderedIds.length !== existing.size ||
    incoming.size !== orderedIds.length ||
    orderedIds.some((id) => !existing.has(id))
  ) {
    return { error: "排序数据无效" };
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index];
      if (!id) continue;
      await tx
        .update(contentType)
        .set({ sortOrder: index })
        .where(eq(contentType.id, id));
    }
  });
  invalidateContentTypes();
  return { ok: true };
}
