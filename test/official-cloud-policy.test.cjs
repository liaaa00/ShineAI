const test = require('node:test');
const assert = require('node:assert/strict');
const { LocalIdentityService } = require('../src/main/extensions/local-identity.cjs');
const { RemovedCloudService, RemovedUpdater } = require('../src/main/extensions/removed-cloud-services.cjs');
const { isOfficialUrl, isRemovedChannel, installCloudIpcPolicy } = require('../src/main/security/official-cloud-policy.cjs');
test('local identity never loads or refreshes a saved official login', async () => {
  const service = new LocalIdentityService({ getLocalUser() { throw new Error('must not read official login'); } });
  await service.init();
  assert.equal(service.isAuthenticated(), false);
  assert.equal(service.getAccessToken(), null);
  assert.equal(await service.getValidAccessToken(), null);
  assert.equal(service.getUserInfo(), null);
  assert.equal(service.isRemoteSubActive(), false);
  assert.equal(service.getUserPlan(), 'ultra');
  assert.equal((await service.refreshCurrentUser()).success, false);
  service.cleanup();
});
test('official domains are blocked without catching lookalikes or custom AI providers', () => {
  for (const url of ['https://api.spectraidev.cloud/api', 'wss://relay.spectraidev.com/socket', 'https://claudeops.wbdao.cn/api']) assert.equal(isOfficialUrl(url), true);
  for (const url of ['https://api.openai.com/v1/responses', 'https://my-provider.example/v1', 'http://127.0.0.1:8765', 'https://spectraidev.cloud.example.com', 'https://not-spectraidev.cloud']) assert.equal(isOfficialUrl(url), false);
});
test('official IPC operations cannot reach handlers while local projects and custom providers remain callable', async () => {
  const handlers = new Map(); let reached = 0;
  const ipc = { handle(channel, handler) { handlers.set(channel, handler); } };
  installCloudIpcPolicy(ipc);
  for (const channel of ['auth:login-email', 'payment:create-order', 'org:drive-upload', 'meeting:create-room', 'relay:connect', 'session:share-html:publish', 'community:publish', 'feedback:create']) {
    assert.equal(isRemovedChannel(channel), true);
    ipc.handle(channel, () => { reached++; });
    assert.equal((await handlers.get(channel)({})).errorCode, 'OFFICIAL_CLOUD_REMOVED');
  }
  assert.equal(reached, 0);
  for (const channel of ['workspace:create', 'file-manager:write-file', 'pty:create', 'session:send-message', 'session:resume', 'team:start', 'skill:import-url']) assert.equal(isRemovedChannel(channel), false);
  ipc.handle('provider:get-all', () => [{id:'claudeops-builtin'}, {id:'codex'}, {id:'custom'}]);
  assert.deepEqual(await handlers.get('provider:get-all')({}), [{id:'codex'}, {id:'custom'}]);
  ipc.handle('session:create', () => ({ success: true }));
  assert.equal((await handlers.get('session:create')({}, {providerId:'claudeops-builtin'})).success, false);
  assert.equal((await handlers.get('session:create')({}, {providerId:'codex'})).success, true);
});
test('removed service lifecycles do not open cloud ports or enable auto updates', async () => {
  const service = new RemovedCloudService();
  await service.init(); await service.start();
  assert.equal(service.isRunning, false);
  assert.equal(service.gatewayPort, null);
  assert.equal((await service.connect()).success, false);
  await service.stop(); service.destroy();
  assert.equal((await new RemovedUpdater().checkForUpdates()).state.isForcedUpgrade, false);
});

test('public skill and MCP markets reach their handlers without restoring hosted account services', async () => {
  const handlers = new Map();
  const ipc = { handle(channel, handler) { handlers.set(channel, handler); } };
  installCloudIpcPolicy(ipc);
  for (const channel of ['registry:fetch-market-mcps', 'registry:fetch-mcps', 'registry:fetch-skills', 'registry:force-refresh', 'registry:install-mcp', 'skill:install-from-registry']) {
    assert.equal(isRemovedChannel(channel), false);
    const item = { id: 'public-market-item' };
    ipc.handle(channel, (_event, value) => ({ success: true, value }));
    assert.deepEqual(await handlers.get(channel)({}, item), { success: true, value: item });
  }
  for (const url of ['https://raw.githubusercontent.com/spectrai/registry/main/registry.json', 'https://registry.modelcontextprotocol.io/v0/servers', 'https://skills.sh/']) assert.equal(isOfficialUrl(url), false);
  assert.equal(isRemovedChannel('auth:login-email'), true);
  assert.equal(isRemovedChannel('community:publish'), true);
});
