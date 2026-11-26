import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FxCategoryPage } from "@/components/fx/fx-category-page";
import { FxEntry } from "@/components/fx/fx-entry";
import { FxListPage } from "@/components/fx/fx-list-page";
import {
  cachedPublishedPost,
  cachedPublishedPostCards,
} from "@/lib/blog/cached";
import { indexPath } from "@/lib/content-types/paths";
import { sectionIndexDocumentTitle } from "@/lib/content-types/presentation";
import type { ContentTypeView } from "@/lib/content-types/types";
import { getEntryMetadata } from "@/lib/seo/entry";
import { buildCanonicalPageMetadata } from "@/lib/seo/pages";

type TypePromise = Promise<ContentTypeView | null>;
type SearchParamsPromise = Promise<{ page?: string | string[] }>;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw ?? "1");
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export async function sectionIndexMetadata(
  type: TypePromise,
): Promise<Metadata> {
  const resolved = await type;
  if (!resolved?.enabled) {
    return {
      title: "ページが見つかりません",
      robots: { index: false, follow: false },
    };
  }
  return buildCanonicalPageMetadata({
    title: sectionIndexDocumentTitle(resolved),
    description: resolved.seoDescription,
    path: indexPath(resolved.slug),
  });
}

async function SectionIndexBody({
  type,
  searchParams,
}: {
  type: TypePromise;
  searchParams?: SearchParamsPromise;
}) {
  const resolved = await type;
  if (!resolved?.enabled) notFound();

  const cards = await cachedPublishedPostCards(resolved.key);
  const params = searchParams ? await searchParams : {};
  const basePath = indexPath(resolved.slug);

  if (resolved.key === "article") {
    return (
      <FxListPage
        type={resolved}
        cards={cards}
        page={parsePage(params.page)}
        basePath={basePath}
      />
    );
  }

  return (
    <FxCategoryPage
      type={resolved}
      cards={cards}
      page={parsePage(params.page)}
      basePath={basePath}
    />
  );
}

export function SectionIndexScreen({
  type,
  searchParams,
}: {
  type: TypePromise;
  searchParams?: SearchParamsPromise;
}) {
  return (
    <Suspense fallback={null}>
      <SectionIndexBody type={type} searchParams={searchParams} />
    </Suspense>
  );
}

export async function sectionEntryMetadata(
  type: TypePromise,
  slug: Promise<string>,
  options?: { path?: string },
): Promise<Metadata> {
  const resolved = await type;
  if (!resolved?.enabled) {
    return {
      title: "ページが見つかりません",
      robots: { index: false, follow: false },
    };
  }
  const data = await cachedPublishedPost(await slug, resolved.key);
  if (!data) {
    return {
      title: "コンテンツが見つかりません",
      robots: { index: false, follow: false },
    };
  }
  return getEntryMetadata(resolved, data.post, options);
}

async function SectionEntryBody({
  type,
  slug,
  canonicalPath,
  showBreadcrumb,
}: {
  type: TypePromise;
  slug: Promise<string>;
  canonicalPath?: string;
  showBreadcrumb?: boolean;
}) {
  const resolved = await type;
  if (!resolved?.enabled) notFound();
  const data = await cachedPublishedPost(await slug, resolved.key);
  if (!data) notFound();

  const cards = await cachedPublishedPostCards(resolved.key);

  return (
    <FxEntry
      type={resolved}
      post={data.post}
      html={data.html}
      cards={cards}
      canonicalPath={canonicalPath}
      showBreadcrumb={showBreadcrumb}
    />
  );
}

export function SectionEntryScreen({
  type,
  slug,
  canonicalPath,
  showBreadcrumb,
}: {
  type: TypePromise;
  slug: Promise<string>;
  canonicalPath?: string;
  showBreadcrumb?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <SectionEntryBody
        type={type}
        slug={slug}
        canonicalPath={canonicalPath}
        showBreadcrumb={showBreadcrumb}
      />
    </Suspense>
  );
}

export async function sectionMarkdownResponse(
  type: ContentTypeView | null,
  slug: string,
) {
  if (!type?.enabled) {
    return new Response("Not Found", { status: 404 });
  }

  const data = await cachedPublishedPost(slug, type.key);
  if (!data) {
    return new Response("Not Found", { status: 404 });
  }

  const { post } = data;
  const frontmatter = `# ${post.title}

${post.excerpt ? `${post.excerpt}\n\n` : ""}`;

  return new Response(`${frontmatter}${post.content.trim()}\n`, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
