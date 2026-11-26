"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
import {
  updateProfileNameAction,
  type ProfileActionState,
} from "./actions";

const EMPTY: ProfileActionState = null;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      保存昵称
    </Button>
  );
}

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [state, action] = useActionState(updateProfileNameAction, EMPTY);

  return (
    <Card>
      <CardHeader>
        <CardTitle>昵称</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">昵称</FieldLabel>
              <Input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="nickname"
                defaultValue={initialName}
                maxLength={50}
                required
              />
              {state?.error ? (
                <p className="text-xs text-destructive">{state.error}</p>
              ) : null}
              {state?.ok ? (
                <p className="text-xs text-muted-foreground">已保存。</p>
              ) : null}
            </Field>
            <Field>
              <SaveButton />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
