'use strict';
// New development work starts here and in extensions/, not inside the recovered bundle.
const fs = require('node:fs');
const path = require('node:path');
const { app, ipcMain } = require('electron');
// Electron expects one privileged-scheme registration. The recovered client
// registers its schemes separately; collect them with the development scheme.
const { protocol } = require('electron');
const registerSchemes = protocol.registerSchemesAsPrivileged.bind(protocol);
const schemes = new Map();
protocol.registerSchemesAsPrivileged = entries => {
  for (const entry of entries) schemes.set(entry.scheme, entry);
};
const { createConfig } = require('./runtime/config.cjs');
const { installIpcPolicy } = require('./security/ipc-policy.cjs');
const { registerRuntimeInfo } = require('./extensions/runtime-info.cjs');
const { registerServiceAccess } = require('./security/service-access.cjs');
const { installCloudIpcPolicy, installCloudNetworkPolicy } = require('./security/official-cloud-policy.cjs');
const root = path.resolve(__dirname, '../..');
const config = createConfig(root, process.env, { isPackaged: app.isPackaged, appData: app.getPath('appData') });
fs.mkdirSync(config.userData, { recursive: true });
process.chdir(root);
process.env.SHINEAI_USER_DATA_DIR = config.userData;
process.env.SHINEAI_DEV_USER_DATA_DIR = config.userData;
process.env.MEETING_GATEWAY_PORT = String(config.meetingPort);
Object.defineProperty(process, 'resourcesPath', { value: config.resources, configurable: true });
app.name = 'shineai-dev';
app.setPath('userData', config.userData);
app.setPath('sessionData', path.join(config.userData, 'chromium'));
// The recovered bundle also sets an upstream AppUserModelID. Keep one identity
// for the shortcut, taskbar and notifications throughout the process lifetime.
const setIdentity = app.setAppUserModelId.bind(app);
app.setAppUserModelId = () => setIdentity(app.isPackaged ? 'com.local.shineai.dev.installed' : 'com.local.shineai.dev');
app.setAppUserModelId();
// A development runtime never starts an official installer or replaces official URL handlers.
const registerProtocol = app.setAsDefaultProtocolClient.bind(app);
app.setAsDefaultProtocolClient = protocol => {
  if (!['shineai-dev', 'claudeops-dev'].includes(protocol)) return false;
  return app.isPackaged ? registerProtocol(protocol) : registerProtocol(protocol, process.execPath, [root]);
};
app.setLoginItemSettings = () => {};
installIpcPolicy(ipcMain, path.join(root, 'out/renderer'));
installCloudIpcPolicy(ipcMain);
installCloudNetworkPolicy(app);
registerRuntimeInfo({ ipcMain, config });
registerServiceAccess(ipcMain, config);
require('./extensions/appearance.cjs').registerAppearance({app,ipcMain,config,...require('electron')});
ipcMain.on('dev:preload-info', event => { event.returnValue = { cwd: root, home: require('node:os').homedir() }; });
app.on('browser-window-created', (_event, window) => {
  window.on('page-title-updated', event => { event.preventDefault(); window.setTitle(config.title); });
});
app.on('web-contents-created', (_event, contents) => {
  // App views and the built-in browser stay isolated from Node.
  contents.on('will-attach-webview', (_event, preferences) => {
    preferences.nodeIntegration = false; preferences.contextIsolation = true; preferences.sandbox = true;
  });
});
if (!app.requestSingleInstanceLock()) { app.quit(); } else {
  app.on('second-instance', () => { const window = require('electron').BrowserWindow.getAllWindows().find(w => w.isVisible()); window?.show(); window?.focus(); });
  require('./index.js');
  registerSchemes([...schemes.values()]);
  protocol.registerSchemesAsPrivileged = registerSchemes;
}
