import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

/**
 * Turso (libSQL) bağlantısı.
 *
 * Öncelik: DATABASE_URL → TURSO_DATABASE_URL.
 *
 * Desteklenen URL'ler (aynı Drizzle kod yolu):
 * - file:.data/parla.db          → gömülü SQLite dosyası
 * - http://127.0.0.1:8080        → yerel sqld (Turso protokolü) — `npm run turso:local`
 * - ws://127.0.0.1:8081          → yerel sqld Hrana WebSocket
 * - libsql://xxx.turso.io        → Turso Cloud (+ TURSO_AUTH_TOKEN)
 */
const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL veya TURSO_DATABASE_URL gerekli");
}

const needsToken =
  url.startsWith("libsql://") ||
  (Boolean(process.env.TURSO_AUTH_TOKEN) &&
    (url.startsWith("https://") || url.startsWith("wss://")));

const client = createClient({
  url,
  authToken: needsToken ? process.env.TURSO_AUTH_TOKEN : undefined,
});

export const db = drizzle(client);
