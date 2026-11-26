"use client";

import { useEffect } from "react";

import { preloadMonaco } from "@/lib/monaco/loader";

export function MonacoPreload() {
  useEffect(() => {
    preloadMonaco();
  }, []);
  return null;
}
