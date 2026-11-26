import { i18n } from "@better-auth/i18n";
import { passkey as passkeyPlugin } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { admin } from "better-auth/plugins/admin";

import {
  account,
  passkey,
  session,
  user,
  verification,
} from "../../db/auth-schema";
import { db } from "../../db";
import { getPasskeyAuthenticatorSource } from "./passkey-authenticator";
import { zhAuthErrors } from "./zh-errors";

export type AuthRuntimeConfig = {
  appUrl: string;
  secret?: string;
  github?: { clientId: string; clientSecret: string };
  adminUserIds: string[];
};

const DEFAULT_APP_URL = "http://localhost:3033";

function passkeyRelyingParty(url: string) {
  try {
    const parsed = new URL(url);
    return { rpID: parsed.hostname, origin: parsed.origin };
  } catch {
    return { rpID: "localhost", origin: DEFAULT_APP_URL };
  }
}

/** 暂不开放注册；邮箱密码、GitHub、通行密钥均拒绝创建新账号 */
const disableSignUp = true;

export function createAuth(runtime: AuthRuntimeConfig) {
  const appUrl = runtime.appUrl.replace(/\/+$/, "") || DEFAULT_APP_URL;
  const { rpID, origin: passkeyOrigin } = passkeyRelyingParty(appUrl);

  return betterAuth({
    baseURL: appUrl,
    ...(runtime.secret ? { secret: runtime.secret } : {}),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification, passkey },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      disableSignUp,
    },
    socialProviders: runtime.github
      ? {
          github: {
            clientId: runtime.github.clientId,
            clientSecret: runtime.github.clientSecret,
            disableSignUp,
          },
        }
      : {},
    account: {
      accountLinking: {
        enabled: true,
        // 不在第三方登录时按邮箱自动合并账号，需登录后手动绑定
        disableImplicitLinking: true,
      },
    },
    rateLimit: {
      enabled: true,
      //限流
      customRules: {
        "/sign-in/email": { window: 60, max: 25 },
        "/sign-up/email": { window: 60, max: 25 },
      },
    },
    onAPIError: {
      errorURL: `${appUrl}/login`,
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminUserIds: runtime.adminUserIds,
        bannedUserMessage: "你的账号已被封禁。",
      }),
      passkeyPlugin({
        rpName: "yasuko-takane-fx-blog",
        rpID,
        origin: passkeyOrigin,
        registration: {
          afterVerification: async ({ verification: verified }) => {
            const name = getPasskeyAuthenticatorSource(
              verified.registrationInfo?.aaguid,
            );
            return name ? { name } : undefined;
          },
        },
      }),
      i18n({
        defaultLocale: "zh",
        translations: { zh: zhAuthErrors },
      }),
      nextCookies(),
    ],
  });
}

/** 仅读环境变量，供 `pnpm auth:generate` 与本地脚本使用。 */
export function envAuthConfig(): AuthRuntimeConfig {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  return {
    appUrl: process.env.SITE_URL ?? DEFAULT_APP_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    github:
      clientId && clientSecret ? { clientId, clientSecret } : undefined,
    adminUserIds: (process.env.SITE_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}
