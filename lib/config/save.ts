import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { siteConfig } from "@/db/schema";

import { encryptSecret } from "./crypto";
import { isDbOverridable, type ConfigItem } from "./registry";
import {
  checkConfigText,
  CONFIG_TEXTAREA_MAX_CHARS,
  normalizeConfigText,
} from "./value-rules";

export async function applyConfigItem(
  item: ConfigItem,
  source: string,
  customValue: string,
  userId: string | null,
): Promise<void> {
  if (!isDbOverridable(item)) return;

  if (source === "env" || (source === "custom" && customValue.trim() === "")) {
    await db.delete(siteConfig).where(eq(siteConfig.key, item.key));
    return;
  }

  let value = source === "recommended" ? item.recommended : customValue;
  if (item.type === "textarea") {
    value = normalizeConfigText(value);
    if (checkConfigText(value)) {
      console.warn(
        `[config] ${item.key} 内容超长（上限 ${CONFIG_TEXTAREA_MAX_CHARS} 字），已忽略本次写入`,
      );
      return;
    }
  }

  const stored = item.secret ? encryptSecret(value) : value;
  await db
    .insert(siteConfig)
    .values({
      key: item.key,
      value: stored,
      isSecret: Boolean(item.secret),
      updatedByUserId: userId,
    })
    .onConflictDoUpdate({
      target: siteConfig.key,
      set: {
        value: stored,
        isSecret: Boolean(item.secret),
        updatedByUserId: userId,
        updatedAt: new Date(),
      },
    });
}
