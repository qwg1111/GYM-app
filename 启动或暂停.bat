@echo off
title Fitness Timer - Dev Server

set PORT=5173
set DIR=%~dp0

echo ========================================
echo   Fitness Timer - Start / Stop
echo ========================================
echo.

netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [STOP] Stopping dev server on port %PORT%...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
        echo [DONE] Server stopped. PID: %%a
    )
) else (
    echo [START] Starting dev server...
    cd /d "%DIR%"
    start /b cmd /c "npx vite --host 0.0.0.0 --port %PORT%"
    timeout /t 3 /nobreak >nul
    echo [DONE] Server running at http://localhost:%PORT%
)

echo.
echo ========================================
pause
