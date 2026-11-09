/**
 * Noir Archive — Windows Desktop Application Main Process
 * Loads the production website directly: https://noirarchive.onrender.com
 */

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const PRODUCTION_URL = 'https://noirarchive.onrender.com';

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;

// Branded offline / cold-start error screen with retry button
const ERROR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Noir Archive — Connection Notice</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #090503;
      color: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #140b07;
      border: 1px solid rgba(255, 107, 0, 0.25);
      border-radius: 16px;
      padding: 36px 30px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 107, 0, 0.1);
    }
    .icon {
      width: 52px;
      height: 52px;
      background: #ff6b00;
      color: #000;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 24px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      color: #ffffff;
    }
    p {
      font-size: 13px;
      line-height: 1.6;
      color: #a3a3a3;
      margin-bottom: 22px;
    }
    .url-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 11px;
      background: rgba(255, 107, 0, 0.12);
      border: 1px solid rgba(255, 107, 0, 0.3);
      color: #ff8533;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #ff6b00;
      color: #000000;
      font-weight: 700;
      font-size: 13px;
      padding: 12px 28px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
      text-decoration: none;
    }
    .btn:hover {
      background: #ff8533;
      transform: translateY(-1px);
    }
    .footer {
      margin-top: 22px;
      font-size: 11px;
      color: #737373;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✦</div>
    <h1>Unable to Reach Noir Archive</h1>
    <div class="url-badge">${PRODUCTION_URL}</div>
    <p>
      The cloud service may be waking from cold standby or your device is temporarily disconnected from the internet.
    </p>
    <button class="btn" onclick="window.location.href='${PRODUCTION_URL}'">
      Retry Connection
    </button>
    <div class="footer">Noir Archive · Production Web Application</div>
  </div>
</body>
</html>`;

function getTargetUrl() {
  if (process.env.NOIR_URL && process.env.NOIR_URL.trim()) {
    return process.env.NOIR_URL.trim();
  }
  return PRODUCTION_URL;
}

async function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../build/icon.png');

  mainWindow = new BrowserWindow({
    title: 'Noir Archive',
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#090503',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false,
    },
  });

  // Remove Chromium application menu (File, Edit, View, Help)
  Menu.setApplicationMenu(null);

  // Reveal smoothly when content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in user's default browser (Edge, Chrome, Firefox)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      const targetOrigin = new URL(PRODUCTION_URL).origin;
      if (parsed.origin !== targetOrigin) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    } catch {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Keep navigation within the production site; open any third-party links externally
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsed = new URL(navigationUrl);
      const targetOrigin = new URL(PRODUCTION_URL).origin;
      if (parsed.origin !== targetOrigin && !navigationUrl.startsWith('data:')) {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      }
    } catch {
      event.preventDefault();
    }
  });

  // Handle load failures gracefully with retry screen
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    // Ignore aborted navigations
    if (errorCode === -3) return;
    console.warn(`[Noir Archive] Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ERROR_HTML)}`);
  });

  // Load the production website directly!
  const targetUrl = getTargetUrl();
  console.log(`[Noir Archive Desktop] Loading production website: ${targetUrl}`);
  try {
    await mainWindow.loadURL(targetUrl);
  } catch (err) {
    console.warn('[Noir Archive Desktop] Initial load encountered error, showing retry screen:', err);
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ERROR_HTML)}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Enforce single instance focus
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (err) {
    console.error('[Noir Archive Desktop] Failed to bootstrap window:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
