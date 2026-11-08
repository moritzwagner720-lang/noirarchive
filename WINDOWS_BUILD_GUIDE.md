# Noir Archive — Windows Desktop Application & Installer Guide

This guide explains how Noir Archive is configured as a native Windows desktop application and how to compile the Windows NSIS installer (`Setup.exe`) locally.

---

## 1. Architecture Overview

- **Framework**: Electron (v34+) + React 19 + Vite 8
- **Backend Architecture**: Embedded Express server running inside Electron
- **Persistence**: Storage (`server-storage.json`) is stored in the user's persistent Windows AppData directory (`%APPDATA%\Noir Archive\server-storage.json`). All user profiles, transferred packages, chat messages, and photo archives persist across updates and restarts.
- **Window Presentation**: Standalone window with browser chrome (address bars, developer menus, navigation bars) stripped out. Modern Windows 11/10 title bar overlay with native window controls (minimize, maximize, close) and draggable title area.
- **Application Icons**:
  - `build/icon.ico`: High-resolution Windows multi-size icon (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
  - `build/icon.png`: 512x512 PNG master asset
  - `build/installerIcon.ico`: NSIS installer wizard icon
  - `build/uninstallerIcon.ico`: Windows Add/Remove programs uninstaller icon

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
   - Build the Vite frontend (`npm run build`)
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

## 5. Running in Desktop Development Mode

To test the Electron window locally without packaging:
```cmd
npm run electron:dev
```
This boots the embedded desktop backend, initializes the BrowserWindow, and renders Noir Archive.

---

## 6. Project Configuration Files

- `electron/main.cjs`: Electron main process controlling window lifecycle, single instance locking, and IPC.
- `electron/server.cjs`: Embedded local backend server managing `/api/*` endpoints and data persistence.
- `electron/preload.cjs`: Secure context bridge exposing desktop features to the frontend.
- `electron-builder.json`: Configuration defining Windows targets, NSIS options, and output naming (`Setup.exe`).
- `build/icon.ico`: High-resolution Windows application icon.
