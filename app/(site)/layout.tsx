import { Suspense } from "react";
import type { Viewport } from "next";
import { redirect } from "next/navigation";

import "@/components/fx/fx.css";
import { FxShell } from "@/components/fx/fx-shell";
import { MaintenanceScreen } from "@/components/site/maintenance-screen";
import { readSiteFlags } from "@/lib/site/cached-flags";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f0f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1f141d" },
  ],
};

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const flags = await readSiteFlags();
  if (!flags.initialized) redirect("/setup");
  if (flags.maintenance) return <MaintenanceScreen />;

  return (
    <Suspense fallback={null}>
      <FxShell>{children}</FxShell>
    </Suspense>
  );
}
