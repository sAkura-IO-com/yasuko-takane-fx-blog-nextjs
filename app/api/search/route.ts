import { NextResponse, connection } from "next/server";

import { searchPublishedPosts } from "@/lib/blog/search";

export async function GET(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const requestedLimit = Number(searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 10;

  const results = query ? await searchPublishedPosts(query, limit) : [];

  return NextResponse.json(
    {
      items: results.map((result) => ({
        path: result.path,
        title: result.title,
        snippet: result.snippet,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
