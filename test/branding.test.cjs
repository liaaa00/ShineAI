'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

test('branding preserves encrypted records, real market endpoints and cloud blocklist', async () => {
  const { brandSource } = await import('../scripts/brand-source.mjs');
  const old = Buffer.from('U3BlY3RyQUk=', 'base64').toString();
  const salt = old.toLowerCase() + '-secret-store-salt-v1';
  const source = `${old} ${old.toUpperCase()} ${old[0].toLowerCase() + old.slice(1)} "${salt}" https://raw.githubusercontent.com/${old.toLowerCase()}/registry/main/registry.json https://${old.toLowerCase()}dev.cloud`;
  const result = brandSource(source);
  assert.ok(result.startsWith('ShineAI SHINEAI shineAI'));
  assert.ok(result.includes(`"${salt}"`));
  assert.ok(result.includes(`githubusercontent.com/${old.toLowerCase()}/registry/`));
  assert.ok(result.includes(`${old.toLowerCase()}dev.cloud`));
  assert.equal(brandSource(result), result);
  const key = s => crypto.pbkdf2Sync('fixture-material', s, 100000, 32, 'sha512');
  assert.deepEqual(key(JSON.parse(brandSource(`"${salt}"`))), key(salt));
});

test('renamed UI preferences retain user values and do not overwrite newer choices', () => {
  const old = Buffer.from('c3BlY3RyYWk=', 'base64').toString();
  const value = JSON.stringify({ path: `D:/projects/${old}/work`, text: 'keep user content' });
  const entries = new Map([[`${old}-theme`, 'dark'], [`${old}-session`, value], ['shineai-theme', 'light']]);
  const localStorage = { get length() { return entries.size; }, key: i => [...entries.keys()][i], getItem: k => entries.get(k) ?? null, setItem: (k, v) => entries.set(k, v) };
  const script = fs.readFileSync(path.join(__dirname, '../src/renderer/assets/dev-storage-migration.js'), 'utf8');
  const run = () => vm.runInNewContext(script, { window: { localStorage }, atob: s => Buffer.from(s, 'base64').toString() });
  run();
  assert.equal(entries.get('shineai-theme'), 'light');
  assert.equal(entries.get('shineai-session'), value);
  assert.equal(entries.get(`${old}-session`), value);
  entries.set(`${old}-new-key`, 'later'); run();
  assert.equal(entries.has('shineai-new-key'), false);
});

test('mobile precache revisions match the bundled files after branding', () => {
  const directory = path.join(__dirname, '../resources/web-client');
  const sw = fs.readFileSync(path.join(directory, 'sw.js'), 'utf8');
  const entries = [...sw.matchAll(/url:"([^"]+)",revision:"([^"]+)"/g)];
  assert.ok(entries.length > 10);
  for (const [, file, revision] of entries) assert.equal(revision, crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, file))).digest('hex'), file);
});
