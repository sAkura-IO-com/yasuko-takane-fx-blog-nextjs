import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { siteState, type SiteState } from "@/db/schema";

export const SITE_STATE_ID = "singleton";

export type SiteStateView = SiteState & {
  persisted: boolean;
  rowMissing: boolean;
};

export const UNMIGRATED_SITE_STATE: SiteStateView = {
  id: SITE_STATE_ID,
  initialized: true,
  ownerEmail: null,
  maintenance: false,
  initializedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  persisted: false,
  rowMissing: false,
};

function isMissingSiteState(error: unknown): boolean {
  const pending: unknown[] = [error];
  const seen = new Set<unknown>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const record = current as {
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    const message = typeof record.message === "string" ? record.message : "";
    if (
      record.code === "42P01" ||
      (message.includes("site_state") && message.includes("does not exist"))
    ) {
      return true;
    }
    if ("cause" in record) pending.push(record.cause);
  }
  return false;
}

export async function getSiteState(): Promise<SiteStateView> {
  try {
    const [row] = await db
      .select()
      .from(siteState)
      .where(eq(siteState.id, SITE_STATE_ID))
      .limit(1);
    if (!row) return { ...UNMIGRATED_SITE_STATE, rowMissing: true };
    return { ...row, persisted: true, rowMissing: false };
  } catch (error) {
    if (isMissingSiteState(error)) return UNMIGRATED_SITE_STATE;
    throw error;
  }
}

export async function markSiteInitialized(ownerEmail: string): Promise<void> {
  const email = ownerEmail.trim().toLowerCase();
  const now = new Date();
  await db
    .insert(siteState)
    .values({
      id: SITE_STATE_ID,
      initialized: true,
      ownerEmail: email,
      maintenance: false,
      initializedAt: now,
    })
    .onConflictDoUpdate({
      target: siteState.id,
      set: {
        initialized: true,
        ownerEmail: email,
        initializedAt: now,
        maintenance: false,
      },
    });
}
