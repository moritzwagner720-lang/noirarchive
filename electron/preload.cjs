/**
 * Preload script for Noir Archive Desktop Application
 * Exposes secure bridge APIs to the React renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('noirDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0',
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  showItemInFolder: (fullPath) => ipcRenderer.send('show-item-in-folder', fullPath),
  getAppPaths: () => ipcRenderer.invoke('get-app-paths'),
});
