#!/usr/bin/env bash
set -e
echo "→ pnpm typecheck"
pnpm typecheck
echo "→ pnpm lint"
pnpm lint
echo "→ pnpm build"
pnpm build
echo "✓ smoke OK"
