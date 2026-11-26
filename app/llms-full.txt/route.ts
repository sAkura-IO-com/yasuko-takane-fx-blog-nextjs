import { cachedPublishedPostBodies } from "@/lib/blog/cached";
import { renderLlmsFull } from "@/lib/seo/llms";

export async function GET() {
  const posts = await cachedPublishedPostBodies();
  const content = renderLlmsFull({ posts });

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
