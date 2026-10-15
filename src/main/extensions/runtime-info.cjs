'use strict';
function registerRuntimeInfo({ ipcMain, config }) {
  ipcMain.handle('dev:runtime-info', () => ({
    version: config.version, edition: 'local-development',
    release: require('../runtime/release.json').release,
    officialMembership: false, electron: process.versions.electron,
    officialCloud: 'removed',
    node: process.versions.node, abi: process.versions.modules,
    userData: config.userData,
    ports: { localAuth: null, meeting: null },
  }));
}
module.exports = { registerRuntimeInfo };
