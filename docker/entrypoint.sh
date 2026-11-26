#!/bin/sh
set -eu

cd /app

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

wait_for_db() {
  node - <<'NODE'
const net = require("node:net");
const url = new URL(process.env.DATABASE_URL);
const host = url.hostname;
const port = Number(url.port || 5432);
const deadline = Date.now() + 60_000;
let connected = false;
function connect() {
  const socket = net.connect({ host, port });
  socket.setTimeout(3000);
  socket.once("connect", () => {
    connected = true;
    socket.end();
    process.exit(0);
  });
  socket.once("timeout", () => socket.destroy());
  socket.once("error", () => socket.destroy());
  socket.once("close", () => {
    if (connected) return;
    if (Date.now() >= deadline) {
      console.error(`[entrypoint] 等待数据库超时：${host}:${port}`);
      process.exit(1);
    }
    setTimeout(connect, 1000);
  });
}
connect();
NODE
}

run_migrations() {
  for attempt in $(seq 1 30); do
    if pnpm exec drizzle-kit migrate; then return 0; fi
    log "数据库迁移失败，重试（$attempt/30）"
    sleep 2
  done
  log "数据库迁移失败"
  exit 1
}

init_storage() {
  for attempt in $(seq 1 30); do
    if pnpm exec tsx scripts/ensure-bucket.ts; then return 0; fi
    log "等待 RustFS 就绪（$attempt/30）"
    sleep 2
  done
  log "RustFS 初始化失败，继续启动（媒体功能可能不可用）"
  return 0
}

build_stamp() {
  {
    find . \( -path ./node_modules -o -path ./.next -o -path ./.git \) -prune -o \
      -type f ! -name 'next-env.d.ts' ! -name '*.tsbuildinfo' -print |
      LC_ALL=C sort | xargs sha256sum
    env | grep -E '^(SITE_URL|DATABASE_URL|DRIZZLE_DRIVER|BETTER_AUTH_SECRET|CONFIG_MASTER_KEY|R2_|NODE_ENV)=' |
      LC_ALL=C sort
  } | sha256sum | awk '{print $1}'
}

ensure_build() {
  stamp_file=".next/.docker-build-stamp"
  current="$(build_stamp)"
  if [ -f "$stamp_file" ] && [ -f .next/BUILD_ID ] && [ "$(cat "$stamp_file")" = "$current" ]; then
    log "源码与环境变量未变化，跳过 next build"
    return 0
  fi
  log "开始 next build（首次启动或源码/环境变量已变化）"
  pnpm build
  mkdir -p .next
  printf '%s' "$current" > "$stamp_file"
}

log "等待 PostgreSQL"
wait_for_db
run_migrations
init_storage
ensure_build

log "启动应用"
exec pnpm start