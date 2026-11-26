"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  civilDateToDate,
  compareCivil,
  formatPublishedAtLabel,
  isCivilDateDisabled,
  monthGrid,
  POST_PUBLISHED_AT_MIN,
  publishedAtError,
  shanghaiCivilDate,
  shanghaiTime,
  shiftMonth,
  type CivilDate,
} from "@/lib/blog/published-at";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function parseIso(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timeValue(date: Date): string {
  const time = shanghaiTime(date);
  const hour = String(time.hour).padStart(2, "0");
  const minute = String(time.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}

function monthKey(date: CivilDate): number {
  return date.year * 12 + date.month;
}

export function PostPublishedAtField({
  publishedAt,
  createdAt,
  nowIso,
}: {
  publishedAt?: string | null;
  createdAt?: string | null;
  nowIso: string;
}) {
  const stored = parseIso(publishedAt);
  const created = parseIso(createdAt);
  const [value, setValue] = useState(
    () => stored ?? created ?? parseIso(nowIso) ?? POST_PUBLISHED_AT_MIN,
  );
  const [touched, setTouched] = useState(false);
  const [visible, setVisible] = useState(() => shanghaiCivilDate(value));
  const [now, setNow] = useState(
    () => parseIso(nowIso) ?? POST_PUBLISHED_AT_MIN,
  );

  const selected = shanghaiCivilDate(value);
  const cells = useMemo(
    () => monthGrid(visible.year, visible.month),
    [visible.year, visible.month],
  );
  const minMonth = shanghaiCivilDate(POST_PUBLISHED_AT_MIN);
  const today = shanghaiCivilDate(now);
  const canPrev = monthKey(visible) > monthKey(minMonth);
  const canNext = monthKey(visible) < monthKey(today);
  const error = publishedAtError(value, now);
  const willSubmit = touched || stored != null;
  const showPlaceholder = !stored && !touched && !created;
  const dayMax =
    compareCivil(selected, today) === 0 ? timeValue(now) : undefined;
  const hint = stored
    ? "文章页和列表显示这个日期。"
    : created
      ? "这是创建时间。改选后才会写到文章页；不改则在发布时记为保存时间。"
      : "修改后写入；不修改则在发布时记为保存时间。";

  function selectDay(day: CivilDate) {
    const current = new Date();
    setNow(current);
    if (isCivilDateDisabled(day, current)) return;
    const time = shanghaiTime(value);
    let next = civilDateToDate(day, time.hour, time.minute);
    if (publishedAtError(next, current)) {
      const fallback = shanghaiTime(current);
      next = civilDateToDate(day, fallback.hour, fallback.minute);
      if (publishedAtError(next, current)) return;
    }
    setTouched(true);
    setValue(next);
    setVisible({ year: day.year, month: day.month, day: 1 });
  }

  function selectTime(raw: string) {
    const matched = /^(\d{2}):(\d{2})/.exec(raw);
    if (!matched) return;
    const hour = Number(matched[1]);
    const minute = Number(matched[2]);
    if (hour > 23 || minute > 59) return;
    const current = new Date();
    setNow(current);
    const next = civilDateToDate(selected, hour, minute);
    if (publishedAtError(next, current)) return;
    setTouched(true);
    setValue(next);
  }

  return (
    <Field data-invalid={willSubmit && error ? true : undefined}>
      <FieldLabel htmlFor="publishedAt">发布时间</FieldLabel>
      <Popover
        onOpenChange={(open) => {
          if (open) setNow(new Date());
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id="publishedAt"
              type="button"
              variant="outline"
              aria-invalid={willSubmit && error ? true : undefined}
              className="w-full min-w-0 justify-start font-normal"
            />
          }
        >
          <CalendarIcon data-icon="inline-start" />
          <span className="min-w-0 truncate">
            {showPlaceholder ? "保存时确定" : formatPublishedAtLabel(value)}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-fit rounded-lg border bg-popover p-3 text-popover-foreground shadow-md"
          side="bottom"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!canPrev}
                aria-label="上个月"
                onClick={() => {
                  const next = shiftMonth(visible.year, visible.month, -1);
                  setVisible(next);
                }}
              >
                <ChevronLeftIcon />
              </Button>
              <span className="text-sm font-medium">
                {visible.year}年{visible.month}月
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!canNext}
                aria-label="下个月"
                onClick={() => {
                  const next = shiftMonth(visible.year, visible.month, 1);
                  setVisible(next);
                }}
              >
                <ChevronRightIcon />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((label) => (
                <span
                  key={label}
                  className="flex size-7 items-center justify-center text-xs text-muted-foreground"
                >
                  {label}
                </span>
              ))}
              {cells.map((day) => {
                const inMonth = day.month === visible.month;
                const isSelected = compareCivil(day, selected) === 0;
                const disabled = isCivilDateDisabled(day, now);
                return (
                  <Button
                    key={`${day.year}-${day.month}-${day.day}`}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="icon-sm"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    aria-label={`${day.year}年${day.month}月${day.day}日`}
                    className={cn(
                      !inMonth && !isSelected && "text-muted-foreground",
                    )}
                    onClick={() => selectDay(day)}
                  >
                    {day.day}
                  </Button>
                );
              })}
            </div>
            <Field>
              <FieldLabel htmlFor="published-at-time">时间</FieldLabel>
              <Input
                id="published-at-time"
                type="time"
                step={60}
                value={timeValue(value)}
                max={dayMax}
                disabled={isCivilDateDisabled(selected, now)}
                onChange={(event) => selectTime(event.target.value)}
              />
            </Field>
          </div>
        </PopoverContent>
      </Popover>
      {willSubmit && error ? (
        <FieldError>{error}</FieldError>
      ) : (
        <FieldDescription>{hint}</FieldDescription>
      )}
      {willSubmit ? (
        <input type="hidden" name="publishedAt" value={value.toISOString()} />
      ) : null}
    </Field>
  );
}
