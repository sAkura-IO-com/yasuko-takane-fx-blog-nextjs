import { PostShareChart } from "@/components/admin/post-share-chart";
import {
  ViewTrendChart,
  ViewTrendChartSkeleton,
} from "@/components/admin/view-trend-chart";
import {
  getPostShareChartData,
  getPostViewChartData,
  getSiteViewChartData,
} from "@/lib/blog/view-chart-data";
import { cn } from "@/lib/utils";

export async function PostViewCharts(props: {
  postId: string;
  className?: string;
}): Promise<React.ReactElement> {
  const { postId, className } = props;

  const [site, post, share] = await Promise.all([
    getSiteViewChartData(),
    getPostViewChartData(postId),
    getPostShareChartData(postId),
  ]);

  return (
    <div className={cn("grid min-w-0 gap-4 lg:grid-cols-2", className)}>
      <ViewTrendChart title="本篇每日阅读" data={post} color="var(--chart-1)" />
      <ViewTrendChart title="本站每日阅读" data={site} color="var(--chart-2)" />
      <PostShareChart data={share} className="lg:col-span-2" />
    </div>
  );
}

export function PostViewChartsFallback(): React.ReactElement {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <ViewTrendChartSkeleton className="lg:col-span-1" />
      <ViewTrendChartSkeleton className="lg:col-span-1" />
      <ViewTrendChartSkeleton className="lg:col-span-2" />
    </div>
  );
}
