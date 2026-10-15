'use strict';
const dirtyEffort = Symbol('pending Claude effort update');
const levels = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
function normalizeEffort(value) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string' || !levels.has(value.trim().toLowerCase())) throw new Error('Invalid Claude reasoning effort');
  return value.trim().toLowerCase();
}
function selectedEffort(adapter, id, config) {
  return normalizeEffort(adapter.sessionEfforts.has(id) ? adapter.sessionEfforts.get(id) : config.reasoningEffort);
}
function isCustomEndpoint(value) {
  if (!value) return false;
  try { return new URL(value).hostname.toLowerCase() !== 'api.anthropic.com'; }
  catch { return false; }
}
function configureQueryOptions(adapter, id, config, options) {
  const effort = selectedEffort(adapter, id, config);
  if (!effort) { delete options.effort; return options; }
  options.effort = effort;
  options.env = { ...options.env, CLAUDE_CODE_EFFORT_LEVEL: effort };
  // CLI model-name detection drops effort for unrecognized aliases on custom backends.
  if (isCustomEndpoint(options.env.ANTHROPIC_BASE_URL || config.apiBaseUrl)) options.env.CLAUDE_CODE_ALWAYS_ENABLE_EFFORT = '1';
  // Flag settings outrank env values loaded from user/project settings by the CLI.
  const settings = options.settings || {};
  options.settings = { ...settings, env: { ...settings.env, CLAUDE_CODE_EFFORT_LEVEL: effort, ...(options.env.CLAUDE_CODE_ALWAYS_ENABLE_EFFORT === '1' ? { CLAUDE_CODE_ALWAYS_ENABLE_EFFORT: '1' } : {}) } };
  return options;
}
function setSessionEffort(adapter, id, value) {
  const config = adapter.sessionConfigs.get(id);
  if (!config) throw new Error('Claude session config not found: ' + id);
  const effort = normalizeEffort(value);
  const previous = selectedEffort(adapter, id, config);
  if (effort) adapter.sessionEfforts.set(id, effort);
  else adapter.sessionEfforts.delete(id);
  config.reasoningEffort = effort;
  if (effort !== previous) config[dirtyEffort] = true;
}
async function synchronizeBeforeInput(adapter, id) {
  const config = adapter.sessionConfigs.get(id);
  if (!config?.[dirtyEffort]) return;
  if (adapter.sdkQueries.has(id)) {
    // Finish the current turn; use the existing model-switch resume path for the next input.
    if (adapter.sessions.get(id)?.status === 'running') return;
    await adapter.switchModelInPlace(id, config.model);
  }
  delete config[dirtyEffort];
}
module.exports = { normalizeEffort, selectedEffort, configureQueryOptions, setSessionEffort, synchronizeBeforeInput };
