# Parla — PC’de tamamen çalıştır

Branch: **`arena/01a072d6-parla`**  
Repo: https://github.com/Serdar-star/parla-

---

## Hızlı yol (Windows)

### 0) Node
https://nodejs.org → **LTS** → kur → **Add to PATH** → PC restart → yeni CMD:

```bat
node -v
```

### 1) İndir (bir kez)

```bat
cd %USERPROFILE%
git clone https://github.com/Serdar-star/parla-.git
cd parla-
git checkout arena/01a072d6-parla
git pull origin arena/01a072d6-parla
```

### 2) Paketler (internet şart)

`npm install` bazen kopar (`ECONNRESET`). Önce:

```bat
KUR-PC.bat
```

veya elle:

```bat
cd app
rmdir /s /q node_modules
npm install
```

### 3) Çalıştır

```bat
cd %USERPROFILE%\parla-
START-PC.bat
```

- Notepad → `GROQ_API_KEY=gsk_...` (https://console.groq.com/keys)
- Tarayıcı: **http://localhost:3000/dashboard**

---

## Çalışıyor mu?

| | |
|--|--|
| `/music` | 18 şarkı |
| `/podcast` | 14 |
| `/ai-teacher` | Groq cevabı (key varsa) |

---

## Sık hatalar

| Hata | Çözüm |
|------|--------|
| Node.js yok | LTS kur, PATH, **yeni** CMD |
| `ECONNRESET` / npm install | `KUR-PC.bat`, hotspot, VPN |
| AI YEDEK | Gerçek `gsk_...` yaz, dev yeniden |
| Port 3000 | Diğer terminali kapat |

---

## Sonraki seferler

```bat
cd %USERPROFILE%\parla-
git pull origin arena/01a072d6-parla
START-PC.bat
```

Sadece tarayıcı: `AC.bat`
