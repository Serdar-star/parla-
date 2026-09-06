@echo off
chcp 65001 >nul
cd /d "%~dp0app"
if not exist "KUR-PC.bat" (
  echo [HATA] app\KUR-PC.bat yok — git pull yap
  pause
  exit /b 1
)
call KUR-PC.bat
