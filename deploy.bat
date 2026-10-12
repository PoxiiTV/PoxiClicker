@echo off
chcp 65001 >nul
title PoxiClicker (deploy)
cd /d "%~dp0"
set OUT=deploy-hosting
if exist %OUT% rmdir /s /q %OUT%
mkdir %OUT%\src %OUT%\resources
copy main.js %OUT%\ >nul
copy preload.js %OUT%\ >nul
copy clicker.ps1 %OUT%\ >nul
copy package.json %OUT%\ >nul
copy start.bat %OUT%\ >nul
copy src\* %OUT%\src\ >nul
copy resources\icon.png %OUT%\resources\ >nul
if exist .env copy .env %OUT%\ >nul
echo Listo: carpeta %OUT% (ejecuta npm install --omit=dev dentro y luego npm start)
pause
