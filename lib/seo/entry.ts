import type { Metadata } from "next";

import type { PostWithTags } from "@/lib/blog/db";
import { indexPath, postPath } from "@/lib/content-types/paths";
import {
  crumbLabel,
  sectionLabel,
  type ContentTypeView,
} from "@/lib/content-types/types";
import { mediaUrl } from "@/lib/media/url";
import { seoLabels, siteName } from "@/lib/seo/copy";
import { seoDescription } from "@/lib/seo/description";
import { blogId, personId, websiteId } from "@/lib/seo/graph";
import { absoluteUrl, feedAlternateTypes } from "@/lib/site";

export function entryDescription(post: {
  title: string;
  excerpt: string;
  content: string;
}) {
  return seoDescription({
    excerpt: post.excerpt,
    body: post.content,
    fallback: `${post.title}｜${siteName}`,
  });
}

export function entryTitle(title: string) {
  return `${title}｜${siteName}`;
}

function coverUrl(post: { coverKey: string | null }): string | undefined {
  return post.coverKey ? mediaUrl(post.coverKey) : undefined;
}

function ogImageFor(
  post: { title: string; coverKey: string | null },
  description: string,
) {
  const coverImage = coverUrl(post);
  if (coverImage) return coverImage;
  const params = new URLSearchParams({
    title: post.title,
    description,
  });
  return `/og?${params.toString()}`;
}

export function getEntryMetadata(
  type: ContentTypeView,
  post: PostWithTags,
  options?: { path?: string },
): Metadata {
  const path = options?.path ?? postPath(type.slug, post.slug);
  const description = entryDescription(post);
  const title = entryTitle(post.title);
  const coverImage = coverUrl(post);
  const ogImage = ogImageFor(post, description);
  const keywords = post.tags.map((tag) => tag.name);

  return {
    title: { absolute: title },
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: path,
      types: feedAlternateTypes(),
    },
    openGraph: {
      type: "article",
      url: path,
      title,
      description,
      siteName,
      locale: "ja_JP",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [siteName],
      tags: keywords.length > 0 ? keywords : undefined,
      images: [
        {
          url: ogImage,
          ...(coverImage && post.coverWidth && post.coverHeight
            ? { width: post.coverWidth, height: post.coverHeight }
            : coverImage
              ? {}
              : { width: 1200, height: 630 }),
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function buildBlogPostingJsonLd(
  type: ContentTypeView,
  post: PostWithTags,
  options?: { path?: string },
) {
  const path = options?.path ?? postPath(type.slug, post.slug);
  const postUrl = absoluteUrl(path);
  const description = entryDescription(post);
  const coverImage = coverUrl(post);
  const image = coverImage
    ? [coverImage]
    : [absoluteUrl(ogImageFor(post, description))];
  const keywords = post.tags.map((tag) => tag.name).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#post`,
    headline: post.title,
    description,
    image,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      "@id": personId(),
      name: siteName,
      url: absoluteUrl("/"),
    },
    publisher: {
      "@type": "Person",
      "@id": personId(),
      name: siteName,
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    isPartOf: [{ "@id": websiteId() }, { "@id": blogId() }],
    inLanguage: "ja",
    articleSection: sectionLabel(type),
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    wordCount: post.wordCount > 0 ? post.wordCount : undefined,
    url: postUrl,
  };
}

export function buildEntryBreadcrumbJsonLd(
  type: ContentTypeView,
  post: { title: string; slug: string },
) {
  const path = postPath(type.slug, post.slug);
  const postUrl = absoluteUrl(path);
  const listPath = indexPath(type.slug);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: seoLabels.home,
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: crumbLabel(type),
        item: absoluteUrl(listPath),
      },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };
}
