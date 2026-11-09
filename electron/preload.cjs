/**
 * Preload script for Noir Archive Desktop Application
 * Exposes minimal secure helper APIs to the loaded production window.
 * No sensitive backend keys or credentials are ever exposed.
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('noirDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0',
});
