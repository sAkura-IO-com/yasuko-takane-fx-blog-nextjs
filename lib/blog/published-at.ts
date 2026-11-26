export const POST_DATE_TIME_ZONE = "Asia/Shanghai";

export const POST_PUBLISHED_AT_MIN = new Date("2000-01-01T00:00:00+08:00");

const INVALID_MESSAGE = "发布时间无效";
const TOO_EARLY_MESSAGE = "发布时间不能早于 2000 年 1 月 1 日";
const TOO_LATE_MESSAGE = "发布时间不能晚于现在";

export type CivilDate = {
  year: number;
  month: number;
  day: number;
};

export function shanghaiCivilDate(date: Date): CivilDate {
  const pick = readParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
  };
}

export function shanghaiTime(date: Date): { hour: number; minute: number } {
  const pick = readParts(date, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0;
  return { hour, minute: Number(pick("minute")) };
}

export function civilDateToDate(
  date: CivilDate,
  hour: number,
  minute: number,
): Date {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return new Date(`${date.year}-${month}-${day}T${h}:${m}:00+08:00`);
}

export function compareCivil(a: CivilDate, b: CivilDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function isCivilDateDisabled(date: CivilDate, now: Date): boolean {
  const min = shanghaiCivilDate(POST_PUBLISHED_AT_MIN);
  const today = shanghaiCivilDate(now);
  return compareCivil(date, min) < 0 || compareCivil(date, today) > 0;
}

export function mondayIndex(date: CivilDate): number {
  const utcDay = new Date(
    Date.UTC(date.year, date.month - 1, date.day, 4, 0, 0),
  ).getUTCDay();
  return (utcDay + 6) % 7;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): CivilDate {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12 + 1;
  return { year: nextYear, month: nextMonth, day: 1 };
}

export function monthGrid(year: number, month: number): CivilDate[] {
  const lead = mondayIndex({ year, month, day: 1 });
  const count = daysInMonth(year, month);
  const cells: CivilDate[] = [];
  const prev = shiftMonth(year, month, -1);
  const prevCount = daysInMonth(prev.year, prev.month);
  for (let offset = lead; offset > 0; offset -= 1) {
    cells.push({
      year: prev.year,
      month: prev.month,
      day: prevCount - offset + 1,
    });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ year, month, day });
  }
  const next = shiftMonth(year, month, 1);
  let day = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ year: next.year, month: next.month, day });
    day += 1;
  }
  return cells;
}

export function formatPublishedAtLabel(date: Date): string {
  const civil = shanghaiCivilDate(date);
  const time = shanghaiTime(date);
  const hour = String(time.hour).padStart(2, "0");
  const minute = String(time.minute).padStart(2, "0");
  return `${civil.year}年${civil.month}月${civil.day}日 ${hour}:${minute}`;
}

export function publishedAtError(date: Date, now = new Date()): string | null {
  if (Number.isNaN(date.getTime())) return INVALID_MESSAGE;
  if (date.getTime() < POST_PUBLISHED_AT_MIN.getTime()) {
    return TOO_EARLY_MESSAGE;
  }
  if (date.getTime() > now.getTime()) return TOO_LATE_MESSAGE;
  return null;
}

export function parsePublishedAtFormValue(
  raw: string,
  now = new Date(),
): { date: Date } | { error: string } {
  const value = raw.trim();
  if (!value) return { error: "请选择发布时间" };
  const date = new Date(value);
  const error = publishedAtError(date, now);
  if (error) return { error };
  return { date };
}

export function resolvePublishedAt(input: {
  status: "draft" | "published" | "archived";
  submitted?: Date;
  current?: Date | null;
  now?: Date;
}): Date | null {
  if (input.submitted) return input.submitted;
  if (input.current) return input.current;
  if (input.status === "published") return input.now ?? new Date();
  return null;
}

function readParts(date: Date, options: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: POST_DATE_TIME_ZONE,
    ...options,
  }).formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return (type: Intl.DateTimeFormatPartTypes) => map.get(type) ?? "";
}
