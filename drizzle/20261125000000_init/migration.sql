CREATE TYPE "comment_status" AS ENUM('pending', 'approved', 'rejected', 'spam');--> statement-breakpoint
CREATE TYPE "content_layout" AS ENUM('article', 'note');--> statement-breakpoint
CREATE TYPE "post_kind" AS ENUM('article', 'note');--> statement-breakpoint
CREATE TYPE "post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "article_views_daily" (
	"day" date PRIMARY KEY,
	"page_views" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "article_views_daily_page_views_nonneg" CHECK ("page_views" >= 0)
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"post_id" uuid NOT NULL,
	"parent_id" uuid,
	"root_id" uuid,
	"author_name" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" "comment_status" DEFAULT 'pending'::"comment_status" NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by_user_id" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_body_length" CHECK (char_length("body") <= 2000),
	CONSTRAINT "comment_thread_shape" CHECK (("parent_id" is null and "root_id" is null) or ("parent_id" is not null and "root_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "content_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"singular_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"seo_title" text DEFAULT '' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"crumb_name" text NOT NULL,
	"article_section" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"layout" "content_layout" DEFAULT 'article'::"content_layout" NOT NULL,
	"show_in_nav" boolean DEFAULT true NOT NULL,
	"show_on_home" boolean DEFAULT false NOT NULL,
	"home_featured_count" integer DEFAULT 0 NOT NULL,
	"markdown_export" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_type_key_format" CHECK ("key" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "content_type_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "content_type_home_featured_nonneg" CHECK ("home_featured_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"author_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"cover_key" text,
	"cover_width" integer,
	"cover_height" integer,
	"kind" "post_kind" DEFAULT 'article'::"post_kind",
	"type_id" uuid NOT NULL,
	"status" "post_status" DEFAULT 'draft'::"post_status" NOT NULL,
	"published_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "post_tag" (
	"post_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "post_tag_pkey" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "post_views_daily" (
	"day" date,
	"post_id" uuid,
	"views" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_views_daily_pkey" PRIMARY KEY("day","post_id"),
	CONSTRAINT "post_views_daily_views_nonneg" CHECK ("views" >= 0)
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_state" (
	"id" text PRIMARY KEY,
	"initialized" boolean DEFAULT false NOT NULL,
	"owner_email" text,
	"maintenance" boolean DEFAULT false NOT NULL,
	"initialized_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_state_singleton" CHECK ("id" = 'singleton')
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "comment_post_status_created_at_idx" ON "comment" ("post_id","status","created_at");--> statement-breakpoint
CREATE INDEX "comment_root_created_at_idx" ON "comment" ("root_id","created_at");--> statement-breakpoint
CREATE INDEX "comment_status_created_at_idx" ON "comment" ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_type_key_uidx" ON "content_type" ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "content_type_slug_uidx" ON "content_type" ("slug");--> statement-breakpoint
CREATE INDEX "content_type_sort_idx" ON "content_type" ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "post_slug_uidx" ON "post" ("slug");--> statement-breakpoint
CREATE INDEX "post_kind_status_published_at_idx" ON "post" ("kind","status","published_at");--> statement-breakpoint
CREATE INDEX "post_status_published_at_idx" ON "post" ("status","published_at");--> statement-breakpoint
CREATE INDEX "post_type_status_published_at_idx" ON "post" ("type_id","status","published_at");--> statement-breakpoint
CREATE INDEX "post_tag_tag_id_idx" ON "post_tag" ("tag_id");--> statement-breakpoint
CREATE INDEX "post_views_daily_post_id_day_idx" ON "post_views_daily" ("post_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_slug_uidx" ON "tag" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_name_uidx" ON "tag" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_comment_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_root_id_comment_id_fkey" FOREIGN KEY ("root_id") REFERENCES "comment"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_reviewed_by_user_id_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_id_user_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_type_id_content_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "content_type"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_post_id_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_tag_id_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_views_daily" ADD CONSTRAINT "post_views_daily_post_id_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "site_config" ADD CONSTRAINT "site_config_updated_by_user_id_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
INSERT INTO "content_type" ("id", "key", "slug", "name", "singular_name", "description", "seo_title", "seo_description", "crumb_name", "article_section", "icon", "sort_order", "layout", "show_in_nav", "show_on_home", "home_featured_count", "markdown_export", "enabled", "is_system") VALUES ($ct$11111111-1111-4111-8111-111111111111$ct$, $ct$article$ct$, $ct$posts$ct$, $ct$文章$ct$, $ct$文章$ct$, $ct$sAkura-IO 的技术博客文章列表，覆盖 C++、Qt、Linux、树莓派、WebAssembly 与前端项目实践。从这里阅读全部已发布长文，查看源码笔记、工程踩坑与最新更新。适合按主题翻阅，也可以订阅 RSS 跟进新文章，或回到首页看精选条目。$ct$, $ct$技术博客文章：C++、Qt、Linux、树莓派与前端实践｜sAkura-IO$ct$, $ct$sAkura-IO 的技术博客文章列表，覆盖 C++、Qt、Linux、树莓派、WebAssembly 与前端项目实践。从这里阅读全部已发布长文，查看源码笔记、工程踩坑与最新更新。适合按主题翻阅，也可以订阅 RSS 跟进新文章，或回到首页看精选条目。$ct$, $ct$文章$ct$, $ct$技术博客$ct$, $ct$text.page$ct$, 0, $ct$article$ct$::"content_layout", true, true, 8, true, true, true);--> statement-breakpoint
INSERT INTO "content_type" ("id", "key", "slug", "name", "singular_name", "description", "seo_title", "seo_description", "crumb_name", "article_section", "icon", "sort_order", "layout", "show_in_nav", "show_on_home", "home_featured_count", "markdown_export", "enabled", "is_system") VALUES ($ct$22222222-2222-4222-8222-222222222222$ct$, $ct$note$ct$, $ct$notes$ct$, $ct$笔记$ct$, $ct$笔记$ct$, $ct$sAkura-IO 的技术笔记列表，收录开发配置、命令备忘和实验手记。比长文更短、更快查阅，适合检索 Linux、树莓派与日常工程问题。笔记会持续补充，遇到同类问题时可以直接对照命令操作，省去再翻长文的时间。$ct$, $ct$技术笔记：开发记录、配置备忘与实验手记｜sAkura-IO$ct$, $ct$sAkura-IO 的技术笔记列表，收录开发配置、命令备忘和实验手记。比长文更短、更快查阅，适合检索 Linux、树莓派与日常工程问题。笔记会持续补充，遇到同类问题时可以直接对照命令操作，省去再翻长文的时间。$ct$, $ct$笔记$ct$, $ct$技术笔记$ct$, $ct$newspaper$ct$, 1, $ct$note$ct$::"content_layout", true, true, 5, false, true, true);--> statement-breakpoint
-- 已有管理员的库（含正式站）视为已初始化，避免上线后弹出初始化向导。
INSERT INTO "site_state" ("id", "initialized", "initialized_at")
SELECT
  'singleton',
  admin_exists,
  CASE WHEN admin_exists THEN now() ELSE NULL END
FROM (
  SELECT EXISTS (
    SELECT 1 FROM "user"
    WHERE "role" IS NOT NULL
      AND (
        "role" = 'admin'
        OR "role" LIKE 'admin,%'
        OR "role" LIKE '%,admin'
        OR "role" LIKE '%,admin,%'
      )
  ) AS admin_exists
) AS existing;--> statement-breakpoint
CREATE OR REPLACE FUNCTION post_fill_type_id_from_kind()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF NEW.type_id IS NULL OR (TG_OP = 'UPDATE' AND NEW.kind IS DISTINCT FROM OLD.kind AND NEW.kind IS NOT NULL) THEN
    NEW.type_id := CASE NEW.kind::text
      WHEN 'article' THEN '11111111-1111-4111-8111-111111111111'::uuid
      WHEN 'note' THEN '22222222-2222-4222-8222-222222222222'::uuid
      ELSE NEW.type_id
    END;
  END IF;
  RETURN NEW;
END;
$fn$;--> statement-breakpoint
CREATE TRIGGER post_fill_type_id_from_kind
BEFORE INSERT OR UPDATE ON post
FOR EACH ROW
EXECUTE FUNCTION post_fill_type_id_from_kind();