"use client";

import { useSyncExternalStore } from "react";

function subscribeMinWidth(minWidth: number, onChange: () => void) {
  const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMinWidthSnapshot(minWidth: number) {
  return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
}

export function useMinWidth(minWidth: number, serverDefault = true) {
  return useSyncExternalStore(
    (onChange) => subscribeMinWidth(minWidth, onChange),
    () => getMinWidthSnapshot(minWidth),
    () => serverDefault,
  );
}
