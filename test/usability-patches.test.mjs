import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {patchUsabilityMain,patchUsabilityPreload,patchUsabilityRenderer} from '../scripts/patch-usability.mjs';
import {patchAppearancePreload} from '../scripts/patch-appearance.mjs';

test('recovery transforms keep existing usability fixes intact on repeated application',()=>{
  for(const [file,patch] of [['main/index.js',patchUsabilityMain],['preload/index.js',patchUsabilityPreload],['renderer/assets/index-0LVJEr5c.js',patchUsabilityRenderer]]) {
    const source=fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
    assert.equal(patch(source),source);
  }
});

test('appearance recovery preserves the file preview bridge and other namespaces',()=>{
  const source='electron.contextBridge.exposeInMainWorld("development", {chatFiles:{prepare:()=>42}, getRuntimeInfo:()=>43});\nconst sentinel=1;';
  const patched=patchAppearancePreload(source);
  assert.ok(patched.includes('chatFiles:{prepare:()=>42}'));
  assert.ok(patched.includes('getRuntimeInfo:()=>43'));
  assert.ok(patched.endsWith('const sentinel=1;'));
  assert.ok(patched.includes('dev:appearance:get'));
  assert.equal(patchAppearancePreload(patched),patched);
});
