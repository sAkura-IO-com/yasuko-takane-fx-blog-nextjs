"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { fxCopy } from "@/lib/fx/copy";

const ICONS = {
  light: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  dark: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  ),
  system: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
} as const;

const OPTIONS = [
  { value: "light", label: fxCopy.light, icon: ICONS.light },
  { value: "dark", label: fxCopy.dark, icon: ICONS.dark },
  { value: "system", label: fxCopy.system, icon: ICONS.system },
] as const;

export function FxThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="fx-theme-toggle"
      role="group"
      aria-label={fxCopy.colorTheme}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="fx-theme-btn"
          aria-label={option.label}
          aria-pressed={mounted ? theme === option.value : undefined}
          onClick={() => setTheme(option.value)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
