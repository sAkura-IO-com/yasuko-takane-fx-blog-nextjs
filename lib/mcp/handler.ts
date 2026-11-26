import { createMcpHandler } from "mcp-handler";

import type { PublicReadSource } from "./public-read";
import { registerPublicMcpTools } from "./tools";

export function createPublicMcpHandler(source: PublicReadSource) {
  return createMcpHandler(
    (server) => {
      registerPublicMcpTools(server, source);
    },
    {
      serverInfo: {
        name: "yasuko-takane-fx-blog",
        version: "1.0.0",
      },
      instructions:
        "yasuko-takane-fx-blog 的公开只读内容。可以列出已发布文章、笔记及其他启用分类，按 id 读取 Markdown。没有后台数据，也不能写入。",
    },
  );
}
