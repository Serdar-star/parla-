#!/usr/bin/env bash
# Parla — PC tek komut: Groq + Turso/file DB + seed + dev
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "========================================"
echo " PARLA — PC kurulum / başlat"
echo " Groq AI + Turso/file DB"
echo "========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[HATA] Node.js yok → https://nodejs.org LTS kur"
  exit 1
fi
echo "[OK] Node $(node -v)"

if [[ ! -d node_modules ]]; then
  echo "[1/5] npm install..."
  npm install
else
  echo "[1/5] node_modules mevcut"
fi

if [[ ! -f .env.local ]]; then
  echo "[2/5] .env.local oluşturuluyor..."
  cp .env.example .env.local
  echo ""
  echo "*** ÖNEMLİ ***"
  echo "  GROQ_API_KEY=gsk_...     → https://console.groq.com/keys"
  echo "  DATABASE_URL=file:.data/parla.db   (hızlı)"
  echo "  veya Turso: libsql://... + TURSO_AUTH_TOKEN"
  echo ""
  if command -v nano >/dev/null 2>&1; then
    ${EDITOR:-nano} .env.local
  elif command -v code >/dev/null 2>&1; then
    code --wait .env.local || true
  else
    echo "  Dosyayı bir editörle aç: $(pwd)/.env.local"
    read -r -p "  Kaydedince Enter..."
  fi
else
  echo "[2/5] .env.local mevcut"
fi

echo "[3/5] .env.local kontrol..."
if grep -q 'gsk_buraya_yapistir' .env.local 2>/dev/null || ! grep -qE '^GROQ_API_KEY=gsk_' .env.local 2>/dev/null; then
  echo "[UYARI] GROQ_API_KEY eksik veya placeholder — AI YEDEK olabilir."
  read -r -p "Şimdi düzenle? [e/N] " ans || true
  if [[ "${ans:-}" =~ ^[eEyY]$ ]]; then
    ${EDITOR:-nano} .env.local
  fi
fi

# Sandbox sqld URL'si PC'de genelde yok → file'a çevir
if grep -q '^DATABASE_URL=http://127.0.0.1:8080' .env.local 2>/dev/null; then
  echo "[i] Sandbox sqld URL → file:.data/parla.db"
  sed -i.bak 's|^DATABASE_URL=http://127.0.0.1:8080|DATABASE_URL=file:.data/parla.db|' .env.local
  rm -f .env.local.bak
fi

# Export key=value from .env.local (basit parser)
set -a
# shellcheck disable=SC1091
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
    export "$line"
  fi
done < .env.local
set +a

export DATABASE_URL="${DATABASE_URL:-file:.data/parla.db}"
export JWT_SECRET="${JWT_SECRET:-parla-pc-dev-secret-change-me}"
export DEMO_MODE="${DEMO_MODE:-on}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "[4/5] Veritabanı push + seed..."
echo "     DATABASE_URL=$DATABASE_URL"
mkdir -p .data

npx drizzle-kit push --force || echo "[UYARI] drizzle push — devam"
npm run db:seed

echo ""
echo "[5/5] http://localhost:3000"
echo "     AI Öğretmen = Groq  |  Müzik/Podcast = DB"
echo "     Durdurmak: Ctrl+C"
echo ""

# Tarayıcıyı otomatik aç (3 sn sonra)
(
  sleep 3
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000/dashboard" || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000/dashboard" || true
  elif command -v wslview >/dev/null 2>&1; then
    wslview "http://localhost:3000/dashboard" || true
  fi
) &

exec npm run dev
