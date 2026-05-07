#!/usr/bin/env bash
# Smoke leve por default — typecheck + lint apenas. NÃO roda `pnpm build`
# porque build polui o `.next/` que o `pnpm dev` está usando, gerando o
# erro "Cannot find module './vendor-chunks/...'" enquanto o dev tenta
# servir chunks antigos.
#
# Pra build completo (fim de task, antes de deploy): ./scripts/smoke.sh --build
# ou pnpm smoke:build
set -e

echo "→ pnpm typecheck"
pnpm typecheck
echo "→ pnpm lint"
pnpm lint

if [[ "$1" == "--build" ]]; then
  if pgrep -f "next-server" >/dev/null 2>&1 || pgrep -f "next dev" >/dev/null 2>&1; then
    echo "✗ pnpm dev está rodando — build vai poluir .next/. Matar primeiro:"
    echo "    pkill -f 'next dev' && pkill -f 'next-server'"
    exit 1
  fi
  echo "→ pnpm build (limpando .next antes pra evitar lixo)"
  rm -rf .next
  pnpm build
fi

echo "✓ smoke OK"
