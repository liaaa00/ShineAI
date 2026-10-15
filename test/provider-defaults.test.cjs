const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeProviderDefaults } = require('../src/main/extensions/provider-defaults.cjs');
test('fresh local defaults avoid unauthenticated hosted models and preserve subsequent choices', () => {
  const settings = {}, changes = [];
  const db = { getAppSettings: () => settings, updateProvider: (id, patch) => changes.push([id, patch]), updateAppSetting: (key, value) => settings[key] = value };
  initializeProviderDefaults(db, null, () => true, () => undefined);
  assert.deepEqual(changes, [['claudeops-builtin', { enabled:false }], ['codex', { enabled:true }]]);
  initializeProviderDefaults(db, null, () => false);
  assert.equal(changes.length, 2);
});
test('real hosted login keeps hosted provider configuration', () => {
  let updates = 0;
  const db = { getAppSettings: () => ({}), updateProvider: () => updates++, updateAppSetting: () => {} };
  initializeProviderDefaults(db, { getUserInfo: () => ({ id:'real-user' }) }, () => true);
  assert.equal(updates, 0);
});
