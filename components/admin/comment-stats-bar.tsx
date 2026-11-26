import Link from "next/link";

import type { CommentCounts } from "@/lib/comments/db";
import type { CommentStatus } from "@/lib/comments/types";
import { cn } from "@/lib/utils";

type DisplayStatus = Exclude<CommentStatus, "spam">;

const STATUSES: DisplayStatus[] = ["pending", "approved", "rejected"];

const STATUS_LABEL: Record<DisplayStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

function statusHref(baseHref: string, status: CommentStatus | null): string {
  const separator = baseHref.includes("?") ? "&" : "?";
  return status ? `${baseHref}${separator}status=${status}` : baseHref;
}

export function CommentStatsBar({
  totals,
  baseHref,
  activeStatus,
}: {
  totals: CommentCounts;
  baseHref: string;
  activeStatus?: CommentStatus;
}) {
  const chips: {
    key: CommentStatus | "all";
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "全部", count: totals.total },
    ...STATUSES.map((status) => ({
      key: status,
      label: STATUS_LABEL[status],
      count: totals[status],
    })),
  ];
  const active = activeStatus ?? "all";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const isActive = chip.key === active;
          return (
            <Link
              key={chip.key}
              href={statusHref(baseHref, chip.key === "all" ? null : chip.key)}
              scroll={false}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                isActive
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "tabular-nums",
                  isActive ? "opacity-80" : "font-medium text-foreground",
                )}
              >
                {chip.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
