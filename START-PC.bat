@echo off
chcp 65001 >nul
cd /d "%~dp0app"
if not exist "start-pc.bat" (
  echo [HATA] app\start-pc.bat yok.
  echo        git pull origin arena/01a072d6-parla
  pause
  exit /b 1
)
call start-pc.bat
