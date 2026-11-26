import "server-only";

import { forbidden } from "next/navigation";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
  getSession,
  requirePageSession,
  type Session,
} from "@/lib/better-auth/session";
import { dbConfirmsAdmin, isUserBanned } from "@/lib/blog/admin-record";
import { getConfig } from "@/lib/config";

async function adminUserIds(): Promise<string[]> {
  return (await getConfig("auth.site_admin_user_ids"))
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function ensureOwner(session: Session): Promise<boolean> {
  const [row] = await db
    .select({
      role: user.role,
      banned: user.banned,
      banExpires: user.banExpires,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  if (!row || isUserBanned(row)) return false;
  return dbConfirmsAdmin({
    userId: session.user.id,
    role: row.role,
    banned: row.banned,
    banExpires: row.banExpires,
    adminUserIds: await adminUserIds(),
  });
}

export async function requireOwner(callbackUrl = "/admin"): Promise<Session> {
  const session = await requirePageSession(callbackUrl);
  const ok = await ensureOwner(session);
  if (!ok) forbidden();
  return session;
}

export async function requireOwnerApiJson(): Promise<
  | { session: Session; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "请先登录" }, { status: 401 }),
    };
  }
  const ok = await ensureOwner(session);
  if (!ok) {
    return {
      error: NextResponse.json({ error: "无权访问" }, { status: 403 }),
    };
  }
  return { session };
}
