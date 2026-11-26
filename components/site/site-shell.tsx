import { Suspense, type ReactNode } from "react";

import { SiteCopyrightYear } from "@/components/site/site-copyright-year";
import { SiteFrame } from "@/components/site/site-frame";
import { SiteHeader } from "@/components/site/site-header";
import { SiteLayoutGrid } from "@/components/site/site-layout";
import { SiteScrollToTop } from "@/components/site/site-scroll-to-top";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  children: ReactNode;
  header?: ReactNode;
  headerAsideLeft?: ReactNode;
  headerAsideRight?: ReactNode;
  mainAsideLeft?: ReactNode;
  mainAsideRight?: ReactNode;
  footerAsideLeft?: ReactNode;
  footerAsideRight?: ReactNode;
  className?: string;
  mainClassName?: string;
  showFooter?: boolean;
  layout?: "default" | "full";
};

export function SiteShell({
  children,
  header = <SiteHeader />,
  headerAsideLeft,
  headerAsideRight,
  mainAsideLeft,
  mainAsideRight,
  footerAsideLeft,
  footerAsideRight,
  className,
  mainClassName,
  showFooter = true,
  layout = "default",
}: SiteShellProps) {
  const useLayoutGrid = layout === "default";

  const footerInner = (
    <SiteFrame
      border={false}
      screenLines="top"
      className="home-footer-inner px-4 py-5"
    >
      <p>按 D 键切换深浅色主题</p>
      <p className="home-tabular">
        ©{" "}
        <Suspense fallback={<span aria-hidden="true">…</span>}>
          <SiteCopyrightYear />
        </Suspense>
      </p>
    </SiteFrame>
  );

  const main = (
    <main
      id="main-content"
      className={cn(
        "home-main min-h-0 min-w-0",
        useLayoutGrid
          ? "h-full overflow-x-clip"
          : "flex-1 overflow-x-clip px-2",
        mainClassName,
      )}
    >
      {children}
    </main>
  );

  const footer = showFooter ? (
    <footer className="overflow-x-clip pb-[env(safe-area-inset-bottom)]">
      {footerInner}
    </footer>
  ) : null;

  return (
    <div
      className={cn(
        "group/layout home-page relative isolate flex min-h-svh max-w-screen flex-col overflow-x-clip bg-background text-foreground",
        className,
      )}
    >
      <Suspense fallback={null}>
        <SiteScrollToTop />
      </Suspense>
      <a href="#main-content" className="home-skip home-focus">
        无障碍:跳到主要内容
      </a>

      {useLayoutGrid ? (
        <SiteLayoutGrid
          className="min-h-0 flex-1"
          header={header}
          main={main}
          footer={footer}
          headerLeft={headerAsideLeft}
          headerRight={headerAsideRight}
          mainLeft={mainAsideLeft}
          mainRight={mainAsideRight}
          footerLeft={footerAsideLeft}
          footerRight={footerAsideRight}
        />
      ) : (
        <>
          {header}
          {main}
          {footer}
        </>
      )}
    </div>
  );
}
