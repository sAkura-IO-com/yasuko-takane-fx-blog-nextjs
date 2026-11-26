import type { DailyViewPoint } from "./article-view-growth";

export const VIEW_CHART_RANGES = [7, 30, 90] as const;

export type ViewChartRange = (typeof VIEW_CHART_RANGES)[number];

export const VIEW_CHART_DEFAULT_RANGE: ViewChartRange = 30;

export const VIEW_CHART_FETCH_DAYS = 90;

export const VIEW_CHART_RANGE_LABELS: Record<ViewChartRange, string> = {
  7: "近 7 天",
  30: "近 30 天",
  90: "近 90 天",
};

export const VIEW_CHART_LINE_SERIES_LABEL = "阅读量";

export const VIEW_CHART_POST_SERIES_LABEL = "本篇";
export const VIEW_CHART_OTHERS_SERIES_LABEL = "其它内容";

export const VIEW_CHART_NOT_FOUND_MESSAGE = "阅读数据暂时不可用";

export const VIEW_CHART_ERROR_TITLE = VIEW_CHART_NOT_FOUND_MESSAGE;
export const VIEW_CHART_ERROR_DESCRIPTION = "刷新页面可重试。";

export const VIEW_CHART_NEVER_TRACKED_TITLE = "还没有开始统计阅读数据";
export const VIEW_CHART_NEVER_TRACKED_DESCRIPTION =
  "上线后产生第一条浏览记录才会出现趋势。";

export const VIEW_CHART_NO_VIEWS_TITLE = "近 90 天没有阅读记录";
export const VIEW_CHART_NO_VIEWS_DESCRIPTION =
  "换一个时间范围或等产生新的浏览后再来看。";

export type ViewChartPoint = {
  day: string;
  label: string;
  views: number;
};

export type ViewChartSeries = {
  points: ViewChartPoint[];
  today: string;
  trackingStartedAt: string | null;
};

export type ViewChartSlice = {
  range: ViewChartRange;
  rangeLabel: string;
  points: ViewChartPoint[];
  total: number;
  allZero: boolean;
};

export type ViewChartEmptyReason = "never-tracked" | "no-views";

export type ViewChartData =
  | { status: "ok"; series: ViewChartSeries }
  | {
      status: "empty";
      reason: ViewChartEmptyReason;
      today: string;
      trackingStartedAt: string | null;
    }
  | { status: "error"; message: string };

export type ViewChartSharePoint = {
  day: string;
  label: string;
  post: number;
  others: number;
};

export type ViewShareChartData =
  | {
      status: "ok";
      points: ViewChartSharePoint[];
      today: string;
      trackingStartedAt: string | null;
    }
  | {
      status: "empty";
      reason: ViewChartEmptyReason;
      today: string;
      trackingStartedAt: string | null;
    }
  | { status: "error"; message: string };

export type ViewChartPresent = {
  showChart: boolean;
  title: string | null;
  description: string | null;
};

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toViewCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function isAllZero(values: readonly number[]): boolean {
  return values.every((value) => value <= 0);
}

export function formatDayLabel(day: string): string {
  if (!DAY_KEY_PATTERN.test(day)) return day;
  return day.slice(5);
}

export function toViewChartPoints(
  points: readonly DailyViewPoint[],
): ViewChartPoint[] {
  return points.map((point) => ({
    day: point.day,
    label: formatDayLabel(point.day),
    views: toViewCount(point.views),
  }));
}

export function sliceViewSeries(
  series: ViewChartSeries,
  range: ViewChartRange,
): ViewChartSlice {
  const points = series.points.slice(-range);
  const total = points.reduce((sum, point) => sum + point.views, 0);
  return {
    range,
    rangeLabel: VIEW_CHART_RANGE_LABELS[range],
    points,
    total,
    allZero: points.length === 0 || total === 0,
  };
}

export function pickTickInterval(pointCount: number): number {
  if (pointCount <= 7) return 0;
  if (pointCount <= 14) return 1;
  if (pointCount <= 31) return 3;
  if (pointCount <= 62) return 6;
  return 15;
}

export function resolveViewChartData(input: {
  points: readonly DailyViewPoint[];
  today: string;
  trackingStartedAt: string | null;
}): ViewChartData {
  if (input.trackingStartedAt === null) {
    return {
      status: "empty",
      reason: "never-tracked",
      today: input.today,
      trackingStartedAt: null,
    };
  }

  const points = toViewChartPoints(input.points);
  if (isAllZero(points.map((point) => point.views))) {
    return {
      status: "empty",
      reason: "no-views",
      today: input.today,
      trackingStartedAt: input.trackingStartedAt,
    };
  }

  return {
    status: "ok",
    series: {
      points,
      today: input.today,
      trackingStartedAt: input.trackingStartedAt,
    },
  };
}

export function buildSharePoints(input: {
  site: readonly DailyViewPoint[];
  post: readonly DailyViewPoint[];
}): ViewChartSharePoint[] {
  const postByDay = new Map<string, number>();
  for (const point of input.post) {
    postByDay.set(point.day, toViewCount(point.views));
  }

  return input.site.map((sitePoint) => {
    const day = sitePoint.day;
    const siteViews = toViewCount(sitePoint.views);
    const postViews = Math.min(postByDay.get(day) ?? 0, siteViews);
    return {
      day,
      label: formatDayLabel(day),
      post: postViews,
      others: Math.max(0, siteViews - postViews),
    };
  });
}

export function sliceSharePoints(
  points: readonly ViewChartSharePoint[],
  range: ViewChartRange,
): ViewChartSharePoint[] {
  return points.slice(-range);
}

export function resolveShareChartData(input: {
  points: readonly ViewChartSharePoint[];
  today: string;
  trackingStartedAt: string | null;
}): ViewShareChartData {
  if (input.trackingStartedAt === null) {
    return {
      status: "empty",
      reason: "never-tracked",
      today: input.today,
      trackingStartedAt: null,
    };
  }

  const values = input.points.flatMap((point) => [point.post, point.others]);
  if (isAllZero(values)) {
    return {
      status: "empty",
      reason: "no-views",
      today: input.today,
      trackingStartedAt: input.trackingStartedAt,
    };
  }

  return {
    status: "ok",
    points: input.points.map((point) => ({ ...point })),
    today: input.today,
    trackingStartedAt: input.trackingStartedAt,
  };
}

export function describeViewChartData(
  data: ViewChartData | ViewShareChartData,
): ViewChartPresent {
  if (data.status === "ok") {
    return { showChart: true, title: null, description: null };
  }

  if (data.status === "error") {
    return {
      showChart: false,
      title: VIEW_CHART_ERROR_TITLE,
      description: VIEW_CHART_ERROR_DESCRIPTION,
    };
  }

  if (data.reason === "never-tracked") {
    return {
      showChart: false,
      title: VIEW_CHART_NEVER_TRACKED_TITLE,
      description: VIEW_CHART_NEVER_TRACKED_DESCRIPTION,
    };
  }

  return {
    showChart: false,
    title: VIEW_CHART_NO_VIEWS_TITLE,
    description: VIEW_CHART_NO_VIEWS_DESCRIPTION,
  };
}

export function viewChartFooterNote(input: {
  today: string;
  trackingStartedAt: string | null;
}): string {
  const base = `数据截至 ${input.today}（东八区），今日为部分日；缺日补 0。`;
  if (input.trackingStartedAt === null) return base;
  return `${base}自 ${input.trackingStartedAt} 起开始统计。`;
}

export function emptyWindowNotice(rangeLabel: string): string {
  return `${rangeLabel}没有阅读记录`;
}
