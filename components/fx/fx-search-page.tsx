import { Suspense } from "react";
import Link from "next/link";

import { searchPublishedPosts } from "@/lib/blog/search";
import { fxCopy } from "@/lib/fx/copy";
import { highlightMatches } from "@/lib/fx/highlight";

import { FxEmpty } from "./fx-empty";

type SearchParams = Promise<{ q?: string | string[] }>;

function readQuery(params: { q?: string | string[] }) {
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  return (raw ?? "").trim().slice(0, 64);
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="fx-search-icon"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="fx-search-result-arrow"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SearchFormSkeleton() {
  return (
    <div className="fx-search-form" aria-hidden="true">
      <div className="h-14 w-full rounded-full bg-(--fx-fill)" />
    </div>
  );
}

async function FxSearchForm({ searchParams }: { searchParams: SearchParams }) {
  const query = readQuery(await searchParams);

  return (
    <>
      <form
        method="get"
        action="/search"
        role="search"
        aria-label={fxCopy.searchPosts}
        className="fx-search-form"
      >
        <label htmlFor="search-query" className="sr-only">
          {fxCopy.searchPosts}
        </label>
        <div className="fx-search-field">
          <SearchIcon />
          <input
            id="search-query"
            type="search"
            name="q"
            defaultValue={query}
            placeholder={fxCopy.searchPlaceholder}
            autoFocus={!query}
            className="fx-search-input"
          />
          <button type="submit" className="fx-search-submit">
            {fxCopy.searchButton}
          </button>
        </div>
      </form>

      {!query ? (
        <p className="fx-search-hint">
          {fxCopy.searchHint}{" "}
          <Link href="/posts" className="underline">
            {fxCopy.browseAllPosts}
          </Link>
        </p>
      ) : null}
    </>
  );
}

async function FxSearchResults({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = readQuery(await searchParams);
  if (!query) return null;

  const results = await searchPublishedPosts(query, 30);

  return (
    <section className="fx-band-section">
      <div className="fx-frame">
        {results.length === 0 ? (
          <FxEmpty
            title={fxCopy.noResultsFor(query)}
            description={fxCopy.noResultsText}
            action={{ href: "/posts", label: fxCopy.browseAllPosts }}
          />
        ) : (
          <>
            <div className="fx-section-head">
              <p className="min-w-0 text-sm [overflow-wrap:anywhere] text-(--fx-muted)">
                <strong className="font-medium text-(--fx-text)">
                  {fxCopy.resultsCount(results.length)}
                </strong>{" "}
                {fxCopy.resultsFor(query)}
              </p>
              <Link href="/posts" className="fx-arrow-link">
                {fxCopy.allPosts}
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
              </Link>
            </div>

            <ol className="fx-search-results">
              {results.map((result) => (
                <li key={result.path}>
                  <div className="fx-search-result">
                    <div className="grid min-w-0 gap-1">
                      <h2 className="fx-search-result-title">
                        <Link href={result.path}>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightMatches(result.title, query),
                            }}
                          />
                        </Link>
                      </h2>
                      {result.snippet ? (
                        <p
                          className="fx-search-result-snippet"
                          dangerouslySetInnerHTML={{
                            __html: highlightMatches(result.snippet, query),
                          }}
                        />
                      ) : null}
                      <p className="fx-search-result-path">{result.path}</p>
                    </div>
                    <ArrowIcon />
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}

export function FxSearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <header className="fx-intro">
        <div className="fx-frame">
          <p className="fx-eyebrow">{fxCopy.search}</p>
          <h1 className="fx-intro-title">{fxCopy.searchHeading}</h1>
          <Suspense fallback={<SearchFormSkeleton />}>
            <FxSearchForm searchParams={searchParams} />
          </Suspense>
        </div>
      </header>

      <Suspense fallback={null}>
        <FxSearchResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}
