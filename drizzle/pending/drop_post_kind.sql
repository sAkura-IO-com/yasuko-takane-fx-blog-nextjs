-- 收缩迁移：等 expand 版本已经对外服务、旧代码不再读取 post.kind 之后再应用。
-- 不要放进 drizzle/ 时间戳目录，否则 db:cloud:migrate 会立刻执行。

DROP TRIGGER IF EXISTS post_fill_type_id_from_kind ON post;

DROP FUNCTION IF EXISTS post_fill_type_id_from_kind();

DROP INDEX IF EXISTS "post_kind_status_published_at_idx";

ALTER TABLE "post" DROP COLUMN IF EXISTS "kind";

DROP TYPE IF EXISTS "post_kind";
