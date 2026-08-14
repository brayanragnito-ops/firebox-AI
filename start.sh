#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/Code-Forge-AI" && pwd)"
cd "$APP_DIR"

if [ ! -f package.json ]; then
  echo "App root not found: $APP_DIR" >&2
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile --prefer-offline || pnpm install
else
  npm install
fi

exec pnpm run start || npm run start
