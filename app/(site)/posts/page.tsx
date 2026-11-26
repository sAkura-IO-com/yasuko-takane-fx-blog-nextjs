import { cachedContentTypeByKey } from "@/lib/content-types/cached";
import {
  SectionIndexScreen,
  sectionIndexMetadata,
} from "@/components/content/section-screens";

type PostsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export function generateMetadata() {
  return sectionIndexMetadata(cachedContentTypeByKey("article"));
}

export default function PostsPage({ searchParams }: PostsPageProps) {
  return (
    <SectionIndexScreen
      type={cachedContentTypeByKey("article")}
      searchParams={searchParams}
    />
  );
}
