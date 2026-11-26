import { NextResponse } from "next/server";

import { incrementPostViews } from "@/lib/blog/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const VIEW_RATE_LIMIT = 60;
const VIEW_RATE_WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  const quota = rateLimit(`views:${clientIp(request)}`, {
    limit: VIEW_RATE_LIMIT,
    windowMs: VIEW_RATE_WINDOW_MS,
  });
  if (!quota.ok) {
    return NextResponse.json(
      { ok: false },
      {
        status: 429,
        headers: { "Retry-After": String(quota.retryAfterSeconds) },
      },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const slug =
    typeof body === "object" && body !== null && "slug" in body
      ? (body as { slug: unknown }).slug
      : null;

  if (typeof slug !== "string" || slug.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await incrementPostViews(slug);
  return NextResponse.json({ ok: true });
}
