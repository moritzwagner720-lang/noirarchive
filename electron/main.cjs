/**
 * Noir Archive — Windows Desktop Application Main Process
 * Electron + Express Embedded Backend + Vite Static Frontend
 */

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { createDesktopServer } = require('./server.cjs');

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let desktopServerInstance = null;
let currentServerUrl = '';

// Determine paths
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const appUserData = app.getPath('userData');
const distPath = path.resolve(__dirname, '../dist');

// Seed storage from template if not yet present in AppData
const targetStorageFile = path.join(appUserData, 'server-storage.json');
if (!fs.existsSync(targetStorageFile)) {
  const templatePath = path.resolve(__dirname, '../server-storage.json');
  try {
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, targetStorageFile);
    }
  } catch (err) {
    console.warn('[Noir Archive] Notice: Starting with fresh storage.', err);
  }
}

async function createWindow(serverUrl) {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../build/icon.png');

  mainWindow = new BrowserWindow({
    title: 'Noir Archive',
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a0a0f',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    autoHideMenuBar: true, // Strips default browser menu bar
    titleBarStyle: process.platform === 'win32' ? 'hidden' : 'default',
    titleBarOverlay: process.platform === 'win32'
      ? {
          color: '#0a0a0f',
          symbolColor: '#f8fafc',
          height: 38,
        }
      : false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false,
    },
  });

  // Completely remove all Chromium browser menus (File, Edit, View, Help, etc.)
  Menu.setApplicationMenu(null);

  // Smooth window reveal once content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in user's default Windows browser (Edge, Chrome, Firefox)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsed = new URL(navigationUrl);
    const serverOrigin = new URL(serverUrl).origin;
    if (parsed.origin !== serverOrigin) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Load the application
  await mainWindow.loadURL(serverUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for custom titlebar controls
ipcMain.on('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isMaximized() : false;
});

ipcMain.on('open-external', (_event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
    shell.openExternal(url);
  }
});

ipcMain.on('show-item-in-folder', (_event, fullPath) => {
  if (fullPath && fs.existsSync(fullPath)) {
    shell.showItemInFolder(fullPath);
  }
});

ipcMain.handle('get-app-paths', () => {
  return {
    userData: app.getPath('userData'),
    appPath: app.getAppPath(),
    version: app.getVersion(),
  };
});

const backendConfigFile = path.join(appUserData, 'backend-config.json');

function getStoredBackendUrl() {
  if (process.env.NOIR_BACKEND_URL && process.env.NOIR_BACKEND_URL.trim()) {
    return process.env.NOIR_BACKEND_URL.trim();
  }
  try {
    if (fs.existsSync(backendConfigFile)) {
      const cfg = JSON.parse(fs.readFileSync(backendConfigFile, 'utf-8'));
      if (cfg.backendUrl && cfg.backendUrl.trim()) return cfg.backendUrl.trim();
    }
  } catch {
    // ignore
  }
  return 'https://noirarchive.onrender.com';
}

function saveStoredBackendUrl(url) {
  try {
    fs.writeFileSync(backendConfigFile, JSON.stringify({ backendUrl: url || '' }, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

ipcMain.on('get-backend-url', (event) => {
  event.returnValue = getStoredBackendUrl();
});

ipcMain.on('set-backend-url', (_event, url) => {
  saveStoredBackendUrl(url);
});

// App Lifecycle
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    // Start embedded desktop backend server
    const serverModule = createDesktopServer({
      dataDir: appUserData,
      distDir: distPath,
    });
    desktopServerInstance = await serverModule.start();
    currentServerUrl = desktopServerInstance.url;

    await createWindow(currentServerUrl);
  } catch (err) {
    console.error('[Noir Archive Desktop] Failed to bootstrap desktop app:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && currentServerUrl) {
      createWindow(currentServerUrl);
    }
  });
});

app.on('window-all-closed', () => {
  if (desktopServerInstance && desktopServerInstance.server) {
    try {
      desktopServerInstance.server.close();
    } catch {
      // ignore
    }
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
