const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { revealLocalPath } = require('../src/main/extensions/reveal-local-path.cjs');

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
