import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import {
  ContentTypeManager,
  type AdminContentTypeRow,
} from "@/components/admin/content-type-manager";
import { Skeleton } from "@/components/ui/skeleton";
import {
  countPostsForType,
  countPublishedPostsForType,
  listContentTypes,
} from "@/lib/content-types/db";

export const metadata: Metadata = {
  title: "内容分类",
};

function fallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function errorMessage(code: string | undefined) {
  if (code === "system") return "文章和笔记是系统分类，不能删除。";
  if (code === "occupied") return "这个分类下还有内容，请先移走或删除后再试。";
  return undefined;
}

async function TypesSection({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const code = Array.isArray(params.error) ? params.error[0] : params.error;
  const types = await listContentTypes();
  const rows: AdminContentTypeRow[] = await Promise.all(
    types.map(async (type) => ({
      ...type,
      postCount: await countPostsForType(type.id),
      publishedCount: await countPublishedPostsForType(type.id),
    })),
  );

  return <ContentTypeManager types={rows} error={errorMessage(code)} />;
}

export default function ContentTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense fallback={fallback()}>
      <TypesSection searchParams={searchParams} />
    </Suspense>
  );
}
