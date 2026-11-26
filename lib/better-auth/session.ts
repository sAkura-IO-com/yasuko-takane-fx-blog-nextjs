import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/better-auth/runtime";

type Auth = Awaited<ReturnType<typeof getAuth>>;

export type Session = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

export const getSession = cache(async () => {
  const auth = await getAuth();
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requirePageSession(
  callbackUrl?: string,
): Promise<Session> {
  const session = await getSession();
  if (!session) {
    const params = callbackUrl
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";
    redirect(`/login${params}`);
  }
  return session;
}
