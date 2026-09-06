@echo off
chcp 65001 >nul
title Parla - PC baslat
cd /d "%~dp0"

echo.
echo  === Parla PC Kurulum / Baslat ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node.js yok. https://nodejs.org LTS indir, kur, bu dosyayi tekrar calistir.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [1/4] npm install...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)

if not exist ".env.local" (
  echo [2/4] .env.local olusturuluyor...
  copy /Y .env.example .env.local >nul
  echo.
  echo  *** ONEMLI ***
  echo  .env.local dosyasini Notepad ile ac.
  echo  GROQ_API_KEY=gsk_... satirina kendi Groq key'ini yaz.
  echo  Kaydet, bu pencereye don, bir tusa bas.
  echo.
  notepad .env.local
  pause
)

echo [3/4] Veritabani...
set DATABASE_URL=file:.data/parla.db
call npx drizzle-kit push
call npm run db:seed

echo [4/4] Sunucu basliyor... http://localhost:3000
echo  Durdurmak icin Ctrl+C
echo.
call npm run dev
pause
