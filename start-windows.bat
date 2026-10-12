@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js 20 or later is required. Install from https://nodejs.org/
 pause
 exit /b 1
)
echo Starting WOD Stream Studio...
node server.mjs
if errorlevel 1 pause
