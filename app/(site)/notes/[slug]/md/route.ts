import { cachedContentTypeByKey } from "@/lib/content-types/cached";
import { sectionMarkdownResponse } from "@/components/content/section-screens";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return sectionMarkdownResponse(await cachedContentTypeByKey("note"), slug);
}
