import type { Metadata } from "next";

import { FxEmpty } from "@/components/fx/fx-empty";
import { FxEntry } from "@/components/fx/fx-entry";
import {
  cachedPublishedPost,
  cachedPublishedPostCards,
} from "@/lib/blog/cached";
import { cachedContentTypeByKey } from "@/lib/content-types/cached";
import { fxCopy } from "@/lib/fx/copy";
import { siteName } from "@/lib/seo/copy";
import { getEntryMetadata } from "@/lib/seo/entry";
import { getHomeMetadata } from "@/lib/seo/pages";

export function generateMetadata(): Promise<Metadata> {
  return latestArticleState().then(({ type, state }) => {
    if (!type || !state.data) return getHomeMetadata();
    return getEntryMetadata(type, state.data.post, { path: "/" });
  });
}

async function latestArticleState() {
  const [type, cards] = await Promise.all([
    cachedContentTypeByKey("article"),
    cachedPublishedPostCards("article"),
  ]);
  const latest = cards[0];
  if (!latest) return { type, cards, state: { data: null } };

  const data = await cachedPublishedPost(latest.slug, "article");
  return { type, cards, state: { data } };
}

function FxHomeEmpty() {
  return (
    <>
      <header className="fx-intro">
        <div className="fx-frame">
          <p className="fx-eyebrow">{siteName}</p>
          <h1 className="fx-intro-title">{fxCopy.homeEmptyTitle}</h1>
          <p className="fx-intro-lead">{fxCopy.homeEmptyText}</p>
        </div>
      </header>
      <section className="fx-band-section">
        <div className="fx-frame">
          <FxEmpty
            title={fxCopy.noPostsYet}
            description={fxCopy.postsAppearHere}
            action={{ href: "/posts", label: fxCopy.allPosts }}
          />
        </div>
      </section>
    </>
  );
}

export default async function Page() {
  const { type, cards, state } = await latestArticleState();
  if (!type || !state.data) return <FxHomeEmpty />;

  return (
    <FxEntry
      type={type}
      post={state.data.post}
      html={state.data.html}
      cards={cards}
      canonicalPath="/"
      showBreadcrumb={false}
    />
  );
}
