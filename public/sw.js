/* eslint-disable no-undef */
/**
 * 轻量 Service Worker：缓存静态资源、页面文档与 RSC 导航数据，离线可读。
 * 仅生产环境由 components/pwa-register.tsx 注册。
 *
 * 关键认知：SPA 客户端导航不请求 HTML 文档，只请求 RSC 数据（?_rsc=，头 RSC: 1）。
 * 因此除文档外还必须缓存 RSC 响应，并对完整 RSC 加载额外后台缓存对应路径的
 * HTML 文档——否则断网后冷启动/刷新打不开"只通过点击链接访问过"的页面。
 */

const VERSION = "v7";
const STATIC_CACHE = `ska-static-${VERSION}`;
const PAGES_CACHE = `ska-pages-${VERSION}`;

/** 不应被 SW 处理的请求（动态/鉴权/统计/超大的 admin 资源）。 */
function shouldBypass(url, request) {
  if (request.method !== "GET") return true;
  // 音频等资源的分段请求不可缓存
  if (request.headers.has("range")) return true;
  if (url.origin !== self.location.origin) return true;
  const path = url.pathname;
  return (
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/login") ||
    path.startsWith("/_vercel") ||
    path === "/sw.js"
  );
}

/** 带内容哈希的静态资源：缓存优先。 */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/monaco/") ||
    url.pathname.startsWith("/fx/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname.startsWith("/icon-") ||
    url.pathname.startsWith("/pwa/")
  );
}

/** Next.js 的 RSC 导航数据请求。 */
function isRscRequest(url, request) {
  return url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
}

/** 可入缓存的响应：仅完整的 200，排除 206 分段与跨域不透明响应。 */
function isCacheable(response) {
  return response.status === 200;
}

/** 网络优先：成功则更新缓存，失败回退缓存。 */
async function networkFirst(request, cacheName, cacheKey) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const copy = response.clone();
      caches.open(cacheName).then((cache) => cache.put(cacheKey, copy));
    }
    return response;
  } catch {
    const cached = await caches
      .open(cacheName)
      .then((cache) => cache.match(cacheKey));
    return cached ?? Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (shouldBypass(url, request)) return;

  // 1. 静态资源：缓存优先
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (isCacheable(response)) {
          cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  // 2. 页面文档（冷启动 / 刷新 / 直接打开）：网络优先，离线回退按路径匹配
  if (request.mode === "navigate") {
    const pageKey = url.origin + url.pathname;
    event.respondWith(networkFirst(request, PAGES_CACHE, pageKey));
    return;
  }

  // 3. RSC 导航数据：网络优先 + 缓存回退，保证离线时站内导航可用；
  //    完整加载（非预取）时后台补缓存对应路径的 HTML 文档
  if (isRscRequest(url, request)) {
    const rscKey = request.url;
    const isPrefetch = request.headers.get("Next-Router-Prefetch") === "1";
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (isCacheable(response)) {
            const copy = response.clone();
            caches
              .open(PAGES_CACHE)
              .then((cache) => cache.put(rscKey, copy));
            if (!isPrefetch) {
              // 用户真实到访了该页面：后台缓存它的 HTML，供离线冷启动
              const docUrl = url.origin + url.pathname;
              fetch(docUrl)
                .then((doc) => {
                  if (isCacheable(doc)) {
                    return caches
                      .open(PAGES_CACHE)
                      .then((cache) => cache.put(docUrl, doc));
                  }
                })
                .catch(() => {});
            }
          }
          return response;
        } catch {
          const cached = await caches
            .open(PAGES_CACHE)
            .then((cache) => cache.match(rscKey));
          return cached ?? Response.error();
        }
      })(),
    );
    return;
  }

  // 4. 其余同源 GET（rss.xml、favicon.ico 等）：网络优先 + 缓存回退
  event.respondWith(networkFirst(request, STATIC_CACHE, request.url));
});