import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import {
  getArticleViewGrowth,
  getPostViewSeries,
} from "@/lib/blog/article-views";
import { cacheTags } from "@/lib/blog/cache-tags";
import { shanghaiDayKey } from "@/lib/time/shanghai-day";

import {
  buildSharePoints,
  resolveShareChartData,
  resolveViewChartData,
  VIEW_CHART_FETCH_DAYS,
  VIEW_CHART_NOT_FOUND_MESSAGE,
  type ViewChartData,
  type ViewShareChartData,
} from "./view-chart";

export async function getSiteViewChartData(): Promise<ViewChartData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.metrics);

  try {
    const growth = await getArticleViewGrowth(
      new Date(),
      VIEW_CHART_FETCH_DAYS,
    );
    const today = growth.daily.at(-1)?.day ?? shanghaiDayKey(new Date());
    return resolveViewChartData({
      points: growth.daily,
      today,
      trackingStartedAt: growth.trackingStartedAt,
    });
  } catch (error) {
    console.error("[views] 读取阅读图表数据失败:", error);
    return { status: "error", message: VIEW_CHART_NOT_FOUND_MESSAGE };
  }
}

export async function getPostViewChartData(
  postId: string,
): Promise<ViewChartData> {
  try {
    const series = await getPostViewSeries([postId], {
      days: VIEW_CHART_FETCH_DAYS,
    });
    const entry = series.get(postId);
    return resolveViewChartData({
      points: entry?.series ?? [],
      today: shanghaiDayKey(new Date()),
      trackingStartedAt: entry?.firstTrackedDay ?? null,
    });
  } catch (error) {
    console.error("[views] 读取阅读图表数据失败:", error);
    return { status: "error", message: VIEW_CHART_NOT_FOUND_MESSAGE };
  }
}

export async function getPostShareChartData(
  postId: string,
): Promise<ViewShareChartData> {
  try {
    const [site, postSeries] = await Promise.all([
      getSiteViewChartData(),
      getPostViewSeries([postId], { days: VIEW_CHART_FETCH_DAYS }),
    ]);
    const postEntry = postSeries.get(postId);

    if (site.status === "error") {
      return site;
    }

    if (site.status === "empty") {
      return {
        status: "empty",
        reason: site.reason,
        today: site.today,
        trackingStartedAt: site.trackingStartedAt,
      };
    }

    const points = buildSharePoints({
      site: site.series.points,
      post: postEntry?.series ?? [],
    });
    return resolveShareChartData({
      points,
      today: site.series.today,
      trackingStartedAt: site.series.trackingStartedAt,
    });
  } catch (error) {
    console.error("[views] 读取阅读图表数据失败:", error);
    return { status: "error", message: VIEW_CHART_NOT_FOUND_MESSAGE };
  }
}
