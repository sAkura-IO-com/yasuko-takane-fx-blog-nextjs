import Link from "next/link";

import { SiteFrame } from "@/components/site/site-frame";
import { SiteLogo } from "@/components/site/site-logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "首页", route: true },
  { href: "/posts", label: "全部文章", route: true },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 overflow-x-clip bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <SiteFrame
        border={false}
        screenLines="both"
        className="flex h-(--site-header-height) items-center gap-2 pr-2 pl-4 sm:gap-4"
      >
        <SiteLogo />

        <nav className="min-w-0 flex-1" aria-label="页面导航">
          <ul className="flex items-center justify-end gap-0.5 overflow-x-auto sm:gap-1">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "home-focus inline-flex h-8 items-center rounded-md px-2.5 text-sm text-muted-foreground transition-colors",
                    "hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SiteFrame>
    </header>
  );
}
