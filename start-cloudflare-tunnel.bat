@echo off
title Suro Bharati Sangeet Kala Kendra - Cloudflare Live Internet Tunnel
echo ===================================================================
echo   Suro Bharati Sangeet Kala Kendra - Cloudflare Internet Tunnel
echo   Starting local billing server & generating secure HTTPS link...
echo ===================================================================
echo.

cd /d "%~dp0"

:: 1. Start Node.js server in a separate background window if not already running
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

:: 2. Check if cloudflared is installed; if not, install via winget
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo Cloudflare CLI not found. Installing via winget...
    winget install Cloudflare.cloudflared --silent --accept-package-agreements --accept-source-agreements
    for /f "tokens=2*" %%a in ('reg query "HKLM\System\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
    set "PATH=%SYS_PATH%;%PATH%"
)

cloudflared tunnel --url http://localhost:3001
pause
