import {
  cachedContentTypes,
  cachedContentTypeBySlug,
} from "@/lib/content-types/cached";
import {
  SectionIndexScreen,
  sectionIndexMetadata,
} from "@/components/content/section-screens";

type CustomIndexProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

async function customType(params: CustomIndexProps["params"]) {
  const { slug } = await params;
  const type = await cachedContentTypeBySlug(slug);
  if (!type || type.isSystem) return null;
  return type;
}

export async function generateStaticParams() {
  const types = await cachedContentTypes();
  const params = types
    .filter((type) => type.enabled && !type.isSystem)
    .map((type) => ({ slug: type.slug }));
  return params.length > 0 ? params : [{ slug: "__placeholder__" }];
}

export function generateMetadata({ params }: CustomIndexProps) {
  return sectionIndexMetadata(customType(params));
}

export default function CustomIndexPage({
  params,
  searchParams,
}: CustomIndexProps) {
  return (
    <SectionIndexScreen type={customType(params)} searchParams={searchParams} />
  );
}
