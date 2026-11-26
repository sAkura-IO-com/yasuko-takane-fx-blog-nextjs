import type { ReactNode } from "react";

import { SiteFrame, type SiteFrameWidth } from "@/components/site/site-frame";

type AdminPageFrameProps = {
  children: ReactNode;
  width?: SiteFrameWidth;
  fullBleed?: boolean;
};

export function AdminPageFrame({
  children,
  width = "default",
  fullBleed = false,
}: AdminPageFrameProps) {
  const isEditor = width === "editor";

  if (isEditor && fullBleed) {
    return (
      <div className="flex min-w-0 flex-1 flex-col md:min-h-0 md:overflow-hidden">
        <SiteFrame
          width="editor"
          border={false}
          className="admin-editor-frame-inner flex min-w-0 flex-1 flex-col !px-0 py-2 sm:py-3 md:min-h-0 md:overflow-hidden"
        >
          {children}
        </SiteFrame>
      </div>
    );
  }

  return <div className="home-shell home-main-inner">{children}</div>;
}
