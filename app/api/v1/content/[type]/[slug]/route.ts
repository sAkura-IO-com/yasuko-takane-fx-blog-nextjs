import { getContentItem } from "@/lib/api/v1/handlers";

type RouteContext = { params: Promise<{ type: string; slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { type, slug } = await context.params;
  return getContentItem(request, type, slug);
}
