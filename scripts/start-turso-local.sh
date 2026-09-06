#!/usr/bin/env bash
# Yerel Turso (sqld / libSQL server) — cloud Turso ile aynı HTTP/Hrana protokolü.
# Arena sandbox + PC: turso.io'ya çıkmadan gerçek Turso-uyumlu DB.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/app"
BIN="$ROOT/tools/bin/sqld"
DATA="$APP/.data/sqld-data"
SCHEMA="$ROOT/scripts/parla-schema.sql"
HTTP_ADDR="${SQLD_HTTP_LISTEN_ADDR:-0.0.0.0:8080}"
HRANA_ADDR="${SQLD_HRANA_LISTEN_ADDR:-0.0.0.0:8081}"
DB_URL="${DATABASE_URL:-http://127.0.0.1:8080}"

mkdir -p "$ROOT/tools/bin" "$DATA"

ensure_sqld() {
  if [[ -x "$BIN" ]]; then
    return 0
  fi
  echo "⬇️  sqld indiriliyor (npm @sqld/linux-x64)..."
  local tmp
  tmp="$(mktemp -d)"
  (
    cd "$tmp"
    npm pack @sqld/linux-x64@0.24.1-pre.42 --silent
    tar -xzf sqld-linux-x64-*.tgz
    cp package/sqld "$BIN"
    chmod +x "$BIN"
  )
  rm -rf "$tmp"
  echo "✅ sqld hazır: $BIN"
}

ensure_sqld

if ss -tln 2>/dev/null | grep -qE ':8080\s'; then
  echo "ℹ️  Port 8080 zaten dinleniyor — mevcut sqld kullanılıyor."
else
  echo "🚀 sqld başlıyor → HTTP $HTTP_ADDR · Hrana $HRANA_ADDR"
  echo "   db: $DATA"
  nohup "$BIN" \
    --db-path "$DATA" \
    --http-listen-addr "$HTTP_ADDR" \
    --hrana-listen-addr "$HRANA_ADDR" \
    >"$APP/.data/sqld.log" 2>&1 &
  echo $! >"$APP/.data/sqld.pid"
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf "http://127.0.0.1:8080/health" >/dev/null 2>&1 || curl -sf "http://127.0.0.1:8080/" >/dev/null 2>&1; then
      break
    fi
    # libsql may not have /health — try execute via node briefly
    sleep 0.3
  done
  sleep 0.5
fi

export DATABASE_URL="$DB_URL"
export JWT_SECRET="${JWT_SECRET:-super-secret-key-change-this}"
export DEMO_MODE="${DEMO_MODE:-on}"

cd "$APP"

echo "📐 Schema kontrol..."
export SCHEMA_PATH="$SCHEMA"
SCHEMA_PATH="$SCHEMA" node <<'NODE'
const { createClient } = require("@libsql/client");
const fs = require("fs");
(async () => {
  const url = process.env.DATABASE_URL || "http://127.0.0.1:8080";
  const schemaPath = process.env.SCHEMA_PATH;
  const c = createClient({ url });
  let needSchema = false;
  try {
    await c.execute("select 1 from songs limit 1");
  } catch {
    needSchema = true;
  }
  if (!needSchema) {
    console.log("✅ Schema mevcut");
    process.exit(0);
  }
  if (!schemaPath || !fs.existsSync(schemaPath)) {
    console.error("❌ Schema dosyası yok:", schemaPath);
    process.exit(1);
  }
  console.log("📐 Schema yazılıyor:", schemaPath);
  const sql = fs.readFileSync(schemaPath, "utf8");
  await c.execute("PRAGMA foreign_keys = OFF");
  const parts = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  for (const stmt of parts) {
    try {
      await c.execute(stmt);
    } catch (e) {
      if (!String(e.message).includes("already exists")) {
        console.warn("warn:", String(e.message).slice(0, 120));
      }
    }
  }
  console.log("✅ Schema OK");
  process.exit(0);
})();
NODE

echo "🌱 Seed..."
npx tsx src/lib/seed.ts

# Sync app env for next
cat > "$APP/.env" <<EOF
DATABASE_URL=$DB_URL
JWT_SECRET=${JWT_SECRET}
DEMO_MODE=${DEMO_MODE}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
EOF
cp "$APP/.env" "$APP/.env.local"

echo ""
echo "════════════════════════════════════════"
echo "  ✅ TURSO LOKAL (sqld) ÇALIŞIYOR"
echo "  DATABASE_URL=$DB_URL"
echo "  Hrana WS: ws://127.0.0.1:8081"
echo "  Cloud Turso: libsql://… + TURSO_AUTH_TOKEN"
echo "════════════════════════════════════════"
