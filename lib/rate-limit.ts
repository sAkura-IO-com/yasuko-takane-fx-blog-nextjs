import { clientIpFromHeaders } from "@/lib/http/ip";

type Bucket = { count: number; resetAt: number };

declare global {
  var __skaRateLimitBuckets: Map<string, Bucket> | undefined;
}

const MAX_KEYS = 5000;

function buckets(): Map<string, Bucket> {
  return (globalThis.__skaRateLimitBuckets ??= new Map());
}

export function clientIp(request: Request): string {
  return clientIpFromHeaders(request.headers);
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const store = buckets();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (store.size >= MAX_KEYS) sweep(now);
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

function sweep(now: number) {
  const store = buckets();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  if (store.size >= MAX_KEYS) store.clear();
}
