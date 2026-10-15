import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const dataDir = path.join(root, '.test-data', 'claude-effort-' + Date.now());
const workspace = path.join(dataDir, 'workspace');
fs.mkdirSync(workspace, { recursive: true });
const report = { date: new Date().toISOString(), model: 'claude-opus-5-5', checks: {}, requests: [], errors: [] };
let replyCount = 0;
const server = http.createServer((request, response) => {
  let body = '';
  request.on('data', chunk => { body += chunk; });
  request.on('end', () => {
    if (request.url.includes('count_tokens')) { response.setHeader('Content-Type', 'application/json'); response.end('{"input_tokens":100}'); return; }
    if (!request.url.startsWith('/v1/messages')) { response.writeHead(404); response.end(); return; }
    const input = JSON.parse(body);
    if (input.max_tokens === 1) { response.writeHead(400, { 'Content-Type': 'application/json' }); response.end('{"type":"error","error":{"type":"invalid_request_error","message":"Local model probe disabled"}}'); return; }
    if (!input.stream) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ id: 'msg_local_aux', type: 'message', role: 'assistant', model: input.model, content: [{ type: 'text', text: 'Local test' }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 } }));
      return;
    }
    report.requests.push({ model: input.model, effort: input.output_config?.effort ?? null, thinking: input.thinking?.type ?? null });
    const marker = 'CLAUDE_EFFORT_CAPTURE_' + (++replyCount);
    const message = { id: 'msg_local_' + replyCount, type: 'message', role: 'assistant', model: input.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 100, output_tokens: 0 } };
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    const event = payload => response.write(`event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`);
    event({ type: 'message_start', message });
    event({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
    event({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: marker } });
    event({ type: 'content_block_stop', index: 0 });
    event({ type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 10 } });
    event({ type: 'message_stop' }); response.end();
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let app, page, sessionId;
async function sendAndCapture(expected, markerNumber) {
  const before = report.requests.length;
  const sent = await page.evaluate(id => window.shineAI.session.sendMessage(id, 'Reply OK without using any tools.'), sessionId);
  assert.equal(sent.success, true, JSON.stringify(sent));
  const deadline = Date.now() + 90000;
  let replied = false;
  while (Date.now() < deadline) {
    const messages = await page.evaluate(id => window.shineAI.session.getConversation(id), sessionId);
    replied = messages.some(message => message.role === 'assistant' && JSON.stringify(message.content).includes('CLAUDE_EFFORT_CAPTURE_' + markerNumber));
    if (replied) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(replied, 'Local Claude capture did not produce a reply');
  const requests = report.requests.slice(before);
  assert.ok(requests.length > 0);
  assert.ok(requests.every(request => request.model === report.model && request.effort === expected), JSON.stringify(requests));
  await page.waitForTimeout(1000);
}
try {
  ({ app, page } = await openTestApp(dataDir));
  app.process().stderr.on('data', chunk => fs.appendFileSync(path.join(root, 'artifacts/claude-effort-runtime.log'), chunk));
  app.process().stdout.on('data', chunk => fs.appendFileSync(path.join(root, 'artifacts/claude-effort-runtime.log'), chunk));
  await completeOnboarding(page);
  const created = await page.evaluate(dir => window.shineAI.workspace.create({ name: 'Claude effort verification', rootPath: dir, repos: [{ repoPath: dir, name: 'workspace', isPrimary: true }] }), workspace);
  assert.equal(created.success, true);
  const provider = await page.evaluate(config => window.shineAI.provider.create(config), {
    id: 'claude-effort-capture', name: 'Local Claude request capture', adapterType: 'claude-sdk', command: 'claude', enabled: true,
    defaultModel: report.model, reasoningEffort: 'low', apiBaseUrl: 'http://127.0.0.1:' + server.address().port, apiKey: 'local-test-only', executablePath: path.join(root, 'scripts/fixtures/claude-capture/cli.js'),
    envOverrides: { SHINEAI_CLAUDE_CAPTURE_URL: 'http://127.0.0.1:' + server.address().port, SHINEAI_CLAUDE_CAPTURE_DIR: path.join(dataDir, 'claude-config'), CLAUDE_CONFIG_DIR: path.join(dataDir, 'claude-config'), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', ANTHROPIC_API_KEY: 'local-test-only', ANTHROPIC_AUTH_TOKEN: '', CLAUDE_CODE_OAUTH_TOKEN: '', CLAUDE_CODE_EFFORT_LEVEL: 'high' },
  });
  assert.equal(provider.success, true, JSON.stringify(provider));
  assert.equal(provider.provider.reasoningEffort, 'low');
  const providerId = provider.data?.id || provider.provider?.id || provider.id;
  assert.ok(providerId, 'Provider creation must return its ID');
  const session = await page.evaluate(config => window.shineAI.session.create(config), { name: 'Claude effort verification', workingDirectory: workspace, workspaceId: created.workspaceId, model: report.model, providerId, worktreeEnabled: false, supervisorMode: false, missionMode: false });
  assert.equal(session.success, true, JSON.stringify(session));
  sessionId = session.sessionId || session.session?.id || session.id;
  await sendAndCapture('low', 1);
  report.checks.customAliasSendsProviderEffort = true;
  report.checks.explicitEffortOverridesEnvironment = true;
  const change = await page.evaluate(id => window.shineAI.session.setReasoningEffort(id, 'high'), sessionId);
  assert.equal(change.success, true, JSON.stringify(change));
  await sendAndCapture('high', 2);
  report.checks.liveSessionChangeReachesRequest = true;
  assert.equal((await page.evaluate(id => window.shineAI.session.setReasoningEffort(id, 'max'), sessionId)).success, true);
  await sendAndCapture('max', 3);
  report.checks.maxEffortReachesRequest = true;
  assert.equal((await page.evaluate(() => window.shineAI.auth.loginWithEmail('unused@example.invalid', 'unused'))).errorCode, 'OFFICIAL_CLOUD_REMOVED');
  report.checks.hostedLoginStillRemoved = true;
} catch (error) { report.errors.push(error.message); process.exitCode = 1; }
finally {
  if (app) await app.close();
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  fs.writeFileSync(path.join(root, 'artifacts/claude-effort-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
