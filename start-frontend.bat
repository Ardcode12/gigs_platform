@echo off
title WORKMAT Frontend
echo ===================================================
echo Starting WORKMAT Frontend (Expo / Web)
echo Supporting both Worker and Customer interfaces
echo ===================================================
cd /d "%~dp0mobilefrontend"
npm run web
pause
