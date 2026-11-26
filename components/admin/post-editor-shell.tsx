"use client";

import { useState, type ReactNode } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type PostEditorShellProps = {
  editor: ReactNode;
  data: ReactNode;
};

const TABS = [
  { value: "editor", label: "编辑" },
  { value: "data", label: "数据" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function PostEditorShell({ editor, data }: PostEditorShellProps) {
  const [tab, setTab] = useState<TabValue>("editor");
  const [dataMounted, setDataMounted] = useState(false);

  function changeTab(next: string | undefined) {
    if (next !== "editor" && next !== "data") return;
    if (next === "data") setDataMounted(true);
    if (next === "editor" && tab === "data") {
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }
    setTab(next);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 max-md:flex-none md:min-h-0">
      <div className="home-shell flex shrink-0 items-center">
        <ToggleGroup
          value={[tab]}
          onValueChange={(next) => changeTab(next[0])}
          spacing={0}
          className="rounded-lg bg-muted p-0.5"
        >
          {TABS.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              className="h-7 rounded-md px-3 text-xs aria-pressed:bg-background aria-pressed:shadow-sm"
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="relative min-w-0 md:min-h-0 md:flex-1">
        <div
          className={cn(
            "min-w-0 md:absolute md:inset-0",
            tab === "editor" && "home-shell",
            tab !== "editor" && "pointer-events-none invisible max-md:hidden",
          )}
          aria-hidden={tab !== "editor"}
        >
          {editor}
        </div>
        {dataMounted ? (
          <div
            className={cn(
              "home-shell min-w-0 md:absolute md:inset-0 md:overflow-x-clip md:overflow-y-auto",
              tab !== "data" && "pointer-events-none invisible max-md:hidden",
            )}
            aria-hidden={tab !== "data"}
          >
            {data}
          </div>
        ) : null}
      </div>
    </div>
  );
}
