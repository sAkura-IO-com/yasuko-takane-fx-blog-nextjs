import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/better-auth/session";

import { LoginForm } from "./login-form";

type LoginSearchParams = Record<string, string | string[] | undefined>;

type LoginPageProps = {
  searchParams: Promise<LoginSearchParams>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const callbackUrl = firstParam(params.callbackUrl);
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/admin";

  const session = await getSession();
  if (session) redirect(safeCallback);

  const error = firstParam(params.error);

  return <LoginForm callbackUrl={safeCallback} error={error} />;
}

function LoginFallback() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-border p-6">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div lang="zh-CN" className="flex min-h-svh items-center justify-center p-6">
      <Suspense fallback={<LoginFallback />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
