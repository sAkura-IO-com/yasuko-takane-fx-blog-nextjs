"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createSiteAction, type SetupActionState } from "@/app/setup/actions";

const EMPTY: SetupActionState = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      创建管理员并进入登录
    </Button>
  );
}

export function OnboardingForm() {
  const [state, action] = useActionState(createSiteAction, EMPTY);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">初始化站点</h1>
        <p className="text-sm text-muted-foreground">
          这个库还没有完成初始化。创建唯一的管理员账号后，即可登录后台。
        </p>
      </div>

      <form action={action} className="flex flex-col gap-6">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertTitle>无法初始化</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>创建管理员</CardTitle>
            <CardDescription>
              站点不开放游客注册，只有这里创建的账号可以登录后台。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="admin-name">昵称</FieldLabel>
                <Input
                  id="admin-name"
                  name="name"
                  type="text"
                  autoComplete="nickname"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="admin-email">邮箱</FieldLabel>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
                <FieldDescription>登录后台时使用。</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="admin-password">密码</FieldLabel>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <FieldDescription>至少 8 位。</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="admin-password-confirm">
                  确认密码
                </FieldLabel>
                <Input
                  id="admin-password-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>可选：GitHub 登录</CardTitle>
            <CardDescription>
              填写后即可用 GitHub 登录后台；留空可稍后在「配置 → 登录 /
              认证」补填。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="github-client-id">
                  GitHub Client ID
                </FieldLabel>
                <Input
                  id="github-client-id"
                  name="githubClientId"
                  type="text"
                  autoComplete="off"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="github-client-secret">
                  GitHub Client Secret
                </FieldLabel>
                <Input
                  id="github-client-secret"
                  name="githubClientSecret"
                  type="password"
                  autoComplete="off"
                />
                <FieldDescription>
                  回调地址请在 GitHub OAuth App 登记：{"{站点 URL}"}
                  /api/auth/callback/github
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <SubmitButton />
      </form>
    </div>
  );
}
