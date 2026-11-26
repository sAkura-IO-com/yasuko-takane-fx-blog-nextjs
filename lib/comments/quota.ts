import { rateLimit, type RateLimitResult } from "@/lib/rate-limit";

export const COMMENT_RATE_LIMIT = 6;
export const COMMENT_RATE_WINDOW_MS = 10 * 60 * 1000;

export function takeCommentQuota(ip: string): RateLimitResult {
  return rateLimit(`comment:${ip}`, {
    limit: COMMENT_RATE_LIMIT,
    windowMs: COMMENT_RATE_WINDOW_MS,
  });
}
