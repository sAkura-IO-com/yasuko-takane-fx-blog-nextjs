import { i18nClient } from "@better-auth/i18n/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./auth-cli";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    passkeyClient(),
    i18nClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
