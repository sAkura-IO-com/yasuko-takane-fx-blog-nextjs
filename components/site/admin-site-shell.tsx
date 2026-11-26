"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminSiteHeader } from "@/components/site/admin-site-header";
import { SiteShell } from "@/components/site/site-shell";
import { isAdminSplitEditorRoute } from "@/lib/admin/routes";
import { useMinWidth } from "@/lib/hooks/use-min-width";
import { cn } from "@/lib/utils";

type AdminSiteShellProps = {
  children: ReactNode;
};

export function AdminSiteShell({ children }: AdminSiteShellProps) {
  const pathname = usePathname();
  const isWide = useMinWidth(768);
  const useEditorFullLayout = isAdminSplitEditorRoute(pathname) && isWide;

  return (
    <SiteShell
      header={<AdminSiteHeader />}
      className={cn("admin-shell", useEditorFullLayout && "home-page-admin")}
      layout={useEditorFullLayout ? "full" : "default"}
      mainClassName={cn(useEditorFullLayout && "home-main-admin px-0")}
      showFooter={false}
    >
      {children}
    </SiteShell>
  );
}
