import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import {
  CONTENT_ID_HELP,
  contentNotFoundMessage,
  getContentMarkdown,
  listPublishedContent,
  type PublicReadSource,
} from "./public-read";

export const PUBLIC_MCP_TOOL_NAMES = [
  "list_published_content",
  "get_content_markdown",
] as const;

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

type ToolText = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function jsonText(data: unknown): ToolText {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function errorText(message: string): ToolText {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

async function run(read: () => Promise<unknown>): Promise<ToolText> {
  try {
    return jsonText(await read());
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取失败";
    return errorText(message);
  }
}

export function registerPublicMcpTools(
  server: McpServer,
  source: PublicReadSource,
) {
  server.registerTool(
    "list_published_content",
    {
      title: "列出已发布内容",
      description:
        "列出当前已启用公开分类下的全部已发布内容（文章、笔记，以及后台启用的其它分类；与 GET /api/v1 目录里能打开的分类一致）。一次返回完整列表，内部分页会取完，不需要 cursor。每条 items[].id 是公开 API 的 UUID，与 GET /api/v1 摘要的 id 相同，把它原样传给 get_content_markdown。不要用 slug 当 id。不含草稿。",
      inputSchema: z.object({}),
      annotations: readOnly,
    },
    async () => run(() => listPublishedContent(source)),
  );

  server.registerTool(
    "get_content_markdown",
    {
      title: "读取内容 Markdown",
      description:
        "按 id 读取一篇已发布内容的 Markdown 全文，不截断。id 必须是 list_published_content 返回的 items[].id（公开 API UUID），不是 slug。正文字段 markdown 与公开 API 详情 body.markdown 相同。草稿和未启用分类不会返回正文。",
      inputSchema: z.object({
        id: z.string().min(1).max(200).describe(CONTENT_ID_HELP),
      }),
      annotations: readOnly,
    },
    async ({ id }) => {
      try {
        const content = await getContentMarkdown(source, id);
        if (!content) return errorText(contentNotFoundMessage(id));
        return jsonText(content);
      } catch (error) {
        const message = error instanceof Error ? error.message : "读取失败";
        return errorText(message);
      }
    },
  );
}
