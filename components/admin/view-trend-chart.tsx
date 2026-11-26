"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  VIEW_CHART_DEFAULT_RANGE,
  VIEW_CHART_NOT_FOUND_MESSAGE,
  VIEW_CHART_RANGES,
  describeViewChartData,
  emptyWindowNotice,
  pickTickInterval,
  sliceViewSeries,
  viewChartFooterNote,
  type ViewChartData,
  type ViewChartRange,
} from "@/lib/blog/view-chart";
import { cn } from "@/lib/utils";

export type ViewTrendChartProps = {
  title: string;
  data: ViewChartData;
  color: string;
  seriesLabel?: string;
  rangeSwitch?: boolean;
  defaultRange?: ViewChartRange;
  className?: string;
};

const INITIAL_DIMENSION = { width: 320, height: 208 } as const;

function rangeLabelOf(range: ViewChartRange): string {
  return `近 ${range} 天`;
}

function parseViewChartRange(value: string): ViewChartRange | null {
  return VIEW_CHART_RANGES.find((range) => String(range) === value) ?? null;
}

export function ViewTrendChart({
  title,
  data,
  color,
  seriesLabel,
  rangeSwitch = true,
  defaultRange = VIEW_CHART_DEFAULT_RANGE,
  className,
}: ViewTrendChartProps): React.ReactElement {
  const [range, setRange] = useState<ViewChartRange>(defaultRange);

  const present = describeViewChartData(data);
  const isReady = data.status === "ok";
  const slice = isReady ? sliceViewSeries(data.series, range) : null;
  const windowAllZero = slice?.allZero ?? false;
  const emptyTitle =
    data.status === "error" ? VIEW_CHART_NOT_FOUND_MESSAGE : present.title;

  const chartConfig = {
    views: { label: seriesLabel ?? "阅读量", color },
  } satisfies ChartConfig;

  return (
    <section className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {rangeSwitch && isReady ? (
          <ToggleGroup
            aria-label="时间范围"
            spacing={0}
            value={[String(range)]}
            onValueChange={(next) => {
              const [value] = next;
              if (!value) return;
              const parsed = parseViewChartRange(value);
              if (parsed !== null) setRange(parsed);
            }}
            className="rounded-lg bg-muted p-0.5"
          >
            {VIEW_CHART_RANGES.map((option) => (
              <ToggleGroupItem
                key={option}
                value={String(option)}
                className="h-6 rounded-md px-2 text-[11px] aria-pressed:bg-background aria-pressed:shadow-sm"
              >
                {rangeLabelOf(option)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        {isReady && slice ? (
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="min-h-[13rem] w-full min-w-0 flex-1">
              <ChartContainer
                config={chartConfig}
                initialDimension={INITIAL_DIMENSION}
                className="h-full w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={slice.points}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={pickTickInterval(slice.points.length)}
                    minTickGap={8}
                    tickMargin={8}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    width={36}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="var(--color-views)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {viewChartFooterNote({
                today: data.series.today,
                trackingStartedAt: data.series.trackingStartedAt,
              })}
            </p>
            {windowAllZero ? (
              <p className="text-[11px] text-muted-foreground">
                {emptyWindowNotice(slice.rangeLabel)}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[13rem] flex-1 flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="text-sm text-muted-foreground">{emptyTitle}</p>
            <p className="text-[11px] text-muted-foreground">
              {present.description}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function ViewTrendChartSkeleton({
  className,
}: {
  className?: string;
} = {}): React.ReactElement {
  return (
    <section className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex h-5 items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card p-4">
        <Skeleton className="min-h-[13rem] w-full flex-1" />
        <Skeleton className="mt-2 h-3 w-3/4" />
      </div>
    </section>
  );
}
