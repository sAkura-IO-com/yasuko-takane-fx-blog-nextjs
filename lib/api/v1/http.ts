import { createHash } from "node:crypto";

import { connection, NextResponse } from "next/server";

import { siteUrl } from "@/lib/site";

const CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=3600";

const CORS_METHODS = "GET, HEAD, POST, OPTIONS";

export function allowedOrigins(): string[] {
  const extras = (process.env.PUBLIC_API_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([siteUrl(), ...extras])];
}

function corsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("Origin")?.trim();
  const allowOrigin =
    origin && allowedOrigins().includes(origin) ? origin : "*";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": "Content-Type, If-None-Match, Accept",
    "Access-Control-Expose-Headers": "ETag, Last-Modified",
    "Access-Control-Max-Age": "86400",
  };
  if (allowOrigin !== "*") headers.Vary = "Origin";
  return headers;
}

export function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export type PublicApiErrorCode =
  | "not_found"
  | "invalid_slug"
  | "invalid_cursor"
  | "invalid_input"
  | "rate_limited"
  | "internal";

export function jsonError(
  request: Request,
  status: number,
  code: PublicApiErrorCode,
  message: string,
  extra?: {
    fields?: Record<string, string>;
  },
) {
  const error: {
    code: PublicApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  } = { code, message };
  if (extra?.fields) error.fields = extra.fields;

  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        ...corsHeaders(request),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function jsonWrite(request: Request, body: unknown, status = 201) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...corsHeaders(request),
      "Cache-Control": "no-store",
    },
  });
}

export function jsonRateLimited(request: Request, retryAfterSeconds: number) {
  const response = jsonError(
    request,
    429,
    "rate_limited",
    "请求过于频繁，请稍后再试",
  );
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

export async function jsonOk(
  request: Request,
  body: unknown,
  options: { updatedAt?: Date | null; etagSeed?: string } = {},
) {
  await connection();
  const payload = JSON.stringify(body);
  const etag = weakEtag(options.etagSeed ?? payload);
  const headers: Record<string, string> = {
    ...corsHeaders(request),
    ETag: etag,
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": "application/json; charset=utf-8",
  };
  if (options.updatedAt) {
    headers["Last-Modified"] = options.updatedAt.toUTCString();
  }

  if (ifNoneMatch(request, etag)) {
    return new NextResponse(null, { status: 304, headers });
  }

  return new NextResponse(payload, { status: 200, headers });
}

function weakEtag(seed: string): string {
  const hash = createHash("sha1").update(seed).digest("hex").slice(0, 16);
  return `W/"${hash}"`;
}

function ifNoneMatch(request: Request, etag: string): boolean {
  const raw = request.headers.get("if-none-match");
  if (!raw) return false;
  if (raw.trim() === "*") return true;
  const needle = unwrapEtag(etag);
  return raw.split(",").some((part) => unwrapEtag(part) === needle);
}

function unwrapEtag(value: string): string {
  return value.trim().replace(/^W\//i, "").replaceAll('"', "");
}
