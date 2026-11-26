import { OPTIONS } from "@/lib/api/v1/http";
import { getPostComments, postPostComment } from "@/lib/api/v1/handlers";

export { OPTIONS };

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return getPostComments(request, slug, "note");
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return postPostComment(request, slug, "note");
}
