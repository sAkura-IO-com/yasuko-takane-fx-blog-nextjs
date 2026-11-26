import type { ReactNode } from "react";

import { AdminPageFrame } from "@/components/site/admin-page-frame";

export default function AdminMainLayout({ children }: { children: ReactNode }) {
  return <AdminPageFrame>{children}</AdminPageFrame>;
}
