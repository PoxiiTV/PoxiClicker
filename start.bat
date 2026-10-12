@echo off
chcp 65001 >nul
title PoxiClicker (desarrollo)
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
if not exist node_modules (
  echo Instalando dependencias...
  call npm install || goto :error
)
call npm start
exit /b
:error
echo Algo ha fallado. Revisa el mensaje de arriba.
pause
