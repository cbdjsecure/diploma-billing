@echo off
title Suro Bharati Sangeet Kala Kendra - Cloudflare Live Internet Tunnel
echo ===================================================================
echo   Suro Bharati Sangeet Kala Kendra - Cloudflare Internet Tunnel
echo   Starting local billing server & generating secure HTTPS link...
echo ===================================================================
echo.

cd /d "%~dp0"

:: 1. Ensure node is in PATH if using tools directory
set PATH=C:\Users\SASWATA\.gemini\antigravity\tools\node-v22.11.0-win-x64;%PATH%

:: 2. Start Node.js server in a separate background window if not already running
netstat -ano | findstr :3001 >nul
if %errorlevel% neq 0 (
    echo Starting Billing Server on port 3001...
    start "Billing Server" /min cmd /c "node server.js"
    timeout /t 3 /nobreak >nul
) else (
    echo Billing Server is already running on port 3001.
)

echo.
echo ===================================================================
echo   Connecting Cloudflare Tunnel to http://localhost:3001 ...
echo   Look below for your public HTTPS link (e.g. https://xxx.trycloudflare.com)
echo   Share this link with your Helpline operator!
echo ===================================================================
echo.

:: 3. Run cloudflared (using local cloudflared.exe if present)
if exist "%~dp0cloudflared.exe" (
    "%~dp0cloudflared.exe" tunnel --url http://localhost:3001
) else (
    cloudflared tunnel --url http://localhost:3001
)

pause
