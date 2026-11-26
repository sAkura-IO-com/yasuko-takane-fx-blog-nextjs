"use client";

import * as React from "react";

import { usePeleDiagrams } from "@/components/blog/use-pele-diagrams";
import { cn } from "@/lib/utils";

export function MarkdownBody({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const articleRef = React.useRef<HTMLElement | null>(null);
  usePeleDiagrams(articleRef, html);

  if (!html) return null;
  return (
    <article
      ref={articleRef}
      className={cn("ios-md", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
