@echo off
title WORKMAT Mobile Expo Go
echo ===================================================
echo Starting Expo for Mobile (Expo Go)
echo LAN Host: 10.190.13.187
echo ===================================================
cd /d "%~dp0mobilefrontend"
npx expo start --host lan -c
pause
