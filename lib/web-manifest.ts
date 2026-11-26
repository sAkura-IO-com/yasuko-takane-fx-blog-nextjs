import type { MetadataRoute } from "next";

import { siteDescription, siteName, siteShortName } from "@/lib/seo/copy";

const shortcutIcon = {
  src: "/icon-96.png",
  sizes: "96x96",
  type: "image/png",
} as const;

export function webAppManifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteShortName,
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f0f6",
    theme_color: "#f7f0f6",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "記事一覧",
        url: "/posts",
        description: "すべての記事を見る",
        icons: [shortcutIcon],
      },
      {
        name: "管理画面",
        url: "/admin",
        description: "コンテンツ管理画面を開く",
        icons: [shortcutIcon],
      },
    ],
  };
}
