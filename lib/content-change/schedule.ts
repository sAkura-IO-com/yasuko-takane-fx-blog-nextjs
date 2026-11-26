import "server-only";

import { after } from "next/server";

import { runContentChange } from "./run";
import type { ContentChangeEvent } from "./plan";

export function scheduleContentChange(event: ContentChangeEvent) {
  after(async () => {
    try {
      await runContentChange(event);
    } catch (error) {
      console.error("[content-change] 执行失败:", error);
    }
  });
}
