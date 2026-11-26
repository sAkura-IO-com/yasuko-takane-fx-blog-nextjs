import { cachedContentTypeBySlug } from "@/lib/content-types/cached";
import { sectionMarkdownResponse } from "@/components/content/section-screens";

type RouteContext = { params: Promise<{ slug: string; postSlug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug, postSlug } = await context.params;
  const type = await cachedContentTypeBySlug(slug);
  return sectionMarkdownResponse(
    type && !type.isSystem ? type : null,
    postSlug,
  );
}
