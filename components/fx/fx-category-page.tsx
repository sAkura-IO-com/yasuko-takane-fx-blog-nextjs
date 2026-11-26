import Link from "next/link";

import type { PublishedPostCard } from "@/lib/blog/db";
import type { ContentTypeView } from "@/lib/content-types/types";
import { fxCopy } from "@/lib/fx/copy";

import { FxEmpty } from "./fx-empty";
import { FX_PAGE_SIZE } from "./fx-list-page";
import { FxPagination } from "./fx-pagination";
import { FxPostCard } from "./fx-post-card";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function FxCategoryPage({
  type,
  cards,
  page,
  basePath,
}: {
  type: ContentTypeView;
  cards: PublishedPostCard[];
  page: number;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(cards.length / FX_PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), totalPages);
  const items = cards.slice(
    (current - 1) * FX_PAGE_SIZE,
    current * FX_PAGE_SIZE,
  );

  return (
    <>
      <header className="fx-intro">
        <div className="fx-frame">
          <div className="flex flex-wrap [align-items:last_baseline] justify-between gap-x-10 gap-y-5">
            <div className="min-w-0">
              <p className="fx-eyebrow">{fxCopy.category}</p>
              <h1 className="fx-intro-title">{type.name}</h1>
              <p className="fx-intro-lead">
                {type.description || fxCopy.postsFiledUnder(type.name)}
              </p>
            </div>
            <Link href="/posts" className="fx-arrow-link">
              {fxCopy.allPosts}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      <section className="fx-band-section">
        <div className="fx-frame">
          {items.length === 0 ? (
            <FxEmpty
              title={fxCopy.nothingHereYet}
              description={fxCopy.noPostsInCategory(type.name)}
              action={{ href: "/posts", label: fxCopy.browseAllPosts }}
            />
          ) : (
            <>
              <div className="fx-post-grid">
                {items.map((post) => (
                  <FxPostCard key={post.id} post={post} />
                ))}
              </div>
              <FxPagination
                basePath={basePath}
                page={current}
                totalPages={totalPages}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
