import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  or,
  sql,
  sum,
} from "drizzle-orm";

import { db } from "@/db";
import { assertSiteWritable } from "@/lib/site/writable";
import { contentType, post, postTag, tag, type Post } from "@/db/schema";
import { recordArticlePageView } from "@/lib/blog/article-views";
import { resolvePublishedAt } from "@/lib/blog/published-at";
import { countWords, isValidSlug, slugifyTitle } from "@/lib/blog/slug";
import { legacyPostKind } from "@/lib/content-types/legacy-kind";

export type PostStatus = Post["status"];
export type ContentLayout = "article" | "note";

export type PostWithTags = Post & {
  tags: { id: string; slug: string; name: string }[];
  typeKey: string;
  typeSlug: string;
  layout: ContentLayout;
  singularName: string;
};

export type PublishedPostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  typeKey: string;
  typeSlug: string;
  layout: ContentLayout;
  coverKey: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  viewCount: number;
  tags: { slug: string; name: string }[];
};

async function tagsForPosts(postIds: string[]) {
  if (postIds.length === 0)
    return new Map<string, { id: string; slug: string; name: string }[]>();

  const rows = await db
    .select({
      postId: postTag.postId,
      id: tag.id,
      slug: tag.slug,
      name: tag.name,
    })
    .from(postTag)
    .innerJoin(tag, eq(postTag.tagId, tag.id))
    .where(inArray(postTag.postId, postIds));

  const map = new Map<string, { id: string; slug: string; name: string }[]>();
  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push({ id: row.id, slug: row.slug, name: row.name });
    map.set(row.postId, list);
  }
  return map;
}

export async function listTags(): Promise<
  { id: string; slug: string; name: string }[]
> {
  return db
    .select({ id: tag.id, slug: tag.slug, name: tag.name })
    .from(tag)
    .orderBy(asc(tag.name));
}

function publishedTypeFilter(typeKey?: string) {
  return and(
    eq(post.status, "published"),
    eq(contentType.enabled, true),
    typeKey ? eq(contentType.key, typeKey) : undefined,
  );
}

export async function listPublishedPostCards(
  typeKey?: string,
): Promise<PublishedPostCard[]> {
  const rows = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      typeKey: contentType.key,
      typeSlug: contentType.slug,
      layout: contentType.layout,
      coverKey: post.coverKey,
      coverWidth: post.coverWidth,
      coverHeight: post.coverHeight,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      wordCount: post.wordCount,
      viewCount: post.viewCount,
    })
    .from(post)
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(publishedTypeFilter(typeKey))
    .orderBy(desc(post.publishedAt), desc(post.createdAt));

  const tagMap = await tagsForPosts(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    tags: (tagMap.get(row.id) ?? []).map(({ slug, name }) => ({ slug, name })),
  }));
}

export async function listPublishedPostCardsByTag(
  tagSlug: string,
): Promise<PublishedPostCard[]> {
  const rows = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      typeKey: contentType.key,
      typeSlug: contentType.slug,
      layout: contentType.layout,
      coverKey: post.coverKey,
      coverWidth: post.coverWidth,
      coverHeight: post.coverHeight,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      wordCount: post.wordCount,
      viewCount: post.viewCount,
    })
    .from(post)
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .innerJoin(postTag, eq(postTag.postId, post.id))
    .innerJoin(tag, eq(tag.id, postTag.tagId))
    .where(and(publishedTypeFilter(), eq(tag.slug, tagSlug)))
    .orderBy(desc(post.publishedAt), desc(post.createdAt));

  const tagMap = await tagsForPosts(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    tags: (tagMap.get(row.id) ?? []).map(({ slug, name }) => ({ slug, name })),
  }));
}

export async function listPublishedSlugs(
  typeKey: string,
): Promise<{ slug: string }[]> {
  return db
    .select({ slug: post.slug })
    .from(post)
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(publishedTypeFilter(typeKey));
}

export type PublishedPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  typeKey: string;
  typeSlug: string;
  markdownExport: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};

export async function listPublishedPostMetas(
  typeKey?: string,
): Promise<PublishedPostMeta[]> {
  return db
    .select({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      typeKey: contentType.key,
      typeSlug: contentType.slug,
      markdownExport: contentType.markdownExport,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(publishedTypeFilter(typeKey))
    .orderBy(desc(post.publishedAt), desc(post.createdAt));
}

export type PublishedPostBody = PublishedPostMeta & { content: string };

export async function listPublishedPostBodies(
  typeKey?: string,
): Promise<PublishedPostBody[]> {
  return db
    .select({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      typeKey: contentType.key,
      typeSlug: contentType.slug,
      markdownExport: contentType.markdownExport,
      content: post.content,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(publishedTypeFilter(typeKey))
    .orderBy(desc(post.publishedAt), desc(post.createdAt));
}

export type PublishedFeedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  typeKey: string;
  typeSlug: string;
  coverKey: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
  tags: { slug: string; name: string }[];
};

export async function listPublishedFeedPosts(): Promise<PublishedFeedPost[]> {
  const rows = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      typeKey: contentType.key,
      typeSlug: contentType.slug,
      coverKey: post.coverKey,
      coverWidth: post.coverWidth,
      coverHeight: post.coverHeight,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(publishedTypeFilter())
    .orderBy(desc(post.publishedAt), desc(post.createdAt));

  const tagMap = await tagsForPosts(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    tags: (tagMap.get(row.id) ?? []).map(({ slug, name }) => ({ slug, name })),
  }));
}

function withType<
  T extends {
    contentType: {
      key: string;
      slug: string;
      layout: ContentLayout;
      singularName: string;
      enabled: boolean;
    } | null;
    postTags: { tag: { id: string; slug: string; name: string } | null }[];
  },
>(row: T) {
  if (!row.contentType) return undefined;
  return {
    ...row,
    typeKey: row.contentType.key,
    typeSlug: row.contentType.slug,
    layout: row.contentType.layout,
    singularName: row.contentType.singularName,
    tags: row.postTags
      .map((item) => item.tag)
      .filter((item): item is NonNullable<typeof item> => item != null),
  };
}

export async function getPublishedPostBySlug(
  slug: string,
  typeKey?: string,
): Promise<PostWithTags | undefined> {
  const row = await db.query.post.findFirst({
    where: { slug, status: "published" },
    with: {
      contentType: true,
      postTags: {
        with: { tag: true },
      },
    },
  });
  if (!row) return undefined;
  const mapped = withType(row);
  if (!mapped || !row.contentType?.enabled) return undefined;
  if (typeKey && mapped.typeKey !== typeKey) return undefined;
  return mapped;
}

export async function getPostById(
  id: string,
): Promise<PostWithTags | undefined> {
  const row = await db.query.post.findFirst({
    where: { id },
    with: {
      contentType: true,
      postTags: {
        with: { tag: true },
      },
    },
  });
  if (!row) return undefined;
  return withType(row);
}

export async function listAdminPosts(filter?: {
  typeKey?: string;
}): Promise<PostWithTags[]> {
  const rows = await db.query.post.findMany({
    where: filter?.typeKey
      ? { contentType: { key: filter.typeKey } }
      : undefined,
    orderBy: { createdAt: "desc" },
    with: {
      contentType: true,
      postTags: {
        with: { tag: true },
      },
    },
  });
  return rows.flatMap((row) => {
    const mapped = withType(row);
    return mapped ? [mapped] : [];
  });
}

export async function getBlogMetrics() {
  const [postStats] = await db
    .select({
      total: count(),
      views: sum(post.viewCount),
    })
    .from(post);

  const byStatus = await db
    .select({
      status: post.status,
      total: count(),
    })
    .from(post)
    .groupBy(post.status);

  const topPosts = await db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      viewCount: post.viewCount,
      status: post.status,
    })
    .from(post)
    .orderBy(desc(post.viewCount), desc(post.updatedAt))
    .limit(8);

  const statusCount = {
    draft: 0,
    published: 0,
    archived: 0,
  };
  for (const row of byStatus) {
    statusCount[row.status] = Number(row.total);
  }

  return {
    totalPosts: Number(postStats?.total ?? 0),
    totalViews: Number(postStats?.views ?? 0),

    statusCount,
    topPosts,
  };
}

export async function incrementPostViews(slug: string) {
  const updated = await db
    .update(post)
    .set({ viewCount: sql`${post.viewCount} + 1` })
    .where(and(eq(post.slug, slug), eq(post.status, "published")))
    .returning({ id: post.id });
  const postId = updated[0]?.id;
  if (!postId) return;
  try {
    await recordArticlePageView(postId);
  } catch (error) {
    console.error("[views] 记录文章日阅读失败:", error);
  }
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = isValidSlug(base) ? base : slugifyTitle(base);
  let candidate = root;
  let n = 2;
  while (true) {
    const existing = await db.query.post.findFirst({
      where: { slug: candidate },
      columns: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}

export type PostInput = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverKey?: string | null;
  coverWidth?: number | null;
  coverHeight?: number | null;
  typeId: string;
  typeKey: string;
  status: PostStatus;
  tagNames: string[];
  publishedAt?: Date;
};

async function syncTags(postId: string, tagNames: string[]) {
  const names = [
    ...new Set(
      tagNames
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  ];

  await db.delete(postTag).where(eq(postTag.postId, postId));
  if (names.length === 0) return;

  const tagRows: { id: string; slug: string; name: string }[] = [];
  for (const name of names) {
    const slug = slugifyTitle(name);
    const existing = await db.query.tag.findFirst({
      where: { slug },
    });
    if (existing) {
      tagRows.push(existing);
      continue;
    }
    const [created] = await db.insert(tag).values({ slug, name }).returning();
    tagRows.push(created);
  }

  if (tagRows.length > 0) {
    await db
      .insert(postTag)
      .values(tagRows.map((row) => ({ postId, tagId: row.id })));
  }
}

export async function createPostRecord(authorId: string, input: PostInput) {
  await assertSiteWritable();
  const slug = await uniqueSlug(
    input.slug?.trim() || slugifyTitle(input.title),
  );
  const publishedAt = resolvePublishedAt({
    status: input.status,
    submitted: input.publishedAt,
  });
  const [row] = await db
    .insert(post)
    .values({
      authorId,
      slug,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      content: input.content,
      coverKey: input.coverKey?.trim() || null,
      coverWidth: input.coverKey ? (input.coverWidth ?? null) : null,
      coverHeight: input.coverKey ? (input.coverHeight ?? null) : null,
      typeId: input.typeId,
      kind: legacyPostKind(input.typeKey),
      status: input.status,
      publishedAt,
      wordCount: countWords(input.content),
    })
    .returning();

  await syncTags(row.id, input.tagNames);
  return row;
}

export async function updatePostRecord(id: string, input: PostInput) {
  await assertSiteWritable();
  const current = await getPostById(id);
  if (!current) return undefined;

  const slug = await uniqueSlug(input.slug?.trim() || current.slug, id);
  const publishedAt = resolvePublishedAt({
    status: input.status,
    submitted: input.publishedAt,
    current: current.publishedAt,
  });
  const coverKey = input.coverKey?.trim() || null;

  const [row] = await db
    .update(post)
    .set({
      slug,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      content: input.content,
      coverKey,
      coverWidth: coverKey
        ? (input.coverWidth ?? current.coverWidth ?? null)
        : null,
      coverHeight: coverKey
        ? (input.coverHeight ?? current.coverHeight ?? null)
        : null,
      typeId: input.typeId,
      kind: legacyPostKind(input.typeKey),
      status: input.status,
      publishedAt,
      wordCount: countWords(input.content),
    })
    .where(eq(post.id, id))
    .returning();

  await syncTags(id, input.tagNames);
  return row;
}

export async function deletePostRecord(id: string) {
  await assertSiteWritable();
  const [row] = await db.delete(post).where(eq(post.id, id)).returning({
    slug: post.slug,
  });
  return row;
}

export type MediaReference = {
  kind: "post_cover" | "post_content";
  label: string;
};

export async function findMediaReferencesFor(
  keys: string[],
  urlOf: (key: string) => string,
): Promise<Record<string, MediaReference[]>> {
  const references: Record<string, MediaReference[]> = {};
  if (keys.length === 0) return references;

  const [coverRows, contentRows] = await Promise.all([
    db
      .select({ key: post.coverKey, title: post.title })
      .from(post)
      .where(inArray(post.coverKey, keys)),
    db
      .select({ title: post.title, content: post.content })
      .from(post)
      .where(or(...keys.map((key) => like(post.content, `%${urlOf(key)}%`)))),
  ]);

  function add(key: string | null, reference: MediaReference) {
    if (!key) return;
    const list = (references[key] ??= []);
    list.push(reference);
  }

  for (const row of coverRows) {
    add(row.key, { kind: "post_cover", label: `文章《${row.title}》的封面` });
  }
  for (const key of keys) {
    const url = urlOf(key);
    for (const row of contentRows) {
      if (row.content.includes(url)) {
        add(key, {
          kind: "post_content",
          label: `文章《${row.title}》的正文`,
        });
      }
    }
  }

  return references;
}

export async function findMediaReferences(
  key: string,
  publicUrl: string,
): Promise<MediaReference[]> {
  const [coverRows, contentRows] = await Promise.all([
    db
      .select({ title: post.title })
      .from(post)
      .where(eq(post.coverKey, key))
      .limit(5),
    db
      .select({ title: post.title })
      .from(post)
      .where(like(post.content, `%${publicUrl}%`))
      .limit(5),
  ]);

  const references: MediaReference[] = [];
  for (const row of coverRows) {
    references.push({
      kind: "post_cover",
      label: `文章《${row.title}》的封面`,
    });
  }
  for (const row of contentRows) {
    references.push({
      kind: "post_content",
      label: `文章《${row.title}》的正文`,
    });
  }
  return references;
}
