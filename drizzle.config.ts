import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./db/schema.ts", "./db/auth-schema.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 只管理业务表（Vercel World 不在应用库建 Workflow 表）
  tablesFilter: [
    "user",
    "session",
    "account",
    "verification",
    "passkey",
    "content_type",
    "post",
    "tag",
    "post_tag",
    "article_views_daily",
    "post_views_daily",
    "comment",
    "site_state",
    "site_config",
  ],
});
