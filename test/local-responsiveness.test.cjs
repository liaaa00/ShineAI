'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { parse } = createRequire(path.join(__dirname, '../.runtime/package.json'))('acorn');
const { execFileOutput, spawnResult } = require('../src/main/extensions/async-process.cjs');
const { environmentProxy, proxyEnvironment } = require('../src/main/extensions/provider-proxy.cjs');
const { defaults, registerScreenshotShortcuts } = require('../src/main/extensions/screenshot-shortcuts.cjs');
const { parsePorts } = require('../src/main/extensions/port-discovery.cjs');

test('port discovery preserves listening ports and Windows excluded ranges', () => {
  const ports = parsePorts('TCP 127.0.0.1:9000 0.0.0.0:0 LISTENING 123\r\nTCP [::1]:9001 [::]:0 LISTENING 123\r\nTCP 127.0.0.1:9002 127.0.0.1:90 ESTABLISHED 123', '10000 10002 *\n0 65536', 'win32');
  assert.deepEqual([...ports], [9000, 9001, 10000, 10001, 10002]);
  assert.deepEqual([...parsePorts('node 123 user TCP 127.0.0.1:9000 (LISTEN)', '', 'linux')], [9000]);
});

test('occupied screenshot shortcuts move to distinct available accelerators and persist the effective bindings', () => {
  const occupied = new Set(['Ctrl+Shift+S', 'Ctrl+Alt+S', defaults.screenshotFull]);
  const callbacks = new Map();
  const bindings = { screenshotFull: 'Ctrl+Shift+S', screenshotWindow: 'Ctrl+Alt+S', newSession: 'Ctrl+N' };
  let saved, full = 0, window = 0;
  const registered = registerScreenshotShortcuts({
    globalShortcut: { register(key, callback) { if (occupied.has(key)) return false; occupied.add(key); callbacks.set(key, callback); return true; } },
    bindings, onFull: () => full++, onWindow: () => window++,
    onBindingsChanged: value => { saved = value; }, logger: { info() {}, warn() {} },
  });
  assert.deepEqual(registered, ['Ctrl+Alt+Shift+F8', defaults.screenshotWindow]);
  assert.deepEqual(saved, bindings);
  assert.equal(bindings.newSession, 'Ctrl+N');
  callbacks.get(bindings.screenshotFull)(); callbacks.get(bindings.screenshotWindow)();
  assert.deepEqual([full, window], [1, 1]);
});

test('free custom screenshot bindings and explicitly disabled bindings are preserved', () => {
  const bindings = { screenshotFull: 'Ctrl+Alt+F7', screenshotWindow: '' };
  const registered = registerScreenshotShortcuts({ globalShortcut: { register: () => true }, bindings, onBindingsChanged: () => assert.fail('Unchanged preferences must not be rewritten') });
  assert.deepEqual(registered, ['Ctrl+Alt+F7']);
  assert.equal(bindings.screenshotWindow, '');
});

test('proxy lookup needs no shell, honors the environment, and encodes configured credentials', () => {
  assert.equal(environmentProxy({}), null);
  assert.equal(environmentProxy({ HTTPS_PROXY: 'https://proxy.example:80', HTTP_PROXY: 'http://other.example:80' }), 'https://proxy.example:80');
  assert.equal(environmentProxy({ all_proxy: 'socks5://127.0.0.1:1080' }), 'socks5://127.0.0.1:1080');
  assert.deepEqual(proxyEnvironment({ getAppSettings: () => ({ proxyType: 'none' }) }), {});
  assert.deepEqual(proxyEnvironment({ getAppSettings: () => ({ proxyType: 'http', proxyHost: '127.0.0.1', proxyPort: 8080, proxyUsername: 'user@host', proxyPassword: 'a:b' }) }), {
    HTTPS_PROXY: 'http://user%40host:a%3Ab@127.0.0.1:8080', HTTP_PROXY: 'http://user%40host:a%3Ab@127.0.0.1:8080', ALL_PROXY: 'http://user%40host:a%3Ab@127.0.0.1:8080',
  });
});

test('async executable probes preserve success, failure and timeout results', async () => {
  const options = { encoding: 'utf8', timeout: 3000, windowsHide: true };
  assert.equal((await execFileOutput(process.execPath, ['-e', 'process.stdout.write("ready")'], options)), 'ready');
  const failed = await spawnResult(process.execPath, ['-e', 'process.exit(7)'], options);
  assert.equal(failed.status, 7); assert.equal(failed.error, undefined);
  const missing = await spawnResult('shineai-intentionally-missing-executable', [], options);
  assert.equal(missing.error.code, 'ENOENT');
  const timedOut = await spawnResult(process.execPath, ['-e', 'setTimeout(()=>{},10000)'], { ...options, timeout: 100 });
  assert.equal(timedOut.error.killed, true);
});

test('the shipped environment checker yields to the event loop during slow tool detection', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/main/index.js'), 'utf8');
  const ast = parse(source, { ecmaVersion: 'latest' });
  const cls = ast.body.find(node => node.type === 'ClassDeclaration' && node.id?.name === 'c6');
  const checker = vm.runInNewContext(source.slice(cls.start, cls.end) + ';new c6({})', {
    a7z: null, require: id => { assert.equal(id, './extensions/async-process.cjs'); return { execFileOutput, spawnResult }; }, process, o6: String,
    s: { spawnSync: () => assert.fail('Environment checker must not use spawnSync') },
  });
  let ticks = 0;
  const timer = setInterval(() => ticks++, 20);
  try {
    const result = await checker.runExecutable(process.execPath, ['-e', 'setTimeout(()=>console.log("slow-tool-ready"),300)']);
    assert.equal(result.ok, true); assert.equal(result.version, 'slow-tool-ready');
    assert.ok(ticks >= 5, 'Slow subprocess must not block the main thread');
  } finally { clearInterval(timer); }
});
