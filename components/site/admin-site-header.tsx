"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { SiteFrame } from "@/components/site/site-frame";
import { SiteLogo } from "@/components/site/site-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { isAdminNavActive, isAdminSplitEditorRoute } from "@/lib/admin/routes";
import { authClient } from "@/lib/better-auth/auth-client";
import { useMinWidth } from "@/lib/hooks/use-min-width";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "指标" },
  { href: "/admin/writing", label: "写作" },
  { href: "/admin/storage", label: "存储" },
  { href: "/admin/comments", label: "评论" },
  { href: "/admin/settings", label: "配置" },
] as const;

const NAV_SCROLL =
  "flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [touch-action:pan-x]";

export function AdminSiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isWide = useMinWidth(768);
  const useEditorFullChrome = isAdminSplitEditorRoute(pathname) && isWide;
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message || "退出登录失败");
        return;
      }
      setConfirmingSignOut(false);
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 overflow-x-clip bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-backdrop-filter:bg-background/70",
        useEditorFullChrome && "max-w-screen px-0",
      )}
    >
      <SiteFrame
        width={useEditorFullChrome ? "editor" : "default"}
        border={false}
        screenLines={useEditorFullChrome ? "none" : "both"}
        className={cn(
          "flex h-(--site-header-height) items-center gap-2 sm:gap-4",
          useEditorFullChrome ? "px-3 sm:px-4" : "px-4",
        )}
      >
        <SiteLogo href="/admin">
          <Image
            src="/icon-96.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-[var(--radius-md)] object-cover"
            priority
            unoptimized
          />
        </SiteLogo>

        <nav className={NAV_SCROLL} aria-label="后台导航">
          <ul className="ms-auto flex w-max flex-nowrap items-center gap-0.5 sm:gap-1">
            {ADMIN_NAV.map((item) => {
              const active = isAdminNavActive(item.href, pathname);

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    prefetch={true}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "home-focus inline-flex h-8 items-center rounded-md px-2.5 text-sm transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="shrink-0">
              <Dialog
                open={confirmingSignOut}
                onOpenChange={setConfirmingSignOut}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmingSignOut(true)}
                  className="h-8 gap-1 px-2.5 text-sm font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                >
                  退出账号
                </Button>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>退出登录？</DialogTitle>
                    <DialogDescription>
                      退出后需要重新登录才能进入后台。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      disabled={isPending}
                      onClick={() => setConfirmingSignOut(false)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={isPending}
                      onClick={signOut}
                    >
                      {isPending ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      确认退出
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </li>
            <li className="shrink-0">
              <Link
                href="/"
                className={cn(
                  "home-focus inline-flex h-8 items-center rounded-md px-2.5 text-sm text-muted-foreground transition-colors",
                  "hover:bg-muted/60 hover:text-foreground",
                )}
              >
                回主站
              </Link>
            </li>
          </ul>
        </nav>
      </SiteFrame>
    </header>
  );
}
