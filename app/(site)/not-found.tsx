import { FxNotFound } from "@/components/fx/fx-not-found";
import { getNotFoundMetadata } from "@/lib/seo/not-found";

export const metadata = getNotFoundMetadata();

export default function SiteNotFound() {
  return <FxNotFound />;
}
