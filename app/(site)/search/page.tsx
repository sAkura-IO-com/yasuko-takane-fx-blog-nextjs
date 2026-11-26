import type { Metadata } from "next";

import { FxSearchPage } from "@/components/fx/fx-search-page";
import { fxCopy } from "@/lib/fx/copy";

export const metadata: Metadata = {
  title: fxCopy.searchPageTitle,
  description: fxCopy.searchDescription,
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  return <FxSearchPage searchParams={searchParams} />;
}
