"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "sonner";

import { PostPublishedAtField } from "@/components/admin/post-published-at-field";
import { MediaField } from "@/components/media/media-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { deletePostAction, type PostFormState } from "@/lib/blog/actions";
import type { PostStatus } from "@/lib/blog/db";
import { parsePublishedAtFormValue } from "@/lib/blog/published-at";

type PostFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverKey: string;
  coverPreviewUrl: string;
  coverWidth?: number | null;
  coverHeight?: number | null;
  status: PostStatus;
  typeKey: string;
  tags: string;
  publishedAt?: string | null;
  createdAt?: string | null;
  nowIso?: string;
};

export type PostTypeOption = {
  key: string;
  slug: string;
  name: string;
  singularName: string;
};

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: "published", label: "发布" },
  { value: "draft", label: "草稿" },
  { value: "archived", label: "归档" },
];

const PostEditor = dynamic(
  () => import("@/components/admin/post-editor").then((m) => m.PostEditor),
  {
    ssr: false,
  },
);

export function PostForm({
  initial,
  action,
  heading,
  types,
}: {
  initial?: PostFormValues;
  action: (prev: PostFormState, formData: FormData) => Promise<PostFormState>;
  heading?: string;
  types: PostTypeOption[];
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");

  const [status, setStatus] = useState<PostStatus>(
    initial?.status ?? "published",
  );
  const [typeKey, setTypeKey] = useState(
    initial?.typeKey ?? types[0]?.key ?? "article",
  );
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const markdownRef = useRef(initial?.content ?? "");
  const handleMarkdownChange = useCallback((value: string) => {
    markdownRef.current = value;
  }, []);

  const currentType = types.find((type) => type.key === typeKey) ?? types[0];
  const listHref = `/admin/writing?tab=${currentType?.slug ?? "posts"}`;

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.ok) {
      if (state.savedSlug) {
        setSlug(state.savedSlug);
      }
      toast.success("已保存");
    }
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const field = event.currentTarget.elements.namedItem("publishedAt");
        if (!(field instanceof HTMLInputElement) || !field.value) return;
        const parsed = parsePublishedAtFormValue(field.value);
        if ("error" in parsed) {
          event.preventDefault();
          toast.error(parsed.error);
        }
      }}
      className="flex h-full flex-col gap-6 overflow-y-auto max-md:h-auto max-md:overflow-visible lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-4 lg:overflow-hidden"
    >
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="typeKey" value={typeKey} />

      <div className="flex shrink-0 flex-col gap-5 lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:pl-2">
        {heading ? <h2 className="text-base font-medium">{heading}</h2> : null}
        {state?.error ? (
          <Alert>
            <AlertTitle>无法保存</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="title">标题</FieldLabel>
          <Input
            id="title"
            name="title"
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="slug">Slug</FieldLabel>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
            }}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="tags">标签</FieldLabel>
          <Input
            id="tags"
            name="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder=""
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="excerpt">摘要</FieldLabel>
          <Textarea
            id="excerpt"
            name="excerpt"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={5}
          />
        </Field>

        <Field>
          <FieldLabel>封面</FieldLabel>
          <MediaField
            name="coverKey"
            widthName="coverWidth"
            heightName="coverHeight"
            initialKey={initial?.coverKey ?? ""}
            initialUrl={initial?.coverPreviewUrl ?? ""}
            initialWidth={initial?.coverWidth}
            initialHeight={initial?.coverHeight}
          />
        </Field>

        <Field>
          <FieldLabel>类型</FieldLabel>
          <ToggleGroup
            value={[typeKey]}
            onValueChange={(next) => {
              const value = next[0];
              if (value && types.some((type) => type.key === value)) {
                setTypeKey(value);
              }
            }}
          >
            {types.map((option) => (
              <ToggleGroupItem key={option.key} value={option.key}>
                {option.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel>状态</FieldLabel>
          <ToggleGroup
            value={[status]}
            onValueChange={(next) => {
              const value = next[0];
              if (
                value === "draft" ||
                value === "published" ||
                value === "archived"
              ) {
                setStatus(value);
              }
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <PostPublishedAtField
          publishedAt={initial?.publishedAt}
          createdAt={initial?.createdAt}
          nowIso={initial?.nowIso ?? "2000-01-01T00:00:00.000Z"}
        />
      </div>

      <PostEditor
        initialMarkdown={initial?.content ?? ""}
        onMarkdownChange={handleMarkdownChange}
        className="shrink-0 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:min-h-0"
      />

      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:col-start-2 lg:row-start-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          保存
        </Button>
        <Button
          variant="outline"
          render={<Link href={listHref} prefetch={true} />}
          nativeButton={false}
        >
          返回列表
        </Button>
        {initial?.id ? <DeletePostButton id={initial.id} /> : null}
      </div>
    </form>
  );
}

function DeletePostButton({ id }: { id: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>
        删除
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除这篇文章？</DialogTitle>
          <DialogDescription>删除后无法恢复。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <form action={deletePostAction.bind(null, id)}>
            <Button variant="destructive" type="submit">
              确认删除
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
