import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import {
  AdminHomeFeed,
  type AdminHomeData,
} from "@/components/admin/home-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { getBlogMetrics } from "@/lib/blog/db";
import { toAdminCommentView } from "@/lib/comments/admin-view";
import { countCommentsByPost, listCommentsForAdmin } from "@/lib/comments/db";

export const metadata: Metadata = {
  title: "后台指标",
};

function MetricsFallback() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

async function AdminMetrics() {
  await connection();
  const [metrics, commentTotals, pendingComments] = await Promise.all([
    getBlogMetrics(),
    countCommentsByPost(),
    listCommentsForAdmin({ status: "pending", limit: 20 }),
  ]);

  const data: AdminHomeData = {
    totalPosts: metrics.totalPosts,
    totalViews: metrics.totalViews,
    totalComments: commentTotals.total,
    pendingComments: commentTotals.pending,
    publishedPosts: metrics.statusCount.published,
    statusCount: metrics.statusCount,
    topPosts: metrics.topPosts.map((post) => ({
      id: post.id,
      title: post.title,
      status: post.status,
      viewCount: post.viewCount,
    })),
    reviewQueue: pendingComments.map((row) => {
      const view = toAdminCommentView(row);
      return {
        id: view.id,
        authorName: view.authorName,
        excerpt: view.excerpt,
        createdAt: view.createdAt,
        postTitle: view.postTitle,
      };
    }),
  };

  return <AdminHomeFeed data={data} />;
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<MetricsFallback />}>
      <AdminMetrics />
    </Suspense>
  );
}
