import "server-only";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { post, contentType } from "@/db/schema";
import { postPath } from "@/lib/content-types/paths";
import { markdownToPlainText } from "@/lib/seo/description";

export type FxSearchResult = {
  slug: string;
  title: string;
  excerpt: string;
  snippet: string;
  typeSlug: string;
  path: string;
  publishedAt: Date | null;
};

const MAX_QUERY_LENGTH = 64;
const MAX_LIMIT = 50;
const SNIPPET_BEFORE = 50;
const SNIPPET_AFTER = 110;

function buildSnippet(content: string, excerpt: string, query: string) {
  const text = markdownToPlainText(content);
  const excerptText = excerpt.trim();
  if (!text) return excerptText;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return excerptText || text.slice(0, 140);

  const start = Math.max(0, index - SNIPPET_BEFORE);
  const end = Math.min(text.length, index + query.length + SNIPPET_AFTER);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

export async function searchPublishedPosts(
  query: string,
  limit = 30,
): Promise<FxSearchResult[]> {
  const q = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (!q) return [];

  const escaped = q.replace(/([\\%_])/g, "\\$1");
  const pattern = `%${escaped}%`;

  const rows = await db
    .select({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      typeSlug: contentType.slug,
      publishedAt: post.publishedAt,
    })
    .from(post)
    .innerJoin(contentType, eq(post.typeId, contentType.id))
    .where(
      and(
        eq(post.status, "published"),
        eq(contentType.enabled, true),
        or(
          ilike(post.title, pattern),
          ilike(post.excerpt, pattern),
          ilike(post.content, pattern),
        ),
      ),
    )
    .orderBy(
      sql`case when ${post.title} ilike ${pattern} then 0 when ${post.excerpt} ilike ${pattern} then 1 else 2 end`,
      desc(post.publishedAt),
      desc(post.createdAt),
    )
    .limit(Math.min(Math.max(limit, 1), MAX_LIMIT));

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    snippet: buildSnippet(row.content, row.excerpt, q),
    typeSlug: row.typeSlug,
    path: postPath(row.typeSlug, row.slug),
    publishedAt: row.publishedAt,
  }));
}
