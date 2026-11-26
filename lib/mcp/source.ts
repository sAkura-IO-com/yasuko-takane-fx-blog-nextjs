import "server-only";

import { MAX_PAGE_SIZE } from "@/lib/api/v1/pagination";
import { getPostDetail, getPostList } from "@/lib/api/v1/handlers";
import type {
  PublicPostDetail,
  PublicPostSummary,
} from "@/lib/api/v1/serialize";
import { cachedEnabledContentTypes } from "@/lib/content-types/cached";

import type { PostPage, PublicReadSource } from "./public-read";

const INTERNAL_ORIGIN = "https://mcp.internal";

function internalRequest(path: string) {
  return new Request(`${INTERNAL_ORIGIN}${path}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("公开接口返回的不是 JSON");
  }
}

function errorMessage(body: unknown, fallback: string) {
  if (!isRecord(body) || !isRecord(body.error)) return fallback;
  return typeof body.error.message === "string" ? body.error.message : fallback;
}

export const publicReadSource: PublicReadSource = {
  async enabledCategories() {
    const types = await cachedEnabledContentTypes();
    return types.map((type) => ({
      key: type.key,
      slug: type.slug,
      name: type.name,
    }));
  },

  async listCategoryPage(typeKey, cursor): Promise<PostPage> {
    const params = new URLSearchParams({ limit: String(MAX_PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    const response = await getPostList(
      internalRequest(`/api/v1/list?${params.toString()}`),
      typeKey,
    );
    const body = await readJson(response);
    if (response.status === 404) return { items: [], nextCursor: null };
    if (!response.ok) {
      throw new Error(errorMessage(body, "读取内容列表失败"));
    }
    if (!isRecord(body) || !Array.isArray(body.items)) {
      throw new Error("内容列表格式异常");
    }
    return {
      items: body.items as PublicPostSummary[],
      nextCursor: typeof body.nextCursor === "string" ? body.nextCursor : null,
    };
  },

  async readPost(typeKey, slug) {
    const response = await getPostDetail(
      internalRequest("/api/v1/detail"),
      slug,
      typeKey,
    );
    const body = await readJson(response);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(errorMessage(body, "读取内容失败"));
    }
    if (!isRecord(body) || !isRecord(body.body)) return null;
    return body as PublicPostDetail;
  },
};
