import "server-only";

import { Feed } from "feed";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/lib/blog/cache-tags";
import { listPublishedFeedPosts, type PublishedFeedPost } from "@/lib/blog/db";
import { renderMarkdownForFeed } from "@/lib/blog/markdown-feed";
import { postPath } from "@/lib/blog/paths";
import { mediaUrl } from "@/lib/media/url";
import {
  absoluteUrl,
  siteContentUpdatedAt,
  siteGithubUrl,
  siteName,
  siteSubtitle,
  siteUrl,
} from "@/lib/site";

const DESCRIPTION_MAX_LENGTH = 140;

const IMAGE_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export type FeedEntry = {
  id: string;
  title: string;
  url: string;
  description: string;
  html: string;
  publishedAt: Date;
  updatedAt: Date;
  enclosure: { url: string; type: string };
  tags: string[];
};

function cdataSafe(value: string): string {
  return sanitizeXmlText(value).replaceAll("]]>", "]]&gt;");
}

function sanitizeXmlText(value: string): string {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += value.slice(index, index + 2);
        index += 1;
      }
      continue;
    }
    if (isXmlChar(code)) result += value[index];
  }
  return result;
}

function isXmlChar(code: number): boolean {
  if (code === 0x09 || code === 0x0a || code === 0x0d) return true;
  if (code < 0x20) return false;
  if (code >= 0xd800 && code <= 0xdfff) return false;
  return code !== 0xfffe && code !== 0xffff;
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("https://") || value.startsWith("http://");
}

function imageTypeFor(url: string): string {
  const path = url.split(/[?#]/)[0];
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  return IMAGE_TYPES[extension] ?? "image/jpeg";
}

function enclosureFor(post: PublishedFeedPost): { url: string; type: string } {
  const cover = post.coverKey ? mediaUrl(post.coverKey) : "";
  if (isHttpUrl(cover)) return { url: cover, type: imageTypeFor(cover) };

  const fallback = absoluteUrl(
    `/og.png?title=${encodeURIComponent(post.title)}`,
  );
  return { url: fallback, type: imageTypeFor(fallback) };
}

function withCoverImage(html: string, post: PublishedFeedPost): string {
  const cover = post.coverKey ? mediaUrl(post.coverKey) : "";
  if (!html || !isHttpUrl(cover)) return html;

  const size =
    post.coverWidth && post.coverHeight
      ? ` width="${post.coverWidth}" height="${post.coverHeight}"`
      : "";
  return `<p><img src="${escapeHtmlAttribute(cover)}" alt="${escapeHtmlAttribute(post.title)}"${size}></p>${html}`;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function descriptionFor(post: PublishedFeedPost, text: string): string {
  const excerpt = post.excerpt.trim();
  if (excerpt) return excerpt;
  return text.length > DESCRIPTION_MAX_LENGTH
    ? `${text.slice(0, DESCRIPTION_MAX_LENGTH)}…`
    : text;
}

async function buildFeedEntries(): Promise<FeedEntry[]> {
  const posts = await listPublishedFeedPosts();

  return Promise.all(
    posts.map(async (post) => {
      const url = absoluteUrl(postPath(post.typeSlug, post.slug));
      const { html, text } = await renderMarkdownForFeed(post.content, url);

      return {
        id: post.id,
        title: post.title,
        url,
        description: descriptionFor(post, text),
        html: withCoverImage(html, post),
        publishedAt: post.publishedAt ?? post.updatedAt,
        updatedAt: post.updatedAt,
        enclosure: enclosureFor(post),
        tags: post.tags.map((tag) => tag.name),
      };
    }),
  );
}

export async function cachedFeedEntries(): Promise<FeedEntry[]> {
  "use cache";
  cacheLife("max");
  cacheTag(cacheTags.posts);
  return buildFeedEntries();
}

export function createFeed(entries: FeedEntry[]): Feed {
  const updated = entries.reduce(
    (latest, entry) => (entry.updatedAt > latest ? entry.updatedAt : latest),
    siteContentUpdatedAt,
  );

  const feed = new Feed({
    title: siteName,
    id: siteUrl(),
    link: siteUrl(),
    description: siteSubtitle,
    language: "ja",
    updated,
    copyright: `Copyright © ${new Date().getFullYear()} ${siteName}`,
    generator: "yasuko-takane-fx-blog",
    docs: "https://www.rssboard.org/rss-specification",
    ttl: 60,
    author: { name: siteName, link: siteGithubUrl },
    image: absoluteUrl("/icon-96.png"),
    feedLinks: {
      rss: absoluteUrl("/rss.xml"),
      atom: absoluteUrl("/atom.xml"),
    },
  });

  for (const entry of entries) {
    feed.addItem({
      title: cdataSafe(entry.title),
      link: entry.url,
      id: `urn:uuid:${entry.id}`,
      date: entry.updatedAt,
      published: entry.publishedAt,
      description: cdataSafe(entry.description),
      content: cdataSafe(entry.html),
      enclosure: entry.enclosure,
      category: entry.tags.map((name) => ({
        name: sanitizeXmlText(name),
        term: sanitizeXmlText(name),
      })),
      author: [{ name: siteName }],
    });
  }

  return feed;
}
