const test = require('node:test');
const assert = require('node:assert/strict');
const { configureQueryOptions, setSessionEffort, synchronizeBeforeInput, selectedEffort } = require('../src/main/extensions/claude-effort.cjs');
function adapter(config) { return { sessionEfforts: new Map(), sessionConfigs: new Map([['test', config]]), sdkQueries: new Map(), sessions: new Map() }; }
test('Claude custom model aliases forward explicit effort and override stale inherited effort', () => {
  const config = { model: 'claude-opus-5-5', reasoningEffort: 'high' };
  const instance = adapter(config);
  const result = configureQueryOptions(instance, 'test', config, { env: { ANTHROPIC_BASE_URL: 'https://relay.example', CLAUDE_CODE_EFFORT_LEVEL: 'low' } });
  assert.equal(result.effort, 'high');
  assert.equal(result.env.CLAUDE_CODE_EFFORT_LEVEL, 'high');
  assert.equal(result.env.CLAUDE_CODE_ALWAYS_ENABLE_EFFORT, '1');
  assert.equal(result.settings.env.CLAUDE_CODE_EFFORT_LEVEL, 'high');
  assert.equal(result.settings.env.CLAUDE_CODE_ALWAYS_ENABLE_EFFORT, '1');
});
test('default and official Claude sessions preserve model capability detection', () => {
  for (const config of [{}, { reasoningEffort: 'medium', apiBaseUrl: 'https://api.anthropic.com' }]) {
    const result = configureQueryOptions(adapter(config), 'test', config, { env: {} });
    assert.equal(result.env.CLAUDE_CODE_ALWAYS_ENABLE_EFFORT, undefined);
    assert.equal(result.effort, config.reasoningEffort);
  }
});
test('changing Claude effort resumes the pipeline before the next idle input and clearing restores default', async () => {
  const config = { model: 'claude-opus-5-5', reasoningEffort: 'low' };
  const instance = adapter(config); const updates = [];
  instance.sdkQueries.set('test', {}); instance.sessions.set('test', { status: 'running' });
  instance.switchModelInPlace = async (id, model) => updates.push({ id, model, effort: config.reasoningEffort });
  setSessionEffort(instance, 'test', 'high');
  assert.equal(selectedEffort(instance, 'test', config), 'high');
  await synchronizeBeforeInput(instance, 'test'); assert.equal(updates.length, 0);
  instance.sessions.get('test').status = 'waiting_input';
  await synchronizeBeforeInput(instance, 'test');
  await synchronizeBeforeInput(instance, 'test'); assert.equal(updates.length, 1);
  setSessionEffort(instance, 'test', null); await synchronizeBeforeInput(instance, 'test');
  assert.equal(selectedEffort(instance, 'test', config), undefined);
  assert.equal(updates[1].effort, undefined);
  assert.throws(() => setSessionEffort(instance, 'test', 'invalid'), /Invalid/);
});
