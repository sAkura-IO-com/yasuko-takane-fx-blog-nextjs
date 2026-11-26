"use client";

import { useEffect } from "react";

export function DisableLinkDrag() {
  useEffect(() => {
    const onDragStart = (event: DragEvent) => {
      const target = event.target;
      if (target instanceof HTMLAnchorElement) {
        event.preventDefault();
      }
    };

    document.addEventListener("dragstart", onDragStart, true);
    return () => document.removeEventListener("dragstart", onDragStart, true);
  }, []);

  return null;
}
