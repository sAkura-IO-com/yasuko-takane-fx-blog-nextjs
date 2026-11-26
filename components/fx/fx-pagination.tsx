import Link from "next/link";

import { fxCopy } from "@/lib/fx/copy";

export function FxPagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="fx-pagination" aria-label={fxCopy.pagination}>
      {page > 1 ? (
        <Link href={basePath} className="fx-page-btn">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          {fxCopy.firstPage}
        </Link>
      ) : null}

      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
          className="fx-page-btn ms-auto"
        >
          {fxCopy.nextPage}
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
      ) : null}
    </nav>
  );
}
