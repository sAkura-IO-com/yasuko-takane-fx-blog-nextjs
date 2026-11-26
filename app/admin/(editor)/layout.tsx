"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminPageFrame } from "@/components/site/admin-page-frame";
import { isAdminSplitEditorRoute } from "@/lib/admin/routes";

export default function AdminEditorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const fullBleed = isAdminSplitEditorRoute(usePathname());

  return (
    <AdminPageFrame width="editor" fullBleed={fullBleed}>
      {children}
    </AdminPageFrame>
  );
}
