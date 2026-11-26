import Link from "next/link";

import type { PublishedPostCard } from "@/lib/blog/db";
import { postPath } from "@/lib/content-types/paths";
import { fxCopy } from "@/lib/fx/copy";

const SIBLINGS = 3;

type PageItem =
  | { type: "page"; post: PublishedPostCard; index: number }
  | { type: "ellipsis"; key: string };

export function FxPostPager({
  cards,
  currentSlug,
  typeSlug,
}: {
  cards: PublishedPostCard[];
  currentSlug: string;
  typeSlug: string;
}) {
  const currentIndex = cards.findIndex((card) => card.slug === currentSlug);
  const nextPost = currentIndex === -1 ? undefined : cards[currentIndex + 1];

  const items: PageItem[] = [];
  if (cards.length > 0) {
    const total = cards.length;
    const start =
      currentIndex === -1 ? 0 : Math.max(0, currentIndex - SIBLINGS);
    const end =
      currentIndex === -1
        ? Math.min(total - 1, SIBLINGS * 2)
        : Math.min(total - 1, currentIndex + SIBLINGS);

    if (start > 0) {
      items.push({ type: "page", post: cards[0], index: 0 });
      if (start > 1) items.push({ type: "ellipsis", key: "left" });
    }

    for (let index = start; index <= end; index += 1) {
      items.push({ type: "page", post: cards[index], index });
    }

    if (end < total - 1) {
      if (end < total - 2) items.push({ type: "ellipsis", key: "right" });
      items.push({
        type: "page",
        post: cards[total - 1],
        index: total - 1,
      });
    }
  }

  return (
    <div className="fx-entry-pager">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) =>
          item.type === "ellipsis" ? (
            <span key={item.key} className="px-1 opacity-50" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={item.post.id}
              href={postPath(typeSlug, item.post.slug)}
              title={item.post.title}
              aria-current={item.post.slug === currentSlug ? "page" : undefined}
            >
              {item.index + 1}
            </Link>
          ),
        )}
      </div>

      {nextPost ? (
        <Link
          href={postPath(typeSlug, nextPost.slug)}
          title={nextPost.title}
          className="fx-entry-next"
        >
          {fxCopy.nextPage} &gt;
        </Link>
      ) : null}
    </div>
  );
}
