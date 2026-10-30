@echo off
title Hyqoo Local Server
cd /d "%~dp0"
echo Starting Hyqoo Local Server...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
