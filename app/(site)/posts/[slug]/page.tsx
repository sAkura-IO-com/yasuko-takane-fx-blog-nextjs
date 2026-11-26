import { listPublishedSlugs } from "@/lib/blog/db";
import { cachedContentTypeByKey } from "@/lib/content-types/cached";
import {
  SectionEntryScreen,
  sectionEntryMetadata,
} from "@/components/content/section-screens";

type PostsEntryProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs("article");
  return slugs.length > 0 ? slugs : [{ slug: "__placeholder__" }];
}

export function generateMetadata({ params }: PostsEntryProps) {
  return sectionEntryMetadata(
    cachedContentTypeByKey("article"),
    params.then((item) => item.slug),
  );
}

export default function PostsEntryPage({ params }: PostsEntryProps) {
  return (
    <SectionEntryScreen
      type={cachedContentTypeByKey("article")}
      slug={params.then((item) => item.slug)}
    />
  );
}
