const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const runtime = fs.readFile(path.join(__dirname, '../src/renderer/assets/dev-editor-runtime.js'), 'utf8')
  .then(source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64')));

test('slow editor initialization shares one load and still resolves after the text fallback', async () => {
  const { createEditorRuntime } = await runtime;
  let finish, calls = 0, slow = 0;
  const monaco = { editor: {} };
  const api = createEditorRuntime({ init: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  const first = api.ready(5, () => { slow++; });
  const second = api.ready(5, () => { slow++; });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(slow, 2); assert.equal(calls, 1);
  finish(monaco);
  assert.equal(await first, monaco); assert.equal(await second, monaco);
});

test('failed editor initialization resets the failed loader before a retry', async () => {
  const { createEditorRuntime } = await runtime;
  let attempts = 0, resets = 0;
  const monaco = { editor: {} };
  const api = createEditorRuntime({ init: async () => { if (++attempts === 1) throw new Error('missing loader'); return monaco; }, reset: () => { resets++; } });
  await assert.rejects(api.ready(10), /missing loader/);
  assert.equal(await api.ready(10), monaco);
  assert.equal(resets, 1); assert.equal(attempts, 2);
});

test('fast editor startup clears the fallback timer', async () => {
  const { createEditorRuntime } = await runtime;
  let slow = 0;
  const api = createEditorRuntime({ init: async () => ({ editor: {} }) });
  await api.ready(5, () => { slow++; });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(slow, 0);
});
