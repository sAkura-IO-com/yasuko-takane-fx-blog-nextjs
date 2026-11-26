import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { PostDataPanel } from "@/components/admin/post-data-panel";
import { PostEditorShell } from "@/components/admin/post-editor-shell";
import { PostForm } from "@/components/admin/post-form";
import { Skeleton } from "@/components/ui/skeleton";
import { updatePostAction } from "@/lib/blog/actions";
import { getPostById } from "@/lib/blog/db";
import { listContentTypes } from "@/lib/content-types/db";
import { mediaUrl } from "@/lib/media/url";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "编辑文章",
};

export const maxDuration = 60;

function EditPostFormFallback() {
  return (
    <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:grid-rows-[minmax(0,1fr)_auto]">
      <Skeleton className="h-full lg:col-start-1 lg:row-span-2 lg:row-start-1" />
      <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-44" />
      </div>
      <Skeleton className="h-10 w-full lg:col-start-2 lg:row-start-2" />
    </div>
  );
}

function PostDataPanelFallback() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function EditPostForm({ params }: EditPostPageProps) {
  await connection();
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const action = updatePostAction.bind(null, post.id);

  const types = await listContentTypes();
  const heading = `编辑${post.singularName}`;

  return (
    <PostForm
      action={action}
      heading={heading}
      types={types}
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverKey: post.coverKey ?? "",
        coverPreviewUrl: post.coverKey ? mediaUrl(post.coverKey) : "",
        coverWidth: post.coverWidth,
        coverHeight: post.coverHeight,
        status: post.status,
        typeKey: post.typeKey,
        tags: post.tags.map((tag) => tag.name).join(", "),
        publishedAt: post.publishedAt?.toISOString() ?? null,
        createdAt: post.createdAt.toISOString(),
        nowIso: new Date().toISOString(),
      }}
    />
  );
}

export default function EditPostPage({ params }: EditPostPageProps) {
  return (
    <div className="admin-editor-page min-w-0">
      <PostEditorShell
        editor={
          <Suspense fallback={<EditPostFormFallback />}>
            <EditPostForm params={params} />
          </Suspense>
        }
        data={
          <Suspense fallback={<PostDataPanelFallback />}>
            <PostDataPanel params={params} />
          </Suspense>
        }
      />
    </div>
  );
}
