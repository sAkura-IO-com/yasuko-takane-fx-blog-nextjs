"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/lib/blog/owner";
import { invalidateAuth } from "@/lib/better-auth/runtime";
import { asString } from "@/lib/strings";
import { assertSiteWritable } from "@/lib/site/writable";

import { invalidateSiteConfig } from "./index";
import { configItem, isDbOverridable } from "./registry";
import { applyConfigItem } from "./save";
import { checkConfigText } from "./value-rules";

export type SettingsFormState = { error?: string; ok?: true } | null;

export async function saveConfigItemAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await assertSiteWritable();
  const session = await requireOwner("/admin/settings");

  const item = configItem(asString(formData.get("key")));
  if (!item) return { error: "未知配置项" };
  if (!isDbOverridable(item)) return { error: "该项仅支持环境变量" };

  if (item.type === "textarea") {
    const invalid = checkConfigText(asString(formData.get("value")));
    if (invalid) return { error: invalid };
  }

  try {
    await applyConfigItem(
      item,
      asString(formData.get("source")),
      asString(formData.get("value")),
      session.user.id,
    );
  } catch (error) {
    console.error("[config] 保存配置失败:", error);
    return {
      error: error instanceof Error ? error.message : "保存失败，请稍后再试",
    };
  }

  invalidateSiteConfig();
  invalidateAuth();
  revalidatePath("/admin/settings");
  return { ok: true };
}
