import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** CSP 的 img-src / connect-src 需要 R2 公开域名与直传端点的 origin（构建期读取；拿不到就退回 https:）。 */
function mediaOrigins(): string[] {
  const bases = [process.env.R2_PUBLIC_BASE_URL, process.env.R2_PUBLIC_ENDPOINT]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  if (bases.length === 0) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[csp] 缺少 R2_PUBLIC_BASE_URL，img-src / connect-src 将退回 https: 通配，建议补上后重新构建",
      );
    }
    return [];
  }
  const origins = new Set<string>();
  for (const base of bases) {
    try {
      origins.add(new URL(base).origin);
    } catch {
      continue;
    }
  }
  return [...origins];
}

/**
 * 允许嵌入的第三方 frame 来源（文章里嵌的视频播放器等）。
 * 只白名单到具体子域，别用 https: 通配，否则 frame-src 等于没设防。
 */
const FRAME_SRC_ALLOWLIST = [
  // B 站外接播放器：/posts 里嵌入的 BV 视频 iframe
  "https://player.bilibili.com",
];

/**
 * 静态 CSP，不启用 nonce：nonce 要求每次请求都动态渲染，
 * 会关掉 PPR / ISR / CDN 缓存，与本站的 cacheComponents 架构冲突。
 * 代价是内联脚本需白名单——Next 的流式 hydration、next-themes 防闪烁脚本、
 * JSON-LD 都是内联的，所以保留 'unsafe-inline'，靠其余指令收敛面。
 *
 * allowEval 只给 /admin 开：Monaco 的 AMD loader 用 new Function 求值模块，
 * 公开页面不加载编辑器，没理由跟着放宽。
 */
function buildCsp({ allowEval }: { allowEval: boolean }): string {
  const media = mediaOrigins().join(" ") || "https:";
  // 本地开发常连生产库，历史外链图片（旧 CDN 域名）不在当前 R2 白名单里。
  // 只在 dev 放行 https:，生产构建仍只认当前 R2 公开域名。
  const devHttps = isDev ? " https:" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${
      isDev || allowEval ? " 'unsafe-eval'" : ""
    }`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${media}${devHttps}`,
    `media-src 'self' blob:${devHttps}`,
    "font-src 'self' data:",
    // media：浏览器直传（presigned PUT）与图片读取
    // *.r2.cloudflarestorage.com：浏览器直传（presigned PUT）
    // data: / blob:：not-found 页火柴盒场景用 GLTFLoader 取 pig.gltf 内嵌的 data: buffer（loader 内部另走 blob:），
    // 拦掉会让 useGLTF 永不 resolve，连带拖垮包在同一 Suspense 里的站点外壳与 404 卡片
    `connect-src 'self' ${media} https://*.r2.cloudflarestorage.com data: blob:${devHttps}`,
    // Monaco 的 worker（部分走 blob URL）
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    // 文章内嵌视频播放器 iframe，仅放行白名单来源
    `frame-src 'self' ${FRAME_SRC_ALLOWLIST.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // "upgrade-insecure-requests",
  ].join("; ");
}

/** CSP 之外的通用响应头；CSP 由各路径规则单独下发。 */
const securityHeaders = [
  // {
  //   key: "Strict-Transport-Security",
  //   value: "max-age=63072000; includeSubDomains",
  // },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 旧浏览器兜底，现代浏览器认 CSP 的 frame-ancestors
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // ska-core OAuth 走整页跳转，allow-popups 留出余地
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const longCache = "public, max-age=31536000, immutable";
const mustRevalidate = "public, max-age=0, must-revalidate";

/**
 * Monaco 里的人工文件（非 hash 名）：不能用长缓存，
 * 否则升级 Monaco 后老用户会一直拿到旧 loader。
 */
const MONACO_UNHASHED = [
  "/monaco/vs/loader.js",
  "/monaco/vs/nls.messages-loader.js",
  "/monaco/vs/nls/:path*",
];

const nextConfig: NextConfig = {
  // 额外允许访问开发服务器的 Origin（如 LAN IP / 自定义本地域名），逗号分隔。
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCsp({ allowEval: false }),
          },
          ...securityHeaders,
        ],
      },
      {
        // Monaco 编辑器所在区域，AMD loader 需要 unsafe-eval
        source: "/admin/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCsp({ allowEval: true }),
          },
        ],
      },
      {
        source: "/monaco/:path*",
        headers: [{ key: "Cache-Control", value: longCache }],
      },
      // 同 key 的规则后者覆盖前者，这几条必须排在 /monaco/:path* 之后
      ...MONACO_UNHASHED.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: mustRevalidate }],
      })),

      // 新前台静态资源：背景、装饰 SVG 与广告图；替换文件时改文件名或加 ?v=
      {
        source: "/fx/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
  // OG 路由运行时从 app/og 读取日文 TTF，部署时需随函数追踪
  outputFileTracingIncludes: {
    "/og": ["./app/og/ChironGoRoundTC-450BK.ttf"],
  },
  // /posts/{slug}.md、/notes/{slug}.md、/c/{slug}/{post}.md → Markdown 版本
  async rewrites() {
    return [
      { source: "/posts/:slug.md", destination: "/posts/:slug/md" },
      { source: "/notes/:slug.md", destination: "/notes/:slug/md" },
      { source: "/c/:slug/:postSlug.md", destination: "/c/:slug/:postSlug/md" },
      // feed 的 enclosure 由 URL 扩展名推导 MIME，/og 需要这个带扩展名的别名
      { source: "/og.png", destination: "/og" },
      // 不走 app/manifest.ts，避免 Metadata 在客户端导航时重插 <link rel="manifest">
      {
        source: "/manifest.webmanifest",
        destination: "/web-app-manifest",
      },
    ];
  },
  // S3 / sharp 由 Node runtime 直接加载
  serverExternalPackages: [
    "pg",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "sharp",
  ],
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
    useOffline: true,
    authInterrupts: true,
    // 后台富媒体走 Server Action 上传文件字节。视频软限制 30MB，再留一点 multipart 开销。
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
