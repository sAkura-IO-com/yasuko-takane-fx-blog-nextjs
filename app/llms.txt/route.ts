import { cachedPublishedPostMetas } from "@/lib/blog/cached";
import { cachedContentTypes } from "@/lib/content-types/cached";
import { renderLlmsTxt } from "@/lib/seo/llms";

export async function GET() {
  const [types, posts] = await Promise.all([
    cachedContentTypes(),
    cachedPublishedPostMetas(),
  ]);

  const content = renderLlmsTxt({ types, posts });

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
