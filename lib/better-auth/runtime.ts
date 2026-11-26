import "server-only";

import { getConfig } from "@/lib/config";

import { createAuth, type AuthRuntimeConfig } from "./auth-factory";

const CACHE_TTL_MS = 10_000;

let cached: {
  at: number;
  signature: string;
  auth: ReturnType<typeof createAuth>;
} | null = null;

async function resolveRuntimeConfig(): Promise<AuthRuntimeConfig> {
  const [appUrl, clientId, clientSecret, adminIds] = await Promise.all([
    getConfig("site.url"),
    getConfig("auth.github_client_id"),
    getConfig("auth.github_client_secret"),
    getConfig("auth.site_admin_user_ids"),
  ]);

  const trimmedId = clientId.trim();
  const trimmedSecret = clientSecret.trim();

  return {
    appUrl: appUrl.trim() || "http://localhost:3033",
    secret: process.env.BETTER_AUTH_SECRET,
    github:
      trimmedId && trimmedSecret
        ? { clientId: trimmedId, clientSecret: trimmedSecret }
        : undefined,
    adminUserIds: adminIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function signatureOf(runtime: AuthRuntimeConfig): string {
  return JSON.stringify([
    runtime.appUrl,
    runtime.github?.clientId ?? "",
    runtime.github?.clientSecret ?? "",
    runtime.adminUserIds,
  ]);
}

export async function getAuth() {
  const runtime = await resolveRuntimeConfig();
  const signature = signatureOf(runtime);
  const now = Date.now();

  if (cached && cached.signature === signature && now - cached.at < CACHE_TTL_MS) {
    return cached.auth;
  }

  const auth = createAuth(runtime);
  cached = { at: now, signature, auth };
  return auth;
}

export function invalidateAuth(): void {
  cached = null;
}
