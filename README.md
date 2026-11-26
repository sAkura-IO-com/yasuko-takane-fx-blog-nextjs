<div align="center">

![LOGO](public/icon-96.png)

# yasuko-takane-fx-blog

**高跟康子的FX投资博客，由sAkura-CMS精简版驱动**

```bash
https://yasuko-takane.s2kura.tech/
```

<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/license/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=ghost&amp;size=sm&amp;mode=dark"><img alt="License" src="https://www.shieldcn.dev/github/license/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=ghost&amp;size=sm&amp;mode=light"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/stars/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=secondary&amp;size=sm&amp;mode=dark"><img alt="GitHub Stars" src="https://www.shieldcn.dev/github/stars/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=secondary&amp;size=sm&amp;mode=light"></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/ci/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=secondary&amp;size=sm&amp;mode=dark"><img alt="CI" src="https://www.shieldcn.dev/github/ci/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=secondary&amp;size=sm&amp;mode=light"></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/last-commit/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=secondary&amp;size=sm&amp;mode=dark"><img alt="Last commit" src="https://www.shieldcn.dev/github/last-commit/sAkura-IO-com/yasuko-takane-fx-blog-nextjs.svg?variant=secondary&amp;size=sm&amp;mode=light"></picture>

</div>

<img src="https://s3.sakura-io.com/library/2026/11/1a88a0c2-9097-4266-8be6-0a6790bf2962.webp" alt="image.png" width="1600" height="919" loading="lazy" decoding="async">


## 1. 环境要求

- pnpm 12.23.0
- Node.js >= 22
- PostgreSQL 16

## 2. 环境变量

必需：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `BETTER_AUTH_SECRET` | 会话签名密钥，`openssl rand -base64 32` |
| `SITE_URL` | 公开访问地址，如 `https://blog.example.com` |

可选：

| 变量 | 说明 |
| --- | --- |
| `CONFIG_MASTER_KEY` | 后台敏感配置入库加密，`openssl rand -base64 32` |
| `R2_*` | Cloudflare R2 媒体库，也可使用其他S3兼容的对象存储（自建端点需设 `R2_REGION=us-east-1`），见 `.env.example` |

## 3. 数据库迁移

部署前对目标库执行一次：

```bash
DATABASE_URL="postgres://user:pass@host:5432/db" pnpm exec drizzle-kit migrate
```

本地已配置 `.env` 时：

```bash
pnpm db:dev:migrate
```

## 4. 部署到 Vercel

推荐使用使用Vercel里的Neon云数据库。

### 4.1 导入项目之后，初次自动部署会失败是正常的，此时我们要配置环境变量

Vercel：Project Settings → Environment Variables

按 README 第3节添加

### 4.2 执行迁移

在本地对Neon数据库执行迁移：

```bash
DATABASE_URL="postgres://user:pass@host:5432/db" pnpm exec drizzle-kit migrate
```

### 4.3 注意事项

若域名变化，必须更新环境变量`SITE_URL`，然后重新构建部署

否则项目使用的metadata、sitemap、RSS仍是旧地址。

## 5. 本地开发

```bash
pnpm install
cp .env.example .env
# 自行创建空白数据库后再往下执行
pnpm db:dev:migrate
pnpm dev
```

## 6. Docker 一键部署

复制附录提供的`compose.yaml`，快速体验：无需修改配置直接部署

```bash
docker compose up -d
```

等待一段时间之后，访问 [http://localhost:13817/setup](http://localhost:13817/setup) 完成CMS初始化向导

> 该配置**仅用于本地体验**：内置的是弱默认凭据
>
> 公开环境部署前必须自行设置强密码（`POSTGRES_PASSWORD`、`DATABASE_URL`、`RUSTFS_*`、`R2_*`、`BETTER_AUTH_SECRET`、`CONFIG_MASTER_KEY`），并按需收紧端口、设置 `SITE_URL` 与 `R2_PUBLIC_BASE_URL`。

## 附录：compose.yaml

```yaml
# 注意：本文件仅用于本地体验：内置凭据均为弱默认值，且端口默认绑定 0.0.0.0。
# 公开环境部署前必须自行设置强密码：
#   - PostgreSQL：POSTGRES_PASSWORD 与 DATABASE_URL 中的密码保持一致
#   - RustFS：RUSTFS_ACCESS_KEY / RUSTFS_SECRET_KEY 与 R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
#   - BETTER_AUTH_SECRET / CONFIG_MASTER_KEY 用 `openssl rand -base64 32` 生成
# 同时建议收紧端口（如 13819 控制台改为 "127.0.0.1:13819:9001"），并修正 SITE_URL 与 R2_PUBLIC_BASE_URL。
name: yasuko-takane-fx-blog

services:
  app:
    image: ghcr.io/sakura-io-com/yasuko-takane-fx-blog-nextjs:latest
    restart: unless-stopped
    init: true
    depends_on:
      postgres:
        condition: service_healthy
      rustfs:
        condition: service_started
    ports:
      - "13817:3033"
    environment:
      NODE_ENV: production
      TZ: Asia/Shanghai
      SITE_URL: http://localhost:13817
      DATABASE_URL: postgres://yasuko:yasuko@postgres:5432/yasuko
      DRIZZLE_DRIVER: node-postgres
      # 以下两项为占位符，公开部署必须替换为随机值
      BETTER_AUTH_SECRET: CHANGE_ME_better_auth_secret_32_chars
      CONFIG_MASTER_KEY: CHANGE_ME_config_master_key_32_chars
      R2_ACCOUNT_ID: local
      R2_ACCESS_KEY_ID: rustfsadmin
      R2_SECRET_ACCESS_KEY: rustfsadmin
      R2_BUCKET: yasuko-takane-fx-blog
      R2_ENDPOINT: http://rustfs:9000
      R2_REGION: us-east-1
      # 浏览器直传用的宿主机地址，指向同上存储的宿主机映射端口
      R2_PUBLIC_ENDPOINT: http://localhost:13818
      R2_PUBLIC_BASE_URL: http://localhost:13818/yasuko-takane-fx-blog
      R2_FORCE_PATH_STYLE: "1"
    volumes:
      - nextcache:/app/.next
    networks:
      - blog

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: yasuko
      POSTGRES_USER: yasuko
      # 弱默认密码，公开部署必须修改（并同步 DATABASE_URL）
      POSTGRES_PASSWORD: yasuko
      TZ: Asia/Shanghai
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U yasuko -d yasuko"]
      interval: 5s
      timeout: 5s
      retries: 20
    networks:
      - blog

  rustfs:
    image: rustfs/rustfs:latest
    restart: unless-stopped
    environment:
      # 弱默认凭据，公开部署必须修改（并同步 R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY）
      RUSTFS_ACCESS_KEY: rustfsadmin
      RUSTFS_SECRET_KEY: rustfsadmin
      RUSTFS_VOLUMES: /data
      RUSTFS_REGION: us-east-1
      RUSTFS_CONSOLE_ENABLE: "true"
    ports:
      - "13818:9000"
      - "13819:9001"
    volumes:
      - rustfsdata:/data
    networks:
      - blog

volumes:
  pgdata:
  rustfsdata:
  nextcache:

networks:
  blog:
```
