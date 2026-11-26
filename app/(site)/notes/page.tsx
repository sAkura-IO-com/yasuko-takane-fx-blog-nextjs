import { cachedContentTypeByKey } from "@/lib/content-types/cached";
import {
  SectionIndexScreen,
  sectionIndexMetadata,
} from "@/components/content/section-screens";

type NotesPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export function generateMetadata() {
  return sectionIndexMetadata(cachedContentTypeByKey("note"));
}

export default function NotesPage({ searchParams }: NotesPageProps) {
  return (
    <SectionIndexScreen
      type={cachedContentTypeByKey("note")}
      searchParams={searchParams}
    />
  );
}
