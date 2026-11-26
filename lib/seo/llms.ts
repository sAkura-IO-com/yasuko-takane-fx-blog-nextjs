import type { PublishedPostBody, PublishedPostMeta } from "@/lib/blog/db";
import { indexPath, postPath } from "@/lib/content-types/paths";
import type { ContentTypeView } from "@/lib/content-types/types";
import { homeProfile } from "@/lib/home/content";
import { absoluteUrl, siteName, siteSubtitle } from "@/lib/site";

function allLines(posts: PublishedPostMeta[], type: ContentTypeView) {
  return posts
    .filter((post) => post.typeKey === type.key)
    .map((post) => {
      const path = `${postPath(type.slug, post.slug)}.md`;
      return `- [${post.title}](${absoluteUrl(path)}): ${post.excerpt || "（概要なし）"}`;
    })
    .join("\n");
}

export function renderLlmsTxt({
  types,
  posts,
}: {
  types: ContentTypeView[];
  posts: PublishedPostMeta[];
}) {
  const enabled = types.filter((type) => type.enabled);
  const sections = enabled
    .map((type) => {
      const lines = allLines(posts, type);
      return `## すべての${type.name}

- [${type.name}一覧](${absoluteUrl(indexPath(type.slug))})

${lines || "- （まだありません）"}`;
    })
    .join("\n\n");

  return `# ${siteName}

> ${siteSubtitle}

## サイトについて

${homeProfile.name}。${homeProfile.bio.join("")}

- [外部リンク](${absoluteUrl("/")}): ${homeProfile.links.map((link) => link.href).join("、")}

${sections}

## 機械向けエンドポイント

- [llms-full.txt](${absoluteUrl("/llms-full.txt")}): 全コンテンツの Markdown 全文
- [RSS](${absoluteUrl("/rss.xml")}): 更新フィード
- [Sitemap](${absoluteUrl("/sitemap.xml")}): 全 URL 索引
- [公開 JSON API v1](${absoluteUrl("/api/v1")}): 記事・ノート・プロフィール・コメント
- [MCP](${absoluteUrl("/api/mcp")}): 公開コンテンツの MCP エンドポイント
`;
}

export function renderLlmsFull({ posts }: { posts: PublishedPostBody[] }) {
  const sections = posts
    .map((post) => {
      const published = post.publishedAt
        ? `（公開日 ${post.publishedAt.toISOString().slice(0, 10)}）`
        : "";
      return `## ${post.title}${published}

出典: ${absoluteUrl(postPath(post.typeSlug, post.slug))}

${post.content.trim()}`;
    })
    .join("\n\n---\n\n");

  return `# ${siteName}

> ${siteSubtitle}

以下は公開済みコンテンツの Markdown 全文です（全 ${posts.length} 件）。

${sections || "（まだコンテンツがありません。）"}
`;
}
