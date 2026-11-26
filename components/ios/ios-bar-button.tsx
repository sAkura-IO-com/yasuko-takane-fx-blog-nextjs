"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const barButtonClasses =
  "ios-bar-button inline-flex aspect-square h-full max-h-12 cursor-pointer items-center justify-center gap-1 rounded-full transition-opacity duration-300 outline-none select-none active:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

export function IosBarButton({
  icon,
  label,
  href,
  onClick,
  className,
  children,
  ...rest
}: {
  icon?: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
} & Pick<
  ComponentProps<"button">,
  "aria-expanded" | "aria-controls" | "aria-haspopup" | "aria-disabled"
>) {
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(barButtonClasses, className)}
        aria-label={label}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(barButtonClasses, className)}
      aria-label={label}
      {...rest}
    >
      {content}
    </button>
  );
}
