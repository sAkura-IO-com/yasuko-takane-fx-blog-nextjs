"use client";

import { PencilLineIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MediaMultiSelectButton({
  pressed,
  onPressedChange,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}) {
  return (
    <Button
      variant={pressed ? "default" : "outline"}
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
    >
      <PencilLineIcon data-icon="inline-start" />
      {pressed ? "退出多选" : "多选"}
    </Button>
  );
}
