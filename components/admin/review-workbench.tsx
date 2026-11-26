"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  approveCommentAction,
  rejectCommentAction,
} from "@/lib/comments/actions";
import { formatCommentTime } from "@/lib/comments/format";

export type ReviewQueueItem = {
  id: string;
  authorName: string;
  excerpt: string;
  createdAt: string;
  postTitle: string;
};

function WorkbenchShell({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {aside}
      </div>
      <div className="flex h-[22rem] flex-col overflow-hidden rounded-xl border bg-card">
        {children}
      </div>
    </div>
  );
}

export function ReviewWorkbench({
  queue,
}: {
  queue: ReviewQueueItem[];
}) {
  const [items, setItems] = useState(queue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [justCleared, setJustCleared] = useState(false);
  const [initialTotal] = useState(() => queue.length);
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const current = items[0] ?? null;

  function run(kind: "approve" | "reject") {
    if (!current || pending) return;
    setError(null);
    const id = current.id;
    startTransition(async () => {
      try {
        await (kind === "approve"
          ? approveCommentAction(id)
          : rejectCommentAction(id));
        const rest = items.slice(1);
        setItems(rest);
        if (rest.length === 0) {
          setJustCleared(initialTotal > 0);
          router.refresh();
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "操作失败，请重试");
      }
    });
  }

  if (!current) {
    return (
      <WorkbenchShell
        title="审核台"
        aside={
          <span className="text-[11px] text-muted-foreground">
            {justCleared ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-500">
                ✓ 已全部审完
              </span>
            ) : (
              "暂无待审评论"
            )}
          </span>
        }
      >
        <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          暂无待审评论。
        </p>
      </WorkbenchShell>
    );
  }

  const done = initialTotal - items.length;

  return (
    <WorkbenchShell title="审核台">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={current.id}
          initial={reduceMotion ? false : { x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { x: "-100%", opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.3,
            ease: "easeInOut",
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-start justify-between gap-3 px-4 pt-3">
            <div className="min-w-0">
              <p className="truncate text-xs">
                <span className="font-medium text-foreground">
                  {current.authorName}
                </span>
                <span className="text-muted-foreground">
                  {" · "}
                  {formatCommentTime(current.createdAt)}
                </span>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {current.postTitle}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
              待审核 {items.length} 条 · 第 {done + 1} / {initialTotal}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-3">
            <div className="flex max-w-xl flex-col items-center gap-3 text-center">
              <p className="text-lg leading-relaxed break-words whitespace-pre-wrap">
                {current.excerpt || "（无正文）"}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="shrink-0 border-t px-4 py-3">
        {error ? (
          <p className="mb-2 text-center text-xs text-destructive">{error}</p>
        ) : null}
        <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2">
          <Button disabled={pending} onClick={() => run("approve")}>
            通过
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run("reject")}
          >
            拒绝
          </Button>
        </div>
      </div>
    </WorkbenchShell>
  );
}
