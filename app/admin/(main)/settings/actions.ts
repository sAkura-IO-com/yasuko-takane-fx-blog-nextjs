"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getAuth } from "@/lib/better-auth/runtime";
import { requireOwner } from "@/lib/blog/owner";
import { asString } from "@/lib/strings";
import { assertSiteWritable } from "@/lib/site/writable";

export type ProfileActionState = { error?: string; ok?: true } | null;

const MIN_PASSWORD_LENGTH = 8;
const SETTINGS_PATH = "/admin/settings?g=account";

export async function updateProfileNameAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  await assertSiteWritable();
  await requireOwner(SETTINGS_PATH);

  const name = asString(formData.get("name")).trim();
  if (!name) return { error: "请填写昵称" };
  if (name.length > 50) return { error: "昵称最长 50 个字符" };

  try {
    const auth = await getAuth();
    await auth.api.updateUser({
      body: { name },
      headers: await headers(),
    });
  } catch (error) {
    console.error("[settings] 修改昵称失败:", error);
    return { error: "修改昵称失败，请稍后再试" };
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setProfilePasswordAction(
  newPassword: string,
): Promise<{ error: string } | { ok: true }> {
  await assertSiteWritable();
  await requireOwner(SETTINGS_PATH);

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `密码至少 ${MIN_PASSWORD_LENGTH} 位` };
  }

  try {
    const auth = await getAuth();
    await auth.api.setPassword({
      body: { newPassword },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    console.error("[settings] 设置密码失败:", error);
    return { error: "设置密码失败，请稍后再试" };
  }
}
