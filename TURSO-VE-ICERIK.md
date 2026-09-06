# Turso + Müzik / Podcast — ne çalışır, ne zaman?

## Kısa cevap

| Ortam | Veritabanı | Müzik / Podcast | Groq AI |
|--------|------------|-----------------|---------|
| **Arena sandbox (şimdi)** | Yerel SQLite `file:.data/parla.db` ✅ | ✅ (seed’li) | ❌ ağ engeli |
| **Kendi PC** | Aynı SQLite veya Turso ✅ | ✅ | ✅ |
| **Vercel + Turso** | Turso bulut ✅ | ✅ | ✅ |

**Turso bulutuna sandbox’tan bağlanılamıyor** (`turso.io` TLS kapalı).  
Ama **aynı kod + aynı tablolar** zaten yerelde dolu: şarkı, podcast, haber.

Sandbox’ta “gerçek çalışan DB” = **lokal libSQL dosyası**.  
Production’da sadece URL’i Turso’ya çevirirsin — kod değişmez.

---

## Şu an içerik (seed)

Uygulama ayaktayken:

- `/music` — şarkılar (söz + TR + kelime + YouTube karaoke)
- `/podcast` — podcast’ler (transcript + quiz)
- `/news` — haberler (simple / medium / original)

API:

```text
GET /api/content/songs
GET /api/content/podcasts
GET /api/content/news
```

Yeniden doldurmak:

```bash
cd app
export DATABASE_URL=file:.data/parla.db
npx drizzle-kit push
npm run db:seed
```

---

## Turso’yu ne zaman ekleyeceksin? (en sonda)

1. https://turso.tech → hesap → Create Database  
2. URL al: `libsql://parla-xxx.turso.io`  
3. Token al: `turso db tokens create ...`  
4. Vercel (veya PC `.env.local`) env:

```env
DATABASE_URL=libsql://parla-xxx.turso.io
# veya
TURSO_DATABASE_URL=libsql://parla-xxx.turso.io
TURSO_AUTH_TOKEN=eyJ...

GROQ_API_KEY=gsk_...
JWT_SECRET=uzun-gizli
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=https://senin-app.vercel.app
```

5. Bir kez migrate/seed (PC veya CI’dan, sandbox’tan değil):

```bash
export DATABASE_URL=libsql://...
export TURSO_AUTH_TOKEN=...
npx drizzle-kit push
npm run db:seed
```

Kod yolu zaten hazır: `src/db/index.ts` hem `file:` hem `libsql://` destekler.

---

## Neden sandbox’ta Turso “ekleyemiyoruz”?

```
sandbox → turso.io:443 → SSL kesiliyor (Groq ile aynı engel)
sandbox → file:.data/parla.db → tam çalışıyor
```

Yani Turso’yu “sandbox içinde buluta bağlamak” imkânsız;  
**içerik ve tablolar zaten yerelde gerçekten çalışıyor.**  
En sonda Turso = aynı veriyi buluta taşımak.

---

## Ne eklemeye gerek yok?

- Ayrı bir “Turso sadece sandbox” kurulumu  
- Müzik için ayrı sunucu (YouTube embed + sözler DB’de)

İçeriği çoğaltmak için: `src/data/content.ts` → `npm run db:seed`.
