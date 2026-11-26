import type {
  PublicPostDetail,
  PublicPostSummary,
} from "@/lib/api/v1/serialize";

export const MAX_CONTENT_PAGES = 400;

export type EnabledCategory = {
  key: string;
  slug: string;
  name: string;
};

export type PostPage = {
  items: PublicPostSummary[];
  nextCursor: string | null;
};

export type PublicReadSource = {
  enabledCategories(): Promise<EnabledCategory[]>;
  listCategoryPage(typeKey: string, cursor: string | null): Promise<PostPage>;
  readPost(typeKey: string, slug: string): Promise<PublicPostDetail | null>;
};

export type PublishedContentList = {
  categories: Array<{
    key: string;
    slug: string;
    name: string;
    total: number;
    items: PublicPostSummary[];
  }>;
};

export type ContentMarkdown = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  typeSlug: string;
  path: string;
  url: string;
  markdown: string;
};

export const CONTENT_ID_HELP =
  "list_published_content 返回的 items[].id。这是公开 API 的 UUID（与 GET /api/v1 摘要的 id 相同），不是 slug，也不是「分类/slug」。";

export function contentNotFoundMessage(id: string): string {
  return `没有找到已发布内容「${clip(id)}」。id 必须是 list_published_content 返回的 items[].id（公开 API 的 UUID），不是 slug。`;
}

export async function collectCategoryPosts(
  fetchPage: (cursor: string | null) => Promise<PostPage>,
): Promise<PublicPostSummary[]> {
  const items: PublicPostSummary[] = [];
  const seenIds = new Set<string>();
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < MAX_CONTENT_PAGES; page++) {
    const result = await fetchPage(cursor);
    for (const item of result.items) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      items.push(item);
    }
    const next = result.nextCursor;
    if (!next || seenCursors.has(next)) return items;
    seenCursors.add(next);
    cursor = next;
  }

  throw new Error(`已发布内容过多，列表没有在 ${MAX_CONTENT_PAGES} 页内结束`);
}

export async function listPublishedContent(
  source: PublicReadSource,
): Promise<PublishedContentList> {
  const categories = await source.enabledCategories();
  const listed = await Promise.all(
    categories.map(async (category) => {
      const items = await collectCategoryPosts((cursor) =>
        source.listCategoryPage(category.key, cursor),
      );
      return {
        key: category.key,
        slug: category.slug,
        name: category.name,
        total: items.length,
        items,
      };
    }),
  );
  return { categories: listed };
}

export async function getContentMarkdown(
  source: PublicReadSource,
  id: string,
): Promise<ContentMarkdown | null> {
  const wanted = id.trim();
  if (!wanted) return null;

  const categories = await source.enabledCategories();
  for (const category of categories) {
    const items = await collectCategoryPosts((cursor) =>
      source.listCategoryPage(category.key, cursor),
    );
    const hit = items.find((item) => item.id === wanted);
    if (!hit) continue;

    const detail = await source.readPost(category.key, hit.slug);
    if (!detail || detail.id !== wanted) return null;
    return {
      id: detail.id,
      slug: detail.slug,
      title: detail.title,
      kind: detail.kind,
      typeSlug: category.slug,
      path: detail.path,
      url: detail.url,
      markdown: detail.body.markdown,
    };
  }
  return null;
}

function clip(id: string): string {
  const trimmed = id.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
}
