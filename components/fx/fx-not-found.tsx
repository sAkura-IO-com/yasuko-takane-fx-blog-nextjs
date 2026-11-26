import Link from "next/link";

import { fxCopy } from "@/lib/fx/copy";

export function FxNotFound() {
  return (
    <section className="fx-not-found">
      <div className="fx-not-found-dots" aria-hidden="true" />
      <div className="fx-frame fx-not-found-inner">
        <p className="fx-error-badge">{fxCopy.errorCode}</p>
        <h1 className="fx-intro-title">{fxCopy.pageNotFound}</h1>
        <p className="fx-not-found-text">{fxCopy.pageNotFoundText}</p>

        <div className="fx-not-found-actions">
          <Link href="/" className="fx-primary-btn">
            {fxCopy.goHome}
          </Link>
          <Link href="/posts" className="fx-page-btn">
            {fxCopy.browseAllPosts}
          </Link>
        </div>

        <form
          method="get"
          action="/search"
          role="search"
          aria-label={fxCopy.searchPosts}
          className="fx-search-form fx-not-found-search"
        >
          <label htmlFor="not-found-query" className="sr-only">
            {fxCopy.searchPosts}
          </label>
          <div className="fx-search-field">
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
            <input
              id="not-found-query"
              type="search"
              name="q"
              placeholder={fxCopy.searchPlaceholder}
              className="fx-search-input fx-not-found-input"
            />
            <button
              type="submit"
              className="fx-not-found-submit"
              aria-label={fxCopy.search}
            >
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
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
