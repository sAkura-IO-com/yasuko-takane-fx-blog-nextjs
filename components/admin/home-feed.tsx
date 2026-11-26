import Link from "next/link";
import { Eye, FileText, MessageSquare, type LucideIcon } from "lucide-react";

import {
  ReviewWorkbench,
  type ReviewQueueItem,
} from "@/components/admin/review-workbench";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminHomeData = {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  pendingComments: number;
  publishedPosts: number;
  statusCount: { draft: number; published: number; archived: number };
  topPosts: { id: string; title: string; status: string; viewCount: number }[];
  reviewQueue: ReviewQueueItem[];
};

const POST_STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  alert,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  alert?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-2xl font-medium tabular-nums">{value}</span>
      <span
        className={cn(
          "text-xs",
          alert
            ? "text-amber-600 dark:text-amber-500"
            : "text-muted-foreground",
        )}
      >
        {hint}
      </span>
    </div>
  );
}

function Panel({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {aside}
      </div>
      <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
        {children}
      </div>
    </section>
  );
}

function DistributionBar({
  segments,
}: {
  segments: { label: string; value: number; className: string }[];
}) {
  const total = Math.max(
    segments.reduce((sum, segment) => sum + segment.value, 0),
    1,
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.label}
              className={cn("h-full", segment.className)}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {segments.map((segment) => (
          <span key={segment.label} className="flex items-center gap-1">
            <span className={cn("size-2 rounded-full", segment.className)} />
            {segment.label} {segment.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function PostRow({
  post,
}: {
  post: { id: string; title: string; status: string; viewCount: number };
}) {
  return (
    <Link
      href={`/admin/posts/${post.id}`}
      prefetch
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40"
    >
      <span className="min-w-0 flex-1 truncate text-sm">{post.title}</span>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {POST_STATUS_LABEL[post.status] ?? post.status}
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {post.viewCount}
      </span>
    </Link>
  );
}

export function AdminHomeFeed({
  data,
}: {
  data: AdminHomeData;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">概览</h2>
          <p className="text-xs text-muted-foreground">
            已发布 {data.publishedPosts} 篇 · 待审评论 {data.pendingComments}
          </p>
        </div>
        <Button
          size="sm"
          render={<Link href="/admin/posts/new" prefetch />}
          nativeButton={false}
        >
          新建文章
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          icon={FileText}
          label="文章"
          value={data.totalPosts}
          hint={`已发布 ${data.statusCount.published} · 草稿 ${data.statusCount.draft}`}
        />
        <KpiCard
          icon={Eye}
          label="总阅读"
          value={data.totalViews}
          hint="全部已发布文章"
        />
        <KpiCard
          icon={MessageSquare}
          label="评论"
          value={data.totalComments}
          hint={`待审 ${data.pendingComments}`}
          alert={data.pendingComments > 0}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-4 lg:items-start">
        <div className="min-w-0 lg:col-span-3">
          <ReviewWorkbench queue={data.reviewQueue} />
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:col-span-1">
          <Panel title="状态分布">
            <div className="flex flex-col gap-3 px-4 py-3">
              <DistributionBar
                segments={[
                  {
                    label: "已发布",
                    value: data.statusCount.published,
                    className: "bg-primary/80",
                  },
                  {
                    label: "草稿",
                    value: data.statusCount.draft,
                    className: "bg-amber-500/80",
                  },
                  {
                    label: "归档",
                    value: data.statusCount.archived,
                    className: "bg-muted-foreground/40",
                  },
                ]}
              />
            </div>
          </Panel>
          <Panel title="阅读最多">
            <div className="divide-y">
              {data.topPosts.slice(0, 5).map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
