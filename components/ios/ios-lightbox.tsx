"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useGesture } from "@use-gesture/react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import { IosBarButton } from "@/components/ios/ios-bar-button";
import { IosGlass } from "@/components/ios/ios-glass";
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";

import "./ios-lightbox.css";

export type IosLightboxImage = {
  src?: string;
  svgHtml?: string;
  alt?: string;
};

export type IosLightboxProps = {
  images: IosLightboxImage[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  label?: string;
};

type LightboxViewerHandle = {
  close: (onDone: () => void) => void;
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2;
const ZOOM_SNAP = 0.04;
const WHEEL_ZOOM_SPEED = 0.0012;
const WHEEL_ZOOM_SPEED_PINCH = 0.002;
const WHEEL_DELTA_LIMIT = 120;
const ZOOM_DURATION = 0.22;
const TAP_DELAY = 260;
const EXIT_FADE = 0.26;
const EXIT_FLY = 0.45;
const PULL_DISTANCE = 120;
const PULL_VELOCITY = 0.55;
const SWIPE_VELOCITY = 0.5;
const CHROME_FADE = 180;
const RUBBER = 0.32;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function IosLightbox({
  images,
  index,
  open,
  onOpenChange,
  onIndexChange,
  label = "图片查看",
}: IosLightboxProps) {
  const viewerRef = React.useRef<LightboxViewerHandle | null>(null);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        onOpenChange(true);
        return;
      }
      const viewer = viewerRef.current;
      if (!viewer) {
        onOpenChange(false);
        return;
      }
      viewer.close(() => onOpenChange(false));
    },
    [onOpenChange],
  );

  if (images.length === 0) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          aria-modal="true"
          aria-label={label}
          initialFocus={false}
          tabIndex={-1}
          className="safe-areas fixed inset-0 z-[70] overflow-hidden overscroll-none outline-none select-none data-closed:pointer-events-none"
        >
          <LightboxViewer
            ref={viewerRef}
            images={images}
            index={index}
            onIndexChange={onIndexChange}
            onRequestClose={() => onOpenChange(false)}
          />
          <DialogPrimitive.Close className="sr-only">
            关闭图片查看
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function LightboxViewer({
  images,
  index,
  onIndexChange,
  onRequestClose,
  ref,
}: {
  images: IosLightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onRequestClose: () => void;
  ref?: React.Ref<LightboxViewerHandle>;
}) {
  const reduce = useReducedMotion() ?? false;

  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const mediaRef = React.useRef<HTMLElement | null>(null);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const thumbsRef = React.useRef<HTMLDivElement | null>(null);
  const thumbRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const stageSizeRef = React.useRef({ w: 0, h: 0 });
  const imgBoxRef = React.useRef({ w: 0, h: 0 });
  const frameBoxRef = React.useRef({ w: 0, h: 0 });
  const safeOffsetRef = React.useRef({ x: 0, y: 0 });
  const dragBase = React.useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const moveSample = React.useRef({ t: 0, x: 0, y: 0, vx: 0, vy: 0 });
  const pinchBase = React.useRef({ k: 1, tx: 0, ty: 0, dx: 0, dy: 0 });
  const indexRef = React.useRef(index);
  const committedRef = React.useRef<number | null>(null);
  const pendingSlide = React.useRef<{ pre: number } | { fade: true } | null>(
    null,
  );
  const slideAnim = React.useRef<{ stop: () => void } | null>(null);
  const closingRef = React.useRef(false);
  const tapTimer = React.useRef<number | null>(null);
  const lastTap = React.useRef(0);
  const zoomAnims = React.useRef<{ stop: () => void }[]>([]);
  const stopZoomAnims = React.useCallback(() => {
    for (const anim of zoomAnims.current) anim.stop();
    zoomAnims.current = [];
  }, []);

  const settleAnims = React.useRef<{ stop: () => void }[]>([]);
  const stopSettleAnims = () => {
    for (const anim of settleAnims.current) anim.stop();
    settleAnims.current = [];
  };

  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const scale = useMotionValue(1);
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const glass = useMotionValue(0);
  const chromeMul = useMotionValue(0);
  const stageOpacity = useMotionValue(0);
  const stageScale = useMotionValue(0.96);

  const [chromeOn, setChromeOn] = React.useState(true);

  const chromeOpacity = useTransform(
    [chromeMul, dy],
    ([mul, offset]: number[]) =>
      mul * (1 - Math.min(Math.abs(offset) / CHROME_FADE, 1) * 0.65),
  );

  React.useLayoutEffect(() => {
    indexRef.current = index;
    committedRef.current = null;
  }, [index]);

  const currentIndex = () => committedRef.current ?? indexRef.current;

  const mounted = React.useRef(false);
  React.useEffect(() => {
    const zoom = reduce ? { duration: 0 } : { ...SPRING_PANEL };
    animate(glass, 1, {
      duration: reduce ? 0 : 0.3,
      ease: EASE_OUT,
    });
    animate(stageOpacity, 1, { duration: reduce ? 0 : 0.22, ease: EASE_OUT });
    animate(stageScale, 1, zoom);
    mounted.current = true;
  }, [reduce, glass, stageOpacity, stageScale]);

  React.useEffect(() => {
    animate(chromeMul, chromeOn ? 1 : 0, {
      duration: reduce ? 0 : 0.22,
      delay: chromeOn && mounted.current ? 0.06 : 0,
      ease: EASE_OUT,
    });
  }, [chromeOn, reduce, chromeMul]);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      stageSizeRef.current = { w: el.clientWidth, h: el.clientHeight };
      const frame = frameRef.current;
      if (frame) {
        frameBoxRef.current = { w: frame.clientWidth, h: frame.clientHeight };
      }
      const slot = el.querySelector<HTMLElement>(".ios-lightbox-slot");
      if (slot) {
        const cs = getComputedStyle(slot);
        safeOffsetRef.current = {
          x: (parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / 2,
          y: (parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / 2,
        };
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    stopZoomAnims();
    scale.set(1);
    tx.set(0);
    ty.set(0);
    const pending = pendingSlide.current;
    pendingSlide.current = null;
    if (pending && "fade" in pending) {
      dx.set(0);
      stageOpacity.set(0);
      animate(stageOpacity, 1, { duration: reduce ? 0 : 0.2, ease: EASE_OUT });
      return;
    }
    if (pending) {
      dx.set(pending.pre);
      slideAnim.current = animate(dx, 0, {
        duration: reduce ? 0 : 0.26,
        ease: EASE_OUT,
      });
      return;
    }
    dx.set(0);
  }, [index, dx, scale, tx, ty, stageOpacity, reduce, stopZoomAnims]);

  React.useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = thumbRefs.current[index];
    if (!strip || !thumb) return;
    strip.scrollTo({
      left:
        thumb.offsetLeft -
        strip.offsetLeft -
        (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [index, reduce]);

  React.useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return;
    const onWheel = (event: WheelEvent) => {
      if (strip.scrollWidth <= strip.clientWidth) return;
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? strip.clientWidth
            : 1;
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      strip.scrollLeft += delta * unit;
    };
    strip.addEventListener("wheel", onWheel, { passive: false });
    return () => strip.removeEventListener("wheel", onWheel);
  }, [images.length]);

  const stageWidth = () => stageSizeRef.current.w || window.innerWidth || 1;
  const stageHeight = () => stageSizeRef.current.h || window.innerHeight || 1;

  const panBounds = (k: number) => {
    const img = imgBoxRef.current;
    const frame = frameBoxRef.current;
    return {
      x: Math.max(0, (k * img.w - frame.w) / 2),
      y: Math.max(0, (k * img.h - frame.h) / 2),
    };
  };

  const focalPoint = (px: number, py: number) => {
    const safe = safeOffsetRef.current;
    return {
      x: px - (stageSizeRef.current.w / 2 + safe.x + dx.get()),
      y: py - (stageSizeRef.current.h / 2 + safe.y + dy.get()),
    };
  };

  const focalShift = (
    p: { x: number; y: number },
    t0: { x: number; y: number },
    k0: number,
    k1: number,
  ) => ({
    x: p.x - (k1 / k0) * (p.x - t0.x),
    y: p.y - (k1 / k0) * (p.y - t0.y),
  });

  const springBack = () => (reduce ? { duration: 0 } : { ...SPRING_PANEL });

  const sampleMove = (mx: number, my: number) => {
    const now = performance.now();
    const sample = moveSample.current;
    const dt = now - sample.t;
    if (dt <= 0) return;
    if (mx !== sample.x) sample.vx = (mx - sample.x) / dt;
    if (my !== sample.y) sample.vy = (my - sample.y) / dt;
    sample.t = now;
    sample.x = mx;
    sample.y = my;
  };

  const flickVelocity = (axis: "x" | "y", v: number) => {
    const sample = moveSample.current;
    const measured =
      performance.now() - sample.t > 80
        ? 0
        : axis === "x"
          ? sample.vx
          : sample.vy;
    return Math.abs(v) > Math.abs(measured) ? v : measured;
  };

  const setPull = (damped: number) => {
    dy.set(damped);
    glass.set(clamp(1 - Math.abs(damped) / (PULL_DISTANCE * 2.2), 0.15, 1));
  };

  const stepZoom = (px: number, py: number, factor: number) => {
    const k0 = scale.get();
    const k1 = clamp(k0 * factor, MIN_SCALE, MAX_SCALE);
    if (Math.abs(k1 - k0) < 0.001) return;
    const target = focalShift(
      focalPoint(px, py),
      { x: tx.get(), y: ty.get() },
      k0,
      k1,
    );
    const bounds = panBounds(k1);
    const transition = { duration: reduce ? 0 : ZOOM_DURATION, ease: EASE_OUT };
    stopZoomAnims();
    zoomAnims.current = [
      animate(scale, k1, transition),
      animate(tx, clamp(target.x, -bounds.x, bounds.x), transition),
      animate(ty, clamp(target.y, -bounds.y, bounds.y), transition),
    ];
  };

  const stepZoomRef = React.useRef(stepZoom);
  React.useEffect(() => {
    stepZoomRef.current = stepZoom;
  });
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      const delta = clamp(
        event.deltaY * unit,
        -WHEEL_DELTA_LIMIT,
        WHEEL_DELTA_LIMIT,
      );
      const speed = event.ctrlKey ? WHEEL_ZOOM_SPEED_PINCH : WHEEL_ZOOM_SPEED;
      stepZoomRef.current(
        event.clientX,
        event.clientY,
        Math.exp(-delta * speed),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const runExit = React.useCallback(
    (onDone: () => void, dir: 0 | 1 | -1 = 0) => {
      if (closingRef.current) return;
      closingRef.current = true;
      const transition = {
        duration: reduce ? 0 : dir === 0 ? EXIT_FADE : EXIT_FLY,
        ease: EASE_OUT,
      };
      animate(
        dy,
        dir === 0 ? dy.get() + 24 : dir * (stageHeight() + 80),
        transition,
      );
      if (dir === 0) animate(stageScale, 0.94, transition);
      void Promise.all([
        animate(glass, 0, transition),
        animate(chromeMul, 0, transition),
        animate(stageOpacity, 0, transition),
      ]).then(onDone);
    },
    [reduce, dy, glass, chromeMul, stageOpacity, stageScale],
  );

  React.useImperativeHandle(
    ref,
    () => ({ close: (onDone: () => void) => runExit(onDone, 0) }),
    [runExit],
  );

  const commit = (dir: 1 | -1, from?: number) => {
    const target = currentIndex() + dir;
    if (target < 0 || target >= images.length) return;
    slideAnim.current?.stop();
    slideAnim.current = null;
    stopSettleAnims();
    committedRef.current = target;
    pendingSlide.current = reduce
      ? null
      : { pre: (from ?? dx.get()) + dir * stageWidth() };
    onIndexChange(target);
  };

  const goTo = (next: number) => {
    const current = currentIndex();
    if (next < 0 || next >= images.length || next === current) return;
    if (Math.abs(next - current) === 1) {
      commit(next > current ? 1 : -1);
      return;
    }
    slideAnim.current?.stop();
    slideAnim.current = null;
    stopSettleAnims();
    committedRef.current = next;
    pendingSlide.current = reduce ? null : { fade: true };
    onIndexChange(next);
  };

  const toggleZoom = (px: number, py: number) => {
    const transition = { duration: reduce ? 0 : 0.3, ease: EASE_OUT };
    stopZoomAnims();
    if (Math.abs(scale.get() - 1) > 0.01) {
      animate(scale, 1, transition);
      animate(tx, 0, transition);
      animate(ty, 0, transition);
      return;
    }
    const k = DOUBLE_TAP_SCALE;
    const p = focalPoint(px, py);
    const next = focalShift(p, { x: 0, y: 0 }, 1, k);
    const bounds = panBounds(k);
    animate(scale, k, transition);
    animate(tx, clamp(next.x, -bounds.x, bounds.x), transition);
    animate(ty, clamp(next.y, -bounds.y, bounds.y), transition);
  };

  const handleTap = (px: number, py: number) => {
    const now = performance.now();
    if (now - lastTap.current < TAP_DELAY) {
      lastTap.current = 0;
      if (tapTimer.current !== null) {
        window.clearTimeout(tapTimer.current);
        tapTimer.current = null;
      }
      toggleZoom(px, py);
      return;
    }
    lastTap.current = now;
    if (tapTimer.current !== null) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      setChromeOn((visible) => !visible);
    }, TAP_DELAY);
  };

  const settle = (vx: number, vy: number) => {
    const zoomed = scale.get() > 1.01;

    const pull = dy.get();
    const vPull = flickVelocity("y", vy);
    if (pull > PULL_DISTANCE || (pull > 0 && vPull > PULL_VELOCITY)) {
      runExit(onRequestClose, 1);
      return;
    }
    if (pull < -PULL_DISTANCE || (pull < 0 && vPull < -PULL_VELOCITY)) {
      runExit(onRequestClose, -1);
      return;
    }

    const slide = dx.get();
    const vSlide = flickVelocity("x", vx);
    const threshold = Math.min(stageWidth() * 0.3, 140);
    if (
      currentIndex() < images.length - 1 &&
      (slide < -threshold || (slide < 0 && vSlide < -SWIPE_VELOCITY))
    ) {
      commit(1, slide);
      return;
    }
    if (
      currentIndex() > 0 &&
      (slide > threshold || (slide > 0 && vSlide > SWIPE_VELOCITY))
    ) {
      commit(-1, slide);
      return;
    }

    if (zoomed) {
      const bounds = panBounds(scale.get());
      stopSettleAnims();
      settleAnims.current = [
        animate(tx, clamp(tx.get(), -bounds.x, bounds.x), springBack()),
        animate(ty, clamp(ty.get(), -bounds.y, bounds.y), springBack()),
        animate(dx, 0, springBack()),
        animate(dy, 0, springBack()),
      ];
      if (pull !== 0) {
        settleAnims.current.push(
          animate(glass, 1, { duration: reduce ? 0 : 0.22, ease: EASE_OUT }),
        );
      }
      return;
    }

    stopSettleAnims();
    settleAnims.current = [
      animate(dx, 0, springBack()),
      animate(dy, 0, springBack()),
    ];
    if (pull !== 0) {
      settleAnims.current.push(
        animate(glass, 1, { duration: reduce ? 0 : 0.22, ease: EASE_OUT }),
      );
    }
  };

  useGesture(
    {
      onDrag: (state) => {
        if (closingRef.current) return;
        const {
          first,
          last,
          tap,
          pinching,
          touches,
          axis,
          movement: [mx, my],
          velocity: [vx, vy],
          direction: [dirX, dirY],
          xy: [px, py],
        } = state;

        if (tap) {
          handleTap(px, py);
          return;
        }

        if (pinching || touches > 1) {
          dragBase.current = {
            x: dx.get() - mx,
            y: dy.get() - my,
            tx: tx.get(),
            ty: ty.get(),
          };
          return;
        }

        if (first) {
          slideAnim.current?.stop();
          slideAnim.current = null;
          stopSettleAnims();
          stopZoomAnims();
          dragBase.current = {
            x: dx.get(),
            y: dy.get(),
            tx: tx.get(),
            ty: ty.get(),
          };
          moveSample.current = {
            t: performance.now(),
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
          };
          imgBoxRef.current = {
            w: mediaRef.current?.clientWidth ?? 0,
            h: mediaRef.current?.clientHeight ?? 0,
          };
          return;
        }

        if (last) {
          settle(vx * dirX, vy * dirY);
          return;
        }

        sampleMove(mx, my);

        if (scale.get() > 1.01) {
          const bounds = panBounds(scale.get());
          const rawX = dragBase.current.tx + mx;
          const rawY = dragBase.current.ty + my;
          const nextX = clamp(rawX, -bounds.x, bounds.x);
          const nextY = clamp(rawY, -bounds.y, bounds.y);
          tx.set(nextX);
          ty.set(nextY);
          const overX = rawX - nextX;
          if (overX !== 0) {
            const atStart = currentIndex() <= 0;
            const atEnd = currentIndex() >= images.length - 1;
            let offset = overX;
            if ((atStart && offset > 0) || (atEnd && offset < 0)) {
              offset *= RUBBER;
            } else {
              offset = clamp(offset, -stageWidth(), stageWidth());
            }
            dx.set(offset);
          } else if (dx.get() !== 0) {
            dx.set(0);
          }
          const overY = rawY - nextY;
          if (overY !== 0) {
            setPull(overY > 0 ? overY : overY * RUBBER);
          } else if (dy.get() !== 0) {
            setPull(0);
          }
          return;
        }

        if (axis === "x") {
          let offset = dragBase.current.x + mx;
          const atStart = currentIndex() <= 0;
          const atEnd = currentIndex() >= images.length - 1;
          if ((atStart && offset > 0) || (atEnd && offset < 0)) {
            offset *= RUBBER;
          } else {
            offset = clamp(offset, -stageWidth(), stageWidth());
          }
          dx.set(offset);
          return;
        }

        if (axis === "y") {
          const raw = dragBase.current.y + my;
          setPull(raw < 0 ? raw * RUBBER : raw);
        }
      },

      onPinch: (state) => {
        if (closingRef.current) return;
        const {
          first,
          last,
          offset: [nextScale],
          origin: [ox, oy],
        } = state;

        if (first) {
          slideAnim.current?.stop();
          slideAnim.current = null;
          stopSettleAnims();
          stopZoomAnims();
          pinchBase.current = {
            k: scale.get(),
            tx: tx.get(),
            ty: ty.get(),
            dx: dx.get(),
            dy: dy.get(),
          };
          imgBoxRef.current = {
            w: mediaRef.current?.clientWidth ?? 0,
            h: mediaRef.current?.clientHeight ?? 0,
          };
        }

        const base = pinchBase.current;
        const k = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        const safe = safeOffsetRef.current;
        const p = {
          x: ox - (stageSizeRef.current.w / 2 + safe.x + base.dx),
          y: oy - (stageSizeRef.current.h / 2 + safe.y + base.dy),
        };
        const t1 = focalShift(p, { x: base.tx, y: base.ty }, base.k, k);
        const bounds = panBounds(k);
        scale.set(k);
        tx.set(clamp(t1.x, -bounds.x, bounds.x));
        ty.set(clamp(t1.y, -bounds.y, bounds.y));

        if (last) {
          if (Math.abs(k - 1) < ZOOM_SNAP) {
            animate(scale, 1, springBack());
          }
          animate(tx, clamp(tx.get(), -bounds.x, bounds.x), springBack());
          animate(ty, clamp(ty.get(), -bounds.y, bounds.y), springBack());
        }
      },
    },
    {
      target: stageRef,
      drag: {
        axis: "lock",
        filterTaps: true,
        tapsThreshold: 4,
        axisThreshold: { touch: 8, pen: 8 },
      },
      pinch: {
        axis: "lock",
        threshold: 0,
        scaleBounds: { min: MIN_SCALE, max: MAX_SCALE },
        from: () => [scale.get(), 0],
        pinchOnWheel: false,
      },
    },
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex() - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex() + 1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        runExit(onRequestClose, 0);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointerEvents = chromeOn
    ? "pointer-events-auto"
    : "pointer-events-none";

  return (
    <>
      <motion.div
        aria-hidden
        className="ios-lightbox-blur absolute inset-0"
        style={{ opacity: glass }}
      />
      <motion.div
        aria-hidden
        className="ios-lightbox-veil absolute inset-0"
        style={{ opacity: glass }}
      />

      <div ref={stageRef} className="ios-lightbox-stage absolute inset-0 z-10">
        <motion.div
          className="ios-lightbox-track"
          style={{ x: dx, y: dy, opacity: stageOpacity, scale: stageScale }}
        >
          {[index - 1, index, index + 1].map((slot, k) => {
            const image = images[slot];
            const transform = k === 1 ? { scale, x: tx, y: ty } : undefined;
            return (
              <div key={k} className="ios-lightbox-slot">
                {image ? (
                  <div
                    ref={k === 1 ? frameRef : undefined}
                    className="ios-lightbox-frame"
                  >
                    {image.svgHtml ? (
                      <motion.div
                        ref={
                          k === 1
                            ? (el) => {
                                mediaRef.current = el;
                              }
                            : undefined
                        }
                        role="img"
                        aria-label={
                          k === 1 ? (image.alt ?? "Mermaid 图") : undefined
                        }
                        aria-hidden={k !== 1 || undefined}
                        className="ios-lightbox-svg-host ios-lightbox-pele"
                        style={transform}
                        dangerouslySetInnerHTML={{ __html: image.svgHtml }}
                      />
                    ) : (
                      <motion.img
                        ref={
                          k === 1
                            ? (el) => {
                                mediaRef.current = el;
                              }
                            : undefined
                        }
                        src={image.src}
                        alt={k === 1 ? (image.alt ?? "") : ""}
                        aria-hidden={k !== 1 || undefined}
                        draggable={false}
                        className="ios-lightbox-img"
                        style={transform}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </motion.div>
      </div>

      <motion.div
        aria-hidden={!chromeOn}
        className="pointer-events-none absolute inset-0 z-20 text-black dark:text-white"
        style={{ opacity: chromeOpacity }}
      >
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-safe-4">
          <IosGlass
            className={cn("ios-lightbox-chrome", pointerEvents)}
            interactive
          >
            <IosBarButton
              icon={<XIcon className="ios-bar-button-icon" aria-hidden />}
              label="关闭图片查看"
              onClick={() => runExit(onRequestClose, 0)}
              className="ios-bar-button-in-glass"
            />
          </IosGlass>
          <IosGlass className="pointer-events-none flex h-9 items-center justify-center rounded-full px-3">
            <span
              aria-live="polite"
              className="text-[0.8125rem] font-medium tabular-nums"
            >
              {index + 1} / {images.length}
            </span>
          </IosGlass>
          <span className="size-11" aria-hidden />
        </div>

        <IosGlass
          className={cn(
            "ios-lightbox-chrome ios-lightbox-arrow left-3",
            pointerEvents,
          )}
        >
          <IosBarButton
            icon={
              <ChevronLeftIcon className="ios-bar-button-icon" aria-hidden />
            }
            label="上一张"
            aria-disabled={index <= 0 || undefined}
            onClick={() => goTo(index - 1)}
            className="ios-bar-button-in-glass"
          />
        </IosGlass>
        <IosGlass
          className={cn(
            "ios-lightbox-chrome ios-lightbox-arrow right-3",
            pointerEvents,
          )}
        >
          <IosBarButton
            icon={
              <ChevronRightIcon className="ios-bar-button-icon" aria-hidden />
            }
            label="下一张"
            aria-disabled={index >= images.length - 1 || undefined}
            onClick={() => goTo(index + 1)}
            className="ios-bar-button-in-glass"
          />
        </IosGlass>

        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-safe-4">
            <IosGlass
              ref={thumbsRef}
              radius="none"
              className={cn(
                "ios-lightbox-thumbs no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto px-3 py-1.5",
                pointerEvents,
              )}
            >
              {images.map((image, i) => (
                <button
                  key={image.src ? `${image.src}-${i}` : `svg-${i}`}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`第 ${i + 1} 张`}
                  aria-current={i === index}
                  className={cn(
                    "ios-lightbox-thumb",
                    i === index && "is-active",
                    pointerEvents,
                  )}
                >
                  {image.svgHtml ? (
                    <span
                      className="ios-lightbox-thumb-svg ios-lightbox-pele"
                      aria-hidden
                      dangerouslySetInnerHTML={{ __html: image.svgHtml }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.src} alt="" draggable={false} />
                  )}
                </button>
              ))}
            </IosGlass>
          </div>
        ) : null}
      </motion.div>
    </>
  );
}
