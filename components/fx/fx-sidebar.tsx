import Image from "next/image";
import Link from "next/link";

import type { PublishedPostCard } from "@/lib/blog/db";
import { postPath } from "@/lib/content-types/paths";
import { fxAds, type FxAd } from "@/lib/fx/ads";
import { fxCopy } from "@/lib/fx/copy";
import type { FxNavItem } from "@/lib/fx/nav";

import { FxSearchBox } from "./fx-search-box";

export function FxSidebarRight({
  nav,
  categories,
  tags,
}: {
  nav: FxNavItem[];
  categories: { href: string; label: string }[];
  tags: { slug: string; name: string }[];
}) {
  return (
    <aside className="fx-sidebar is-right" aria-label={fxCopy.sidebar}>
      <div className="fx-sidebar-inner">
        <div className="fx-follow">
          <Link href="/rss.xml" className="fx-follow-link">
            {fxCopy.follow}
          </Link>
        </div>

        <nav className="fx-nav-block" aria-label={fxCopy.blogTop}>
          <div className="fx-nav-heading">{fxCopy.blogTop}</div>
          <a className="fx-nav-link">{fxCopy.photos}</a>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="fx-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="w-full">
          <FxSearchBox />
        </div>

        {categories.length > 0 ? (
          <div className="fx-sidebar-section">
            <div className="fx-sidebar-heading">{fxCopy.categories}</div>
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="fx-tag-link"
              >
                <span>{category.label}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div className="fx-sidebar-section">
            <div className="fx-sidebar-heading">{fxCopy.tags}</div>
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="fx-tag-link"
              >
                <span>{tag.name}</span>
              </Link>
            ))}
            <span className="fx-show-more">{fxCopy.showMore}</span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function FxSidebarLeft({ latest }: { latest: PublishedPostCard[] }) {
  return (
    <aside className="fx-sidebar is-left" aria-label={fxCopy.latestPosts}>
      <div className="fx-sidebar-spacer" />
      <div className="fx-sidebar-inner">
        <FxAdItem ad={fxAds[0]} />
        <FxAdItem ad={fxAds[1]} />
        <FxLatestPosts latest={latest} />
        <FxAdItem ad={fxAds[2]} />
        <FxAdItem ad={fxAds[3]} />
      </div>
    </aside>
  );
}

function FxAdItem({ ad }: { ad: FxAd | undefined }) {
  if (!ad) return null;

  const image = (
    <Image
      src={ad.image}
      alt={ad.alt}
      width={ad.width}
      height={ad.height}
      sizes="(min-width: 1100px) 18vw, 80vw"
      className="h-auto w-full rounded-(--fx-radius)"
    />
  );

  return (
    <div className="fx-ad">
      {ad.href ? <a href={ad.href}>{image}</a> : image}
      {ad.text ? <div className="fx-ad-text">{ad.text}</div> : null}
    </div>
  );
}

function FxLatestPosts({ latest }: { latest: PublishedPostCard[] }) {
  return (
    <div className="fx-sidebar-section">
      <div className="fx-sidebar-heading">{fxCopy.latestPosts}</div>
      {latest.length === 0 ? (
        <p className="text-sm text-(--fx-muted)">{fxCopy.noPostsYet}</p>
      ) : (
        latest.map((post) => (
          <Link
            key={post.id}
            href={postPath(post.typeSlug, post.slug)}
            className="fx-latest-link"
          >
            <span>{post.title}</span>
          </Link>
        ))
      )}
      <Link href="/posts" className="fx-latest-more">
        <span className="fx-follow-link fx-latest-more-button">
          {fxCopy.allPosts}
        </span>
      </Link>
    </div>
  );
}
