export type ConfigGroup = "site" | "auth" | "seo" | "media";

export type ConfigType = "string" | "boolean" | "number" | "textarea";

export type ConfigItem = {
  key: string;
  group: ConfigGroup;
  envName: string;
  label: string;
  description: string;
  type: ConfigType;
  recommended: string;
  secret?: boolean;
  dbOverridable?: boolean;
  options?: readonly { value: string; label: string }[];
  note?: string;
};

export const CONFIG_GROUPS: readonly { id: ConfigGroup; label: string }[] = [
  { id: "site", label: "站点" },
  { id: "auth", label: "认证" },
  { id: "seo", label: "SEO" },
  { id: "media", label: "存储" },
];

const BOOLEAN_OPTIONS = [
  { value: "1", label: "开启" },
  { value: "0", label: "关闭" },
] as const;

export const CONFIG_ITEMS: readonly ConfigItem[] = [
  {
    key: "site.url",
    group: "site",
    envName: "SITE_URL",
    label: "站点 URL",
    description: "公开站点地址（metadata / sitemap / RSS / IndexNow 的基准）。",
    type: "string",
    recommended: "",
    dbOverridable: false,
  },
  {
    key: "site.public_api_origins",
    group: "site",
    envName: "PUBLIC_API_ORIGINS",
    label: "API 允许的 Origin",
    description: "/api/v1 额外允许回显的 Origin，逗号分隔。",
    type: "string",
    recommended: "",
    dbOverridable: false,
  },

  {
    key: "auth.github_client_id",
    group: "auth",
    envName: "GITHUB_CLIENT_ID",
    label: "GitHub Client ID",
    description: "GitHub OAuth App 的 Client ID。与 Secret 都填写后才会显示 GitHub 登录。",
    type: "string",
    recommended: "",
    note: "回调地址需在 GitHub OAuth App 登记：{站点 URL}/api/auth/callback/github",
  },
  {
    key: "auth.github_client_secret",
    group: "auth",
    envName: "GITHUB_CLIENT_SECRET",
    label: "GitHub Client Secret",
    description: "GitHub OAuth App 的 Client Secret。",
    type: "string",
    recommended: "",
    secret: true,
  },
  {
    key: "auth.site_admin_user_ids",
    group: "auth",
    envName: "SITE_ADMIN_USER_IDS",
    label: "兜底管理员 User ID",
    description: "额外放行的管理员用户 id，逗号分隔。",
    type: "string",
    recommended: "",
    note: "通常不用填——/setup 创建的账号已写入 role=admin。",
  },

  {
    key: "seo.indexnow_key",
    group: "seo",
    envName: "INDEXNOW_KEY",
    label: "IndexNow Key",
    description: "需与 public/{key}.txt 一致；留空跳过 IndexNow。",
    type: "string",
    recommended: "",
  },

  {
    key: "media.r2_account_id",
    group: "media",
    envName: "R2_ACCOUNT_ID",
    label: "R2 Account ID",
    description: "Cloudflare R2 账号。",
    type: "string",
    recommended: "",
  },
  {
    key: "media.r2_access_key_id",
    group: "media",
    envName: "R2_ACCESS_KEY_ID",
    label: "R2 Access Key ID",
    description: "R2 访问密钥 ID。",
    type: "string",
    recommended: "",
    secret: true,
  },
  {
    key: "media.r2_secret_access_key",
    group: "media",
    envName: "R2_SECRET_ACCESS_KEY",
    label: "R2 Secret Access Key",
    description: "R2 访问密钥。",
    type: "string",
    recommended: "",
    secret: true,
  },
  {
    key: "media.r2_bucket",
    group: "media",
    envName: "R2_BUCKET",
    label: "媒体桶",
    description: "媒体文件存储桶名。",
    type: "string",
    recommended: "yasuko-takane-fx-blog",
  },
  {
    key: "media.r2_public_base_url",
    group: "media",
    envName: "R2_PUBLIC_BASE_URL",
    label: "CDN 自定义域名",
    description: "媒体公网访问前缀（CSP / preconnect / URL 拼接）。",
    type: "string",
    recommended: "",
    note: "入库修改后需重新部署，next.config 的 CSP 才会更新。",
  },
  {
    key: "media.r2_endpoint",
    group: "media",
    envName: "R2_ENDPOINT",
    label: "S3 兼容端点",
    description: "默认按 Account ID 推导；MinIO 等自建时填写。",
    type: "string",
    recommended: "",
  },
  {
    key: "media.r2_public_endpoint",
    group: "media",
    envName: "R2_PUBLIC_ENDPOINT",
    label: "浏览器直传端点",
    description:
      "presigned URL 使用的端点；仅当浏览器与容器访问地址不同时填写（如 http://localhost:13818）。",
    type: "string",
    recommended: "",
  },
  {
    key: "media.r2_force_path_style",
    group: "media",
    envName: "R2_FORCE_PATH_STYLE",
    label: "路径风格（MinIO）",
    description: "1 = 路径风格；R2 勿开。",
    type: "string",
    recommended: "",
  },
];

const GROUP_DB_OVERRIDABLE: Partial<Record<ConfigGroup, boolean>> = {
  media: false,
};

export function isDbOverridable(item: ConfigItem): boolean {
  if (item.dbOverridable !== undefined) return item.dbOverridable;
  return GROUP_DB_OVERRIDABLE[item.group] ?? true;
}

export function configItem(key: string): ConfigItem | undefined {
  return CONFIG_ITEMS.find((item) => item.key === key);
}

export function itemsOfGroup(group: ConfigGroup): ConfigItem[] {
  return CONFIG_ITEMS.filter((item) => item.group === group);
}

const CONFIG_GROUP_SECTIONS: Partial<
  Record<ConfigGroup, { title: string; keys: readonly string[] }[]>
> = {
  site: [{ title: "站点", keys: ["site.url", "site.public_api_origins"] }],
  auth: [
    {
      title: "GitHub 登录",
      keys: ["auth.github_client_id", "auth.github_client_secret"],
    },
    { title: "管理员", keys: ["auth.site_admin_user_ids"] },
  ],
  seo: [{ title: "IndexNow", keys: ["seo.indexnow_key"] }],
  media: [
    {
      title: "R2 凭据",
      keys: [
        "media.r2_account_id",
        "media.r2_access_key_id",
        "media.r2_secret_access_key",
      ],
    },
    {
      title: "存储桶",
      keys: ["media.r2_bucket", "media.r2_public_base_url"],
    },
    { title: "高级", keys: ["media.r2_endpoint", "media.r2_force_path_style"] },
  ],
};

export type ConfigSection = { title: string; items: ConfigItem[] };

export function sectionsOfGroup(group: ConfigGroup): ConfigSection[] {
  const items = itemsOfGroup(group);
  const definitions = CONFIG_GROUP_SECTIONS[group];
  if (!definitions) {
    return items.length > 0 ? [{ title: "常规", items }] : [];
  }
  const byKey = new Map(items.map((item) => [item.key, item]));
  const used = new Set<string>();
  const sections: ConfigSection[] = [];
  for (const definition of definitions) {
    const sectionItems: ConfigItem[] = [];
    for (const key of definition.keys) {
      const item = byKey.get(key);
      if (item) {
        sectionItems.push(item);
        used.add(key);
      }
    }
    if (sectionItems.length > 0) {
      sections.push({ title: definition.title, items: sectionItems });
    }
  }
  const rest = items.filter((item) => !used.has(item.key));
  if (rest.length > 0) sections.push({ title: "其它", items: rest });
  return sections;
}

export const CONFIG_BOOLEAN_OPTIONS = BOOLEAN_OPTIONS;
