import { OPTIONS } from "@/lib/api/v1/http";
import { getPostDetail } from "@/lib/api/v1/handlers";

export { OPTIONS };

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return getPostDetail(request, slug, "note");
}
