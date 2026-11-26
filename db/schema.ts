import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const postStatus = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);

/** 列表和详情用哪套现有版式。文章、笔记页面外观靠它保持不变。 */
export const contentLayout = pgEnum("content_layout", ["article", "note"]);

/**
 * 过渡列。新代码按 typeId 读写；文章和笔记保存时仍写入 kind，
 * 让还在跑的旧版本能按 kind 过滤。其他分类留空。删列放在后续迁移。
 */
export const postKind = pgEnum("post_kind", ["article", "note"]);

/**
 * 评论状态。`spam` 仅历史兼容：新代码不再产生（「垃圾」操作已移除），
 * 展示与统计归并为「已拒绝」；保留枚举值以兼容旧备份恢复。
 */
export const commentStatus = pgEnum("comment_status", [
  "pending",
  "approved",
  "rejected",
  "spam",
]);

/**
 * 内容分类。文章和笔记是两条系统分类（isSystem），后台可再加。
 * key 创建后不可改；slug 在已有已发布内容或系统分类上锁定。
 */
export const contentType = pgTable(
  "content_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 稳定内部标识，如 article / note */
    key: text("key").notNull(),
    /** URL 段，如 posts / notes */
    slug: text("slug").notNull(),
    /** 复数显示名：文章 */
    name: text("name").notNull(),
    /** 单数：写文章、无效的文章 */
    singularName: text("singular_name").notNull(),
    description: text("description").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    crumbName: text("crumb_name").notNull(),
    /** JSON-LD articleSection，文章为「技术博客」 */
    articleSection: text("article_section").notNull(),
    /** 菜单图标，取自现有 SF Symbols */
    icon: text("icon").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    layout: contentLayout("layout").notNull().default("article"),
    showInNav: boolean("show_in_nav").notNull().default(true),
    showOnHome: boolean("show_on_home").notNull().default(false),
    homeFeaturedCount: integer("home_featured_count").notNull().default(0),
    markdownExport: boolean("markdown_export").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("content_type_key_uidx").on(table.key),
    uniqueIndex("content_type_slug_uidx").on(table.slug),
    index("content_type_sort_idx").on(table.sortOrder),
    check(
      "content_type_key_format",
      sql`${table.key} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
    check(
      "content_type_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
    check(
      "content_type_home_featured_nonneg",
      sql`${table.homeFeaturedCount} >= 0`,
    ),
  ],
);

export const post = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    /** R2 object key（library/...）；外链图片则直接存 URL */
    coverKey: text("cover_key"),
    /** 封面像素尺寸（上传时浏览器测得），渲染 width/height 属性消除 CLS */
    coverWidth: integer("cover_width"),
    coverHeight: integer("cover_height"),
    /**
     * 旧版本仍读写这一列。可空，默认 article：旧代码漏写时不会插入失败；
     * 新代码对非文章/笔记显式写 null，避免被默认值当成文章。
     */
    kind: postKind("kind").default("article"),
    typeId: uuid("type_id")
      .notNull()
      .references(() => contentType.id, { onDelete: "restrict" }),
    status: postStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at"),
    viewCount: integer("view_count").notNull().default(0),
    wordCount: integer("word_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("post_slug_uidx").on(table.slug),
    index("post_kind_status_published_at_idx").on(
      table.kind,
      table.status,
      table.publishedAt,
    ),
    index("post_status_published_at_idx").on(table.status, table.publishedAt),
    index("post_type_status_published_at_idx").on(
      table.typeId,
      table.status,
      table.publishedAt,
    ),
    check(
      "post_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
  ],
);

export const tag = pgTable(
  "tag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tag_slug_uidx").on(table.slug),
    uniqueIndex("tag_name_uidx").on(table.name),
  ],
);

export const postTag = pgTable(
  "post_tag",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_tag_tag_id_idx").on(table.tagId),
  ],
);

/**
 * 全站文章页浏览的东八区自然日合计。
 * 只在已发布文章的 view_count 成功 +1 之后写入；上线前的日期没有行。
 */
export const articleViewsDaily = pgTable(
  "article_views_daily",
  {
    /** 东八区自然日键（YYYY-MM-DD），由 lib/time/shanghai-day.ts 的 shanghaiDayKey() 生成 */
    day: date("day").primaryKey(),
    pageViews: integer("page_views").notNull().default(0),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    check(
      "article_views_daily_page_views_nonneg",
      sql`${table.pageViews} >= 0`,
    ),
  ],
);

/**
 * 单篇文章的东八区自然日浏览。
 * 与 article_views_daily 同一时刻各 +1；文章删除时一并删掉。
 */
export const postViewsDaily = pgTable(
  "post_views_daily",
  {
    day: date("day").notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.day, table.postId] }),
    index("post_views_daily_post_id_day_idx").on(table.postId, table.day),
    check("post_views_daily_views_nonneg", sql`${table.views} >= 0`),
  ],
);

export const comment = pgTable(
  "comment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    /** 直接父级：一级评论为 null，回复指向被回复的任意一层 */
    parentId: uuid("parent_id").references((): AnyPgColumn => comment.id, {
      onDelete: "cascade",
    }),
    /** 所属一级评论：一级评论为 null，回复永远指向根，实现两级扁平展开 */
    rootId: uuid("root_id").references((): AnyPgColumn => comment.id, {
      onDelete: "cascade",
    }),
    authorName: text("author_name").notNull(),
    /** 管理员回复标记；游客评论永远为 false */
    isAdmin: boolean("is_admin").notNull().default(false),
    body: text("body").notNull().default(""),
    status: commentStatus("status").notNull().default("pending"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("comment_post_status_created_at_idx").on(
      table.postId,
      table.status,
      table.createdAt,
    ),
    index("comment_root_created_at_idx").on(table.rootId, table.createdAt),
    index("comment_status_created_at_idx").on(table.status, table.createdAt),
    check("comment_body_length", sql`char_length(${table.body}) <= 2000`),
    // 线程形态只能是一级评论（两者皆空）或回复（两者皆填）
    check(
      "comment_thread_shape",
      sql`(${table.parentId} is null and ${table.rootId} is null) or (${table.parentId} is not null and ${table.rootId} is not null)`,
    ),
  ],
);

/**
 * 整站实例状态，全库只有 id = 'singleton' 一行。
 * initialized 由初始化流程在创建管理员时写成 true。
 * maintenance 保留为只读防护位；简版不再提供备份恢复入口。
 */
export const siteState = pgTable(
  "site_state",
  {
    id: text("id").primaryKey(),
    initialized: boolean("initialized").notNull().default(false),
    ownerEmail: text("owner_email"),
    maintenance: boolean("maintenance").notNull().default(false),
    initializedAt: timestamp("initialized_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [check("site_state_singleton", sql`${table.id} = 'singleton'`)],
);

/**
 * 站点运行期配置（键值覆盖）。有行的键用入库值覆盖环境变量；
 * 敏感项 value 为 AES-256-GCM 加密串（见 lib/config/crypto.ts）。
 * 读取统一走 lib/config/index.ts 的 getConfig()，优先级 入库值 > 环境变量 > 推荐值。
 */
export const siteConfig = pgTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  isSecret: boolean("is_secret").notNull().default(false),
  updatedByUserId: text("updated_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type SiteConfig = typeof siteConfig.$inferSelect;

export type ContentType = typeof contentType.$inferSelect;
export type NewContentType = typeof contentType.$inferInsert;
export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type Tag = typeof tag.$inferSelect;
export type Comment = typeof comment.$inferSelect;
export type NewComment = typeof comment.$inferInsert;
export type SiteState = typeof siteState.$inferSelect;
