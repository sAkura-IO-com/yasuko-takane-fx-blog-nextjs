import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { AdminPostList } from "@/components/admin/post-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listContentTypes } from "@/lib/content-types/db";

export const metadata: Metadata = {
  title: "写作",
};

function WritingFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function WritingSection({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const types = await listContentTypes();
  const requested = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const current = types.find((type) => type.slug === requested) ?? types[0];
  if (!current) {
    return <p className="text-sm text-muted-foreground">还没有内容分类。</p>;
  }
  const newHref = `/admin/posts/new?type=${current.key}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">写作</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href="/admin/writing/types" prefetch={true} />}
            nativeButton={false}
          >
            分类管理
          </Button>
          <Button
            render={<Link href={newHref} prefetch={true} />}
            nativeButton={false}
          >
            写{current.singularName}
          </Button>
        </div>
      </div>

      <AdminSectionTabs
        label="写作内容类型"
        basePath="/admin/writing"
        active={current.slug}
        tabs={types.map((type) => ({
          value: type.slug,
          label: type.enabled ? type.name : `${type.name}（停用）`,
        }))}
      >
        <AdminPostList type={current} />
      </AdminSectionTabs>
    </div>
  );
}

export default function AdminWritingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<WritingFallback />}>
      <WritingSection searchParams={searchParams} />
    </Suspense>
  );
}
