@echo off
title Suro Bharati Diploma Billing System
echo ========================================================
echo   Starting Suro Bharati Diploma Exam Billing System...
echo ========================================================
set "PATH=C:\Users\SASWATA\.gemini\antigravity\tools\node-v22.11.0-win-x64;%PATH%"
cd /d "C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing"
start http://localhost:3001
node server.js
pause
