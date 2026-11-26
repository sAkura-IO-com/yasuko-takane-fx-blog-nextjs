export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export function parsePageLimit(raw: string | null): number {
  if (raw == null || raw === "") return DEFAULT_PAGE_SIZE;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export type TimestampCursor = { timestamp: Date; id: string };

export function encodeTimestampCursor(timestamp: Date, id: string): string {
  return `${timestamp.toISOString()}|${id}`;
}

export function decodeTimestampCursor(value: string): TimestampCursor | null {
  const sep = value.indexOf("|");
  if (sep <= 0) return null;
  const iso = value.slice(0, sep);
  const id = value.slice(sep + 1);
  if (!iso || !id) return null;
  const timestamp = new Date(iso);
  if (Number.isNaN(timestamp.getTime())) return null;
  return { timestamp, id };
}

export function paginateByTimestamp<
  T extends { id: string; publishedAt: Date | null; createdAt: Date },
>(
  items: T[],
  cursor: TimestampCursor | null,
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const rest = cursor
    ? items.filter((item) => isAfterCursor(item, cursor))
    : items;
  const page = rest.slice(0, limit);
  const last = page.at(-1);
  const hasMore = rest.length > page.length;
  return {
    page,
    nextCursor:
      hasMore && last
        ? encodeTimestampCursor(last.publishedAt ?? last.createdAt, last.id)
        : null,
  };
}

function isAfterCursor(
  item: { id: string; publishedAt: Date | null; createdAt: Date },
  cursor: TimestampCursor,
): boolean {
  const itemTime = (item.publishedAt ?? item.createdAt).getTime();
  const cursorTime = cursor.timestamp.getTime();
  if (itemTime !== cursorTime) return itemTime < cursorTime;
  return item.id < cursor.id;
}
