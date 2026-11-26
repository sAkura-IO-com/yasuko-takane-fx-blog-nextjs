import { listPublishedSlugs } from "@/lib/blog/db";
import { cachedContentTypeByKey } from "@/lib/content-types/cached";
import {
  SectionEntryScreen,
  sectionEntryMetadata,
} from "@/components/content/section-screens";

type NotesEntryProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs("note");
  return slugs.length > 0 ? slugs : [{ slug: "__placeholder__" }];
}

export function generateMetadata({ params }: NotesEntryProps) {
  return sectionEntryMetadata(
    cachedContentTypeByKey("note"),
    params.then((item) => item.slug),
  );
}

export default function NotesEntryPage({ params }: NotesEntryProps) {
  return (
    <SectionEntryScreen
      type={cachedContentTypeByKey("note")}
      slug={params.then((item) => item.slug)}
    />
  );
}
