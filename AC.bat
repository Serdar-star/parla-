@echo off
chcp 65001 >nul
title Parla - Tarayicide Ac
cd /d "%~dp0"

echo.
echo  Parla tarayicide aciliyor...
echo.

REM Sunucu ayakta mi?
curl -s -o nul -m 2 http://127.0.0.1:3000/dashboard 2>nul
if errorlevel 1 (
  echo  Sunucu kapali — START-PC.bat baslatiliyor...
  start "" "%~dp0START-PC.bat"
  timeout /t 8 /nobreak >nul
)

start http://localhost:3000/dashboard
echo  Acildi: http://localhost:3000/dashboard
timeout /t 2 >nul
