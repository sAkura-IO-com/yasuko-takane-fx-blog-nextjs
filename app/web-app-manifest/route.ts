import { webAppManifest } from "@/lib/web-manifest";

export function GET() {
  return new Response(JSON.stringify(webAppManifest()), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
