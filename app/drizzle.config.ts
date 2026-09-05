import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "";
const token = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Turso token'ı libsql URL'ine query param olarak eklenir.
    url: token && url.startsWith("libsql://") ? `${url}?authToken=${encodeURIComponent(token)}` : url,
  },
});
