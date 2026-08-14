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
  npx pnpm install --frozen-lockfile --prefer-offline || npx pnpm install
fi

if command -v pnpm >/dev/null 2>&1; then
  exec pnpm run start
else
  exec npx pnpm run start
fi
