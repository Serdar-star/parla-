# Parla — Vercel’de yayınla (canlı link)

Bitince elinde şöyle bir adres olur:  
`https://parla-xxxx.vercel.app` → herkes Chrome’dan açar.

---

## Senin yapacakların (sırayla)

### 1) Hesaplar (ücretsiz yeterli)

| Hesap | Ne için | Link |
|--------|---------|------|
| **GitHub** | Kod zaten burada | github.com (hazır) |
| **Vercel** | Siteyi yayınlar | https://vercel.com → Continue with GitHub |
| **Turso** | Kalıcı veritabanı | https://turso.tech |
| **Groq** | Gerçek AI | https://console.groq.com/keys |

---

### 2) Turso veritabanı

1. turso.tech → kayıt / giriş  
2. **Create Database** → isim: `parla` (veya ne istersen)  
3. Şunları kopyala (not defterine sakla):

```text
URL   = libsql://parla-XXXX.turso.io
TOKEN = eyJ...   (Create Token / tokens create)
```

CLI kullanırsan (opsiyonel):

```bash
turso db create parla
turso db show parla --url
turso db tokens create parla
```

---

### 3) Groq key

1. https://console.groq.com/keys  
2. **Create API Key** → `gsk_...` kopyala  

---

### 4) Vercel’e bağla

1. https://vercel.com/new  
2. **Import** → `Serdar-star/parla-` (GitHub’dan yetki ver)  
3. Proje ayarları:

| Ayar | Değer |
|------|--------|
| **Framework** | Next.js (otomatik) |
| **Root Directory** | **`app`** ← kritik |
| **Production Branch** | **`arena/01a072d6-parla`** |
| Build Command | `npm run build` (varsayılan) |
| Install Command | `npm install` |

4. **Environment Variables** ekle (Production + Preview):

```env
DATABASE_URL=libsql://parla-XXXX.turso.io
TURSO_DATABASE_URL=libsql://parla-XXXX.turso.io
TURSO_AUTH_TOKEN=eyJ...token...
GROQ_API_KEY=gsk_...key...
JWT_SECRET=buraya-uzun-rastgele-gizli-yazi-12345
DEMO_MODE=on
NEXT_PUBLIC_APP_URL=https://HENUZ-BILINMIYOR.vercel.app
```

> `NEXT_PUBLIC_APP_URL` ilk deploy’dan sonra gerçek domain ile güncelleyip **Redeploy** et.

5. **Deploy** → 2–5 dk bekle → yeşil **Ready**  
6. Linki kopyala: `https://….vercel.app`

---

### 5) Veritabanını doldur (bir kez, PC’den)

Vercel build seed **yapmaz**. Kendi PC’nde:

```bat
cd C:\Users\Serdar\parla-\app

set DATABASE_URL=libsql://parla-XXXX.turso.io
set TURSO_DATABASE_URL=libsql://parla-XXXX.turso.io
set TURSO_AUTH_TOKEN=eyJ...token...
set JWT_SECRET=istedigin-gizli
set DEMO_MODE=on

npx drizzle-kit push --force
npm run db:seed
```

Bitince sitede: Müzik 18 şarkı, dersler, demo kullanıcı.

Admin (DEMO_MODE=on): giriş şart değil; istersen  
`zeynepkaya@ornek.com` / `demo1234`

---

### 6) APP_URL’i düzelt + Redeploy

Vercel → Project → **Settings → Environment Variables**:

```env
NEXT_PUBLIC_APP_URL=https://SENIN-GERCEK-ADRES.vercel.app
```

**Deployments** → son deploy → **⋯ → Redeploy**.

---

### 7) Kontrol listesi

| Test | Beklenen |
|------|----------|
| Ana sayfa / dashboard | Açılıyor |
| `/music` | Şarkılar dolu |
| `/ai-teacher` | Groq cevap (YEDEK değil) |
| Telefon Chrome | Aynı link açılıyor |

---

## Sonradan ben nasıl güncellerim?

Sen “şunu değiştir” dersin → ben koda yazarım → `git push`  
Vercel **otomatik** yeniden yayınlar (GitHub bağlıysa).

Senin yapman gereken ekstra bir şey yok (env değişmedikçe).

---

## Sık hatalar

| Sorun | Çözüm |
|--------|--------|
| Build fail / wrong root | Root Directory = **`app`** |
| Boş müzik / hata | Turso seed atılmamış (adım 5) |
| AI YEDEK | `GROQ_API_KEY` Vercel env’de yok / Redeploy yok |
| `DATABASE_URL` hatası | `libsql://` + `TURSO_AUTH_TOKEN` ikisi birden |
| Eski kod | Branch = `arena/01a072d6-parla` |
| 404 stil | `NEXT_PUBLIC_APP_URL` yanlış domain |

---

## Mini özet

```text
1. Turso DB + token
2. Groq key
3. Vercel Import → Root: app → Branch: arena/01a072d6-parla
4. Env’leri yapıştır → Deploy
5. PC’den drizzle push + db:seed
6. APP_URL güncelle → Redeploy
7. Linki aç 🎉
```

Takıldığın adımı (ekran / hata yazısı) at, oradan devam ederiz.
