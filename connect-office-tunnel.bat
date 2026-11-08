@echo off
title Suro Bharati Sangeet Kala Kendra - Connect Tunnel to billing.saswiko.in
echo ===================================================================
echo   Connecting Office PC to https://billing.saswiko.in
echo ===================================================================
echo.

cd /d "%~dp0"

:: Check if cloudflared.exe exists; if not, download it
if not exist "%~dp0cloudflared.exe" (
    echo Downloading cloudflared.exe...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe' -UseBasicParsing"
)

:: 1. Install and start as a permanent background Windows service
echo Installing Cloudflare background service for billing.saswiko.in...
"%~dp0cloudflared.exe" service install eyJhIjoiOTY0NmMwOGYyYTA1OWIyZTkxNWY1N2RjYWE5NjkzOGIiLCJ0IjoiNmM2NDdlNjYtOWZlMC00NjgzLWFlYzItZjViZjFmYzFhZGNiIiwicyI6Ik1ERmlNMkZpT1RFdE9UZzJZUzAwWW1NM0xUZzFZell0Tm1FeE5URTFZV1U0TkRjNSJ9

echo.
echo ===================================================================
echo   CONNECTED!
echo   https://billing.saswiko.in is now pointing to this PC!
echo   Now start your billing server with: start-billing.bat
echo ===================================================================
echo.
pause
