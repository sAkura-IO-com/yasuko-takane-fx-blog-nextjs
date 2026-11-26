import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";

import { relations } from "./relations";

/**
 * Drizzle Postgres 客户端。
 * 默认 Neon serverless（Vercel 等无长连接环境）；只有 `DRIZZLE_DRIVER=node-postgres`
 * 时才动态加载 `pg`，走标准 TCP 连接池（本地开发）。
 * 需配置 `DATABASE_URL`（Neon 建议带 `?sslmode=require`）。
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  // 占位，保证未加载 env 时也能通过 typecheck；实际查询需真实 URL
  "postgres://user:pass@localhost:5432/yasuko-takane-fx-blog";

async function openDatabase() {
  if (process.env.DRIZZLE_DRIVER === "node-postgres") {
    const { createNodePostgresDb } = await import("./node-postgres");
    return createNodePostgresDb(databaseUrl, relations);
  }
  return drizzleNeon(databaseUrl, { relations });
}

export const db = await openDatabase();
