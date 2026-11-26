"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollWindowToTop() {
  if (typeof window === "undefined") return;
  if (window.location.hash) return;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

export function SiteScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    scrollWindowToTop();
    const frame = requestAnimationFrame(() => scrollWindowToTop());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
