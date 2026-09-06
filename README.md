# Parla — PC’de çalıştır (Groq + DB gerçek)

> **Bu proje artık PC / Vercel içindir.**  
> Arena sandbox Groq ve Turso cloud’a çıkamaz. Geliştirme ve demo = **kendi bilgisayarın**.

---

## Hızlı start (tek tık)

### Windows
1. [Node.js LTS](https://nodejs.org) kur  
2. Bu repoyu indir / clone et  
3. **`START-PC.bat`** dosyasına **çift tık**  
4. Açılan Notepad’de:
   ```env
   GROQ_API_KEY=gsk_SENIN_KEYIN
   ```
   Key: https://console.groq.com/keys  
5. Kaydet → Enter  
6. Tarayıcı: **http://localhost:3000**

### Mac / Linux
```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla-
git checkout arena/01a072d6-parla
git pull origin arena/01a072d6-parla
chmod +x START-PC.sh
./START-PC.sh
```
Açılan editörde `GROQ_API_KEY=gsk_...` yaz → kaydet.

---

## Ne çalışır?

| Özellik | PC’de |
|---------|--------|
| AI Öğretmen (Groq) | ✅ gerçek |
| Müzik / Podcast / Haber | ✅ 18 / 14 / 12 |
| Dersler, kelime, lig | ✅ seed’li DB |
| Turso cloud (opsiyonel) | ✅ `.env.local` ile |
| Demo giriş | ✅ `DEMO_MODE=on` |

Admin (istersen): `zeynepkaya@ornek.com` / `demo1234`

---

## Branch

```text
arena/01a072d6-parla
```

`main` eski olabilir — **bu branch’i kullan.**

```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla-
git checkout arena/01a072d6-parla
git pull
```

---

## Elle kurulum (script istemezsen)

```bash
cd parla-/app
cp .env.example .env.local
# GROQ_API_KEY=gsk_... yaz
npm install
npx drizzle-kit push --force
npm run db:seed
npm run dev
```

`.env.local` örneği (hızlı):

```env
DATABASE_URL=file:.data/parla.db
JWT_SECRET=istedigin-uzun-gizli
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=http://localhost:3000
GROQ_API_KEY=gsk_SENIN_KEYIN
```

Turso cloud (kalıcı DB):

```env
DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
GROQ_API_KEY=gsk_SENIN_KEYIN
JWT_SECRET=istedigin-uzun-gizli
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Turso hesap: https://turso.tech

---

## Çalışıyor mu?

1. http://localhost:3000/music → şarkılar  
2. http://localhost:3000/ai-teacher → mesaj yaz → **Groq**  
3. Terminal:
   ```bash
   curl -s http://localhost:3000/api/ai/status
   ```
   `"hasKey": true` ve mümkünse `"reachable": true`

---

## Dosyalar

| Dosya | Ne |
|--------|-----|
| `START-PC.bat` / `START-PC.sh` | Tek tık başlat |
| `PC-KURULUM.md` | Detaylı rehber + Vercel |
| `app/.env.example` | Env şablonu |
| `TURSO-VE-ICERIK.md` | DB notları |

---

## Vercel (canlı)

Root Directory: **`app`** · Branch: **`arena/01a072d6-parla`**  
Env: `GROQ_API_KEY`, `DATABASE_URL` (Turso), `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `DEMO_MODE`, `NEXT_PUBLIC_APP_URL`  
Seed’i **PC’den bir kez** Turso’ya bas (`drizzle-kit push` + `npm run db:seed`).

Detay: [PC-KURULUM.md](./PC-KURULUM.md)
