import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div
      lang="zh-CN"
      className="flex min-h-svh items-center justify-center bg-background p-4"
    >
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center text-card-foreground shadow-sm">
        <LockKeyhole className="mx-auto size-9 text-primary" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          没有后台权限
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          这个页面只有管理员可以打开。请用拥有管理员角色的账号登录。
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          回到首页
        </Link>
      </div>
    </div>
  );
}
