import { cachedFeedEntries, createFeed } from "@/lib/blog/feed";

export async function GET() {
  const feed = createFeed(await cachedFeedEntries());

  return new Response(feed.atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
