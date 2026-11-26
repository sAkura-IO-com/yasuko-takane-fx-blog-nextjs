"use client";

import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  saveConfigItemAction,
  type SettingsFormState,
} from "@/lib/config/actions";
import type { ConfigItem } from "@/lib/config/registry";
import { CONFIG_TEXTAREA_MAX_CHARS } from "@/lib/config/value-rules";
import { cn } from "@/lib/utils";

export type ConfigRowState = {
  item: ConfigItem;
  source: "db" | "env";
  storedValue: string;
  envConfigured: boolean;
  effectivePreview: string;
  dbOverridable: boolean;
};

type SourceChoice = "env" | "recommended" | "custom";

function preview(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "（空）";
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

function initialSourceOf(state: ConfigRowState): SourceChoice {
  if (state.source !== "db") return "env";
  if (!state.item.secret && state.storedValue === state.item.recommended) {
    return "recommended";
  }
  return "custom";
}

function initialValueOf(state: ConfigRowState): string {
  if (state.source === "db" && !state.item.secret) return state.storedValue;
  return state.item.type === "textarea" ? state.item.recommended : "";
}

export function ConfigRow({ state }: { state: ConfigRowState }) {
  const { item } = state;
  const isTextarea = item.type === "textarea";
  const initialSource = initialSourceOf(state);
  const initialValue = initialValueOf(state);
  const [source, setSource] = useState<SourceChoice>(initialSource);
  const [value, setValue] = useState(initialValue);
  const [actionState, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(saveConfigItemAction, null);

  const dirty =
    state.dbOverridable &&
    (source !== initialSource ||
      (source === "custom" && value !== initialValue));

  const sourceItems = [
    {
      value: "env",
      label: `跟随环境变量${
        state.envConfigured
          ? "（已配置）"
          : isTextarea
            ? "（未配置，回退内置默认）"
            : "（未配置）"
      }`,
    },
    {
      value: "recommended",
      label: isTextarea ? "内置默认" : `推荐值：${preview(item.recommended)}`,
    },
    { value: "custom", label: "自定义" },
  ];

  return (
    <form
      action={formAction}
      className={cn(
        "flex flex-col gap-3 px-4 py-3",
        !isTextarea &&
          "sm:flex-row sm:items-center sm:justify-between sm:gap-6",
      )}
    >
      <input type="hidden" name="key" value={item.key} />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {dirty ? (
            <span className="text-xs font-normal text-amber-600 dark:text-amber-500">
              （未保存）
            </span>
          ) : null}
          <span>{item.label}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.description}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-mono text-[10px]">
            {item.envName}
          </Badge>
          {item.secret ? <Badge variant="destructive">敏感</Badge> : null}
          {!state.dbOverridable ? (
            <Badge variant="secondary">仅环境变量</Badge>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          当前生效：{state.effectivePreview}
          {item.note ? ` · ${item.note}` : ""}
        </p>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          isTextarea ? "w-full" : "shrink-0",
        )}
      >
        {state.dbOverridable ? (
          <>
            <Select
              name="source"
              value={source}
              items={sourceItems}
              onValueChange={(next) => setSource(next as SourceChoice)}
            >
              <SelectTrigger size="sm" className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {source === "custom" ? (
              isTextarea ? (
                <Textarea
                  name="value"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  rows={14}
                  maxLength={CONFIG_TEXTAREA_MAX_CHARS}
                  placeholder="留空保存 = 恢复内置默认"
                  className="max-h-[60vh] min-h-40 overflow-y-auto text-xs leading-relaxed"
                />
              ) : (
                <Input
                  name="value"
                  type={item.secret ? "password" : "text"}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={
                    item.secret
                      ? "输入新值（留空 = 清除覆盖）"
                      : preview(item.recommended)
                  }
                  className="w-full sm:w-56"
                />
              )
            ) : null}

            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={!dirty || pending}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              保存
            </Button>
          </>
        ) : null}

        {actionState?.error ? (
          <p className="text-xs text-destructive">{actionState.error}</p>
        ) : null}
      </div>
    </form>
  );
}
