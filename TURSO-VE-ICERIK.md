# Turso + Groq — nerede ne çalışır?

## Tek bakış

| Ortam | DB | Groq AI | Ne yap |
|--------|----|---------|--------|
| **Arena sandbox** | Yerel `sqld` veya `file:` ✅ | ❌ ağ engeli | UI / içerik demo |
| **Senin PC** | file **veya** Turso cloud ✅ | ✅ gerçek | **Asıl çalışma** |
| **Vercel** | Turso cloud ✅ | ✅ gerçek | Canlı site |

Sandbox’ı silmek **zorunlu değil**. PC’de clone + `START-PC` yeterli.

---

## PC’de (senin hedefin)

Rehber: **[PC-KURULUM.md](./PC-KURULUM.md)**

```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla- && git checkout arena/01a072d6-parla && git pull
# Windows: START-PC.bat
# Mac/Linux: ./START-PC.sh
```

`.env.local`:

```env
DATABASE_URL=file:.data/parla.db
# veya Turso:
# DATABASE_URL=libsql://parla-xxxx.turso.io
# TURSO_AUTH_TOKEN=eyJ...

GROQ_API_KEY=gsk_GERCEK_KEY
JWT_SECRET=uzun-gizli
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Sandbox’ta Turso protokolü (sqld)

Cloud `turso.io` kapalı; yerel libSQL server:

```bash
cd app && npm run turso:local
# DATABASE_URL=http://127.0.0.1:8080
```

Aynı `@libsql/client` + Drizzle kodu.

---

## İçerik (seed)

| | Adet |
|--|------|
| songs | 18 |
| podcasts | 14 |
| news | 12 |
| vocabulary | 332 |
| lessons | 15 |

`/music` · `/podcast` · `/news` · `GET /api/content/*`
