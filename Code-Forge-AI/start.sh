#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/Code-Forge-AI" && pwd)"

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "App root not found: $APP_DIR" >&2
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  pnpm --dir "$APP_DIR" install --frozen-lockfile --prefer-offline || pnpm --dir "$APP_DIR" install
else
  npx pnpm --dir "$APP_DIR" install --frozen-lockfile --prefer-offline || npx pnpm --dir "$APP_DIR" install
fi

if command -v pnpm >/dev/null 2>&1; then
  exec pnpm --dir "$APP_DIR" run start
else
  exec npx pnpm --dir "$APP_DIR" run start
fi
