#!/usr/bin/env bash
# Gera cert wildcard *.lvh.me localmente via mkcert pro dev HTTPS.
#
# Por que: navigator.mediaDevices.getUserMedia (microfone/câmera) só funciona
# em "secure context" — HTTPS, ou hostnames literais localhost/127.0.0.1.
# `lvh.me` resolve pra 127.0.0.1 mas browser não trata como secure context.
# Sem HTTPS, RecordButton/PhotoUploader (com capture) falham em campo.
#
# Uso:
#   ./scripts/setup-https.sh   # uma vez, gera certs em .cert/
#   pnpm dev:https              # roda dev em HTTPS
#
# mkcert tem que estar instalado:
#   Ubuntu/Debian: sudo apt install mkcert libnss3-tools
#   Fedora/RHEL:   sudo dnf install mkcert nss-tools
#   Arch:          sudo pacman -S mkcert nss
#   macOS:         brew install mkcert nss

set -e

if ! command -v mkcert >/dev/null 2>&1; then
  echo "✗ mkcert não está instalado."
  echo ""
  echo "Linux Ubuntu/Debian:"
  echo "  sudo apt install -y libnss3-tools"
  echo "  curl -JLO 'https://dl.filippo.io/mkcert/latest?for=linux/amd64'"
  echo "  chmod +x mkcert-v*-linux-amd64"
  echo "  sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert"
  echo ""
  echo "macOS:"
  echo "  brew install mkcert nss"
  echo ""
  echo "Depois de instalar, roda este script de novo."
  exit 1
fi

mkdir -p .cert

# Instala CA local (idempotente — só faz nada se já tem)
mkcert -install

# Gera cert wildcard *.lvh.me + lvh.me + localhost + 127.0.0.1
cd .cert
mkcert -cert-file lvh-me.pem -key-file lvh-me-key.pem \
  "*.lvh.me" "lvh.me" "localhost" "127.0.0.1" "::1"
cd ..

echo ""
echo "✓ certs gerados em .cert/"
echo "  cert: .cert/lvh-me.pem"
echo "  key:  .cert/lvh-me-key.pem"
echo ""
echo "Agora roda: pnpm dev:https"
echo "Acessa: https://app.lvh.me:3001 (browser pode pedir confirmação na primeira vez)"
