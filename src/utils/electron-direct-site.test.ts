import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Electron Configuration: Directly loads production website https://noirarchive.onrender.com', async () => {
  const mainPath = path.resolve(__dirname, '../../electron/main.cjs');
  assert.ok(fs.existsSync(mainPath), 'electron/main.cjs must exist');
  const mainContent = fs.readFileSync(mainPath, 'utf-8');

  // 1. Verify production URL is configured
  assert.ok(
    mainContent.includes("PRODUCTION_URL = 'https://noirarchive.onrender.com'"),
    'main.cjs must define PRODUCTION_URL as https://noirarchive.onrender.com'
  );

  // 2. Verify loadURL calls the production website URL
  assert.ok(
    mainContent.includes('mainWindow.loadURL(targetUrl)') ||
    mainContent.includes("mainWindow.loadURL('https://noirarchive.onrender.com')"),
    'mainWindow must directly load the production website URL'
  );

  // 3. Verify secure webPreferences
  assert.ok(mainContent.includes('contextIsolation: true'), 'contextIsolation must be enabled');
  assert.ok(mainContent.includes('nodeIntegration: false'), 'nodeIntegration must be disabled');

  // 4. Verify external links handling
  assert.ok(
    mainContent.includes('shell.openExternal(url)'),
    'External links must be delegated to shell.openExternal'
  );
  assert.ok(
    mainContent.includes('setWindowOpenHandler'),
    'setWindowOpenHandler must be configured for external popups'
  );

  // 5. Verify failure handling with retry screen
  assert.ok(
    mainContent.includes('did-fail-load'),
    'did-fail-load event listener must be configured'
  );
  assert.ok(
    mainContent.includes('Retry Connection'),
    'Error screen must offer a retry connection option'
  );

  // 6. Verify server.cjs is removed and not used
  const serverPath = path.resolve(__dirname, '../../electron/server.cjs');
  assert.equal(
    fs.existsSync(serverPath),
    false,
    'electron/server.cjs must be completely removed — no separate local Express server'
  );

  // 7. Verify no local JSON storage fallback
  const storagePath = path.resolve(__dirname, '../../server-storage.json');
  const builderPath = path.resolve(__dirname, '../../electron-builder.json');
  const builderContent = fs.readFileSync(builderPath, 'utf-8');
  assert.equal(
    builderContent.includes('server-storage.json'),
    false,
    'electron-builder.json must not reference server-storage.json'
  );

  // 8. Verify live production website is reachable
  const res = await fetch('https://noirarchive.onrender.com');
  assert.equal(res.status, 200, 'Production website must be live and return HTTP 200');
  const html = await res.text();
  assert.ok(html.includes('Noir Archive') || html.includes('root'), 'Production website HTML must be returned');

  console.log('✅ ALL ELECTRON DIRECT-SITE REQUIREMENTS VERIFIED!');
});
