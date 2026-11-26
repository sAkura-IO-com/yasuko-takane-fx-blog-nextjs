import {
  fxArticleFont,
  fxDecoFont,
  fxMonoFont,
  fxUiFont,
} from "@/app/(site)/fonts";
import { cachedPublishedPostCards, cachedTags } from "@/lib/blog/cached";
import { cachedContentTypes } from "@/lib/content-types/cached";
import { indexPath } from "@/lib/content-types/paths";
import { fxCopy } from "@/lib/fx/copy";
import { buildFxNav } from "@/lib/fx/nav";
import { siteGraphJsonLd } from "@/lib/seo/graph";
import { JsonLdScript } from "@/lib/seo/json-ld";

import { FxDrawer } from "./fx-drawer";
import { FxFooter } from "./fx-footer";
import { FxHeader } from "./fx-header";
import { FxSidebarLeft, FxSidebarRight } from "./fx-sidebar";

export async function FxShell({ children }: { children: React.ReactNode }) {
  const [types, cards, tags] = await Promise.all([
    cachedContentTypes(),
    cachedPublishedPostCards(),
    cachedTags(),
  ]);
  const nav = buildFxNav(types);
  const categories = types
    .filter((type) => type.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((type) => ({ href: indexPath(type.slug), label: type.name }));
  const latest = cards.slice(0, 20);

  return (
    <div
      className={`fx-site ${fxUiFont.variable} ${fxDecoFont.variable} ${fxArticleFont.variable} ${fxMonoFont.variable}`}
    >
      <JsonLdScript data={siteGraphJsonLd()} />
      <a href="#main" className="fx-skip-link">
        {fxCopy.skipToContent}
      </a>

      <FxHeader />

      <main id="main" tabIndex={-1} className="fx-main">
        <section className="fx-band">
          <div className="fx-columns">
            <div className="fx-content">{children}</div>
            <FxDrawer>
              <FxSidebarRight nav={nav} categories={categories} tags={tags} />
              <FxSidebarLeft latest={latest} />
            </FxDrawer>
          </div>
        </section>
      </main>

      <FxFooter />
    </div>
  );
}
