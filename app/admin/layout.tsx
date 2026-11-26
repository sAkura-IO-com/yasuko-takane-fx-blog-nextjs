import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { MonacoPreload } from "@/components/admin/monaco-preload";
import { AdminPageFrame } from "@/components/site/admin-page-frame";
import { AdminSiteShell } from "@/components/site/admin-site-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOwner } from "@/lib/blog/owner";
import { readSiteFlags } from "@/lib/site/cached-flags";

export const instant = false;

async function AdminGate({ children }: { children: React.ReactNode }) {
  await connection();
  const flags = await readSiteFlags();
  if (!flags.initialized) redirect("/setup");
  await requireOwner("/admin");
  return children;
}

function AdminFallback() {
  return (
    <AdminPageFrame>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    </AdminPageFrame>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <div lang="zh-CN" className="contents">
        <AdminSiteShell>
          <MonacoPreload />
          <Suspense fallback={<AdminFallback />}>{children}</Suspense>
        </AdminSiteShell>
      </div>
    </AdminGate>
  );
}
