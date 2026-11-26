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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

const PROVIDERS = [
  {
    id: "github" as const,
    label: "GitHub",
    description: "用 GitHub 登录本平台",
  },
];

type LinkedAccount = {
  id: string;
  providerId: string;
};

export function LinkedAccounts({
  linkedAccounts,
}: {
  linkedAccounts: LinkedAccount[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const accountByProvider = new Map(
    linkedAccounts.map((account) => [account.providerId, account]),
  );

  function linkProvider(provider: (typeof PROVIDERS)[number]["id"]) {
    startTransition(async () => {
      const { error } = await authClient.linkSocial({
        provider,
        callbackURL: "/admin/profile",
        errorCallbackURL: "/admin/profile",
      });
      if (error) toast.error(error.message || "绑定失败");
    });
  }

  function unlinkProvider(provider: (typeof PROVIDERS)[number]["id"]) {
    const account = accountByProvider.get(provider);
    if (!account) {
      toast.error("未找到已绑定账号");
      return;
    }

    startTransition(async () => {
      const { error } = await authClient.unlinkAccount({
        accountId: account.id,
      });
      if (error) {
        toast.error(error.message || "解除绑定失败");
        return;
      }
      toast.success(`已解除 ${provider} 绑定`);
      setConfirming(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>第三方账号</CardTitle>

      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {PROVIDERS.map((provider) => {
          const isLinked = accountByProvider.has(provider.id);
          return (
            <div
              key={provider.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium">{provider.label}</p>
                <p className="text-xs text-muted-foreground">
                  {isLinked ? "已绑定" : provider.description}
                </p>
              </div>
              {isLinked ? (
                <Dialog
                  open={confirming === provider.id}
                  onOpenChange={(open) =>
                    setConfirming(open ? provider.id : null)
                  }
                >
                  <DialogTrigger
                    render={<Button variant="outline" size="sm" />}
                    disabled={isPending}
                  >
                    解除绑定
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>解除 {provider.label} 绑定？</DialogTitle>
                      <DialogDescription>
                        解除后将无法再用该 {provider.label}{" "}
                        账号一键登录，需要重新绑定才能恢复。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setConfirming(null)}
                      >
                        取消
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => unlinkProvider(provider.id)}
                      >
                        {isPending ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        确认解除
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => linkProvider(provider.id)}
                >
                  {isPending ? <Spinner data-icon="inline-start" /> : null}
                  绑定
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
