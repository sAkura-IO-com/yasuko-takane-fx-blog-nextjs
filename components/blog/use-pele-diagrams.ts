"use client";

import * as React from "react";

import { hasPeleSvg, readPeleSource } from "@/lib/blog/pele-diagram-dom";

import "./pele-diagram.css";

export { hasPeleSvg, readPeleSource } from "@/lib/blog/pele-diagram-dom";

type PeleMounted = {
  destroy: () => void;
};

type PeleMountFn = (
  element: HTMLElement,
  text: string,
  options?: { onError?: (error: unknown) => void },
) => PeleMounted;

const ROOT_MARGIN = "280px 0px";
const MAX_CONCURRENT = 6;
const MAX_ALIVE = 16;

type Slot = {
  el: HTMLElement;
  source: string;
  mounted: PeleMounted | null;
  visible: boolean;
  queued: boolean;
  drawn: boolean;
  lastVisibleAt: number;
};

function scheduleYield(cb: () => void): number {
  return window.setTimeout(cb, 0) as unknown as number;
}

function cancelYield(id: number) {
  clearTimeout(id);
}

function showPlaceholder(el: HTMLElement) {
  el.classList.add("pele-diagram--pending");
  el.classList.remove("pele-diagram--mounted", "pele-diagram--error");
  el.replaceChildren();
  el.setAttribute("aria-busy", "true");
}

function showError(el: HTMLElement, message: string) {
  el.classList.remove("pele-diagram--pending", "pele-diagram--mounted");
  el.classList.add("pele-diagram--error");
  el.removeAttribute("aria-busy");
  el.replaceChildren();
  const err = el.ownerDocument.createElement("div");
  err.className = "pele-diagram-error";
  err.textContent = message;
  el.append(err);
}

function markMounted(el: HTMLElement) {
  el.classList.remove("pele-diagram--pending", "pele-diagram--error");
  el.classList.add("pele-diagram--mounted");
  el.removeAttribute("aria-busy");
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 160);
  }
  return "图表渲染失败";
}

export function usePeleDiagrams(
  rootRef: React.RefObject<HTMLElement | null>,
  html: string,
) {
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !html) return;

    let cancelled = false;
    let mountFn: PeleMountFn | null = null;
    let yieldHandle: number | null = null;
    const slots = new Map<HTMLElement, Slot>();
    const queue: HTMLElement[] = [];

    const releaseSlot = (slot: Slot, clearDom: boolean) => {
      if (slot.mounted) {
        try {
          slot.mounted.destroy();
        } catch {}
        slot.mounted = null;
      }
      if (clearDom) {
        slot.drawn = false;
        showPlaceholder(slot.el);
        return;
      }
      if (hasPeleSvg(slot.el)) {
        slot.drawn = true;
        markMounted(slot.el);
      }
    };

    const enforceAliveLimit = () => {
      const alive = [...slots.values()].filter((s) => s.mounted);
      if (alive.length <= MAX_ALIVE) return;

      const victims = alive
        .filter((s) => !s.visible)
        .sort((a, b) => a.lastVisibleAt - b.lastVisibleAt);
      const need = alive.length - MAX_ALIVE;
      for (let i = 0; i < need && i < victims.length; i++) {
        releaseSlot(victims[i]!, false);
      }

      const still = [...slots.values()].filter((s) => s.mounted);
      if (still.length <= MAX_ALIVE) return;
      still
        .sort((a, b) => a.lastVisibleAt - b.lastVisibleAt)
        .slice(0, still.length - MAX_ALIVE)
        .forEach((s) => releaseSlot(s, false));
    };

    const pump = () => {
      yieldHandle = null;
      if (cancelled || !mountFn) return;

      let processed = 0;
      while (processed < MAX_CONCURRENT && queue.length > 0) {
        const el = queue.shift()!;
        const slot = slots.get(el);
        if (!slot) continue;
        slot.queued = false;

        if (slot.mounted || slot.drawn || hasPeleSvg(el) || !slot.visible) {
          if (hasPeleSvg(el)) {
            slot.drawn = true;
            markMounted(el);
          }
          continue;
        }

        processed += 1;
        try {
          const mounted = mountFn(el, slot.source, {
            onError: () => {
              if (cancelled) return;
              slot.el.classList.remove("pele-diagram--pending");
              slot.el.classList.add("pele-diagram--error");
              slot.el.removeAttribute("aria-busy");
            },
          });
          if (cancelled) {
            mounted.destroy();
            continue;
          }
          slot.mounted = mounted;
          slot.drawn = true;
          markMounted(el);
          enforceAliveLimit();
        } catch (error) {
          if (!cancelled) {
            showError(el, errorMessage(error));
          }
        }
      }

      if (queue.length > 0) {
        yieldHandle = scheduleYield(pump);
      }
    };

    const enqueue = (el: HTMLElement) => {
      const slot = slots.get(el);
      if (!slot || slot.mounted || slot.drawn || slot.queued) return;
      if (hasPeleSvg(el)) {
        slot.drawn = true;
        markMounted(el);
        return;
      }
      slot.queued = true;
      queue.push(el);
      if (yieldHandle == null) {
        yieldHandle = scheduleYield(pump);
      }
    };

    const onIntersect: IntersectionObserverCallback = (entries) => {
      const now = Date.now();
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const slot = slots.get(el);
        if (!slot) continue;
        slot.visible = entry.isIntersecting;
        if (entry.isIntersecting) {
          slot.lastVisibleAt = now;
          enqueue(el);
        } else if (slot.mounted) {
          releaseSlot(slot, false);
          const qi = queue.indexOf(el);
          if (qi >= 0) {
            queue.splice(qi, 1);
            slot.queued = false;
          }
        } else if (slot.queued) {
          const qi = queue.indexOf(el);
          if (qi >= 0) {
            queue.splice(qi, 1);
            slot.queued = false;
          }
        }
      }
    };

    const observer = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: ROOT_MARGIN,
      threshold: 0,
    });

    const nodes = root.querySelectorAll<HTMLElement>("[data-pele-diagram]");
    let needsClientMount = false;
    for (const el of nodes) {
      if (hasPeleSvg(el)) {
        markMounted(el);
        continue;
      }

      const source = readPeleSource(el);
      if (!source) continue;

      needsClientMount = true;
      showPlaceholder(el);
      slots.set(el, {
        el,
        source,
        mounted: null,
        visible: false,
        queued: false,
        drawn: false,
        lastVisibleAt: 0,
      });
      observer.observe(el);
    }

    if (needsClientMount) {
      void import("pele")
        .then(({ mount }) => {
          if (cancelled) return;
          mountFn = mount;
          for (const slot of slots.values()) {
            if (slot.visible && !slot.mounted && !slot.drawn) enqueue(slot.el);
          }
        })
        .catch(() => {
          if (cancelled) return;
          for (const slot of slots.values()) {
            if (!slot.drawn) showError(slot.el, "图表库加载失败");
          }
        });
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      if (yieldHandle != null) cancelYield(yieldHandle);
      for (const slot of slots.values()) {
        if (slot.mounted) {
          try {
            slot.mounted.destroy();
          } catch {}
        }
      }
      slots.clear();
      queue.length = 0;
    };
  }, [rootRef, html]);
}
