'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configureAuthentication } = require('../src/main/extensions/claude-auth.cjs');
const { configureQueryOptions } = require('../src/main/extensions/claude-effort.cjs');

test('explicit provider credentials override inherited and CLI settings credentials', () => {
  const original = { env: { ANTHROPIC_AUTH_TOKEN: 'other-token', ANTHROPIC_BASE_URL: 'https://other.invalid', KEEP: 'yes' }, settings: { permissions: { allow: ['Read'] }, env: { ANTHROPIC_API_KEY: 'other-key', ANTHROPIC_AUTH_TOKEN: 'other-token', KEEP_SETTING: 'yes' } }, settingSources: ['user', 'project', 'local'] };
  const options = structuredClone(original);
  configureAuthentication({ apiKey: ' selected-key ', apiBaseUrl: 'https://selected.invalid' }, options);
  for (const env of [options.env, options.settings.env]) {
    assert.equal(env.ANTHROPIC_API_KEY, 'selected-key');
    assert.equal(env.ANTHROPIC_AUTH_TOKEN, '');
    assert.equal(env.ANTHROPIC_BASE_URL, 'https://selected.invalid');
  }
  assert.equal(options.env.KEEP, 'yes');
  assert.equal(options.settings.env.KEEP_SETTING, 'yes');
  assert.deepEqual(options.settings.permissions, original.settings.permissions);
  assert.deepEqual(options.settingSources, original.settingSources);
  assert.equal(original.env.ANTHROPIC_AUTH_TOKEN, 'other-token');
});

test('native Claude authentication is untouched without an explicit provider key', () => {
  for (const config of [{}, { apiKey: '  ' }, { apiBaseUrl: 'https://custom.invalid' }]) {
    const options = { env: { ANTHROPIC_AUTH_TOKEN: 'native-token' }, settings: { env: { TEST: 'value' } } };
    const before = structuredClone(options);
    assert.strictEqual(configureAuthentication(config, options), options);
    assert.deepEqual(options, before);
  }
});

test('auth override runs even when effort is unset and coexists with configured effort', () => {
  const adapter = { sessionEfforts: new Map() };
  for (const effort of [undefined, 'high']) {
    const options = configureQueryOptions(adapter, 'session', { apiKey: 'selected-key', apiBaseUrl: 'https://selected.invalid', reasoningEffort: effort }, { env: {} });
    assert.equal(options.settings.env.ANTHROPIC_AUTH_TOKEN, '');
    assert.equal(options.env.ANTHROPIC_API_KEY, 'selected-key');
    if (effort) assert.equal(options.settings.env.CLAUDE_CODE_EFFORT_LEVEL, effort);
    else assert.equal(options.effort, undefined);
  }
});
