'use strict';

// Only explicit provider credentials own authentication. Native Claude login
// remains available when ShineAI has no configured API key.
function configureAuthentication(config, options) {
  const key = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
  if (!key) return options;
  const env = { ANTHROPIC_API_KEY: key, ANTHROPIC_AUTH_TOKEN: '' };
  const base = typeof config.apiBaseUrl === 'string' ? config.apiBaseUrl.trim() : '';
  if (base) env.ANTHROPIC_BASE_URL = base;
  options.env = { ...options.env, ...env };
  // SDK settings are CLI flag settings: they outrank user/project/local files.
  // Clearing only the child process env is insufficient because Claude reloads
  // settings.json after spawn. Do not edit the user's global configuration.
  options.settings = {
    ...options.settings,
    env: { ...options.settings?.env, ...env },
  };
  return options;
}

module.exports = { configureAuthentication };
