import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FxTagPage } from "@/components/fx/fx-tag-page";
import { cachedPublishedPostCardsByTag, cachedTags } from "@/lib/blog/cached";
import { fxCopy } from "@/lib/fx/copy";
import { buildCanonicalPageMetadata } from "@/lib/seo/pages";

type TagProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

async function tagState(slug: string) {
  const [tags, cards] = await Promise.all([
    cachedTags(),
    cachedPublishedPostCardsByTag(slug),
  ]);
  const tag = tags.find((item) => item.slug === slug);
  return tag ? { tag, cards } : { tag: null, cards: [] };
}

export async function generateStaticParams() {
  const tags = await cachedTags();
  const params = tags.map((tag) => ({ slug: tag.slug }));
  return params.length > 0 ? params : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: TagProps): Promise<Metadata> {
  const { slug } = await params;
  const { tag } = await tagState(slug);
  if (!tag) {
    return {
      title: fxCopy.pageNotFound,
      robots: { index: false, follow: false },
    };
  }

  return buildCanonicalPageMetadata({
    title: fxCopy.tagPageTitle(tag.name),
    description: fxCopy.tagDescription(tag.name),
    path: `/tag/${tag.slug}`,
  });
}

async function TagBody({ params, searchParams }: TagProps) {
  const { slug } = await params;
  const { tag, cards } = await tagState(slug);
  if (!tag) notFound();

  const paramsValue = await searchParams;
  const raw = Array.isArray(paramsValue.page)
    ? paramsValue.page[0]
    : paramsValue.page;
  const page = Number(raw ?? "1");

  return (
    <FxTagPage
      tag={tag}
      cards={cards}
      page={Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1}
    />
  );
}

export default function TagPage({ params, searchParams }: TagProps) {
  return (
    <Suspense fallback={null}>
      <TagBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}
