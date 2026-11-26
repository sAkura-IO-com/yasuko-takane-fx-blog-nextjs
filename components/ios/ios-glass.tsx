"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import "./ios-glass.css";

const iosGlassVariants = cva("ios-glass", {
  variants: {
    variant: {
      regular: "",
      clear: "ios-glass-clear",
    },
    radius: {
      none: "rounded-none",
      sm: "rounded-lg",
      md: "rounded-xl",
      lg: "rounded-2xl",
      capsule: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "regular",
    radius: "capsule",
  },
});

export type IosGlassProps = React.ComponentProps<"div"> &
  VariantProps<typeof iosGlassVariants> & {
    interactive?: boolean;
  };

export function trackGlassPointer(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--ios-glass-pointer-x",
    `${event.clientX - rect.left}px`,
  );
  event.currentTarget.style.setProperty(
    "--ios-glass-pointer-y",
    `${event.clientY - rect.top}px`,
  );
}

function applyTouchPress(event: React.PointerEvent<HTMLDivElement>) {
  if (event.pointerType === "mouse") return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.dataset.touchPressed = "";
  event.currentTarget.dataset.touchScale =
    rect.width > 60 || rect.height > 60 ? "large" : "small";
}

function releaseTouchPress(event: React.PointerEvent<HTMLDivElement>) {
  delete event.currentTarget.dataset.touchPressed;
  delete event.currentTarget.dataset.touchScale;
}

export function IosGlass({
  className,
  variant,
  radius,
  interactive = false,
  onPointerEnter,
  onPointerDown,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  ...props
}: IosGlassProps) {
  return (
    <div
      data-slot="ios-glass"
      data-variant={variant ?? "regular"}
      className={cn(
        iosGlassVariants({ variant, radius }),
        interactive && "ios-glass-interactive",
        className,
      )}
      onPointerEnter={
        interactive
          ? (event) => {
              applyTouchPress(event);
              trackGlassPointer(event);
              onPointerEnter?.(event);
            }
          : onPointerEnter
      }
      onPointerDown={
        interactive
          ? (event) => {
              applyTouchPress(event);
              onPointerDown?.(event);
            }
          : onPointerDown
      }
      onPointerMove={
        interactive
          ? (event) => {
              trackGlassPointer(event);
              onPointerMove?.(event);
            }
          : onPointerMove
      }
      onPointerLeave={
        interactive
          ? (event) => {
              releaseTouchPress(event);
              onPointerLeave?.(event);
            }
          : onPointerLeave
      }
      onPointerCancel={
        interactive
          ? (event) => {
              releaseTouchPress(event);
              onPointerCancel?.(event);
            }
          : onPointerCancel
      }
      {...props}
    />
  );
}
