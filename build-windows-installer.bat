@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     NOIR ARCHIVE - Windows Desktop Installer Builder
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js (v18, v20, or v22) from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist node_modules (
    echo node_modules not found. Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b %errorlevel%
    )
)

echo.
echo [2/3] Building Vite web distribution...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Packaging Electron Windows Standalone App ^& NSIS Installer...
call npx electron-builder --win nsis
if %errorlevel% neq 0 (
    echo [ERROR] Electron builder failed to package Windows installer.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo SUCCESS! Your Windows NSIS Installer is ready!
echo Installer location: dist-electron\Setup.exe
echo ===================================================
echo.

:: Open the output directory in Windows Explorer
if exist "dist-electron" (
    explorer dist-electron
)

pause
