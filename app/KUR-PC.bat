@echo off
chcp 65001 >nul
title Parla - Sadece kurulum (npm install)
cd /d "%~dp0"

echo.
echo  PARLA — sadece bagimlilik kurulumu
echo  Internet lazim. Bitince START-PC.bat calistir.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node yok — https://nodejs.org LTS
  pause
  exit /b 1
)

node -v
npm -v

call npm config set fetch-retries 5
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
call npm config set fund false
call npm config set audit false

if exist "node_modules\" (
  echo Yarim node_modules siliniyor...
  rmdir /s /q node_modules 2>nul
)
if exist "package-lock.json" del /f /q package-lock.json 2>nul

echo.
echo npm install basliyor...
call npm install
if errorlevel 1 (
  echo.
  echo [HATA] Yine dustu. Hotspot / VPN dene, sonra tekrar KUR-PC.bat
  pause
  exit /b 1
)

if not exist "node_modules\next\" (
  echo [HATA] next yok
  pause
  exit /b 1
)

echo.
echo [OK] Kurulum tamam. Simdi:
echo      cd /d "%~dp0\.."
echo      START-PC.bat
echo.
pause
