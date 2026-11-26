"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2Icon, ReplyIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  approveCommentAction,
  deleteCommentAction,
  rejectCommentAction,
  replyCommentAction,
  type CommentSubmitState,
} from "@/lib/comments/actions";
import { formatCommentTime } from "@/lib/comments/format";
import type { CommentStatus } from "@/lib/comments/types";
import { postHrefFor, type AdminCommentView } from "@/lib/comments/view";

const STATUS_META: Record<
  CommentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "outline" },
  spam: { label: "已拒绝", variant: "outline" },
};

export type CommentTableProps = {
  rows: AdminCommentView[];
  showPostColumn?: boolean;
};

export function CommentTable({
  rows,
  showPostColumn = true,
}: CommentTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">没有符合条件的评论。</p>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {rows.map((row) => (
        <CommentRow key={row.id} row={row} showPostColumn={showPostColumn} />
      ))}
    </div>
  );
}

function CommentRow({
  row,
  showPostColumn,
}: {
  row: AdminCommentView;
  showPostColumn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "操作失败，请重试");
      }
    });
  }

  const status = STATUS_META[row.status];

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{row.authorName}</span>
        {row.isAdmin ? <Badge variant="outline">站长</Badge> : null}
        <Badge variant={status.variant}>{status.label}</Badge>
        <span className="text-xs text-muted-foreground">
          {formatCommentTime(row.createdAt)}
        </span>
      </div>

      <p className="text-sm whitespace-pre-wrap">
        {row.excerpt || "（无正文）"}
      </p>

      {showPostColumn ? (
        <Link
          href={postHrefFor(row)}
          target="_blank"
          className="w-fit text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {row.postTitle}
        </Link>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {row.status !== "approved" ? (
          <Button
            size="xs"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => approveCommentAction(row.id))}
          >
            通过
          </Button>
        ) : null}
        {row.status !== "rejected" ? (
          <Button
            size="xs"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => rejectCommentAction(row.id))}
          >
            拒绝
          </Button>
        ) : null}
        <ReplyDialog row={row} />

        <DeleteDialog
          row={row}
          disabled={pending}
          onConfirm={() => run(() => deleteCommentAction(row.id))}
        />

        {pending ? (
          <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );
}

function ReplyDialog({ row }: { row: AdminCommentView }) {
  const [state, formAction, pending] = useActionState<
    CommentSubmitState | null,
    FormData
  >(replyCommentAction, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="ghost" />}>
        <ReplyIcon /> 回复
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>回复 {row.authorName}</DialogTitle>
          <DialogDescription>回复直接公开。</DialogDescription>
        </DialogHeader>

        <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          {row.excerpt || "（无正文）"}
        </p>

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="parentId" value={row.id} />
          <Textarea
            name="body"
            rows={3}
            placeholder="写点什么…"
            aria-label="回复内容"
          />

          {state?.error ? (
            <Alert>
              <AlertTitle>发送失败</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="submit" size="sm" disabled={pending}>
              发送
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  row,
  disabled,
  onConfirm,
}: {
  row: AdminCommentView;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="ghost" />}>
        删除
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>删除这条评论？</DialogTitle>
          <DialogDescription>
            {row.authorName} 的评论及全部回复将被永久删除。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={disabled}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
