import "server-only";

import { cacheLife } from "next/cache";

export async function currentFxYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}
