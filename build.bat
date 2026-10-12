@echo off
chcp 65001 >nul
title PoxiClicker (build)
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
if not exist node_modules call npm install || goto :error
call npm run dist || goto :error
echo.
echo Listo: instalador y portable en la carpeta release
pause
exit /b
:error
echo Algo ha fallado. Revisa el mensaje de arriba.
pause
