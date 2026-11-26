"use client";

import { useMemo, useState } from "react";

export function useDragOrder<T extends { id: string }>(items: T[]) {
  const [order, setOrder] = useState<string[] | null>(null);

  const rows = useMemo(() => {
    if (!order) return items;
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered: T[] = [];
    for (const id of order) {
      const item = byId.get(id);
      if (!item) continue;
      byId.delete(id);
      ordered.push(item);
    }
    return [...ordered, ...byId.values()];
  }, [items, order]);

  function commitOrder(next: T[]) {
    setOrder(next.map((item) => item.id));
  }

  return [rows, commitOrder] as const;
}
