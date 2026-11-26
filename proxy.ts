import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic auth gate：仅拦截需要登录的路由。
 * Cookie 存在即放行；页面与 API 仍会校验真实 session。
 * 未匹配路由（404）不在保护范围内，避免误跳登录。
 * 不在这里查库：未知根路径没有动态段，由路由本身返回 404。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (sessionCookie) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

function requiresAuth(pathname: string) {
  if (pathname.startsWith("/admin")) return true;

  if (pathname.startsWith("/api/media")) return true;
  if (pathname.startsWith("/api/files")) return true;
  return false;
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and static assets (incl. glTF / audio).
     * txt / xml / webmanifest：SEO/AEO 发现端点（llms.txt、robots.txt、sitemap.xml、rss.xml、manifest.webmanifest、IndexNow key）。
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|woff|ttf|otf|txt|xml|webmanifest)$).*)",
  ],
};
