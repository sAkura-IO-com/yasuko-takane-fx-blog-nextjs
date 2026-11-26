import Link from "next/link";

import { siteName } from "@/lib/seo/copy";

export function FxHeader() {
  return (
    <header className="fx-header">
      <div className="fx-header-inner">
        <div className="fx-header-deco">✞FX堕天使✞</div>
        <div className="fx-header-title-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fx/1059.svg"
            alt=""
            width={80}
            height={80}
            className="fx-header-figure is-mirrored"
          />
          <Link href="/" className="fx-header-title" aria-label={siteName}>
            {siteName}
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fx/1059.svg"
            alt=""
            width={80}
            height={80}
            className="fx-header-figure"
          />
        </div>
      </div>
    </header>
  );
}
