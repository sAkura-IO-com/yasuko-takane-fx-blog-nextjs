"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AdminSectionTab = {
  value: string;
  label: string;
};

export function AdminSectionTabs({
  tabs,
  active,
  label,
  basePath,
  children,
}: {
  tabs: AdminSectionTab[];
  active: string;
  label: string;
  basePath: string;
  children?: ReactNode;
}) {
  const router = useRouter();

  return (
    <Tabs
      value={active}
      className="gap-4"
      onValueChange={(value) => {
        if (typeof value !== "string" || value === active) return;
        router.replace(`${basePath}?tab=${encodeURIComponent(value)}`, {
          scroll: false,
        });
      }}
    >
      <TabsList variant="line" aria-label={label}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={active}>{children}</TabsContent>
    </Tabs>
  );
}
