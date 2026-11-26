import type { MetadataRoute } from "next";

import { cachedPublishedPostMetas, cachedTags } from "@/lib/blog/cached";
import { cachedEnabledContentTypes } from "@/lib/content-types/cached";
import { indexPath, postPath } from "@/lib/content-types/paths";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [types, posts, tags] = await Promise.all([
    cachedEnabledContentTypes(),
    cachedPublishedPostMetas(),
    cachedTags(),
  ]);
  const latestChange = posts[0]?.updatedAt;

  const routes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      ...(latestChange ? { lastModified: latestChange } : {}),
    },
  ];

  for (const type of types) {
    const latest = posts.find((post) => post.typeKey === type.key)?.updatedAt;
    routes.push({
      url: absoluteUrl(indexPath(type.slug)),
      ...(latest ? { lastModified: latest } : {}),
    });
  }

  for (const tag of tags) {
    routes.push({
      url: absoluteUrl(`/tag/${tag.slug}`),
      ...(latestChange ? { lastModified: latestChange } : {}),
    });
  }

  return [
    ...routes,
    ...posts.map((post) => ({
      url: absoluteUrl(postPath(post.typeSlug, post.slug)),
      lastModified: post.updatedAt,
    })),
  ];
}
