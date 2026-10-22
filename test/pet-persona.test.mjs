import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { petImageUrl } from '../src/renderer/assets/dev-pet-persona.mjs';
import { patchPetMain, patchPetPreload, patchPetRenderer } from '../scripts/patch-pet-persona.mjs';
const require = createRequire(import.meta.url);
const { inspectImage, normalizePatch, registerPetPersona, readPersona, savePersona } = require('../src/main/extensions/pet-persona.cjs');
test('only bounded PNG/GIF and opaque local image IDs are accepted', () => {
  const gif = fs.readFileSync(new URL('../scripts/fixtures/appearance/animated.gif', import.meta.url));
  assert.deepEqual(inspectImage(gif, '.gif'), { width: 96, height: 96 });
  for (const bytes of [Buffer.alloc(0), Buffer.from('<svg/>'), Buffer.alloc(10 * 1024 * 1024 + 1), gif.subarray(0, 10)]) assert.throws(() => inspectImage(bytes, '.gif'));
  const huge = Buffer.from(gif); huge.writeUInt16LE(5000, 6); assert.throws(() => inspectImage(huge, '.gif'));
  const id = 'a'.repeat(32) + '.gif'; assert.equal(petImageUrl(id), `shineai-pet://avatar/${id}`);
  assert.equal(petImageUrl(id, true), `shineai-pet://avatar/${id}.poster.png`);
  for (const bad of ['../../secret.png', 'https://example.com/a.png', '<svg/>', '/private.png']) { assert.equal(petImageUrl(bad), null); assert.throws(() => normalizePatch({ customAvatarId: bad })); }
  assert.throws(() => normalizePatch({ avatarType: 'unknown' })); assert.throws(() => normalizePatch({ name: ' ' }));
});
test('saved personas broadcast only after validation; active images cannot be discarded', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shine-pet-')), handlers = new Map(), sent = [], protocols = new Map();
  registerPetPersona({ app: { whenReady: () => Promise.resolve() }, config: { userData: dir }, ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, protocol: { registerSchemesAsPrivileged() {}, handle: (name, fn) => protocols.set(name, fn) }, BrowserWindow: { getAllWindows: () => [{ isDestroyed: () => false, webContents: { send: (...v) => sent.push(v) } }] } });
  let persona = { name: '小光', avatarType: 'cat', personality: 'casual', petSpecies: 'cat_black' };
  const service = { getPersona: () => ({ ...persona }), setPersona: patch => { persona = { ...persona, ...patch }; } };
  readPersona(service);
  assert.equal((await savePersona(service, { avatarType: 'robot', petSpecies: 'robot' })).success, true);
  assert.equal(sent.length, 1); assert.equal(sent[0][1].avatarType, 'robot');
  await assert.rejects(savePersona(service, { avatarType: 'custom', customAvatarId: 'a'.repeat(32) + '.png' }));
  assert.equal(sent.length, 1); assert.equal(persona.avatarType, 'robot');
  const id = 'b'.repeat(32) + '.png', media = path.join(dir, 'pet-images'); fs.mkdirSync(media, { recursive: true });
  fs.writeFileSync(path.join(media, id), 'fixture'); fs.writeFileSync(path.join(media, id + '.json'), JSON.stringify({ name: 'local.png', width: 1, height: 1 }));
  await savePersona(service, { avatarType: 'custom', customAvatarId: id });
  assert.equal(sent.at(-1)[1].customAvatarId, id);
  assert.equal((await handlers.get('dev:pet:discard')({}, id)).success, false);
  for (const url of ['shineai-pet://other/' + id, 'shineai-pet://avatar/' + id + '?x=1', 'shineai-pet://avatar/secret.txt']) assert.equal((await protocols.get('shineai-pet')({ url, method: 'GET' })).status, 404);
});
test('persona integration is repeatable across main, preload and renderer', () => {
  for (const [name, patch] of [['main/index.js', patchPetMain], ['preload/index.js', patchPetPreload], ['renderer/assets/index-0LVJEr5c.js', patchPetRenderer]]) {
    const source = fs.readFileSync(new URL('../src/' + name, import.meta.url), 'utf8'); assert.equal(patch(source), source, name);
  }
});
