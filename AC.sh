#!/usr/bin/env bash
# Tek tık: tarayıcıda Parla'yı aç (yoksa START-PC çalıştır)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
URL="http://localhost:3000/dashboard"

if ! curl -sf -m 2 "$URL" >/dev/null 2>&1; then
  echo "Sunucu kapalı — START-PC başlıyor..."
  (cd "$ROOT" && bash ./START-PC.sh) &
  for i in $(seq 1 30); do
    sleep 1
    curl -sf -m 1 "$URL" >/dev/null 2>&1 && break
  done
fi

if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
elif command -v wslview >/dev/null 2>&1; then
  wslview "$URL"
else
  echo "Tarayıcıda aç: $URL"
fi
echo "Açıldı: $URL"
