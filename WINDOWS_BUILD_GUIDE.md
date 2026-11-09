# Noir Archive — Windows Desktop Application & Installer Guide

This guide explains how Noir Archive is configured as a native Windows desktop application and how to compile the Windows NSIS installer (`Setup.exe`) locally.

---

## 1. Architecture Overview

- **Framework**: Electron (v34+)
- **Direct Website Host**: Electron loads the live production website directly:
  ```javascript
  mainWindow.loadURL("https://noirarchive.onrender.com");
  ```
- **Single Source of Truth**: The browser website is the single source of truth for the entire interface, features, animations, real-time messaging, transfers, and portfolio archives. No separate local React UI or embedded server is maintained.
- **Persistence & Cloud Sync**: Uses the production Render backend and Supabase PostgreSQL database. No local JSON storage or mock data.
- **Security**: Context isolation enabled, node integration disabled, no service-role secrets exposed to the renderer.
- **Resilience**: Includes a branded offline / cold-start fallback screen with a "Retry Connection" button.
- **Window Presentation**: Native Windows application window with clean auto-hidden menu bars, standard Windows control buttons (minimize, maximize, close), and custom multi-resolution application icons.
- **External Links**: External links (such as external portfolios or mailto) automatically open in the user's default Windows web browser (Edge, Chrome, Firefox).

---

## 2. Prerequisites for Local Windows Build

To build the installer on your Windows machine:
1. **Node.js**: Install Node.js (version 20 or 22 LTS recommended) from [nodejs.org](https://nodejs.org).
2. **Git**: If cloning via Git (optional).

---

## 3. How to Generate the Final `Setup.exe`

### Method A: One-Click Batch Script (Recommended for Windows)
1. In File Explorer, navigate to the project directory.
2. Double-click **`build-windows-installer.bat`**.
3. The script will:
   - Verify Node.js
   - Install dependencies if missing
   - Build the distribution assets (`npm run build`)
   - Run Electron Builder to compile the NSIS installer (`npx electron-builder --win nsis`)
   - Open File Explorer automatically showing **`dist-electron\Setup.exe`**.

### Method B: Via Command Prompt / PowerShell / Terminal
1. Open a terminal (PowerShell, Command Prompt, or VS Code Terminal) in the project root:
   ```cmd
   npm install
   ```
2. Build the production assets and the Windows installer:
   ```cmd
   npm run build:win
   ```
3. Once completed, your final standalone installer is located at:
   ```
   dist-electron\Setup.exe
   ```

---

## 4. What the Installer Does

When a user runs `Setup.exe`:
- **Welcome Wizard**: Minimalist, branded Noir Archive installer wizard with custom application icon.
- **Installation Directory**: Installs into `C:\Users\<User>\AppData\Local\Programs\Noir Archive` (per-user, no UAC admin prompt required, with optional elevation).
- **Desktop Shortcut**: Automatically places a "Noir Archive" shortcut on the Windows Desktop.
- **Start Menu Shortcut**: Adds "Noir Archive" to the Windows Start Menu with the custom camera aperture monogram icon.
- **Auto Launch**: Checkbox to launch Noir Archive immediately after installation finishes.
- **Windows Control Panel Integration**: Clean uninstaller entry in Windows Settings > Installed Apps.

---

## 5. Project Configuration Files

- `electron/main.cjs`: Electron main process directly loading `https://noirarchive.onrender.com` with single-instance lock, secure webPreferences, offline retry screen, and external link handling.
- `electron/preload.cjs`: Minimal context bridge exposing desktop client identity (`isDesktop: true`).
- `electron-builder.json`: Configuration defining Windows targets, NSIS options, and output naming (`Setup.exe`).
- `build/icon.ico`: High-resolution Windows application icon.
