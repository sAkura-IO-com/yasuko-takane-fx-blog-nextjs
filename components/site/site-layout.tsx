import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SiteLayoutGridProps = {
  header: ReactNode;
  main: ReactNode;
  footer?: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  mainLeft?: ReactNode;
  mainRight?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  className?: string;
};

function LayoutGutter({
  side,
  row,
  children,
  label,
}: {
  side: "left" | "right";
  row: "header" | "main" | "footer";
  children?: ReactNode;
  label?: string;
}) {
  return (
    <aside
      className={cn(
        "site-layout-gutter",
        side === "left"
          ? "site-layout-gutter-left"
          : "site-layout-gutter-right",
        `site-layout-gutter-${row}-${side}`,
      )}
      aria-label={label}
    >
      {children}
    </aside>
  );
}

export function SiteLayoutColumnFrame() {
  return (
    <div
      className="site-layout-column-frame pointer-events-none"
      aria-hidden="true"
    />
  );
}

export function SiteLayoutGrid({
  header,
  main,
  footer,
  headerLeft,
  headerRight,
  mainLeft,
  mainRight,
  footerLeft,
  footerRight,
  className,
}: SiteLayoutGridProps) {
  const showFooter = footer != null;

  return (
    <>
      <SiteLayoutColumnFrame />
      <div
        className={cn(
          "site-layout-grid",
          !showFooter && "site-layout-grid--no-footer",
          className,
        )}
      >
        <LayoutGutter
          side="left"
          row="header"
          label={headerLeft ? "页眉左侧区域" : undefined}
        >
          {headerLeft}
        </LayoutGutter>
        <div className="site-layout-header-center min-w-0">{header}</div>
        <LayoutGutter
          side="right"
          row="header"
          label={headerRight ? "页眉右侧区域" : undefined}
        >
          {headerRight}
        </LayoutGutter>

        <LayoutGutter
          side="left"
          row="main"
          label={mainLeft ? "内容左侧区域" : undefined}
        >
          {mainLeft}
        </LayoutGutter>
        <div className="site-layout-main-center min-h-0 min-w-0 overflow-x-clip">
          {main}
        </div>
        <LayoutGutter
          side="right"
          row="main"
          label={mainRight ? "内容右侧区域" : undefined}
        >
          {mainRight}
        </LayoutGutter>

        {showFooter ? (
          <>
            <LayoutGutter
              side="left"
              row="footer"
              label={footerLeft ? "页脚左侧区域" : undefined}
            >
              {footerLeft}
            </LayoutGutter>
            <div className="site-layout-footer-center min-w-0">{footer}</div>
            <LayoutGutter
              side="right"
              row="footer"
              label={footerRight ? "页脚右侧区域" : undefined}
            >
              {footerRight}
            </LayoutGutter>
          </>
        ) : null}
      </div>
    </>
  );
}
