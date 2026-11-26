import "server-only";

import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { articleViewsDaily, post, postViewsDaily } from "@/db/schema";
import { shanghaiDayKey, shiftShanghaiDayKey } from "@/lib/time/shanghai-day";
import {
  articlePublishedBounds,
  buildArticleViewGrowth,
  buildDailySeries,
  clampSeriesDays,
  VIEW_SERIES_DEFAULT_DAYS,
  type ArticleViewGrowth,
  type DailyViewPoint,
} from "./article-view-growth";

export async function recordArticlePageView(
  postId: string,
  now = new Date(),
): Promise<void> {
  const day = shanghaiDayKey(now);
  await db.transaction(async (tx) => {
    await tx
      .insert(articleViewsDaily)
      .values({ day, pageViews: 1 })
      .onConflictDoUpdate({
        target: articleViewsDaily.day,
        set: {
          pageViews: sql`${articleViewsDaily.pageViews} + 1`,
          updatedAt: new Date(),
        },
      });
    await tx
      .insert(postViewsDaily)
      .values({ day, postId, views: 1 })
      .onConflictDoUpdate({
        target: [postViewsDaily.day, postViewsDaily.postId],
        set: {
          views: sql`${postViewsDaily.views} + 1`,
          updatedAt: new Date(),
        },
      });
  });
}

function toCount(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function dayKeyFromColumn(value: unknown): string {
  if (value instanceof Date) return shanghaiDayKey(value);
  if (typeof value === "string") return value.slice(0, 10);
  return String(value);
}

export async function getArticleViewGrowth(
  now = new Date(),
  days = VIEW_SERIES_DEFAULT_DAYS,
): Promise<ArticleViewGrowth> {
  const today = shanghaiDayKey(now);
  const bounds = articlePublishedBounds(today);
  const seriesDays = clampSeriesDays(days);
  const seriesStartKey = shiftShanghaiDayKey(today, -(seriesDays - 1));
  const queryStartKey =
    seriesStartKey < bounds.last30StartKey
      ? seriesStartKey
      : bounds.last30StartKey;
  const [viewRows, publishedRows, trackingRows] = await Promise.all([
    db
      .select({
        day: articleViewsDaily.day,
        pageViews: articleViewsDaily.pageViews,
      })
      .from(articleViewsDaily)
      .where(gte(articleViewsDaily.day, queryStartKey)),
    db
      .select({
        today: sql<string>`count(*) filter (where ${post.publishedAt} >= ${bounds.todayStart} and ${post.publishedAt} < ${bounds.tomorrowStart})`,
        yesterday: sql<string>`count(*) filter (where ${post.publishedAt} >= ${bounds.yesterdayStart} and ${post.publishedAt} < ${bounds.todayStart})`,
        last7Days: sql<string>`count(*) filter (where ${post.publishedAt} >= ${bounds.last7Start} and ${post.publishedAt} < ${bounds.tomorrowStart})`,
        last30Days: sql<string>`count(*) filter (where ${post.publishedAt} >= ${bounds.last30Start} and ${post.publishedAt} < ${bounds.tomorrowStart})`,
      })
      .from(post)
      .where(eq(post.status, "published")),
    db
      .select({
        startedAt: sql<
          string | null
        >`to_char(min(${articleViewsDaily.day}), 'YYYY-MM-DD')`,
      })
      .from(articleViewsDaily),
  ]);

  const published = publishedRows[0];
  const startedAt = trackingRows[0]?.startedAt ?? null;
  return buildArticleViewGrowth({
    today,
    byDay: new Map(
      viewRows.map((row) => [dayKeyFromColumn(row.day), row.pageViews]),
    ),
    published: {
      today: toCount(published?.today),
      yesterday: toCount(published?.yesterday),
      last7Days: toCount(published?.last7Days),
      last30Days: toCount(published?.last30Days),
    },
    days: seriesDays,
    trackingStartedAt: startedAt === null ? null : dayKeyFromColumn(startedAt),
  });
}

export type PostViewSeries = {
  postId: string;
  firstTrackedDay: string | null;
  series: DailyViewPoint[];
};

export async function getPostViewSeries(
  postIds: readonly string[],
  options: { days?: number; now?: Date } = {},
): Promise<Map<string, PostViewSeries>> {
  const ids = [...new Set(postIds)];
  if (ids.length === 0) return new Map();
  const days = clampSeriesDays(options.days ?? VIEW_SERIES_DEFAULT_DAYS);
  const today = shanghaiDayKey(options.now ?? new Date());
  const startKey = shiftShanghaiDayKey(today, -(days - 1));

  const [viewRows, firstRows] = await Promise.all([
    db
      .select({
        postId: postViewsDaily.postId,
        day: postViewsDaily.day,
        views: postViewsDaily.views,
      })
      .from(postViewsDaily)
      .where(
        and(
          inArray(postViewsDaily.postId, ids),
          gte(postViewsDaily.day, startKey),
          lte(postViewsDaily.day, today),
        ),
      ),
    db
      .select({
        postId: postViewsDaily.postId,
        firstDay: sql<
          string | null
        >`to_char(min(${postViewsDaily.day}), 'YYYY-MM-DD')`,
      })
      .from(postViewsDaily)
      .where(inArray(postViewsDaily.postId, ids))
      .groupBy(postViewsDaily.postId),
  ]);

  const byPost = new Map<string, Map<string, number>>();
  for (const row of viewRows) {
    const byDay = byPost.get(row.postId) ?? new Map<string, number>();
    const day = dayKeyFromColumn(row.day);
    byDay.set(day, (byDay.get(day) ?? 0) + row.views);
    byPost.set(row.postId, byDay);
  }

  const firstTracked = new Map<string, string | null>(
    firstRows.map((row) => [
      row.postId,
      row.firstDay === null ? null : dayKeyFromColumn(row.firstDay),
    ]),
  );

  return new Map<string, PostViewSeries>(
    ids.map((postId) => [
      postId,
      {
        postId,
        firstTrackedDay: firstTracked.get(postId) ?? null,
        series: buildDailySeries(
          byPost.get(postId) ?? new Map<string, number>(),
          today,
          days,
        ),
      },
    ]),
  );
}
