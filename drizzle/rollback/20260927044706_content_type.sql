-- 回滚 expand 迁移。kind 列和 post_kind 枚举一直都在，这里只撤掉 type_id 和 content_type。
-- 非 article/note 的行 kind 为空，SET NOT NULL 会失败。回滚前先处理掉这些行。

DROP TRIGGER IF EXISTS post_fill_type_id_from_kind ON post;

DROP FUNCTION IF EXISTS post_fill_type_id_from_kind();

ALTER TABLE "post" ALTER COLUMN "kind" SET DEFAULT 'article';

ALTER TABLE "post" ALTER COLUMN "kind" SET NOT NULL;

ALTER TABLE "post" DROP CONSTRAINT IF EXISTS "post_type_id_content_type_id_fkey";

DROP INDEX IF EXISTS "post_type_status_published_at_idx";

ALTER TABLE "post" DROP COLUMN IF EXISTS "type_id";

DROP TABLE IF EXISTS "content_type";

DROP TYPE IF EXISTS "content_layout";
