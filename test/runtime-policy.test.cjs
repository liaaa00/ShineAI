'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createConfig } = require('../src/main/runtime/config.cjs');
const { isTrustedUrl, assertTrustedEvent } = require('../src/main/security/ipc-policy.cjs');
test('installed profiles live outside the application and honor explicit test overrides', () => {
  const root = path.resolve('installed-app');
  const appData = path.resolve('user-appdata');
  assert.equal(createConfig(root, {}).userData, path.join(root, '.data'));
  assert.equal(createConfig(root, {}, { isPackaged: true, appData }).userData, path.join(appData, 'ShineAI', 'Desktop'));
  const override = path.resolve('isolated-test-data');
  assert.equal(createConfig(root, { SHINEAI_DEV_USER_DATA_DIR: override }, { isPackaged: true, appData }).userData, override);
});
test('development ports stay separate and invalid overrides fail explicitly', () => {
  const config = createConfig(path.resolve(__dirname,'..'), {});
  assert.equal(config.localAuthPort,19211); assert.equal(config.meetingPort,17981);
  assert.equal(createConfig(config.root,{SHINEAI_LOCAL_AUTH_PORT:'20111'}).localAuthPort,20111);
  assert.throws(()=>createConfig(config.root,{SHINEAI_LOCAL_AUTH_PORT:'abc'}));
  assert.throws(()=>createConfig(config.root,{SHINEAI_MEETING_GATEWAY_PORT:'65536'}));
});
test('IPC rejects remote frames and traversal outside application renderer',()=>{
  const renderer=path.resolve(__dirname,'../out/renderer');
  const good=pathToFileURL(path.join(renderer,'index.html')).href;
  assert.equal(isTrustedUrl(good+'#/project',renderer),true);
  for(const bad of ['https://example.com','file:///C:/Windows/index.html',pathToFileURL(path.join(renderer,'../renderer-other/index.html')).href,'about:blank'])assert.equal(isTrustedUrl(bad,renderer),false);
  assert.doesNotThrow(()=>assertTrustedEvent({sender:{getURL:()=>good,isDestroyed:()=>false},senderFrame:{url:good}},renderer));
  assert.throws(()=>assertTrustedEvent({sender:{getURL:()=>good},senderFrame:{url:'https://example.com'}},renderer));
});
