"use client";

import { Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/better-auth/auth-client";
import { isPasskeyCancelled } from "@/lib/better-auth/passkey";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export type ProfilePasskey = {
  id: string;
  name: string | null;
  authenticator: string;
  iconSrc: string | null;
  createdAt: string | null;
  synced: boolean;
  deviceBound: boolean;
};

function passkeyTitle(passkey: ProfilePasskey) {
  return passkey.name || passkey.authenticator;
}

function passkeyDetails(passkey: ProfilePasskey) {
  const parts: string[] = [];
  if (passkey.name) parts.push(passkey.authenticator);
  if (passkey.synced) parts.push("已同步");
  else if (passkey.deviceBound) parts.push("仅此设备");
  if (passkey.createdAt) parts.push(`添加于 ${passkey.createdAt}`);
  return parts.join(" · ");
}

function PasskeyLogo({ iconSrc }: { iconSrc: string | null }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white p-1">
      {iconSrc ? (
        // AAGUID 品牌图标是 data URI，next/image 无法处理。
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt=""
          width={24}
          height={24}
          className="size-full object-contain object-center"
        />
      ) : (
        <Fingerprint
          aria-hidden
          className="size-4 text-neutral-500"
          strokeWidth={1.75}
        />
      )}
    </div>
  );
}

export function Passkeys({ passkeys }: { passkeys: ProfilePasskey[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  function addPasskey() {
    startTransition(async () => {
      const { error } = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
      });
      if (error) {
        if (!isPasskeyCancelled(error)) {
          toast.error(error.message || "绑定通行密钥失败");
        }
        return;
      }
      toast.success("通行密钥已绑定");
      setName("");
      router.refresh();
    });
  }

  function deletePasskey(id: string) {
    startTransition(async () => {
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        toast.error(error.message || "删除通行密钥失败");
        return;
      }
      toast.success("已删除通行密钥");
      setDeletingId(null);
      if (renamingId === id) {
        setRenamingId(null);
        setRenameValue("");
      }
      router.refresh();
    });
  }

  function saveRename(id: string) {
    const nextName = renameValue.trim();
    if (!nextName) {
      toast.error("请输入通行密钥名称");
      return;
    }

    startTransition(async () => {
      const { error } = await authClient.passkey.updatePasskey({
        id,
        name: nextName,
      });
      if (error) {
        toast.error(error.message || "重命名失败");
        return;
      }
      toast.success("通行密钥名称已更新");
      setRenamingId(null);
      setRenameValue("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>通行密钥</CardTitle>
 
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {passkeys.length > 0 ? (
          passkeys.map((passkey) => {
            const isRenaming = renamingId === passkey.id;
            return (
              <div
                key={passkey.id}
                className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2"
              >
                <PasskeyLogo iconSrc={passkey.iconSrc} />
                <div className="min-w-0 flex-1">
                  {isRenaming ? (
                    <form
                      className="flex min-w-0 flex-col gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveRename(passkey.id);
                      }}
                    >
                      <Field>
                        <FieldLabel htmlFor={`passkey-rename-${passkey.id}`}>
                          名称
                        </FieldLabel>
                        <Input
                          ref={renameInputRef}
                          id={`passkey-rename-${passkey.id}`}
                          value={renameValue}
                          onChange={(event) =>
                            setRenameValue(event.target.value)
                          }
                          placeholder={passkey.authenticator}
                          disabled={isPending}
                        />
                      </Field>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => {
                            setRenamingId(null);
                            setRenameValue("");
                          }}
                        >
                          取消
                        </Button>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? (
                            <Spinner data-icon="inline-start" />
                          ) : null}
                          保存
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex h-8 min-w-0 items-stretch gap-2">
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <p className="truncate text-sm leading-none font-medium">
                          {passkeyTitle(passkey)}
                        </p>
                        <p className="truncate text-xs leading-none text-muted-foreground">
                          {passkeyDetails(passkey) || "已绑定"}
                        </p>
                      </div>
                      <div className="flex h-8 shrink-0 items-stretch gap-2">
                        <Button
                          variant="outline"
                          className="h-8"
                          disabled={isPending}
                          onClick={() => {
                            setRenamingId(passkey.id);
                            setRenameValue(passkey.name ?? "");
                          }}
                        >
                          重命名
                        </Button>
                        <Dialog
                          open={deletingId === passkey.id}
                          onOpenChange={(open) =>
                            setDeletingId(open ? passkey.id : null)
                          }
                        >
                          <DialogTrigger
                            render={
                              <Button variant="outline" className="h-8" />
                            }
                            disabled={isPending}
                          >
                            删除
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>删除通行密钥？</DialogTitle>
                              <DialogDescription>
                                将删除「{passkeyTitle(passkey)}
                                」。删除后无法用该通行密钥登录，需要重新添加。
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                disabled={isPending}
                                onClick={() => setDeletingId(null)}
                              >
                                取消
                              </Button>
                              <Button
                                variant="destructive"
                                disabled={isPending}
                                onClick={() => deletePasskey(passkey.id)}
                              >
                                {isPending ? (
                                  <Spinner data-icon="inline-start" />
                                ) : null}
                                确认删除
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">还没有通行密钥。</p>
        )}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="passkeyName">名称（可选）</FieldLabel>
            <Input
              id="passkeyName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：本机、YubiKey"
              disabled={isPending}
            />
          </Field>
          <Field>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => addPasskey()}
            >
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              添加通行密钥
            </Button>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
