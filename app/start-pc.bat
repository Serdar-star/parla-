@echo off
chcp 65001 >nul
setlocal EnableExtensions
title Parla - PC (Groq + DB)
cd /d "%~dp0"

echo.
echo  ========================================
echo   PARLA — PC kurulum / baslat
echo   Groq AI + file DB (tamamen lokal)
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node.js PATH'te yok.
  echo        1^) https://nodejs.org  → LTS indir
  echo        2^) Kurulumda "Add to PATH" isaretli olsun
  echo        3^) PC'yi yeniden baslat
  echo        4^) YENI CMD ac → node -v  sonra bu dosyayi tekrar calistir
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo [OK] Node %%v
for /f "tokens=*" %%v in ('npm -v 2^>nul') do echo [OK] npm  %%v

REM npm ag dayanikliligi
call npm config set fetch-retries 5 >nul 2>&1
call npm config set fetch-retry-mintimeout 20000 >nul 2>&1
call npm config set fetch-retry-maxtimeout 120000 >nul 2>&1
call npm config set fund false >nul 2>&1
call npm config set audit false >nul 2>&1

set "NEED_INSTALL=0"
if not exist "node_modules\" set "NEED_INSTALL=1"
if not exist "node_modules\next\" set "NEED_INSTALL=1"

if "%NEED_INSTALL%"=="1" (
  echo [1/5] npm install ^(birkaç dakika surebilir, internet lazim^)...
  if exist "node_modules\" (
    echo      Yarim kalmis node_modules temizleniyor...
    rmdir /s /q node_modules 2>nul
  )
  call npm install
  if errorlevel 1 (
    echo.
    echo [HATA] npm install basarisiz ^(genelde ECONNRESET / internet^).
    echo.
    echo  Dene:
    echo   1^) WiFi yerine telefon hotspot
    echo   2^) VPN ac/kapa
    echo   3^) Asagidaki 3 satiri elle calistir:
    echo.
    echo      cd /d "%~dp0"
    echo      rmdir /s /q node_modules
    echo      npm install
    echo.
    echo  Sonra tekrar START-PC.bat
    pause
    exit /b 1
  )
  if not exist "node_modules\next\" (
    echo [HATA] next paketi yok — npm install yarim kalmis.
    pause
    exit /b 1
  )
  echo [OK] npm install tamam
) else (
  echo [1/5] node_modules mevcut
)

if not exist ".env.local" (
  echo [2/5] .env.local olusturuluyor...
  if exist ".env.example" (
    copy /Y .env.example .env.local >nul
  ) else (
    (
      echo DATABASE_URL=file:.data/parla.db
      echo JWT_SECRET=parla-pc-dev-secret-change-me
      echo DEMO_MODE=on
      echo NEXT_PUBLIC_APP_URL=http://localhost:3000
      echo GROQ_API_KEY=gsk_buraya_yapistir
    ) > .env.local
  )
  echo.
  echo  *** ONEMLI — Notepad acilacak ***
  echo  GROQ_API_KEY=gsk_...  satirina kendi key'ini yaz
  echo  Key: https://console.groq.com/keys
  echo  Kaydet, Notepad'i kapat, bu pencereye don → Enter
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
  echo          Bos birakirsan AI YEDEK calisir; Muzik/DB yine calisir.
  choice /C EN /M "E=Notepad ac key yaz, N=devam"
  if errorlevel 2 goto after_key_warn
  if errorlevel 1 notepad .env.local
)
:after_key_warn

findstr /B /C:"DATABASE_URL=http://127.0.0.1:8080" .env.local >nul 2>&1
if not errorlevel 1 (
  echo [i] Sandbox sqld URL → file:.data/parla.db
  powershell -NoProfile -Command "(Get-Content -Raw .env.local) -replace 'DATABASE_URL=http://127.0.0.1:8080','DATABASE_URL=file:.data/parla.db' | Set-Content .env.local -Encoding UTF8 -NoNewline"
)

for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "DATABASE_URL=" .env.local`) do set "DATABASE_URL=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "TURSO_DATABASE_URL=" .env.local`) do set "TURSO_DATABASE_URL=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "TURSO_AUTH_TOKEN=" .env.local`) do set "TURSO_AUTH_TOKEN=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "JWT_SECRET=" .env.local`) do set "JWT_SECRET=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "GROQ_API_KEY=" .env.local`) do set "GROQ_API_KEY=%%b"
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /B "DEMO_MODE=" .env.local`) do set "DEMO_MODE=%%b"

if "%DATABASE_URL%"=="" set "DATABASE_URL=file:.data/parla.db"
if "%JWT_SECRET%"=="" set "JWT_SECRET=parla-pc-dev-secret-change-me"
if "%DEMO_MODE%"=="" set "DEMO_MODE=on"
set "NEXT_PUBLIC_APP_URL=http://localhost:3000"

echo [4/5] Veritabani (push + seed)...
echo      DATABASE_URL=%DATABASE_URL%
if not exist ".data\" mkdir .data

call npx drizzle-kit push --force
if errorlevel 1 (
  echo [UYARI] drizzle push — seed yine denenecek
)

call npm run db:seed
if errorlevel 1 (
  echo [HATA] Seed basarisiz.
  pause
  exit /b 1
)

echo.
echo [5/5] Sunucu basliyor...
echo      http://localhost:3000/dashboard
echo      Durdurmak: Ctrl+C
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000/dashboard"
call npm run dev
echo.
echo Sunucu durdu.
pause
endlocal
