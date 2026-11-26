import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { CommentStatsBar } from "@/components/admin/comment-stats-bar";
import { CommentTable } from "@/components/admin/comment-table";
import { Skeleton } from "@/components/ui/skeleton";
import { toAdminCommentView } from "@/lib/comments/admin-view";
import { countCommentsByPost, listCommentsForAdmin } from "@/lib/comments/db";
import type { CommentStatus } from "@/lib/comments/types";

export const metadata: Metadata = {
  title: "评论管理",
};

const STATUSES: CommentStatus[] = ["pending", "approved", "rejected"];

function parseStatus(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined;
  return STATUSES.includes(value as CommentStatus)
    ? (value as CommentStatus)
    : undefined;
}

function CommentsFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-full max-w-2xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function AdminComments({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await connection();
  const status = parseStatus((await searchParams).status);

  const [totals, rows] = await Promise.all([
    countCommentsByPost(),
    listCommentsForAdmin({ status }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <CommentStatsBar
        totals={totals}
        baseHref="/admin/comments"
        activeStatus={status}
      />
      <CommentTable rows={rows.map(toAdminCommentView)} />
    </div>
  );
}

export default function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-medium">评论</h2>
      <p className="text-sm text-muted-foreground">
        游客评论全部匿名提交，审核通过后才会公开。
      </p>
      <Suspense fallback={<CommentsFallback />}>
        <AdminComments searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
