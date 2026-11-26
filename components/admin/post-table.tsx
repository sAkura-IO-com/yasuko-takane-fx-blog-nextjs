"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type AdminPostRow = {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  createdAt: number;
  updatedAt: number;
  createdAtText: string;
  updatedAtText: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "归档",
};

const STATUS_ORDER: Record<string, number> = {
  published: 0,
  draft: 1,
  archived: 2,
};

type SortKey = "title" | "status" | "viewCount" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

type Column = {
  key: SortKey;
  label: string;
  firstDirection: SortDirection;
};

const COLUMNS: Column[] = [
  { key: "title", label: "标题", firstDirection: "asc" },
  { key: "status", label: "状态", firstDirection: "asc" },
  { key: "viewCount", label: "阅读", firstDirection: "desc" },
  { key: "createdAt", label: "创建时间", firstDirection: "desc" },
  { key: "updatedAt", label: "更新时间", firstDirection: "desc" },
];

const DEFAULT_SORT: { key: SortKey; direction: SortDirection } = {
  key: "createdAt",
  direction: "desc",
};

function compare(a: AdminPostRow, b: AdminPostRow, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title, "zh-CN");
    case "status":
      return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    case "viewCount":
      return a.viewCount - b.viewCount;
    case "createdAt":
      return a.createdAt - b.createdAt;
    case "updatedAt":
      return a.updatedAt - b.updatedAt;
  }
}

export function AdminPostTable({ rows }: { rows: AdminPostRow[] }) {
  const [sort, setSort] = useState(DEFAULT_SORT);

  const sorted = useMemo(() => {
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compare(a, b, sort.key) * factor);
  }, [rows, sort]);

  function toggleSort(column: Column) {
    setSort((prev) =>
      prev.key === column.key
        ? {
            key: column.key,
            direction: prev.direction === "asc" ? "desc" : "asc",
          }
        : { key: column.key, direction: column.firstDirection },
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => {
            const active = sort.key === column.key;
            const Icon = !active
              ? ChevronsUpDownIcon
              : sort.direction === "asc"
                ? ArrowUpIcon
                : ArrowDownIcon;
            return (
              <TableHead
                key={column.key}
                aria-sort={
                  active
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <button
                  type="button"
                  onClick={() => toggleSort(column)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm whitespace-nowrap transition-colors select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {column.label}
                  <Icon className="size-3.5" aria-hidden="true" />
                </button>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Button
                variant="link"
                size="sm"
                render={
                  <Link href={`/admin/posts/${row.id}`} prefetch={true} />
                }
                nativeButton={false}
              >
                {row.title || "无标题"}
              </Button>
            </TableCell>
            <TableCell>
              <Badge
                variant={row.status === "published" ? "default" : "secondary"}
              >
                {STATUS_LABEL[row.status] ?? row.status}
              </Badge>
            </TableCell>
            <TableCell>{row.viewCount}</TableCell>
            <TableCell className="text-muted-foreground">
              {row.createdAtText}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {row.updatedAtText}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
