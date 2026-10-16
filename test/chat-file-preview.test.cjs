const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { registerChatFilePreview, validateRead } = require('../src/main/extensions/chat-file-preview.cjs');

test('outside-file consent grants one canonical read to one window and session', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-preview-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, '中文.txt'), other = path.join(root, 'other.txt');
  fs.writeFileSync(file, 'preview'); fs.writeFileSync(other, 'other');
  const handlers = new Map(), dialogs = [], sender = { isDestroyed: () => false };
  const guard = { validate: () => ({ allowed: false, error: 'outside scope' }), checkBlacklist: () => null };
  let response = 1;
  registerChatFilePreview(guard, {
    ipcMain: { handle: (name, handler) => handlers.set(name, handler) },
    BrowserWindow: { fromWebContents: () => null }, shell: {},
    dialog: { showMessageBox: async options => { dialogs.push(options); return { response }; } }
  });
  const event = { sender }, context = { sessionId: 'test' };
  const prepare = () => handlers.get('dev:chat-file:prepare')(event, { path: file, context });
  assert.equal((await prepare()).canceled, true);
  assert.equal(validateRead(guard, event, file, context).allowed, false);
  response = 0;
  assert.equal((await prepare()).readOnly, true);
  assert.equal(validateRead(guard, event, file, context).readOnly, true);
  assert.equal(validateRead(guard, event, other, context).allowed, false);
  assert.equal(validateRead(guard, event, root, context).allowed, false);
  assert.equal(validateRead(guard, event, file, { sessionId: 'different' }).allowed, false);
  assert.equal(validateRead(guard, { sender: {} }, file, context).allowed, false);
  assert.equal(guard.validate(file, 'write', context).allowed, false);
  await prepare(); assert.equal(dialogs.length, 2, 'repeat preview reuses the exact file grant');
  assert.ok(dialogs[1].detail.includes(fs.realpathSync(file)));
});

test('system paths and changed junction targets cannot gain preview access', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-preview-link-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const safe = path.join(root, 'safe'), blocked = path.join(root, 'system'), link = path.join(root, 'link');
  fs.mkdirSync(safe); fs.mkdirSync(blocked);
  fs.writeFileSync(path.join(safe, 'file.txt'), 'safe'); fs.writeFileSync(path.join(blocked, 'file.txt'), 'protected');
  fs.symlinkSync(safe, link, 'junction');
  let handler, calls = 0;
  const guard = { validate: () => ({ allowed: false, error: 'outside scope' }), checkBlacklist: p => p.startsWith(blocked) ? 'protected system directory' : null };
  registerChatFilePreview(guard, {
    ipcMain: { handle: (_name, h) => { handler = h; } }, BrowserWindow: { fromWebContents: () => null }, shell: {},
    dialog: { showMessageBox: async () => { calls++; return { response: 0 }; } }
  });
  const event = { sender: { isDestroyed: () => false } }, context = { sessionId: 'test' }, file = path.join(link, 'file.txt');
  assert.equal((await handler(event, { path: file, context })).success, true);
  fs.unlinkSync(link); fs.symlinkSync(blocked, link, 'junction');
  assert.equal(validateRead(guard, event, file, context).allowed, false);
  assert.equal((await handler(event, { path: file, context })).success, false);
  assert.equal(calls, 1);
});
