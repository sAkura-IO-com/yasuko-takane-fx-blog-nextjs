import type { PublishedPostCard } from "@/lib/blog/db";
import type { ContentTypeView } from "@/lib/content-types/types";
import { sectionListCopy } from "@/lib/content-types/presentation";
import { fxCopy } from "@/lib/fx/copy";

import { FxEmpty } from "./fx-empty";
import { FxPagination } from "./fx-pagination";
import { FxPostRow } from "./fx-post-row";

export const FX_PAGE_SIZE = 20;

export function FxListPage({
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
  const copy = sectionListCopy(type);
  const title = type.key === "article" ? fxCopy.allPosts : type.name;
  const lead = type.key === "article" ? fxCopy.allPostsLead : type.description;

  return (
    <>
      <header className="fx-intro">
        <div className="fx-frame">
          <p className="fx-eyebrow">{fxCopy.archive}</p>
          <h1 className="fx-intro-title">{title}</h1>
          {lead ? <p className="fx-intro-lead">{lead}</p> : null}
        </div>
      </header>

      <section className="fx-band-section fx-band-section-flush">
        <div className="fx-frame">
          {items.length === 0 ? (
            <FxEmpty
              title={copy.emptyTitle}
              description={copy.emptyDescription}
              action={{ href: "/posts", label: fxCopy.browseAllPosts }}
            />
          ) : (
            <>
              <ol className="fx-post-list">
                {items.map((post) => (
                  <li key={post.id}>
                    <FxPostRow post={post} />
                  </li>
                ))}
              </ol>
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
