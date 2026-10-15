'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { normalizeCodexBaseUrl, readCodexProbeResponse } = require('../src/main/extensions/codex-endpoint.cjs');

test('bare Codex origins gain /v1 while explicit paths are preserved', () => {
  assert.equal(normalizeCodexBaseUrl(' https://gateway.example/ '), 'https://gateway.example/v1');
  assert.equal(normalizeCodexBaseUrl('http://127.0.0.1:8000'), 'http://127.0.0.1:8000/v1');
  assert.equal(normalizeCodexBaseUrl('https://gateway.example/v1/'), 'https://gateway.example/v1');
  assert.equal(normalizeCodexBaseUrl('https://gateway.example/custom/v1/'), 'https://gateway.example/custom/v1');
});

// Exercise the shipped probe implementation without credentials or a network call.
function loadProbe(fetch) {
  const source = fs.readFileSync(path.join(__dirname, '../src/main/index.js'), 'utf8');
  const begin = source.indexOf('async function JY(');
  const end = source.indexOf('function eX(', begin);
  assert.ok(begin >= 0 && end > begin, 'provider probe implementation is present');
  const context = {
    fetch, AbortController, setTimeout, clearTimeout, Date, JSON, String, encodeURIComponent,
    require: (id) => {
      assert.equal(id, './extensions/codex-endpoint.cjs');
      return { normalizeCodexBaseUrl, readCodexProbeResponse };
    },
    a7z: null, RY: 10000, OY: 'https://api.anthropic.com', DY: 'https://generativelanguage.googleapis.com',
    p: { t: (key, variables) => key + (variables?.status ? ` (${variables.status})` : '') },
    FY: (url) => url.replace(/\/+$/, ''), zY: () => undefined,
    WY: (result) => result, LY: (message) => message,
    XY: async (response) => (await response.json()).error?.message || '',
    VY: () => ({ status: 'config_error', category: 'http', scope: 'provider-config' }),
    HY: (status) => `Request failed (${status})`,
    lY: () => false, jY: () => undefined,
  };
  return vm.runInNewContext(source.slice(begin, end) + '\nZY', context);
}

test('Codex test uses the Responses endpoint for a bare gateway origin', async () => {
  const calls = [];
  let cancelled = 0;
  const probe = loadProbe(async (url, request) => {
    calls.push({ url, method: request.method, body: JSON.parse(request.body) });
    return new Response(new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hi"}\n\n')); },
      cancel() { cancelled += 1; },
    }), { headers: { 'content-type': 'text/event-stream' } });
  });
  const result = await probe({ adapterType: 'codex-appserver', apiBaseUrl: 'https://gateway.example', apiKey: 'test-only-key', model: 'test-model' });
  assert.equal(result.success, true);
  assert.deepEqual(calls.map((call) => [call.url, call.method]), [['https://gateway.example/v1/responses', 'POST']]);
  assert.equal(calls[0].body.model, 'test-model');
  assert.equal(calls[0].body.stream, true);
  assert.equal(cancelled, 1);
});

test('Codex HTTP 200 errors do not turn into successful connection tests', async () => {
  for (const body of [
    'event: response.created\ndata: {"type":"response.created","response":{"model":"test-model","status":"in_progress"}}\n\nevent: response.failed\ndata: {"type":"response.failed","response":{"status":"failed","error":{"message":"Model unavailable"}}}\n\n',
    'event: error\ndata: {"message":"Model unavailable"}\n\n',
  ]) {
    const probe = loadProbe(async () => new Response(body, { headers: { 'content-type': 'text/event-stream' } }));
    const result = await probe({ adapterType: 'codex-appserver', apiBaseUrl: 'https://gateway.example', apiKey: 'test-only-key', model: 'test-model' });
    assert.equal(result.success, false);
    assert.equal(result.httpStatus, 200);
    assert.match(result.message, /Model unavailable/);
  }
});

test('Codex checks JSON fallbacks and rejects HTML pages or empty streams', async () => {
  const success = new Response(JSON.stringify({ object: 'response', status: 'completed', model: 'actual-model' }), { headers: { 'content-type': 'application/json' } });
  assert.equal(await readCodexProbeResponse(success, 'test-model'), 'actual-model');
  for (const body of ['{"error":{"message":"Invalid model"}}', '<html>Login</html>', '']) {
    await assert.rejects(readCodexProbeResponse(new Response(body), 'test-model'), { code: 'CODEX_PROBE_FAILED' });
  }
});

test('Codex parses split CRLF events and cancels after output without waiting for completion', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({
    start(controller) {
      for (const chunk of ['event: response.created\r\ndata: {"response":{"model":"actual-model"}}\r\n\r', '\nevent: response.output_text.delta\r\ndata: {"type":"response.output_text.delta","del', 'ta":"Hi"}\r\n\r\n']) controller.enqueue(new TextEncoder().encode(chunk));
    },
    cancel() { cancelled = true; },
  }), { headers: { 'content-type': 'text/event-stream' } });
  assert.equal(await readCodexProbeResponse(response, 'test-model'), 'actual-model');
  assert.equal(cancelled, true);
});

test('Codex body deadline still applies when HTTP headers arrived but output stalls', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { 'content-type': 'text/event-stream' } });
  await assert.rejects(readCodexProbeResponse(response, 'test-model', 30), { name: 'AbortError' });
  assert.equal(cancelled, true);
});

test('Codex rejects oversized output during a connection probe', async () => {
  await assert.rejects(readCodexProbeResponse(new Response('x'.repeat(256 * 1024 + 1)), 'test-model'), { code: 'CODEX_PROBE_FAILED' });
});

test('Codex test reports a Responses 405 without falling through to another route', async () => {
  const calls = [];
  const probe = loadProbe(async (url) => {
    calls.push(url);
    return { ok: false, status: 405, headers: { get: () => null }, json: async () => ({ error: { message: 'method not allowed' } }) };
  });
  const result = await probe({ adapterType: 'codex-appserver', apiBaseUrl: 'https://gateway.example/v1/', apiKey: 'test-only-key', model: 'test-model' });
  assert.equal(result.httpStatus, 405);
  assert.equal(result.success, false);
  assert.deepEqual(calls, ['https://gateway.example/v1/responses']);
});
