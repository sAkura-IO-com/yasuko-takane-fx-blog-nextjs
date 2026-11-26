"use client";

import { useEffect, useRef, useState } from "react";

import { fxCopy } from "@/lib/fx/copy";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FxDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1100px)");
    const sync = () => {
      drawerRef.current?.toggleAttribute("inert", !media.matches && !open);
      if (media.matches && open) setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [open]);

  useEffect(() => {
    if (open) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      document.documentElement.classList.add("fx-drawer-open");
      requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      document.documentElement.classList.remove("fx-drawer-open");
      previousFocus.current?.focus();
    }
    return () => document.documentElement.classList.remove("fx-drawer-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = [
        ...drawer.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="fx-drawer-toggle"
        aria-controls="fx-sidebar-drawer"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={fxCopy.openSidebar}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
          aria-hidden="true"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      <div
        ref={drawerRef}
        id="fx-sidebar-drawer"
        className="fx-drawer"
        data-open={open ? "true" : "false"}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-labelledby="fx-sidebar-title"
      >
        <div className="fx-drawer-head">
          <span id="fx-sidebar-title" className="fx-drawer-head-title">
            {fxCopy.sidebar}
          </span>
          <button
            ref={closeRef}
            type="button"
            className="fx-drawer-close"
            aria-label={fxCopy.closeSidebar}
            onClick={() => setOpen(false)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        {children}
      </div>

      <div
        className="fx-backdrop"
        data-open={open ? "true" : "false"}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
    </>
  );
}
