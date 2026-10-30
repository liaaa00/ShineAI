import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { configureAuthentication } = createRequire(import.meta.url)('../src/main/extensions/claude-auth.cjs');
fs.mkdirSync(path.join(root, '.test-data'), { recursive: true });
const dir = fs.mkdtempSync(path.join(root, '.test-data', 'claude-auth-'));
const workspace = path.join(dir, 'workspace');
const configDir = path.join(dir, 'config');
fs.mkdirSync(path.join(workspace, '.claude'), { recursive: true });
fs.mkdirSync(configDir, { recursive: true });
const capture = [];
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    if (req.url.includes('count_tokens')) { res.end('{"input_tokens":10}'); return; }
    if (!req.url.startsWith('/v1/messages')) { res.writeHead(404); res.end(); return; }
    const input = JSON.parse(body);
    capture.push({ keyMatches: req.headers['x-api-key'] === 'local-selected-key', authorizationMatchesProvider: !req.headers.authorization || req.headers.authorization === 'Bearer' || req.headers.authorization === 'Bearer local-selected-key', staleBearer: req.headers.authorization === 'Bearer local-stale-token', emptyBearer: req.headers.authorization === 'Bearer' });
    const message = { id: 'msg_auth_test', type: 'message', role: 'assistant', model: input.model, content: [{ type: 'text', text: 'AUTH_PRIORITY_OK' }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 5 } };
    if (!input.stream) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(message)); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const emit = data => res.write(`event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`);
    emit({ type: 'message_start', message: { ...message, content: [], stop_reason: null } });
    emit({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
    emit({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'AUTH_PRIORITY_OK' } });
    emit({ type: 'content_block_stop', index: 0 });
    emit({ type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 5 } });
    emit({ type: 'message_stop' });
    res.end();
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const stale = { env: { ANTHROPIC_AUTH_TOKEN: 'local-stale-token', ANTHROPIC_API_KEY: 'local-stale-key', ANTHROPIC_BASE_URL: 'http://127.0.0.1:1' } };
  for (const file of [path.join(configDir, 'settings.json'), path.join(workspace, '.claude/settings.json'), path.join(workspace, '.claude/settings.local.json')]) fs.writeFileSync(file, JSON.stringify(stale));
  const options = configureAuthentication({ apiKey: 'local-selected-key', apiBaseUrl: `http://127.0.0.1:${server.address().port}` }, { env: { ...process.env, ...stale.env, CLAUDE_CONFIG_DIR: configDir, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', ...(process.platform === 'win32' ? { CLAUDE_CODE_GIT_BASH_PATH: path.join(root, 'resources/git-bash/bin/bash.exe') } : {}) } });
  delete options.env.ELECTRON_RUN_AS_NODE;
  const cli = path.join(root, 'node_modules/@anthropic-ai/claude-agent-sdk/cli.js');
  const child = spawn(process.execPath, [cli, '-p', 'Reply OK. Do not use tools.', '--output-format', 'json', '--model', 'claude-sonnet-4-6', '--max-turns', '1', '--tools', '', '--setting-sources', 'user,project,local', '--settings', JSON.stringify(options.settings)], { cwd: workspace, env: options.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  let errors = '';
  child.stderr.on('data', data => { errors += data; });
  const timer = setTimeout(() => child.kill(), 60000);
  let code;
  try { code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); }); }
  finally { clearTimeout(timer); }
  assert.equal(code, 0, 'Real Claude CLI must complete: ' + errors.slice(-1500) + output.slice(-1000));
  assert.ok(capture.length > 0, 'Real CLI must reach selected local endpoint');
  assert.ok(capture.every(item => item.keyMatches && item.authorizationMatchesProvider && !item.staleBearer), 'Stale bearer token must never reach requests: ' + JSON.stringify(capture));
  assert.ok(output.includes('AUTH_PRIORITY_OK'), 'Real CLI must return local model answer');
  console.log(JSON.stringify({ passed: true, requests: capture.length, userProjectLocalSettingsEnabled: true, providerKeyUsed: true, staleBearerAbsent: true, answerReceived: true }));
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

