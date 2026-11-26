import type { Metadata } from "next";

import { homeSeo, siteDescription, siteName } from "@/lib/seo/copy";
import { feedAlternateTypes, siteUrl } from "@/lib/site";

function ogImagePath(title: string, description: string) {
  const params = new URLSearchParams({ title, description });
  return `/og?${params.toString()}`;
}

export function buildCanonicalPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: path,
      types: feedAlternateTypes(),
    },
  };
}

export function getRootMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: siteName,
      template: `%s｜${siteName}`,
    },
    description: siteDescription,
    alternates: {
      types: feedAlternateTypes(),
    },
    openGraph: {
      type: "website",
      siteName,
      locale: "ja_JP",
      url: "/",
      description: siteDescription,
    },
    twitter: {
      card: "summary",
    },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icon-180.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export function getHomeMetadata(): Metadata {
  const ogImage = ogImagePath(homeSeo.title, homeSeo.description);

  return {
    title: { absolute: homeSeo.title },
    description: homeSeo.description,
    alternates: {
      canonical: "/",
      types: feedAlternateTypes(),
    },
    openGraph: {
      type: "website",
      url: "/",
      title: homeSeo.title,
      description: homeSeo.description,
      siteName,
      locale: "ja_JP",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: homeSeo.heading,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: homeSeo.title,
      description: homeSeo.description,
      images: [ogImage],
    },
  };
}
