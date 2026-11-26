import { getContentCollection } from "@/lib/api/v1/handlers";

type RouteContext = { params: Promise<{ type: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { type } = await context.params;
  return getContentCollection(request, type);
}
