const test = require('node:test');
const assert = require('node:assert/strict');
const { restoreInheritedRouting } = require('../src/main/extensions/codex-routing.cjs');
test('Codex retains custom provider routing while keeping per-session MCP settings', () => {
  const inherited = 'model_provider = "custom"\n[model_providers.custom]\nbase_url = "https://provider.example/v1"\nwire_api = "responses"\n';
  const generated = 'model = "test-model"\nmodel_provider = "shineai"\nopenai_base_url = "https://old.example"\n[mcp_servers.local]\ncommand = "local-mcp"\n[model_providers.custom]\nbase_url = "https://provider.example/v1"\n[model_providers.shineai]\nbase_url = "https://old.example"\n';
  const restored = restoreInheritedRouting(generated, inherited);
  assert.match(restored, /model_provider = "custom"/);
  assert.match(restored, /\[mcp_servers.local\]/);
  assert.match(restored, /https:\/\/provider.example\/v1/);
  assert.doesNotMatch(restored, /old.example|model_providers\.shineai/);
});
test('default OpenAI selection and explicit inherited base URL remain valid', () => {
  assert.doesNotMatch(restoreInheritedRouting('model_provider = "shineai"\n', ''), /model_provider/);
  assert.match(restoreInheritedRouting('model = "x"\n', 'openai_base_url = "https://custom.example/v1"\n'), /openai_base_url = "https:\/\/custom.example\/v1"/);
});
