# Parla — Kendi bilgisayarında çalıştır

Bu rehber **Windows / Mac / Linux** için. Sandbox yok → Groq normal çalışır.

---

## 0) Gerekenler

| Araç | Not |
|------|-----|
| **Node.js 20+** | [nodejs.org](https://nodejs.org) LTS indir |
| **Git** | [git-scm.com](https://git-scm.com) |
| **Groq key** | [console.groq.com/keys](https://console.groq.com/keys) → `gsk_...` |

Terminali aç (Windows: PowerShell veya “Node.js command prompt”).

---

## 1) Repoyu indir

```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla-
git checkout arena/01a072d6-parla
cd app
```

> Branch adı: `arena/01a072d6-parla` (şu anki dolu branch).  
> `main` hâlâ eski “zip upload” olabilir — **bu branch’i kullan**.

---

## 2) Bağımlılıklar

```bash
npm install
```

---

## 3) Ortam dosyası (`.env.local`)

```bash
# Mac / Linux
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

`.env.local` dosyasını Notepad / VS Code ile aç, **en az şunları** doldur:

```env
DATABASE_URL=file:.data/parla.db
JWT_SECRET=istedigin-uzun-gizli-yazi
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=http://localhost:3000
GROQ_API_KEY=gsk_SENIN_KEYIN
```

Kaydet. Bu dosya git’e **gitmez**.

---

## 4) Veritabanı + örnek veri

```bash
# Mac / Linux
export DATABASE_URL=file:.data/parla.db
export JWT_SECRET=istedigin-uzun-gizli-yazi
export DEMO_MODE=on
export GROQ_API_KEY=gsk_SENIN_KEYIN

npx drizzle-kit push
npm run db:seed
```

```powershell
# Windows PowerShell
$env:DATABASE_URL="file:.data/parla.db"
$env:JWT_SECRET="istedigin-uzun-gizli-yazi"
$env:DEMO_MODE="on"
$env:GROQ_API_KEY="gsk_SENIN_KEYIN"

npx drizzle-kit push
npm run db:seed
```

Seed bitince kabaca:
- 300+ kelime, 15 ders, şarkı/podcast/haber  
- Admin (istersen): `zeynepkaya@ornek.com` / `demo1234`  
- `DEMO_MODE=on` iken login şart değil

---

## 5) Çalıştır

```bash
npm run dev
```

Tarayıcı: **http://localhost:3000**

- Dashboard açılır (demo)  
- **AI Öğretmen** → mesaj yaz  
- Üstte **`Groq ●`** veya sunucu cevabında `provider: "groq"` görmelisin  

Kontrol:

```bash
curl -X POST http://localhost:3000/api/ai/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Explain present perfect\",\"mode\":\"gramer\"}"
```

Cevapta `"provider":"groq"` ve `"usedAI":true` → **tamam**.

---

## 6) Sık hatalar

| Hata | Çözüm |
|------|--------|
| `GROQ_API_KEY` yok / AI yedek | `.env.local` kaydettikten sonra `npm run dev` **yeniden** başlat |
| `DATABASE_URL gerekli` | `.env.local` içinde `DATABASE_URL=file:.data/parla.db` |
| Port 3000 dolu | `npm run dev -- -p 3001` |
| `drizzle-kit push` hata | `app` klasöründesin, Node 20+ |
| Branch boş / eski | `git checkout arena/01a072d6-parla` |

---

## 7) İleride Vercel (özet)

1. Repo GitHub’da  
2. [vercel.com](https://vercel.com) → Import  
3. Root Directory: **`app`**  
4. Env’leri yapıştır (`GROQ_API_KEY`, `JWT_SECRET`, **Turso** URL…)  
5. Deploy  

Lokal SQLite Vercel’de kalıcı olmaz → canlıda **Turso** kullan.

---

## Komut özeti (kopyala-yapıştır)

```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla- && git checkout arena/01a072d6-parla && cd app
npm install
cp .env.example .env.local
# → .env.local içine GROQ_API_KEY yaz
npx drizzle-kit push
npm run db:seed
npm run dev
```

Tarayıcı: http://localhost:3000  

Takılırsan hata mesajını aynen at, bakalım.
