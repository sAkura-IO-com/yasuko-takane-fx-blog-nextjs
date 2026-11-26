"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/better-auth/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { setProfilePasswordAction } from "./actions";

export function ChangePasswordForm({
  hasCredential,
}: {
  hasCredential: boolean;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("新密码至少 8 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }

    startTransition(async () => {
      if (hasCredential) {
        const { error } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });
        if (error) {
          toast.error(error.message || "修改密码失败");
          return;
        }
        toast.success("密码已更新");
      } else {
        const result = await setProfilePasswordAction(newPassword);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("密码已设置，之后可用邮箱密码登录");
        router.refresh();
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasCredential ? "修改密码" : "设置密码"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {hasCredential ? (
              <Field>
                <FieldLabel htmlFor="currentPassword">当前密码</FieldLabel>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={isPending}
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="newPassword">新密码</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">确认新密码</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isPending}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                {hasCredential ? "更新密码" : "设置密码"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
