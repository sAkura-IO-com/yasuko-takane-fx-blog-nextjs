import { drizzle } from "drizzle-orm/node-postgres";

import type { relations } from "./relations";

type AppRelations = typeof relations;

/** 仅在 DRIZZLE_DRIVER=node-postgres 时由 db/index.ts 动态加载，避免默认图带上 pg。 */
export function createNodePostgresDb(url: string, appRelations: AppRelations) {
  return drizzle(url, { relations: appRelations });
}
