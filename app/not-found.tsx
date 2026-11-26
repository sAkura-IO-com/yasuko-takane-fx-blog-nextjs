import "@/components/fx/fx.css";
import { FxNotFound } from "@/components/fx/fx-not-found";
import { FxShell } from "@/components/fx/fx-shell";
import { getNotFoundMetadata } from "@/lib/seo/not-found";

export const metadata = getNotFoundMetadata();

export default function NotFound() {
  return (
    <FxShell>
      <FxNotFound />
    </FxShell>
  );
}
