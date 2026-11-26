"use server";

import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createLocalAccountIssuer } from "@better-auth/core/db";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { getAuth } from "@/lib/better-auth/runtime";
import { configItem } from "@/lib/config/registry";
import { applyConfigItem } from "@/lib/config/save";
import { seedDemoContent } from "@/lib/setup/demo-content";
import { invalidateSiteFlags } from "@/lib/site/cached-flags";
import { getSiteState, markSiteInitialized } from "@/lib/site/state";
import { asString } from "@/lib/strings";

export type SetupActionState = { error: string } | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

async function saveOptionalGithub(
  clientId: string,
  clientSecret: string,
  userId: string,
): Promise<string | null> {
  const id = clientId.trim();
  const secret = clientSecret.trim();
  if (!id && !secret) return null;
  if (!id || !secret) return "GitHub 登录需要同时填写 Client ID 与 Client Secret";

  for (const [key, value] of [
    ["auth.github_client_id", id],
    ["auth.github_client_secret", secret],
  ] as const) {
    const item = configItem(key);
    if (!item) return "未知配置项";
    try {
      await applyConfigItem(item, "custom", value, userId);
    } catch (error) {
      console.error(`[setup] 写入 ${key} 失败:`, error);
      return "GitHub 配置保存失败，请稍后再试";
    }
  }
  return null;
}

export async function createSiteAction(
  _prev: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const state = await getSiteState();
  if (state.persisted && state.initialized) redirect("/login");

  const [existing] = await db.select({ value: count() }).from(user);
  if (Number(existing?.value ?? 0) > 0) {
    return { error: "数据库中已存在账号，初始化已完成，请直接登录。" };
  }

  const name = asString(formData.get("name")).trim();
  const email = asString(formData.get("email")).trim().toLowerCase();
  const password = asString(formData.get("password"));
  const confirmPassword = asString(formData.get("confirmPassword"));
  const githubClientId = asString(formData.get("githubClientId"));
  const githubClientSecret = asString(formData.get("githubClientSecret"));

  if (!name) return { error: "请填写管理员昵称" };
  if (!EMAIL_PATTERN.test(email)) return { error: "请填写有效的邮箱地址" };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `密码至少需要 ${MIN_PASSWORD_LENGTH} 位` };
  }
  if (password !== confirmPassword) return { error: "两次输入的密码不一致" };
  if (Boolean(githubClientId.trim()) !== Boolean(githubClientSecret.trim())) {
    return { error: "GitHub 登录需要同时填写 Client ID 与 Client Secret" };
  }
  if (githubClientSecret.trim() && !process.env.CONFIG_MASTER_KEY?.trim()) {
    return {
      error: "缺少 CONFIG_MASTER_KEY，无法加密保存 GitHub Secret。可先跳过，稍后在后台配置。",
    };
  }

  const auth = await getAuth();
  const context = await auth.$context;
  const passwordHash = await context.password.hash(password);
  const created = await context.internalAdapter.createUser(
    {
      email,
      name,
      emailVerified: true,
      role: "admin",
    },
    { method: "email-password" },
  );

  await context.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    issuer: createLocalAccountIssuer("credential"),
    accountId: created.id,
    password: passwordHash,
  });

  await markSiteInitialized(email);

  try {
    await seedDemoContent(created.id);
  } catch (error) {
    console.error("[setup] 示例内容写入失败:", error);
  }

  const githubError = await saveOptionalGithub(
    githubClientId,
    githubClientSecret,
    created.id,
  );
  if (githubError) {
    console.error("[setup] GitHub 配置未保存:", githubError);
  }

  invalidateSiteFlags();
  redirect("/login?setup=1");
}
