#!/usr/bin/env bash
# GreenExpress site watchdog — keeps the canonical public port (3000) serving.
#
# The public surface of this container is port 3000 only. The platform's boot-time
# backstop sometimes launches the site on port 80 (BL_SERVER_PORT=80), which is NOT
# the public surface — if nothing listens on 3000, the public URL 503s. This watchdog
# guarantees exactly one healthy server on port 3000.
#
# Usage:
#   bash watchdog.sh          # self-detaches and runs forever (safe to re-run)
#   bash watchdog.sh --loop   # (internal) run the loop in the foreground
#
# Design:
#   - Health check every 10s: curl --max-time 3 against /api/health on port 3000.
#   - On failure: kill ALL stale/duplicate server processes, start one fresh instance
#     on port 3000 (detached), then wait for HTTP 200 and log the recovery time.
#   - serve.ts enforces single-instance on port 3000 via /tmp/team-site.pid.
#   - Logs to /home/team/shared/site/.run/watchdog.log (no per-cycle spam — only
#     state transitions are logged).

set -u

SITE_DIR="/home/team/shared/site"
CANONICAL_PORT=3000
HEALTH_URL="http://localhost:${CANONICAL_PORT}/api/health"
LOG_FILE="${SITE_DIR}/.run/watchdog.log"
LOCK_FILE="/tmp/team-site-watchdog.pid"
INTERVAL=10
MAX_CURL=3

mkdir -p "${SITE_DIR}/.run"

log() { echo "[$(date -u +%FT%TZ)] $*" >> "$LOG_FILE"; }

# --- self-detach (unless already in --loop mode) -----------------------------
if [ "${1:-}" != "--loop" ]; then
  # If a watchdog is already running, don't stack another one.
  if [ -f "$LOCK_FILE" ]; then
    LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
      exit 0   # already running
    fi
    rm -f "$LOCK_FILE"
  fi
  setsid nohup bash "$0" --loop >> "$LOG_FILE" 2>&1 < /dev/null &
  echo "[$(date -u +%FT%TZ)] watchdog detached (pid $!)" >> "$LOG_FILE"
  exit 0
fi

echo $$ > "$LOCK_FILE"
log "watchdog loop started (canonical port ${CANONICAL_PORT}, interval ${INTERVAL}s)"

health_code() {
  curl -s -o /dev/null -w "%{http_code}" --max-time "$MAX_CURL" "$HEALTH_URL" 2>/dev/null || echo "000"
}

start_server() {
  log "health FAILED — killing stale instances and restarting on port ${CANONICAL_PORT}"
  # Kill every server process (both "bun run start" parent and "serve.ts" child),
  # including any platform-managed port-80 duplicate — we start exactly one.
  pkill -f "bun run serve.ts" 2>/dev/null || true
  pkill -f "bun run start"    2>/dev/null || true
  sleep 1
  rm -f /tmp/team-site.pid
  cd "$SITE_DIR" || exit 1
  setsid nohup env PORT=${CANONICAL_PORT} TMPDIR=/tmp bun run start \
    >> "${SITE_DIR}/.run/server-3000.log" 2>&1 < /dev/null &
  RESTARTED_AT=$(date +%s)
  log "started server pid $! (waiting for HTTP 200)"
}

last_state=""
RESTARTED_AT=0
while true; do
  code=$(health_code)
  if [ "$code" = "200" ]; then
    if [ "$last_state" != "up" ]; then
      log "health OK (HTTP 200)"
      last_state=up
    fi
  else
    log "health check FAILED (code=${code})"
    start_server
    last_state=down
    # Wait up to 15s for the fresh instance to come up, then log recovery time.
    for _ in $(seq 1 15); do
      sleep 1
      c2=$(health_code)
      if [ "$c2" = "200" ]; then
        RECOVERY_S=$(( $(date +%s) - RESTARTED_AT ))
        log "recovered in ${RECOVERY_S}s (HTTP 200)"
        last_state=up
        break
      fi
    done
  fi
  sleep "$INTERVAL"
done
