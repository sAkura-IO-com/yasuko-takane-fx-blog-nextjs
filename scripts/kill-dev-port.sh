#!/usr/bin/env bash
#
# 释放被占用的 TCP 端口（默认：dev server 端口 57286）
#
# 用法:
#   bash scripts/kill-dev-port.sh          # 杀掉占用 57286 的进程
#   bash scripts/kill-dev-port.sh 3000     # 杀掉占用 3000 的进程
#
# 依次尝试 lsof / fuser / ss / 解析 /proc 来定位监听进程，
# 找到后直接 kill -9，最后再确认端口是否已释放。

set -uo pipefail

PORT="${1:-57286}"

if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
  echo "无效的端口: $PORT" >&2
  exit 2
fi

log() { printf '%s\n' "$*"; }

# 输出占用该端口的所有 PID（每行一个），找不到则无输出
collect_pids() {
  local port="$1"
  local pids=""

  # 1) lsof：最准确，优先取处于 LISTEN 状态的进程
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    [ -n "$pids" ] && { printf '%s\n' "$pids"; return 0; }
    pids="$(lsof -tiTCP:"$port" 2>/dev/null || true)"
    [ -n "$pids" ] && { printf '%s\n' "$pids"; return 0; }
  fi

  # 2) fuser
  if command -v fuser >/dev/null 2>&1; then
    pids="$(fuser -n tcp "$port" 2>/dev/null | tr -s ' \t' '\n' | grep -E '^[0-9]+$' || true)"
    [ -n "$pids" ] && { printf '%s\n' "$pids"; return 0; }
  fi

  # 3) ss（iproute2）
  if command -v ss >/dev/null 2>&1; then
    pids="$(ss -ltnpH "sport = :$port" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 || true)"
    [ -n "$pids" ] && { printf '%s\n' "$pids"; return 0; }
  fi

  # 4) 兜底：直接解析 /proc/net/tcp(|6)，再按 socket inode 反查 PID
  local hex inode file local_addr socket pid fd
  hex="$(printf '%04X' "$port")"
  for file in /proc/net/tcp /proc/net/tcp6; do
    [ -r "$file" ] || continue
    while read -r _ local_addr _ _ _ _ _ _ _ inode _; do
      case "$local_addr" in
        *:"$hex") ;;
        *) continue ;;
      esac
      [ "${inode:-0}" = "0" ] && continue
      socket="socket:[$inode]"
      for fd in /proc/[0-9]*/fd/*; do
        [ -e "$fd" ] || continue
        if [ "$(readlink "$fd" 2>/dev/null)" = "$socket" ]; then
          pid="${fd#/proc/}"
          printf '%s\n' "${pid%%/*}"
        fi
      done
    done < "$file"
  done
}

PIDS="$(collect_pids "$PORT" | sort -u | grep -E '^[0-9]+$' | tr '\n' ' ' || true)"
PIDS="${PIDS% }"

if [ -z "$PIDS" ]; then
  log "端口 $PORT 当前没有被占用，无需处理。"
  exit 0
fi

log "端口 $PORT 被以下进程占用："
for pid in $PIDS; do
  cmd="$(ps -o args= -p "$pid" 2>/dev/null | head -c 160 || true)"
  log "  PID $pid  ${cmd:-<已退出>}"
done

status=0
for pid in $PIDS; do
  [ "$pid" = "$$" ] && continue
  if kill -9 "$pid" 2>/dev/null; then
    log "已 kill -9 PID $pid"
  else
    log "无法结束 PID $pid（可能已退出或权限不足）" >&2
    status=1
  fi
done

# 给内核一点时间回收 socket
for _ in 1 2 3 4 5; do
  collect_pids "$PORT" | grep -qE '^[0-9]+$' || break
  sleep 0.2
done

if collect_pids "$PORT" | grep -qE '^[0-9]+$'; then
  log "端口 $PORT 仍被占用，请重试或检查权限。" >&2
  exit 1
fi

log "端口 $PORT 已释放。"
exit "$status"
