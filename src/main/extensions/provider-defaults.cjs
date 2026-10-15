'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
// Only seed a fresh local profile. Never overwrite later user choices or hosted authentication.
function codexHome() { return process.env.CODEX_HOME || path.join(os.homedir(), '.codex'); }
function readCodexModel() {
  try { return fs.readFileSync(path.join(codexHome(), 'config.toml'), 'utf8').split(/^\s*\[/m)[0].match(/^\s*model\s*=\s*"([^"]+)"/m)?.[1]; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
function initializeProviderDefaults(database, authService, hasCodexConfiguration = () => fs.existsSync(path.join(codexHome(), 'auth.json')), getCodexModel = readCodexModel) {
  const key = 'development.providerDefaults.v1';
  const settings = database.getAppSettings() || {};
  if (settings[key]) return;
  if (!authService?.getUserInfo?.()) {
    database.updateProvider('claudeops-builtin', { enabled: false });
    if (hasCodexConfiguration()) {
      const model = getCodexModel();
      database.updateProvider('codex', { enabled: true, ...(model ? { defaultModel: model } : {}) });
    }
  }
  database.updateAppSetting(key, true);
}
module.exports = { initializeProviderDefaults };
