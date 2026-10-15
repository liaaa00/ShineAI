const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { revealLocalPath } = require('../src/main/extensions/reveal-local-path.cjs');
const helper = fs.readFile(path.join(__dirname, '../src/renderer/assets/dev-file-links.js'), 'utf8')
  .then(source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64')));

test('chat file links preserve resolved paths and source positions inside the app', async () => {
  const { openChatFile } = await helper;
  const calls = [];
  const options = {
    path: 'docs/example.cmd',
    resolve: async () => ({ path: 'D:/workspace/docs/example.cmd', kind: 'file' }),
    files: { openFileInTab: async p => calls.push([p]), openFileAtLine: async (...args) => calls.push(args) },
    revealDirectory: () => assert.fail('a file must not open in the operating system'),
    notify: () => assert.fail('should succeed')
  };
  assert.equal((await openChatFile({ ...options, line: 2, col: 3 })).success, true);
  assert.equal((await openChatFile(options)).success, true);
  assert.deepEqual(calls, [['D:\\workspace\\docs\\example.cmd', 2, 3], ['D:\\workspace\\docs\\example.cmd']]);
});

test('chat open failures are reported and never fall back to a native launcher', async () => {
  const { openChatFile } = await helper;
  const notifications = [];
  const result = await openChatFile({
    path: 'private.txt', resolve: async p => ({ path: p }),
    files: { openFileInTab: async () => { throw new Error('Permission denied'); } },
    revealDirectory: () => assert.fail('must not fall back'),
    notify: (...args) => notifications.push(args)
  });
  assert.equal(result.success, false);
  assert.deepEqual(notifications, [['Permission denied', 'error']]);
});

test('file links select existing files without executing them; directories open directly', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'shineai-reveal-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, '中文 skill & sample.cmd');
  await fs.writeFile(file, 'DO NOT EXECUTE');
  const calls = [];
  const shell = { showItemInFolder: p => calls.push(['select', p]), openPath: async p => { calls.push(['directory', p]); return ''; } };
  assert.equal((await revealLocalPath(file, shell)).success, true);
  assert.equal((await revealLocalPath(root, shell)).success, true);
  assert.deepEqual(calls, [['select', file], ['directory', root]]);
});

test('missing, relative and URL paths report errors without opening a fallback folder', async () => {
  const shell = { showItemInFolder: () => assert.fail('must not select'), openPath: () => assert.fail('must not open') };
  for (const input of ['SKILL.md', 'https://example.com/a', '', '\0', path.join(os.tmpdir(), 'shineai-missing-'+Date.now(), 'SKILL.md')]) {
    const result = await revealLocalPath(input, shell);
    assert.equal(result.success, false);
    assert.ok(result.error);
  }
});

test('Explorer failures propagate to the renderer rather than pretending success', async () => {
  assert.deepEqual(await revealLocalPath(os.tmpdir(), { openPath: async () => 'Explorer failed' }), { success: false, error: 'Explorer failed' });
});
