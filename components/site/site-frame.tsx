import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SiteFrameWidth = "default" | "editor";

type SiteFrameProps = {
  children: ReactNode;
  className?: string;
  screenLines?: "none" | "top" | "bottom" | "both";
  width?: SiteFrameWidth;
  border?: boolean;
};

export function SiteFrame({
  children,
  className,
  screenLines = "none",
  width = "default",
  border = true,
}: SiteFrameProps) {
  return (
    <div
      className={cn(
        "site-frame w-full",
        width === "editor"
          ? "max-w-none border-x-0"
          : border
            ? "mx-auto max-w-3xl border-x border-border"
            : undefined,
        screenLines === "top" && "site-screen-line-top",
        screenLines === "bottom" && "site-screen-line-bottom",
        screenLines === "both" &&
          "site-screen-line-top site-screen-line-bottom",
        className,
      )}
    >
      {children}
    </div>
  );
}
