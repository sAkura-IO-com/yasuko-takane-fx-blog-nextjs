"use client";

import { useEffect, useState } from "react";

export function SiteCopyrightYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  if (year === null) {
    return <span aria-hidden="true">…</span>;
  }

  return <span>{year}</span>;
}
