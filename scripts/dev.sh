#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
node_binary="${NODE_BINARY:-$HOME/.nvm/versions/node/v24.20.0/bin/node}"
if [[ ! -x "$node_binary" ]]; then node_binary="$(command -v node)"; fi
"$node_binary" -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(!((major===22&&minor>=12)||major===24)){console.error("Use Node 24 (recommended) or Node 22.12+.");process.exit(1)}'
bash "$project_root/scripts/mysql.sh" start
php "$project_root/backend/artisan" serve --host=127.0.0.1 --port=8000 &
api_pid=$!
(cd "$project_root/frontend" && exec "$node_binary" node_modules/vite/bin/vite.js --host 127.0.0.1) &
web_pid=$!
trap 'kill "$api_pid" "$web_pid" 2>/dev/null || true' EXIT INT TERM
wait
