"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fxCopy } from "@/lib/fx/copy";

type SearchResult = {
  path: string;
  title: string;
  snippet?: string;
};

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export function FxSearchBox({ limit = 6 }: { limit?: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { items?: SearchResult[] };
        setResults(data.items ?? []);
        setActive(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, limit]);

  function go(path: string) {
    setOpen(false);
    setQuery("");
    router.push(path);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive((prev) => {
        const next = prev + delta;
        if (next < 0) return results.length - 1;
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0 && results[active]) go(results[active].path);
      else if (query.trim())
        go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const showDropdown = open && query.trim().length >= MIN_CHARS;

  return (
    <search ref={rootRef} className="fx-live-search">
      <div className="fx-live-search-row">
        <input
          type="search"
          className="fx-live-search-input"
          value={query}
          placeholder={fxCopy.searchPlaceholder}
          aria-label={fxCopy.searchPosts}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="fx-live-search-results"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.trim().length >= MIN_CHARS) setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fx/search.svg" alt="" className="fx-live-search-icon" />
      </div>

      {showDropdown ? (
        <div id="fx-live-search-results" className="fx-live-search-results">
          {loading ? (
            <div className="fx-live-search-status">{fxCopy.searching}</div>
          ) : results.length === 0 ? (
            <div className="fx-live-search-status">
              {fxCopy.searchNoResults}
            </div>
          ) : (
            results.map((result, index) => (
              <Link
                key={result.path}
                href={result.path}
                className={`fx-live-search-result${index === active ? " is-active" : ""}`}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActive(index)}
              >
                {result.title}
              </Link>
            ))
          )}
        </div>
      ) : null}
    </search>
  );
}
