#!/usr/bin/env bash
# Rebuild the site and (re)start the production server on port 3000.
# Build runs in the foreground so errors surface; the server is launched in a new
# session (setsid) so it keeps running after this script — and your shell — exits.
# serve.ts supersedes any previously running instance, so this is safe to re-run.
set -euo pipefail
cd "$(dirname "$0")"

# Kill any server already on port 3000 — process name first, then port
pkill -f "bun run serve" 2>/dev/null || true
pkill -f "bun run start" 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

bun run build
setsid nohup env PORT=3000 bun run start > /tmp/team-site.log 2>&1 < /dev/null &
echo "site published; serving on port 3000"
