import { shanghaiDayStart, shiftShanghaiDayKey } from "@/lib/time/shanghai-day";

export const TODAY_VIEW_LABEL = "今日（截至此刻）";

export const ARTICLE_VIEW_GROWTH_NOTE =
  "今日阅读是截至此刻的部分日，不是完整自然日。日环比用昨日全天作对照，较上周同期用上周同日全天作对照。daily 是东八区逐日序列，缺日补 0；views 为会话级浏览，同一浏览器标签页内同一篇只记一次。trackingStartedAt 之前没有日记录，代表还没开始统计，不是 0 阅读，且 backfilled 为 false，历史无法回填。对照日为 0 时百分比为空。新发布按当前仍为已发布、且 publishedAt 落在东八区窗口内的文章计数，不含草稿和归档。";

export type ArticleViewFact = {
  label: string;
  value: number | string;
};

export type DailyViewPoint = {
  day: string;
  views: number;
};

export const VIEW_SERIES_MAX_DAYS = 90;
export const VIEW_SERIES_DEFAULT_DAYS = 30;

export function clampSeriesDays(days: number): number {
  if (!Number.isFinite(days)) return VIEW_SERIES_DEFAULT_DAYS;
  return Math.min(VIEW_SERIES_MAX_DAYS, Math.max(1, Math.trunc(days)));
}

export type ArticlePublishedCounts = {
  today: number;
  yesterday: number;
  last7Days: number;
  last30Days: number;
};

export type ArticleViewGrowth = {
  todayLabel: typeof TODAY_VIEW_LABEL;
  today: number;
  yesterday: number;
  sameWeekdayLastWeek: number;
  dayOverDayPercent: number | null;
  weekOverWeekPercent: number | null;
  dayOverDayLabel: string;
  weekOverWeekLabel: string;
  last7Days: number;
  last30Days: number;
  published: ArticlePublishedCounts;
  daily: DailyViewPoint[];
  trackingStartedAt: string | null;
  backfilled: false;
  facts: ArticleViewFact[];
  note: string;
};

export function ratioPercent(current: number, baseline: number): number | null {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(baseline) ||
    baseline === 0
  ) {
    return null;
  }
  return Math.round(((current - baseline) / baseline) * 1000) / 10;
}

export function formatRatioPercent(value: number | null): string {
  if (value === null) return "—";
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "0%";
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return rounded > 0 ? `+${text}%` : `${text}%`;
}

export function articlePublishedBounds(today: string) {
  const tomorrow = shiftShanghaiDayKey(today, 1);
  const yesterday = shiftShanghaiDayKey(today, -1);
  const last7StartKey = shiftShanghaiDayKey(today, -6);
  const last30StartKey = shiftShanghaiDayKey(today, -29);
  return {
    last30StartKey,
    todayStart: shanghaiDayStart(today),
    yesterdayStart: shanghaiDayStart(yesterday),
    last7Start: shanghaiDayStart(last7StartKey),
    last30Start: shanghaiDayStart(last30StartKey),
    tomorrowStart: shanghaiDayStart(tomorrow),
  };
}

function viewsOn(byDay: ReadonlyMap<string, number>, day: string): number {
  return byDay.get(day) ?? 0;
}

function viewsBetween(
  byDay: ReadonlyMap<string, number>,
  start: string,
  end: string,
): number {
  let total = 0;
  for (const [day, views] of byDay) {
    if (day >= start && day <= end) total += views;
  }
  return total;
}

export function buildDailySeries(
  byDay: ReadonlyMap<string, number>,
  today: string,
  days: number,
): DailyViewPoint[] {
  const start = shiftShanghaiDayKey(today, -(days - 1));
  return Array.from({ length: days }, (_, index) => {
    const day = shiftShanghaiDayKey(start, index);
    return { day, views: viewsOn(byDay, day) };
  });
}

export function buildArticleViewGrowth(input: {
  today: string;
  byDay: ReadonlyMap<string, number>;
  published: ArticlePublishedCounts;
  days?: number;
  trackingStartedAt?: string | null;
}): ArticleViewGrowth {
  const yesterday = shiftShanghaiDayKey(input.today, -1);
  const sameWeekdayLastWeek = shiftShanghaiDayKey(input.today, -7);
  const last7Start = shiftShanghaiDayKey(input.today, -6);
  const last30Start = shiftShanghaiDayKey(input.today, -29);
  const todayViews = viewsOn(input.byDay, input.today);
  const yesterdayViews = viewsOn(input.byDay, yesterday);
  const sameWeekdayViews = viewsOn(input.byDay, sameWeekdayLastWeek);
  const last7Days = viewsBetween(input.byDay, last7Start, input.today);
  const last30Days = viewsBetween(input.byDay, last30Start, input.today);
  const dayOverDayPercent = ratioPercent(todayViews, yesterdayViews);
  const weekOverWeekPercent = ratioPercent(todayViews, sameWeekdayViews);
  const dayOverDayLabel = formatRatioPercent(dayOverDayPercent);
  const weekOverWeekLabel = formatRatioPercent(weekOverWeekPercent);

  return {
    todayLabel: TODAY_VIEW_LABEL,
    today: todayViews,
    yesterday: yesterdayViews,
    sameWeekdayLastWeek: sameWeekdayViews,
    dayOverDayPercent,
    weekOverWeekPercent,
    dayOverDayLabel,
    weekOverWeekLabel,
    last7Days,
    last30Days,
    published: input.published,
    daily: buildDailySeries(
      input.byDay,
      input.today,
      clampSeriesDays(input.days ?? VIEW_SERIES_DEFAULT_DAYS),
    ),
    trackingStartedAt: input.trackingStartedAt ?? null,
    backfilled: false,
    facts: [
      { label: TODAY_VIEW_LABEL, value: todayViews },
      { label: "昨日阅读", value: yesterdayViews },
      { label: "日环比", value: dayOverDayLabel },
      { label: "较上周同期", value: weekOverWeekLabel },
      { label: "近 7 日阅读", value: last7Days },
      { label: "近 30 日阅读", value: last30Days },
      { label: "今日新发布", value: input.published.today },
      { label: "昨日新发布", value: input.published.yesterday },
      { label: "近 7 日新发布", value: input.published.last7Days },
      { label: "近 30 日新发布", value: input.published.last30Days },
    ],
    note: ARTICLE_VIEW_GROWTH_NOTE,
  };
}
