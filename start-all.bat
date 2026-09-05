@echo off
title Launch WORKMAT Backend and Frontend
echo ===================================================
echo Starting WORKMAT Backend and Frontend
echo ===================================================

start "WORKMAT Backend" cmd /k "%~dp0start-backend.bat"
timeout /t 2 /nobreak >nul
start "WORKMAT Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo Both servers are launching in separate windows!
echo - Backend:  http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
echo - Frontend: http://localhost:8081
echo.
