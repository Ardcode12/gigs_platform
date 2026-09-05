@echo off
title WORKMAT Backend
echo ===================================================
echo Starting WORKMAT Backend (FastAPI + Uvicorn)
echo Supporting both Worker and Customer APIs on port 8000
echo ===================================================
cd /d "%~dp0mobilebackend"
call .\.venv\Scripts\activate
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --reload
pause
