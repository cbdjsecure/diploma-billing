@echo off
title Suro Bharati Sangeet Kala Kendra - New PC Setup
echo ===================================================================
echo   Suro Bharati Sangeet Kala Kendra - Diploma Billing System
echo   One-Click Automated Setup for Office PC
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/5] Installing Node.js LTS...
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements

echo [2/5] Installing Python 3...
winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements

echo [3/5] Setting up Cloudflare Tunnel (cloudflared.exe)...
if not exist "%~dp0cloudflared.exe" (
    echo Downloading standalone cloudflared.exe...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe' -UseBasicParsing"
) else (
    echo cloudflared.exe already present!
)

echo [4/5] Refreshing Environment Paths...
for /f "tokens=2*" %%a in ('reg query "HKLM\System\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%b"
set "PATH=%SYS_PATH%;%USER_PATH%;%PATH%"

echo [5/5] Installing Project Dependencies & Building Client...
call pip install openpyxl pillow
call npm install
call npm run build

echo.
echo ===================================================================
echo   SETUP COMPLETE!
echo.
echo   To run on this PC:
echo     - start-billing.bat           (Run locally at http://localhost:3001)
echo     - connect-office-tunnel.bat   (Connect permanently to billing.saswiko.in)
echo ===================================================================
echo.
pause
