"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { SortableHandle } from "@/components/admin/sticker-sortable";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { indexPath } from "@/lib/content-types/paths";
import { CONTENT_TYPE_ICONS } from "@/lib/content-types/icons";
import {
  createContentTypeAction,
  deleteContentTypeAction,
  reorderContentTypesAction,
  updateContentTypeAction,
  type ContentTypeFormState,
} from "@/lib/content-types/actions";
import type { ContentTypeView } from "@/lib/content-types/types";
import { useDragOrder } from "@/lib/hooks/use-drag-order";
import { cn } from "@/lib/utils";

export type AdminContentTypeRow = ContentTypeView & {
  postCount: number;
  publishedCount: number;
};

const ICON_LABEL: Record<(typeof CONTENT_TYPE_ICONS)[number], string> = {
  "text.page": "文档",
  newspaper: "报纸",
  sparkles: "闪光",
  "tag.fill": "标签",
  "photo.fill": "图片",
  clock: "时钟",
  safari: "指南针",
  link: "链接",
  "info.circle": "信息",
  gear: "齿轮",
};

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function ContentTypeManager({
  types,
  error,
}: {
  types: AdminContentTypeRow[];
  error?: string;
}) {
  const [rows, commitOrder] = useDragOrder(types);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = rows.findIndex((row) => row.id === active.id);
    const to = rows.findIndex((row) => row.id === over.id);
    if (from < 0 || to < 0) return;

    const previous = rows;
    const next = arrayMove(rows, from, to);
    commitOrder(next);
    startTransition(async () => {
      const result = await reorderContentTypesAction(next.map((row) => row.id));
      if (result?.error) {
        commitOrder(previous);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">内容分类</h2>
          <p className="text-sm text-muted-foreground">
            新分类会出现在侧栏菜单，底部标签栏不变。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href="/admin/writing" prefetch={true} />}
            nativeButton={false}
          >
            返回写作
          </Button>
          <CreateTypeDialog />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>无法删除</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={cn("transition-opacity", pending && "opacity-60")}>
          <Table
            data-testid="content-type-table"
            className="border-separate border-spacing-0"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">排序</span>
                </TableHead>
                <TableHead>名称</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>版式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>内容</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={rows.map((row) => row.id)}
                strategy={verticalListSortingStrategy}
              >
                {rows.map((type) => (
                  <SortableTypeRow key={type.id} type={type} />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </div>
      </DndContext>
    </div>
  );
}

function SortableTypeRow({ type }: { type: AdminContentTypeRow }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: type.id });

  return (
    <TableRow
      ref={setNodeRef}
      data-testid={`content-type-row-${type.slug}`}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        isDragging &&
          "relative z-20 bg-background shadow-md ring-1 ring-foreground/10",
      )}
    >
      <TableCell className="w-10">
        <SortableHandle
          attributes={attributes}
          listeners={listeners}
          label={`拖动排序 ${type.name}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{type.name}</span>
          <span className="text-xs text-muted-foreground">
            {type.singularName} · {type.key}
          </span>
        </div>
      </TableCell>
      <TableCell>{indexPath(type.slug)}</TableCell>
      <TableCell>{type.layout === "note" ? "笔记" : "文章"}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {type.isSystem ? <Badge variant="secondary">系统</Badge> : null}
          <Badge variant={type.enabled ? "default" : "secondary"}>
            {type.enabled ? "启用" : "停用"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>{type.postCount}</TableCell>
      <TableCell>
        <div className="flex flex-wrap justify-end gap-1">
          <EditTypeDialog type={type} />
          {type.isSystem ? null : (
            <form action={deleteContentTypeAction}>
              <input type="hidden" name="id" value={type.id} />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={type.postCount > 0}
                data-testid={`delete-type-${type.slug}`}
              >
                删除
              </Button>
            </form>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function CreateTypeDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createContentTypeAction,
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" data-testid="create-content-type" />}
      >
        <PlusIcon data-icon="inline-start" />
        新增分类
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增分类</DialogTitle>
          <DialogDescription>
            内部标识创建后不可改；有已发布内容后地址也会锁定。
          </DialogDescription>
        </DialogHeader>
        <TypeForm
          formAction={formAction}
          state={state}
          pending={pending}
          submitLabel="创建"
        />
      </DialogContent>
    </Dialog>
  );
}

function EditTypeDialog({ type }: { type: AdminContentTypeRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateContentTypeAction.bind(null, type.id),
    null,
  );
  const slugLocked = type.isSystem || type.publishedCount > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            data-testid={`edit-type-${type.slug}`}
          />
        }
      >
        编辑
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑{type.name}</DialogTitle>
          <DialogDescription>
            {type.isSystem
              ? "系统分类不能删除，地址固定。"
              : slugLocked
                ? "已有已发布内容，地址已锁定。"
                : "停用后前台将完全隐藏此分类。"}
          </DialogDescription>
        </DialogHeader>
        <TypeForm
          type={type}
          formAction={formAction}
          state={state}
          pending={pending}
          submitLabel="保存"
          slugLocked={slugLocked}
          keyLocked
        />
      </DialogContent>
    </Dialog>
  );
}

function TypeForm({
  type,
  formAction,
  state,
  pending,
  submitLabel,
  slugLocked = false,
  keyLocked = false,
}: {
  type?: AdminContentTypeRow;
  formAction: (formData: FormData) => void;
  state: ContentTypeFormState;
  pending: boolean;
  submitLabel: string;
  slugLocked?: boolean;
  keyLocked?: boolean;
}) {
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertTitle>无法保存</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertTitle>已保存</AlertTitle>
        </Alert>
      ) : null}
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="type-name">名称</FieldLabel>
            <Input
              id="type-name"
              name="name"
              required
              defaultValue={type?.name ?? ""}
              placeholder="周记"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-singular">单数名称</FieldLabel>
            <Input
              id="type-singular"
              name="singularName"
              required
              defaultValue={type?.singularName ?? ""}
              placeholder="周记"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-key">内部标识</FieldLabel>
            <Input
              id="type-key"
              name="key"
              required
              defaultValue={type?.key ?? ""}
              readOnly={keyLocked}
              placeholder="weekly"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-slug">地址</FieldLabel>
            <Input
              id="type-slug"
              name="slug"
              required
              defaultValue={type?.slug ?? ""}
              readOnly={slugLocked}
              placeholder="weekly"
            />
            <p className="text-xs text-muted-foreground">
              {type?.isSystem
                ? `公开地址：${indexPath(type.slug)}`
                : "公开地址：/c/地址"}
            </p>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="type-description">简介</FieldLabel>
          <Textarea
            id="type-description"
            name="description"
            rows={2}
            defaultValue={type?.description ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="type-seo-title">SEO 标题</FieldLabel>
          <Input
            id="type-seo-title"
            name="seoTitle"
            required
            defaultValue={type?.seoTitle ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="type-seo-description">SEO 描述</FieldLabel>
          <Textarea
            id="type-seo-description"
            name="seoDescription"
            rows={2}
            required
            defaultValue={type?.seoDescription ?? ""}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="type-crumb">面包屑</FieldLabel>
            <Input
              id="type-crumb"
              name="crumbName"
              required
              defaultValue={type?.crumbName ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-section">分区名称</FieldLabel>
            <Input
              id="type-section"
              name="articleSection"
              required
              defaultValue={type?.articleSection ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-icon">菜单图标</FieldLabel>
            <select
              id="type-icon"
              name="icon"
              defaultValue={type?.icon ?? "text.page"}
              className={selectClass}
            >
              {CONTENT_TYPE_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {ICON_LABEL[icon]}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="type-layout">版式</FieldLabel>
            <select
              id="type-layout"
              name="layout"
              defaultValue={type?.layout ?? "article"}
              className={selectClass}
            >
              <option value="article">文章版式</option>
              <option value="note">笔记版式</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="type-sort">排序</FieldLabel>
            <Input
              id="type-sort"
              name="sortOrder"
              type="number"
              defaultValue={type?.sortOrder ?? 0}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="type-home-count">首页条数</FieldLabel>
            <Input
              id="type-home-count"
              name="homeFeaturedCount"
              type="number"
              min={0}
              defaultValue={type?.homeFeaturedCount ?? 0}
            />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Check
            name="showInNav"
            label="显示在侧栏菜单"
            defaultChecked={type?.showInNav ?? true}
          />
          <Check
            name="showOnHome"
            label="显示在首页"
            defaultChecked={type?.showOnHome ?? false}
          />
          <Check
            name="enabled"
            label="启用"
            defaultChecked={type?.enabled ?? true}
          />
        </div>
      </FieldGroup>
      <DialogFooter>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          data-testid="save-content-type"
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        value="on"
        defaultChecked={defaultChecked}
        className="size-4 accent-foreground"
      />
      {label}
    </label>
  );
}
