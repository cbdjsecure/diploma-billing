@echo off
title Suro Bharati Sangeet Kala Kendra - Billing Desk Server
echo ========================================================
echo   Suro Bharati Sangeet Kala Kendra Billing System
echo   Starting server at http://localhost:3001 ...
echo ========================================================

cd /d "%~dp0"

set PATH=C:\Users\SASWATA\.gemini\antigravity\tools\node-v22.11.0-win-x64;C:\Program Files\Git\cmd;%PATH%

start http://localhost:3001
node server.js
pause

