import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { MediaLibrary } from "@/components/media/media-library";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "存储",
};

const TABS = [
  { value: "images", label: "图片库" },
  { value: "files", label: "文件" },
];

const TAB_VALUES: readonly string[] = TABS.map((tab) => tab.value);

function parseTab(value: string | string[] | undefined) {
  return typeof value === "string" && TAB_VALUES.includes(value)
    ? value
    : "images";
}

function StorageFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function StorageSection({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const active = parseTab(params.tab);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-medium">存储</h2>

      <AdminSectionTabs
        label="存储内容类型"
        basePath="/admin/storage"
        active={active}
        tabs={TABS}
      >
        {active === "images" ? <MediaLibrary mode="browse" /> : null}
        {active === "files" ? (
          <MediaLibrary mode="browse" scope="files" />
        ) : null}
      </AdminSectionTabs>
    </div>
  );
}

export default function AdminStoragePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<StorageFallback />}>
      <StorageSection searchParams={searchParams} />
    </Suspense>
  );
}
