import "server-only";

import { getConfig } from "@/lib/config";
import { submitToIndexNowOrThrow } from "@/lib/seo/indexnow";
import { absoluteUrl } from "@/lib/site";

import { planContentChange, type ContentChangeEvent } from "./plan";

export type IndexNowRunResult =
  | { status: "ok"; urls: string[] }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export async function runContentChange(
  event: ContentChangeEvent,
): Promise<IndexNowRunResult> {
  const plan = planContentChange(event);
  if (!plan.shouldRun) {
    return { status: "skipped", reason: "draft-only change" };
  }
  if (plan.indexNowPaths.length === 0) {
    return { status: "skipped", reason: "no paths" };
  }

  const key = (await getConfig("seo.indexnow_key")).trim();
  if (!key) {
    return { status: "skipped", reason: "missing INDEXNOW_KEY" };
  }

  const urls = plan.indexNowPaths.map(absoluteUrl);
  try {
    await submitToIndexNowOrThrow(urls);
    return { status: "ok", urls };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[content-change] IndexNow 提交失败:", error);
    return { status: "failed", error: message };
  }
}
