import { Suspense } from "react";
import type { Metadata } from "next";

import { PostForm } from "@/components/admin/post-form";
import { Skeleton } from "@/components/ui/skeleton";
import { createPostAction } from "@/lib/blog/actions";
import { listContentTypes } from "@/lib/content-types/db";

export const metadata: Metadata = {
  title: "写文章",
};

export const maxDuration = 60;

type NewPostPageProps = {
  searchParams: Promise<{ type?: string; kind?: string }>;
};

async function NewPostForm({ searchParams }: NewPostPageProps) {
  const params = await searchParams;
  const types = (await listContentTypes()).filter((type) => type.enabled);
  const requested =
    params.type ?? (params.kind === "note" ? "note" : "article");
  const current = types.find((type) => type.key === requested) ?? types[0];
  const heading = current ? `写${current.singularName}` : "写文章";

  return (
    <div className="admin-editor-page home-shell">
      <PostForm
        action={createPostAction}
        heading={heading}
        types={types}
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          coverKey: "",
          coverPreviewUrl: "",
          status: "published",
          typeKey: current?.key ?? "article",
          tags: "",
          publishedAt: null,
          nowIso: new Date().toISOString(),
        }}
      />
    </div>
  );
}

export default function NewPostPage({ searchParams }: NewPostPageProps) {
  return (
    <Suspense
      fallback={<Skeleton className="admin-editor-page h-full w-full" />}
    >
      <NewPostForm searchParams={searchParams} />
    </Suspense>
  );
}
