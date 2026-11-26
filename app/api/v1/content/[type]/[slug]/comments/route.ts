import { getContentComments, postContentComment } from "@/lib/api/v1/handlers";

type RouteContext = { params: Promise<{ type: string; slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { type, slug } = await context.params;
  return getContentComments(request, type, slug);
}

export async function POST(request: Request, context: RouteContext) {
  const { type, slug } = await context.params;
  return postContentComment(request, type, slug);
}
