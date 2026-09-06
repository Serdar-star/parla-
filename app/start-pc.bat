@echo off
chcp 65001 >nul
title Parla - PC (Groq + DB)
cd /d "%~dp0"

echo.
echo  ========================================
echo   PARLA — PC kurulum / baslat
echo   Groq AI + Turso/file DB
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node.js yok.
  echo        https://nodejs.org  → LTS indir, kur, PC'yi gerekirse yeniden baslat.
  echo        Sonra bu dosyayi tekrar calistir.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo [OK] Node %%v

if not exist "node_modules\" (
  echo [1/5] npm install...
  call npm install
  if errorlevel 1 (
    echo [HATA] npm install basarisiz.
    pause
    exit /b 1
  )
) else (
  echo [1/5] node_modules mevcut
)

if not exist ".env.local" (
  echo [2/5] .env.local olusturuluyor (.env.example kopyasi)...
  copy /Y .env.example .env.local >nul
  echo.
  echo  *** ONEMLI — Notepad acilacak ***
  echo  1^) GROQ_API_KEY=gsk_...   ^(console.groq.com/keys^)
  echo  2^) DATABASE_URL=file:.data/parla.db   ^(hizli baslangic^)
  echo     veya Turso cloud:
  echo     DATABASE_URL=libsql://parla-xxxx.turso.io
  echo     TURSO_AUTH_TOKEN=eyJ...
  echo  3^) Kaydet, Notepad'i kapat, bu pencereye don → bir tusa bas
  echo.
  notepad .env.local
  pause
) else (
  echo [2/5] .env.local mevcut
)

echo [3/5] .env.local kontrol...
findstr /C:"gsk_buraya_yapistir" .env.local >nul 2>&1
if not errorlevel 1 (
  echo.
  echo  [UYARI] GROQ_API_KEY henuz placeholder.
  echo          Gercek key yoksa AI YEDEK moda duser.
  echo          Duzenlemek icin Notepad acilsin mi?
  choice /C EN /M "E=evet Notepad, N=devam"
  if errorlevel 2 goto after_key_warn
  if errorlevel 1 notepad .env.local
)
:after_key_warn

REM Load simple defaults if user left http turso local from sandbox example
findstr /B /C:"DATABASE_URL=http://127.0.0.1:8080" .env.local >nul 2>&1
if not errorlevel 1 (
  echo [i] Sandbox sqld URL bulundu → PC icin file DB'ye cevriliyor
  powershell -NoProfile -Command "(Get-Content .env.local) -replace 'DATABASE_URL=http://127.0.0.1:8080','DATABASE_URL=file:.data/parla.db' | Set-Content .env.local -Encoding UTF8"
)

echo [4/5] Veritabani (push + seed)...
REM dotenv in drizzle/seed reads .env.local via dotenv/config in app code;
REM also export common vars for drizzle-kit CLI
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "DATABASE_URL=" .env.local`) do set "DATABASE_URL=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "TURSO_DATABASE_URL=" .env.local`) do set "TURSO_DATABASE_URL=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "TURSO_AUTH_TOKEN=" .env.local`) do set "TURSO_AUTH_TOKEN=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "JWT_SECRET=" .env.local`) do set "JWT_SECRET=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "GROQ_API_KEY=" .env.local`) do set "GROQ_API_KEY=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "DEMO_MODE=" .env.local`) do set "DEMO_MODE=%%b"

if "%DATABASE_URL%"=="" set "DATABASE_URL=file:.data/parla.db"
if "%JWT_SECRET%"=="" set "JWT_SECRET=parla-pc-dev-secret-change-me"
if "%DEMO_MODE%"=="" set "DEMO_MODE=on"

echo      DATABASE_URL=%DATABASE_URL%

if not exist ".data\" mkdir .data

call npx drizzle-kit push --force
if errorlevel 1 (
  echo [UYARI] drizzle push sorunlu — seed yine denenecek
)

call npm run db:seed
if errorlevel 1 (
  echo [HATA] Seed basarisiz. .env.local DATABASE_URL / TURSO_AUTH_TOKEN kontrol et.
  pause
  exit /b 1
)

echo.
echo [5/5] Sunucu basliyor...
echo      http://localhost:3000
echo      AI Ogretmen = Groq  ^|  Muzik/Podcast = DB
echo      Durdurmak: Ctrl+C
echo.
call npm run dev
pause
