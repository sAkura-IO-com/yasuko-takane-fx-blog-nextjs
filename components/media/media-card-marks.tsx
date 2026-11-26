import { Badge } from "@/components/ui/badge";

export function MediaInsertedBadge() {
  return (
    <Badge
      aria-hidden
      variant="secondary"
      className="pointer-events-none absolute end-1.5 top-1.5 z-10 h-4 border border-border/80 bg-background/95 px-1 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm"
    >
      已插入
    </Badge>
  );
}

export function MediaSelectionIndex({ index }: { index: number }) {
  return (
    <Badge
      aria-hidden
      className="pointer-events-none absolute start-8 top-1.5 z-10 h-5 min-w-5 rounded-md px-1 text-[10px] tabular-nums"
    >
      {index}
    </Badge>
  );
}

export function mediaCardLabel(
  name: string,
  inserted: boolean,
  order?: number,
): string {
  const extra: string[] = [];
  if (inserted) extra.push("已插入");
  if (order) extra.push(`第 ${order} 项`);
  return extra.length > 0 ? `${name}，${extra.join("，")}` : name;
}
