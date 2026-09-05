import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

/**
 * Turso (libSQL) bağlantısı.
 *
 * Öncelik: DATABASE_URL (lokal dosya/libsql) → TURSO_DATABASE_URL.
 * Sandbox/lokal geliştirmede DATABASE_URL="file:..." ile aynı kod yolu
 * çalışır; dağıtımda .env'deki TURSO_* değerleri devreye girer.
 */
const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL veya TURSO_DATABASE_URL gerekli");
}

const client = createClient({
  url,
  authToken: url.startsWith("libsql://") ? process.env.TURSO_AUTH_TOKEN : undefined,
});

export const db = drizzle(client);
