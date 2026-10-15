'use strict';
const path = require('node:path');
const { fileURLToPath } = require('node:url');
function isTrustedUrl(value, rendererRoot) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'file:') return false;
    const relative = path.relative(path.resolve(rendererRoot), fileURLToPath(url));
    return relative !== '' && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative) && relative.endsWith('.html');
  } catch { return false; }
}
function assertTrustedEvent(event, rendererRoot) {
  if (!event?.sender || event.sender.isDestroyed?.() || !isTrustedUrl(event.sender.getURL(), rendererRoot) || !isTrustedUrl(event.senderFrame?.url, rendererRoot)) throw new Error('Untrusted application frame');
}
function installIpcPolicy(ipcMain, rendererRoot) {
  const originalHandle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (channel, handler) => originalHandle(channel, (event, ...args) => {
    assertTrustedEvent(event, rendererRoot);
    return handler(event, ...args);
  });
  // Existing non-invoke messages also cross the same renderer boundary.
  const originalOn = ipcMain.on.bind(ipcMain);
  ipcMain.on = (channel, handler) => originalOn(channel, (event, ...args) => {
    try { assertTrustedEvent(event, rendererRoot); } catch { event.returnValue = null; return; }
    return handler(event, ...args);
  });
}
module.exports = { isTrustedUrl, assertTrustedEvent, installIpcPolicy };
