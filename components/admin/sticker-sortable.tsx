"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SortableState = ReturnType<typeof useSortable>;

export type SortableHandleProps = Pick<
  SortableState,
  "attributes" | "listeners"
>;

export function SortableItem({
  id,
  disabled = false,
  className,
  role,
  children,
}: {
  id: string;
  disabled?: boolean;
  className?: string;
  role?: string;
  children: (state: SortableHandleProps & { isDragging: boolean }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      role={role}
      style={style}
      className={cn(isDragging && "relative z-20", className)}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}

export function SortableHandle({
  attributes,
  listeners,
  label,
  className,
}: SortableHandleProps & { label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/70 transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing",
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon className="size-3.5" />
    </button>
  );
}
