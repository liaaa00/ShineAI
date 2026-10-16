import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import {patchTaskNotificationsMain,patchTaskNotificationsPreload} from '../scripts/patch-task-notifications.mjs';
const require=createRequire(import.meta.url);
const {activateTaskWindow,showTaskNotification}=require('../src/main/extensions/task-notifications.cjs');
function fixture() {
  const contents=new EventEmitter(),sent=[];
  let loading=true,destroyed=false,minimized=true,visible=false;
  Object.assign(contents,{isDestroyed:()=>destroyed,isLoadingMainFrame:()=>loading,send:(...args)=>sent.push(args)});
  const window={webContents:contents,isDestroyed:()=>destroyed,isMinimized:()=>minimized,restore:()=>{minimized=false;},isVisible:()=>visible,show:()=>{visible=true;},focus:()=>{}};
  return {window,contents,sent,loaded:()=>{loading=false;contents.emit('did-finish-load');},destroy:()=>{destroyed=true;contents.emit('destroyed');}};
}
test('loading window opens immediately and delivers only latest click after load',()=>{
  const f=fixture();
  assert.equal(activateTaskWindow(()=>f.window,'one'),true);
  assert.equal(f.window.isVisible(),true);assert.equal(f.window.isMinimized(),false);
  activateTaskWindow(()=>f.window,'two');assert.deepEqual(f.sent,[]);
  f.loaded();assert.deepEqual(f.sent,[['butler:navigate-session','two']]);
  assert.equal(f.contents.listenerCount('did-finish-load'),0);
  assert.equal(f.contents.listenerCount('destroyed'),0);
});
test('destroyed or missing windows do not throw or navigate',()=>{
  assert.equal(activateTaskWindow(()=>null,'one'),false);
  const f=fixture();activateTaskWindow(()=>f.window,'one');f.destroy();f.loaded();
  assert.deepEqual(f.sent,[]);assert.equal(activateTaskWindow(()=>f.window,'one'),false);
});
test('native notification binds its target before showing',()=>{
  const f=fixture();f.loaded();
  class Notification extends EventEmitter {show(){this.emit('click');}}
  showTaskNotification({Notification,getMainWindow:()=>f.window,title:'done',body:'task',silent:false,sessionId:'target'});
  assert.deepEqual(f.sent,[['butler:navigate-session','target']]);
});
test('preload preserves navigation arriving before renderer subscription',async()=>{
  const source=fs.readFileSync(new URL('../src/preload/index.js',import.meta.url),'utf8');
  const start=source.indexOf('// Buffer navigation'),end=source.indexOf('const __devPreloadInfo',start);
  const methodStart=source.indexOf('    onNavigateSession: (callback) => {');
  const methodEnd=source.indexOf('\n    }',methodStart)+6;
  const ipcRenderer=new EventEmitter();
  const subscribe=vm.compileFunction(source.slice(start,end)+'return ({'+source.slice(methodStart,methodEnd)+'}).onNavigateSession;',['electron','queueMicrotask'])({ipcRenderer},queueMicrotask);
  const received=[];
  ipcRenderer.emit('butler:navigate-session',{},'early');
  const unsubscribe=subscribe(id=>received.push(id));await Promise.resolve();
  ipcRenderer.emit('butler:navigate-session',{},'live');
  assert.deepEqual(received,['early','live']);unsubscribe();
  ipcRenderer.emit('butler:navigate-session',{},'later');
  subscribe(id=>received.push(id));await Promise.resolve();
  assert.deepEqual(received,['early','live','later']);
});
test('source patches are idempotent',()=>{
  for(const [file,patch] of [['main/index.js',patchTaskNotificationsMain],['preload/index.js',patchTaskNotificationsPreload]]) {
    const source=fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
    assert.equal(patch(source),source);
  }
});
