# 尚未进入 drizzle/ 的迁移

这里的 SQL **不会**被 `drizzle-kit migrate` 执行。等「内容分类改为数据库驱动」已经在正式站跑起来、确认旧版本不再需要 `post.kind` 之后，再把文件挪进 `drizzle/<timestamp>_drop_post_kind/`，作为后续 PR 应用。

在此之前：

- `post.kind` 和枚举 `post_kind` 留着。
- 新代码读 `type_id`。保存文章或笔记时同时写 `kind`，其他分类把 `kind` 写成 null。
- 触发器 `post_fill_type_id_from_kind` 让仍在跑的旧版本只写 `kind` 时也能补上 `type_id`。

应用收缩迁移前，确认没有部署还在读 `kind`，并先删掉触发器（脚本里已经包含）。

当前代码保存文章 / 笔记时仍会写 `kind`，触发器也还在，因此 **不要** 把 `drop_post_kind.sql` 提升为正式迁移。整站备份的列指纹会同时记录「有 kind」和「没有 kind」两种形态，恢复时由升级链双向补齐（见 `lib/backup/core/post-kind.ts`）。
