@echo off
title WORKMAT Mobile Expo Go
echo ===================================================
echo Starting Expo for Mobile (Expo Go)
echo LAN Host: 192.168.137.1
echo ===================================================
cd /d "%~dp0mobilefrontend"
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.137.1
npx expo start --host lan -c
pause
