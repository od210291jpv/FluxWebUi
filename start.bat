@echo off
title Flux Web UI Launcher
echo ========================================
echo Starting Flux Web UI (Network Mode)
echo ========================================
echo.

:: Start Backend
echo [1/2] Starting Python FastAPI Backend...
cd backend
:: Set CORS to allow any local network origin (since we are hosting on 0.0.0.0)
set CORS_ORIGINS=["*"]
start "Flux Backend" cmd /k "if exist .venv\Scripts\activate (call .venv\Scripts\activate) else (echo WARNING: .venv not found. Make sure you ran 'python -m venv .venv') & uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..

:: Start Frontend
echo [2/2] Starting React Frontend on port 8888...
cd frontend
start "Flux Frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port 8888"
cd ..

echo.
echo Both services are launching in separate windows!
echo.
echo Local Access:
echo http://localhost:8888
echo.
echo Network Access:
echo Find this PC's local IPv4 address (e.g., 192.168.x.x) using 'ipconfig'
echo and access from other devices on your network at:
echo http://[YOUR-IP-ADDRESS]:8888
echo.
pause
