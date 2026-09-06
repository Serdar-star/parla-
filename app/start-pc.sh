#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "=== Parla PC Kurulum / Başlat ==="

if ! command -v node >/dev/null 2>&1; then
  echo "[HATA] Node.js yok → https://nodejs.org LTS kur"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[1/4] npm install..."
  npm install
fi

if [ ! -f .env.local ]; then
  echo "[2/4] .env.local oluşturuluyor..."
  cp .env.example .env.local
  echo ""
  echo "*** GROQ_API_KEY satırına key'ini yaz, kaydet ***"
  ${EDITOR:-nano} .env.local || true
fi

echo "[3/4] Veritabanı..."
export DATABASE_URL="${DATABASE_URL:-file:.data/parla.db}"
npx drizzle-kit push
npm run db:seed

echo "[4/4] http://localhost:3000"
exec npm run dev
