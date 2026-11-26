import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { CommentTable } from "@/components/admin/comment-table";
import {
  PostViewCharts,
  PostViewChartsFallback,
} from "@/components/admin/post-view-charts";
import { Badge } from "@/components/ui/badge";
import { getPostById } from "@/lib/blog/db";
import { toAdminCommentView } from "@/lib/comments/admin-view";
import { countCommentsByPost, listCommentsForAdmin } from "@/lib/comments/db";
import { formatCommentTime } from "@/lib/comments/format";

const COMMENT_PREVIEW_LIMIT = 50;

const POST_STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

function NumberMetric({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-2xl font-medium tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}

export async function PostDataPanel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const post = await getPostById(id);
  if (!post) notFound();

  const [totals, comments] = await Promise.all([
    countCommentsByPost(post.id),
    listCommentsForAdmin({ postId: post.id, limit: COMMENT_PREVIEW_LIMIT }),
  ]);

  const rows = comments.map(toAdminCommentView);

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-2">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">文章</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {POST_STATUS_LABEL[post.status] ?? post.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {post.publishedAt
                ? formatCommentTime(post.publishedAt)
                : "未发布"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            字数{" "}
            <b className="text-foreground tabular-nums">{post.wordCount}</b>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border bg-card px-4 py-3">
          <NumberMetric value={post.viewCount} label="阅读" />
          <NumberMetric value={totals.total} label="评论" />
          <NumberMetric value={totals.pending} label="待审" />
        </div>
      </div>

      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-sm font-medium">阅读趋势</h3>
        <Suspense fallback={<PostViewChartsFallback />}>
          <PostViewCharts postId={post.id} />
        </Suspense>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">
            评论{rows.length > 0 ? `（最近 ${rows.length} 条）` : ""}
          </h3>
          <Link
            href="/admin/comments"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            全部评论
          </Link>
        </div>
        <CommentTable rows={rows} showPostColumn={false} />
      </section>
    </div>
  );
}
