"use client";

import { useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  VIEW_CHART_DEFAULT_RANGE,
  VIEW_CHART_NOT_FOUND_MESSAGE,
  VIEW_CHART_RANGES,
  describeViewChartData,
  pickTickInterval,
  sliceSharePoints,
  viewChartFooterNote,
  type ViewChartRange,
  type ViewShareChartData,
} from "@/lib/blog/view-chart";
import { cn } from "@/lib/utils";

export type PostShareChartProps = {
  data: ViewShareChartData;
  rangeSwitch?: boolean;
  defaultRange?: ViewChartRange;
  className?: string;
};

const INITIAL_DIMENSION = { width: 320, height: 208 } as const;

const SHARE_CHART_CONFIG = {
  post: { label: "本篇", color: "var(--chart-1)" },
  others: { label: "其它内容", color: "var(--chart-4)" },
} satisfies ChartConfig;

const SHARE_FOOTER_NOTE =
  "构成按东八区日键对齐；「其它内容」= 本站当日阅读 − 本篇当日阅读，含其它文章与已删除文章的当日阅读。";

function rangeLabelOf(range: ViewChartRange): string {
  return `近 ${range} 天`;
}

function parseViewChartRange(value: string): ViewChartRange | null {
  return VIEW_CHART_RANGES.find((range) => String(range) === value) ?? null;
}

export function PostShareChart({
  data,
  rangeSwitch = true,
  defaultRange = VIEW_CHART_DEFAULT_RANGE,
  className,
}: PostShareChartProps): React.ReactElement {
  const [range, setRange] = useState<ViewChartRange>(defaultRange);

  const present = describeViewChartData(data);
  const isReady = data.status === "ok";
  const points = isReady ? sliceSharePoints(data.points, range) : null;
  const emptyTitle =
    data.status === "error" ? VIEW_CHART_NOT_FOUND_MESSAGE : present.title;

  const okFooterNote =
    data.status === "ok"
      ? `${viewChartFooterNote({
          today: data.today,
          trackingStartedAt: data.trackingStartedAt,
        })}${SHARE_FOOTER_NOTE}`
      : null;

  return (
    <section className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">
          每日阅读构成
        </h3>
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

      <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
        {data.status === "ok" && points ? (
          <div className="flex flex-col gap-2 p-4">
            <div className="h-[13rem] w-full min-w-0">
              <ChartContainer
                config={SHARE_CHART_CONFIG}
                initialDimension={INITIAL_DIMENSION}
                className="h-full w-full"
              >
                <BarChart data={points}>
                  <XAxis
                    dataKey="label"
                    interval={pickTickInterval(points.length)}
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
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <ChartLegend
                    content={
                      <ChartLegendContent
                        nameKey="dataKey"
                        className="flex-wrap"
                      />
                    }
                  />
                  <Bar
                    stackId="views"
                    dataKey="post"
                    fill="var(--color-post)"
                    radius={[0, 0, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    stackId="views"
                    dataKey="others"
                    fill="var(--color-others)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ChartContainer>
            </div>
            <p className="text-[11px] text-muted-foreground">{okFooterNote}</p>
          </div>
        ) : (
          <div className="flex h-[13rem] flex-col items-center justify-center gap-1 px-4 text-center">
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
