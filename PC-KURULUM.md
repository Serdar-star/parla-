# Parla — PC’de gerçek Groq + Turso

Sandbox’ı kapatmana gerek yok; **PC’de ayrı çalıştırırsın.**  
PC’de internet açık → **Groq gerçek**, **Turso cloud veya yerel DB gerçek.**

---

## 5 dakikada ayağa kalk (özet)

```text
1. Node 20+ kur
2. git clone + branch
3. start-pc.bat  (Windows)  veya  ./start-pc.sh  (Mac/Linux)
4. .env.local içine GROQ_API_KEY yapıştır
5. http://localhost:3000 → AI Öğretmen + Müzik
```

---

## 0) Gerekenler

| Araç | Link |
|------|------|
| **Node.js 20+ LTS** | https://nodejs.org |
| **Git** | https://git-scm.com |
| **Groq API key** | https://console.groq.com/keys → `gsk_...` |
| **Turso** (opsiyonel ama önerilir) | https://turso.tech → ücretsiz DB |

Windows’ta kurulumdan sonra **yeni** PowerShell / CMD aç (PATH yenilensin).

---

## 1) Repoyu indir

```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla-
git checkout arena/01a072d6-parla
git pull origin arena/01a072d6-parla
```

> **Bu branch’i kullan** (`arena/01a072d6-parla`). `main` eski olabilir.

---

## 2) Tek tık başlat

### Windows

1. Klasör: `parla-\app\`
2. **`start-pc.bat`** dosyasına çift tık
3. İlk seferde Notepad açılır → `GROQ_API_KEY=gsk_...` yaz → kaydet → Enter

veya kökten: `START-PC.bat`

### Mac / Linux

```bash
cd parla-/app
chmod +x start-pc.sh
./start-pc.sh
```

veya kökten: `./START-PC.sh`

Script şunları yapar:

1. `npm install` (yoksa)
2. `.env.local` oluşturur
3. Veritabanı push + seed
4. `npm run dev` → **http://localhost:3000**

---

## 3) `.env.local` — iki mod

Dosya: `app/.env.local` (git’e **gitmez**)

### A) Hızlı (dosya DB + Groq) — ilk deneme

```env
DATABASE_URL=file:.data/parla.db
JWT_SECRET=istedigin-uzun-gizli-yazi-12345
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=http://localhost:3000
GROQ_API_KEY=gsk_SENIN_GERCEK_KEYIN
```

Bu yeter: müzik/podcast/ders + **gerçek Groq AI**.

### B) Tam (Turso Cloud + Groq) — kalıcı DB

1. https://turso.tech → kayıt → **Create Database** (`parla` gibi isim)
2. URL kopyala: `libsql://parla-xxxx.turso.io`
3. Token: dashboard’dan veya CLI:

```bash
# Turso CLI (bir kez)
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create parla
turso db show parla --url
turso db tokens create parla
```

4. `.env.local`:

```env
DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_AUTH_TOKEN=eyJ...token...
JWT_SECRET=istedigin-uzun-gizli-yazi-12345
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=http://localhost:3000
GROQ_API_KEY=gsk_SENIN_GERCEK_KEYIN
```

5. Seed’i Turso’ya bas (script otomatik dener; elle):

```bash
cd app
# Windows PowerShell:
$env:DATABASE_URL="libsql://parla-xxxx.turso.io"
$env:TURSO_AUTH_TOKEN="eyJ..."
npx drizzle-kit push
npm run db:seed
npm run dev
```

```bash
# Mac/Linux
export DATABASE_URL=libsql://parla-xxxx.turso.io
export TURSO_AUTH_TOKEN=eyJ...
npx drizzle-kit push
npm run db:seed
npm run dev
```

---

## 4) Çalışıyor mu? Kontrol listesi

Tarayıcı: **http://localhost:3000**

| Test | Beklenen |
|------|----------|
| `/dashboard` | Demo kullanıcı, XP |
| `/music` | 18 şarkı |
| `/podcast` | 14 podcast |
| `/news` | 12 haber |
| `/ai-teacher` | Cevap + **Groq** badge / `provider: groq` |

API kontrol:

```bash
# AI status
curl -s http://localhost:3000/api/ai/status

# Chat (Groq)
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Explain present perfect simply\",\"mode\":\"gramer\"}"
```

Cevapta `"provider":"groq"` ve `"usedAI":true` → **tamam.**

Şarkılar:

```bash
curl -s http://localhost:3000/api/content/songs | head -c 200
```

---

## 5) Sandbox vs PC

| | Arena sandbox | Senin PC |
|--|---------------|----------|
| Groq | ❌ ağ engeli | ✅ gerçek |
| Turso cloud | ❌ TLS engeli | ✅ gerçek |
| Yerel sqld / file DB | ✅ | ✅ |
| Ne yapmalısın? | Demo / UI | **Asıl çalışma burası** |

Sandbox’ı “ayırman” = PC’de clone + start. Sandbox silmene gerek yok.

---

## 6) Sık hatalar

| Hata | Çözüm |
|------|--------|
| AI yedek / YEDEK | `.env.local`’de gerçek `gsk_...`, kaydet, **dev’i yeniden başlat** |
| `GROQ_API_KEY eksik` | Placeholder `gsk_buraya_yapistir` bırakma |
| `DATABASE_URL gerekli` | `.env.local` satırını kontrol et |
| Turso `UNAUTHORIZED` | Token yanlış / süresi dolmuş → yeni token |
| Turso bağlanamıyor | İnternet + URL `libsql://` ile başlıyor mu |
| Port 3000 dolu | `npx next dev -H 0.0.0.0 -p 3001` |
| Eski kod | `git pull origin arena/01a072d6-parla` |
| `drizzle-kit push` TTY | Script `--force` kullanır; yine takılırsa file moda geç |

---

## 7) Vercel (canlı site)

1. vercel.com → Import `Serdar-star/parla-`
2. **Root Directory:** `app`
3. Branch: `arena/01a072d6-parla`
4. Env:

```env
DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
GROQ_API_KEY=gsk_...
JWT_SECRET=uzun-gizli
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=https://senin-proje.vercel.app
```

5. Deploy sonrası **PC’den bir kez** seed (Vercel build seed etmez):

```bash
export DATABASE_URL=libsql://...
export TURSO_AUTH_TOKEN=...
cd app && npx drizzle-kit push && npm run db:seed
```

---

## Komut özeti (kopyala-yapıştır)

```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla- && git checkout arena/01a072d6-parla && git pull
cd app
cp .env.example .env.local
# → GROQ_API_KEY=gsk_...  (ve istersen Turso satırları)
npm install
npx drizzle-kit push
npm run db:seed
npm run dev
```

Windows: `app\start-pc.bat` çift tık yeterli.

---

Admin (DEMO_MODE=on iken login şart değil):  
`zeynepkaya@ornek.com` / `demo1234`

Takılırsan hata metnini aynen at.
