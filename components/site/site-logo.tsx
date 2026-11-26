import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { siteName } from "@/lib/site";

type SiteLogoProps = {
  className?: string;
  href?: string;
  children?: ReactNode;
};

export function SiteLogo({ className, href = "/", children }: SiteLogoProps) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={cn("site-logo home-focus shrink-0", className)}
      aria-label={`${siteName} 首页`}
    >
      {children ?? (
        <Image
          src="/icon-96.png"
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-[var(--radius-md)] object-cover"
          priority
          unoptimized
        />
      )}
    </Link>
  );
}
