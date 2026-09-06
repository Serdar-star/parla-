@echo off
chcp 65001 >nul
cd /d "%~dp0app"
if not exist "start-pc.bat" (
  echo [HATA] app\start-pc.bat yok. Repo bozulmus olabilir.
  pause
  exit /b 1
)
call start-pc.bat
