import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import {
  AdminPostTable,
  type AdminPostRow,
} from "@/components/admin/post-table";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { listAdminPosts } from "@/lib/blog/db";
import type { ContentTypeView } from "@/lib/content-types/types";

function copyFor(type: ContentTypeView) {
  return {
    title: `还没有${type.name}`,
    newHref: `/admin/posts/new?type=${type.key}`,
    newLabel: `写${type.singularName}`,
  };
}

function PostListFallback() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

async function PostListTable({ type }: { type: ContentTypeView }) {
  await connection();
  const posts = await listAdminPosts({ typeKey: type.key });
  const copy = copyFor(type);

  if (posts.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>{copy.title}</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button
            render={<Link href={copy.newHref} prefetch={true} />}
            nativeButton={false}
          >
            {copy.newLabel}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const rows: AdminPostRow[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    status: post.status,
    viewCount: post.viewCount,
    createdAt: post.createdAt.getTime(),
    updatedAt: post.updatedAt.getTime(),
    createdAtText: post.createdAt.toLocaleString("zh-CN"),
    updatedAtText: post.updatedAt.toLocaleString("zh-CN"),
  }));

  return <AdminPostTable rows={rows} />;
}

export function AdminPostList({ type }: { type: ContentTypeView }) {
  return (
    <Suspense fallback={<PostListFallback />}>
      <PostListTable type={type} />
    </Suspense>
  );
}
