# Parla — Sadece PC (sandbox yok)

Sandbox’tan **tamamen ayrıldın**. Bundan sonra her şey kendi bilgisayarında.

Repo: https://github.com/Serdar-star/parla-  
Branch: **`arena/01a072d6-parla`**

---

## 1) Kur (bir kez)

| Araç | Link |
|------|------|
| Node.js 20+ LTS | https://nodejs.org |
| Git | https://git-scm.com |
| Groq key | https://console.groq.com/keys |
| Turso (opsiyonel) | https://turso.tech |

Windows: kurulumdan sonra **yeni** CMD/PowerShell aç.

---

## 2) İndir

```bash
git clone https://github.com/Serdar-star/parla-.git
cd parla-
git checkout arena/01a072d6-parla
git pull origin arena/01a072d6-parla
```

ZIP indirdiysen: zip’i aç → `parla-` klasörüne gir → branch’in bu olduğundan emin ol.

---

## 3) Çalıştır

### Windows
Klasörde **`START-PC.bat`** → çift tık.

### Mac / Linux
```bash
chmod +x START-PC.sh
./START-PC.sh
```

İlk sefer `.env.local` açılır:

```env
GROQ_API_KEY=gsk_xxxxxxxx
```

Kaydet. Script: `npm install` → DB push → seed → `npm run dev`.

Tarayıcı: **http://localhost:3000**

---

## 4) Kanıt — çalışıyor mu?

| Test | Sonuç |
|------|--------|
| `/music` | 18 şarkı |
| `/podcast` | 14 podcast |
| `/news` | 12 haber |
| `/ai-teacher` | Cevap + **Groq** (YEDEK değil) |

```bash
curl -s http://localhost:3000/api/ai/status
# hasKey: true

curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Explain present perfect\",\"mode\":\"gramer\"}"
# provider: groq
```

---

## 5) Turso cloud (kalıcı DB)

Dosya DB (`file:.data/parla.db`) PC’de yeter. Kalıcı / Vercel için:

1. turso.tech → Create Database  
2. URL + token al  
3. `app/.env.local`:

```env
DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_DATABASE_URL=libsql://parla-xxxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
GROQ_API_KEY=gsk_...
JWT_SECRET=uzun-gizli-yazi
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Yeniden:

```bash
cd app
npx drizzle-kit push --force
npm run db:seed
npm run dev
```

veya `START-PC` tekrar.

---

## 6) Sık hatalar

| Sorun | Çözüm |
|--------|--------|
| AI YEDEK | Gerçek `gsk_...` yaz, placeholder bırakma, dev’i yeniden başlat |
| Port 3000 dolu | Başka terminal kapat veya `-p 3001` |
| `DATABASE_URL gerekli` | `app/.env.local` var mı bak |
| Eski kod | `git pull origin arena/01a072d6-parla` |
| Turso UNAUTHORIZED | Yeni token al |

---

## 7) Vercel

1. Import repo · Root: **`app`** · Branch: **`arena/01a072d6-parla`**  
2. Env: Groq + Turso + JWT + DEMO + APP_URL  
3. Deploy  
4. PC’den bir kez Turso’ya seed (yukarıdaki push+seed)

---

## Özet

```text
Sandbox  →  bitti / kullanma
PC       →  START-PC + GROQ key  →  gerçek AI + gerçek DB
```

Takılırsan hata satırını aynen gönder.
