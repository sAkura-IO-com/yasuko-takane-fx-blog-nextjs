import "server-only";

import { db } from "@/db";
import { siteConfig } from "@/db/schema";

import { decryptSecret } from "./crypto";
import {
  configItem,
  isDbOverridable,
  itemsOfGroup,
  type ConfigGroup,
  type ConfigItem,
} from "./registry";

const OVERRIDE_TTL_MS = 10_000;
let cache: { at: number; overrides: Record<string, string> } | null = null;

async function readOverrides(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(siteConfig);
    const overrides: Record<string, string> = {};
    for (const row of rows) {
      if (row.isSecret) {
        const plain = decryptSecret(row.value);
        if (plain !== null) overrides[row.key] = plain;
      } else {
        overrides[row.key] = row.value;
      }
    }
    return overrides;
  } catch (error) {
    console.warn("[config] 读取 site_config 失败，全部回退环境变量:", error);
    return {};
  }
}

async function overrides(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cache.at < OVERRIDE_TTL_MS) return cache.overrides;
  const fresh = await readOverrides();
  cache = { at: now, overrides: fresh };
  return fresh;
}

function envValue(item: ConfigItem): string | undefined {
  const raw = process.env[item.envName];
  if (raw === undefined || raw === "") return undefined;
  return raw;
}

export async function getConfig(key: string): Promise<string> {
  const item = configItem(key);
  if (!item) return "";
  if (isDbOverridable(item)) {
    const map = await overrides();
    const found = map[key];
    if (found !== undefined) return found;
  }
  return envValue(item) ?? item.recommended;
}

export async function getConfigGroup(
  group: ConfigGroup,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const item of itemsOfGroup(group)) {
    out[item.key] = await getConfig(item.key);
  }
  return out;
}

export function hasEnvValue(item: ConfigItem): boolean {
  return envValue(item) !== undefined;
}

export async function getOverriddenKeys(): Promise<string[]> {
  return Object.keys(await overrides());
}

export function invalidateSiteConfig(): void {
  cache = null;
}
