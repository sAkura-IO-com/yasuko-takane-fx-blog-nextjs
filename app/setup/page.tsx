import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { OnboardingForm } from "@/components/setup/onboarding-form";
import { Skeleton } from "@/components/ui/skeleton";
import { readSiteFlags } from "@/lib/site/cached-flags";

export const instant = false;

export const metadata: Metadata = {
  title: "初始化站点",
  robots: { index: false, follow: false },
};

function SetupFallback() {
  return (
    <main lang="zh-CN" className="home-shell home-main-inner">
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    </main>
  );
}

async function SetupContent() {
  await connection();
  const flags = await readSiteFlags();
  if (flags.initialized) redirect("/login");

  return (
    <main lang="zh-CN" className="home-shell home-main-inner">
      <OnboardingForm />
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<SetupFallback />}>
      <SetupContent />
    </Suspense>
  );
}
