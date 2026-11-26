import type { Metadata } from "next";

import { notFoundSeo, siteName } from "@/lib/seo/copy";

export function getNotFoundMetadata(options?: { path?: string }): Metadata {
  const openGraph: NonNullable<Metadata["openGraph"]> = {
    type: "website",
    title: notFoundSeo.title,
    description: notFoundSeo.description,
    siteName,
    locale: "ja_JP",
  };
  if (options?.path) {
    openGraph.url = options.path;
  }

  return {
    title: { absolute: notFoundSeo.title },
    description: notFoundSeo.description,
    robots: { index: false, follow: false },
    alternates: options?.path ? { canonical: options.path } : undefined,
    openGraph,
    twitter: {
      card: "summary",
      title: notFoundSeo.title,
      description: notFoundSeo.description,
    },
  };
}
