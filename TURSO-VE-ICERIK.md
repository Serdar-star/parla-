# Turso — sandbox’ta gerçekten çalışıyor

## Kısa cevap

| Ortam | Veritabanı | Komut |
|--------|------------|--------|
| **Arena sandbox** | **Yerel Turso (`sqld`)** `http://127.0.0.1:8080` ✅ | `npm run turso:local` |
| **Kendi PC** | Aynı sqld veya dosya veya cloud ✅ | `npm run turso:local` / cloud env |
| **Vercel** | Turso Cloud `libsql://…` ✅ | env + seed (PC/CI) |

Cloud `turso.io` sandbox’tan **ulaşılmaz** (TLS engeli).  
Bunun yerine **aynı motor** çalışıyor: **libSQL server (`sqld`)** — Turso’nun açık kaynak sunucusu, HTTP + Hrana WS.

```text
Uygulama  →  @libsql/client  →  http://127.0.0.1:8080 (sqld)  →  .data/sqld-data
                 aynı client        production’da:
                              →  libsql://xxx.turso.io + token
```

Kod: `app/src/db/index.ts` — `file:` / `http:` / `libsql://` hepsi aynı Drizzle yolu.

---

## Sandbox’ta ayağa kaldırma

```bash
cd app
npm run turso:local          # sqld + schema + seed
# ayrı terminal:
npm run dev                  # .env DATABASE_URL=http://127.0.0.1:8080
# veya tek komut:
npm run dev:turso
```

Script: `scripts/start-turso-local.sh`  
Binary: ilk seferde npm’den `@sqld/linux-x64` iner → `tools/bin/sqld`  
Schema: `scripts/parla-schema.sql`

Portlar:

- **8080** — HTTP (Hrana over HTTP) ← `DATABASE_URL`
- **8081** — Hrana WebSocket

---

## İçerik (seed sonrası)

| Tablo | Adet |
|--------|------|
| songs | 18 |
| podcasts | 14 |
| news_articles | 12 |
| vocabulary | 332 |
| lessons | 15 |

Sayfalar: `/music` · `/podcast` · `/news`  
API: `GET /api/content/songs|podcasts|news`

Admin: `zeynepkaya@ornek.com` / `demo1234`

---

## Production Turso Cloud

1. https://turso.tech → DB oluştur  
2. Env:

```env
DATABASE_URL=libsql://parla-xxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
GROQ_API_KEY=gsk_...
JWT_SECRET=uzun-gizli
DEMO_MODE=on
```

3. PC/CI’dan (sandbox cloud’a çıkamaz):

```bash
export DATABASE_URL=libsql://...
export TURSO_AUTH_TOKEN=...
npx drizzle-kit push
npm run db:seed
```

---

## Dosya modu (yedek)

sqld yoksa hâlâ:

```env
DATABASE_URL=file:.data/parla.db
```

Aynı seed, aynı tablolar — sadece gömülü dosya, sunucu yok.
