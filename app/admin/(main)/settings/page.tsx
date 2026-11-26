import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";

import type { ConfigRowState } from "@/components/settings/config-row";
import {
  SettingsSections,
  type SettingsSection,
} from "@/components/settings/settings-sections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuth } from "@/lib/better-auth/runtime";
import {
  getPasskeyAuthenticatorIcon,
  getPasskeyAuthenticatorName,
  isCustomPasskeyName,
} from "@/lib/better-auth/passkey-authenticator";
import { requirePageSession } from "@/lib/better-auth/session";
import { getConfigGroup, getOverriddenKeys, hasEnvValue } from "@/lib/config";
import {
  CONFIG_GROUPS,
  isDbOverridable,
  sectionsOfGroup,
  type ConfigGroup,
} from "@/lib/config/registry";
import { configPreview } from "@/lib/config/value-rules";
import { cn } from "@/lib/utils";

import { LinkedAccounts } from "./account-linked";
import { ChangePasswordForm } from "./account-password";
import { Passkeys, type ProfilePasskey } from "./account-passkeys";
import { ProfileNameForm } from "./account-name";

export const metadata: Metadata = { title: "配置" };

type SettingsTab = ConfigGroup | "account";

const TAB_LABELS: readonly { id: SettingsTab; label: string }[] = [
  { id: "account", label: "账号" },
  ...CONFIG_GROUPS,
];

type PasskeyRow = {
  id: string;
  name?: string | null;
  aaguid?: string | null;
  createdAt?: Date | string | null;
  backedUp?: boolean | null;
  deviceType?: string | null;
};

function toProfilePasskey(passkey: PasskeyRow): ProfilePasskey {
  const authenticator = getPasskeyAuthenticatorName(passkey.aaguid);
  const storedName = passkey.name?.trim() ?? "";
  const customName = isCustomPasskeyName(storedName, passkey.aaguid)
    ? storedName
    : null;
  const createdAt =
    passkey.createdAt instanceof Date
      ? passkey.createdAt.toISOString().slice(0, 10)
      : typeof passkey.createdAt === "string"
        ? passkey.createdAt.slice(0, 10)
        : null;

  return {
    id: passkey.id,
    name: customName,
    authenticator,
    iconSrc: getPasskeyAuthenticatorIcon(passkey.aaguid) ?? null,
    createdAt,
    synced: Boolean(passkey.backedUp),
    deviceBound: passkey.deviceType === "singleDevice",
  };
}

function parseTab(value: string | string[] | undefined): SettingsTab {
  const raw = typeof value === "string" ? value.trim() : "";
  return TAB_LABELS.find((entry) => entry.id === raw)?.id ?? "site";
}

function tabHref(tab: SettingsTab) {
  return tab === "account" ? "/admin/settings?g=account" : `/admin/settings?g=${tab}`;
}

async function AccountContent() {
  const session = await requirePageSession("/admin/settings?g=account");
  const auth = await getAuth();
  const requestHeaders = await headers();

  const [accounts, passkeys] = await Promise.all([
    auth.api.listUserAccounts({ headers: requestHeaders }),
    auth.api.listPasskeys({ headers: requestHeaders }),
  ]);

  const hasCredential = accounts.some(
    (account) => account.providerId === "credential",
  );
  const linkedAccounts = accounts
    .filter((account) => account.providerId !== "credential")
    .map((account) => ({
      id: account.id,
      providerId: account.providerId,
    }));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">昵称：</span>
            {session.user.name}
          </p>
          <p>
            <span className="text-muted-foreground">邮箱：</span>
            {session.user.email}
          </p>
        </CardContent>
      </Card>

      <ProfileNameForm initialName={session.user.name} />

      <LinkedAccounts linkedAccounts={linkedAccounts} />

      <Passkeys passkeys={passkeys.map(toProfilePasskey)} />

      <ChangePasswordForm hasCredential={hasCredential} />
    </div>
  );
}

async function loadSections(group: ConfigGroup): Promise<SettingsSection[]> {
  const [values, overridden] = await Promise.all([
    getConfigGroup(group),
    getOverriddenKeys(),
  ]);
  const overriddenSet = new Set(overridden);
  return sectionsOfGroup(group).map((section) => ({
    title: section.title,
    fields: section.items.map((item): ConfigRowState => {
      const isOverridden = overriddenSet.has(item.key);
      const value = values[item.key] ?? "";
      return {
        item,
        source: isOverridden ? "db" : "env",
        storedValue: item.secret ? "" : isOverridden ? value : "",
        envConfigured: hasEnvValue(item),
        effectivePreview:
          item.secret && value
            ? "••••••（已配置）"
            : item.type === "textarea"
              ? configPreview(value)
              : value.trim() || "（未配置）",
        dbOverridable: isDbOverridable(item),
      };
    }),
  }));
}

async function SettingsContent({
  searchParams,
}: {
  searchParams: Promise<{ g?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const tab = parseTab(params.g);

  const sections: SettingsSection[] =
    tab === "account" ? [] : await loadSections(tab);

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <nav className="flex flex-col gap-1">
        {TAB_LABELS.map((entry) => (
          <Link
            key={entry.id}
            href={tabHref(entry.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              entry.id === tab
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-base font-medium">
          {TAB_LABELS.find((entry) => entry.id === tab)?.label}
        </h3>
        {tab === "account" ? (
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
            <AccountContent />
          </Suspense>
        ) : (
          <SettingsSections sections={sections} />
        )}
      </section>
    </div>
  );
}

export default function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string | string[] }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-medium">配置</h2>
      <p className="text-sm text-muted-foreground">
        入库配置优先于环境变量；「跟随环境变量」表示不覆盖。
      </p>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <SettingsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
