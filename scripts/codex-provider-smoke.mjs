import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { completeOnboarding } from './electron-test-helper.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, '.runtime/package.json'));
const { _electron } = require('playwright-core');
const requests = [];
const responseDelayMs = Number(process.env.CODEX_PROBE_SLOW_MS || 0);
const server = http.createServer((request, response) => {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    requests.push({ method: request.method, path: request.url, model: body.model, stream: body.stream });
    setTimeout(() => {
      if (body.model === 'json-error-model') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end('{"error":{"message":"Local model unavailable"}}');
        return;
      }
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      response.write(`event: response.created\ndata: ${JSON.stringify({ type: 'response.created', response: { model: body.model, status: 'in_progress' } })}\n\n`);
      if (body.model === 'failed-model') {
        setTimeout(() => response.end('event: response.failed\ndata: {"type":"response.failed","response":{"status":"failed","error":{"message":"Local model unavailable"}}}\n\n'), 25);
      } else response.end('event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hi"}\n\n');
    }, responseDelayMs);
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const env = { ...process.env, SHINEAI_DEV_USER_DATA_DIR: path.join(root, '.test-data', `codex-probe-${Date.now()}`), SHINEAI_LOCAL_AUTH_PORT: '19321', SHINEAI_MEETING_GATEWAY_PORT: '18091' };
delete env.ELECTRON_RUN_AS_NODE;
let application;
try {
  application = await _electron.launch({ executablePath: path.join(root, '.runtime/electron/electron.exe'), args: [root], cwd: root, env, timeout: 120000 });
  let page;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    page = application.windows().find((candidate) => !candidate.isClosed() && candidate.url().includes('/renderer/index.html'));
    if (page) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(page, 'development renderer opened');
  await page.waitForFunction(() => window.shineAI?.provider?.testApi, undefined, { timeout: 120000 });
  const started = Date.now();
  const result = await page.evaluate(({ origin }) => window.shineAI.provider.testApi({ adapterType: 'codex-appserver', apiBaseUrl: origin, apiKey: 'local-smoke-key', model: 'test-model' }), { origin });
  assert.equal(result.success, true, result.message);
  assert.deepEqual(requests, [{ method: 'POST', path: '/v1/responses', model: 'test-model', stream: true }]);
  console.log(JSON.stringify({ result: 'passed', endpoint: requests[0].path, requests: requests.length, ms: Date.now() - started }));
  if (process.env.CODEX_PROBE_DIAGNOSTIC_URL) {
    const started = Date.now();
    const diagnostic = await page.evaluate(({ remote }) => window.shineAI.provider.testApi({ adapterType: 'codex-appserver', apiBaseUrl: remote, apiKey: 'invalid-test-key', model: 'test-model' }), { remote: process.env.CODEX_PROBE_DIAGNOSTIC_URL });
    console.log(JSON.stringify({ diagnosticStatus: diagnostic.httpStatus ?? diagnostic.status, category: diagnostic.category, ms: Date.now() - started }));
  }
  {
    await completeOnboarding(page);
    const updated = await page.evaluate(({ origin }) => window.shineAI.provider.update('codex', { apiBaseUrl: origin, apiKey: 'local-smoke-key', defaultModel: 'test-model', enabled: true }), { origin });
    assert.equal(updated.success, true);
    await page.getByRole('button', { name: '设置', exact: true }).click();
    await page.getByText('全部设置', { exact: true }).click();
    await page.getByRole('button', { name: 'AI 模型', exact: true }).click();
    await page.getByRole('button', { name: /Codex CLI/ }).last().click();
    await page.getByRole('button', { name: '测试', exact: true }).click();
    await page.getByText('连接成功，模型：test-model').waitFor({ timeout: 50000 });
    assert.equal(requests.length, 2);
    console.log(JSON.stringify({ uiTest: 'passed', requests: requests.length, stream: requests[1].stream }));
  }
  for (const model of ['failed-model', 'json-error-model']) {
    const failed = await page.evaluate(({ origin, model }) => window.shineAI.provider.testApi({ adapterType: 'codex-appserver', apiBaseUrl: origin, apiKey: 'local-smoke-key', model }), { origin, model });
    assert.equal(failed.success, false, 'HTTP 200 model errors must not report success');
    assert.equal(failed.httpStatus, 200);
    assert.match(failed.message, /Local model unavailable/);
  }
  console.log(JSON.stringify({ responseErrorChecks: 'passed', requests: requests.length }));
} finally {
  if (application) await application.close();
  await new Promise((resolve) => server.close(resolve));
}
