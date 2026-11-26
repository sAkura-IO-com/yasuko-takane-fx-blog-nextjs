import { listPublishedSlugs } from "@/lib/blog/db";
import {
  cachedContentTypes,
  cachedContentTypeBySlug,
} from "@/lib/content-types/cached";
import {
  SectionEntryScreen,
  sectionEntryMetadata,
} from "@/components/content/section-screens";

type CustomEntryProps = {
  params: Promise<{ slug: string; postSlug: string }>;
};

async function customType(params: CustomEntryProps["params"]) {
  const { slug } = await params;
  const type = await cachedContentTypeBySlug(slug);
  if (!type || type.isSystem) return null;
  return type;
}

export async function generateStaticParams() {
  const types = (await cachedContentTypes()).filter(
    (type) => type.enabled && !type.isSystem,
  );
  const params: { slug: string; postSlug: string }[] = [];
  for (const type of types) {
    const slugs = await listPublishedSlugs(type.key);
    for (const item of slugs) {
      params.push({ slug: type.slug, postSlug: item.slug });
    }
  }
  return params.length > 0
    ? params
    : [{ slug: "__placeholder__", postSlug: "__placeholder__" }];
}

export function generateMetadata({ params }: CustomEntryProps) {
  return sectionEntryMetadata(
    customType(params),
    params.then((item) => item.postSlug),
  );
}

export default function CustomEntryPage({ params }: CustomEntryProps) {
  return (
    <SectionEntryScreen
      type={customType(params)}
      slug={params.then((item) => item.postSlug)}
    />
  );
}
