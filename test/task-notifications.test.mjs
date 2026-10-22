import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import {patchTaskNotificationsMain,patchTaskNotificationsPreload,patchTaskNotificationsRenderer} from '../scripts/patch-task-notifications.mjs';
const require=createRequire(import.meta.url);
const {activateTaskWindow,showTaskNotification}=require('../src/main/extensions/task-notifications.cjs');
const {createTracker,beginTurn,beginInitialTurn,isSessionViewed,sendTurn}=require('../src/main/extensions/task-completion-policy.cjs');

function completionFixture() {
  const session={id:'s',name:'Example',status:'waiting_input',config:{initialPrompt:'old prompt'}};
  const sessions={getSession:()=>session},sent=[],jobs=[];
  let viewed=false;
  const notifications={onTaskCompleted:(...args)=>sent.push(args),acknowledge:()=>{}};
  const tracker=createTracker({sessions,notifications,isViewed:()=>viewed,schedule:job=>jobs.push(job)});
  const drain=()=>{while(jobs.length)jobs.shift()();};
  return {session,sessions,tracker,sent,drain,view:(value=true)=>{viewed=value;},
    answer:()=>tracker.message('s',{role:'assistant',content:'New answer'}),
    status:value=>{session.status=value;tracker.status('s',value);}};
}

test('restoring old sessions never qualifies as new task completion',()=>{
  const f=completionFixture();
  beginInitialTurn(f.sessions,'s',f.session.config,{mode:'resume'});
  f.status('running');f.answer();f.status('waiting_input');f.drain();
  beginInitialTurn(f.sessions,'s',{initialPrompt:'Recovery context',initialPromptVisibility:'hidden'},{mode:'start'});
  f.status('running');f.status('waiting_input');f.drain();
  assert.deepEqual(f.sent,[]);
});

test('fresh background round completes once, including answer arriving after idle status',()=>{
  const f=completionFixture();
  beginTurn(f.sessions,'s');f.status('running');f.status('waiting_input');f.drain();
  assert.equal(f.sent.length,0);
  f.answer();f.drain();f.status('waiting_input');f.answer();f.drain();
  assert.deepEqual(f.sent,[['s','Example']]);
  beginTurn(f.sessions,'s');f.status('running');f.answer();f.status('waiting_input');f.drain();
  assert.equal(f.sent.length,2);
});

test('initial visible request qualifies but old initialPrompt alone does not',()=>{
  const f=completionFixture();
  beginInitialTurn(f.sessions,'s',f.session.config,{mode:'start'});
  f.status('running');f.answer();f.status('waiting_input');f.drain();
  assert.equal(f.sent.length,1);
});

test('foreground completion is consumed, while internal turns and cancelled turns stay quiet',()=>{
  const f=completionFixture();f.view();beginTurn(f.sessions,'s');
  f.status('running');f.answer();f.status('waiting_input');f.drain();
  assert.equal(f.sent.length,0);
  f.view(false);f.answer();f.status('waiting_input');f.drain();
  assert.equal(f.sent.length,0);
  for(const source of ['system_internal','agent_completion','cross_session']) {
    beginTurn(f.sessions,'s',{source});f.answer();f.status('waiting_input');f.drain();
  }
  beginTurn(f.sessions,'s');f.status('running');f.answer();f.status('interrupted');f.drain();
  assert.equal(f.sent.length,0);
});

test('a failed send rolls back before late output can create a notification',async()=>{
  const f=completionFixture();
  await assert.rejects(sendTurn(f.sessions,'s',{source:'user'},async()=>{throw Error('fixture send failed');}),/fixture send failed/);
  f.answer();f.status('waiting_input');f.drain();
  assert.equal(f.sent.length,0);
});

test('failed sends roll back eligibility and tool progress is not a final answer',()=>{
  const f=completionFixture();
  const cancel=beginTurn(f.sessions,'s');cancel();f.answer();f.drain();
  assert.equal(f.sent.length,0);
  beginTurn(f.sessions,'s');f.status('running');f.answer();
  f.tracker.message('s',{role:'tool_use',content:'command'});
  f.status('waiting_input');f.drain();assert.equal(f.sent.length,0);
  f.answer();f.drain();assert.equal(f.sent.length,1);
});

test('view detection requires the exact conversation in a focused visible window',()=>{
  const wc={isDestroyed:()=>false};
  let focused=true,visible=true,minimized=false;
  const window={isDestroyed:()=>false,isVisible:()=>visible,isFocused:()=>focused,isMinimized:()=>minimized};
  const topics=new Set(['session-deltas:hidden','task-notification-view:s']);
  const input={BrowserWindow:{fromWebContents:()=>window},subscriptions:new Map([[1,{wc,topics}]]),sessionId:'s'};
  assert.equal(isSessionViewed(input),true);
  focused=false;assert.equal(isSessionViewed(input),false);focused=true;
  visible=false;assert.equal(isSessionViewed(input),false);visible=true;
  minimized=true;assert.equal(isSessionViewed(input),false);minimized=false;
  assert.equal(isSessionViewed({...input,sessionId:'other'}),false);
  assert.equal(isSessionViewed({...input,sessionId:'hidden'}),false,'A hidden mounted conversation is not being viewed');
});

test('actual application event wiring ignores restore and delivers a real new request once',async()=>{
  const source=fs.readFileSync(new URL('../src/main/index.js',import.meta.url),'utf8');
  const start=source.indexOf('function G5('),end=source.indexOf('const V5=',start);
  const sessions=new EventEmitter(),session={id:'s',name:'Example',status:'waiting_input',config:{initialPrompt:'old'}};
  sessions.getSession=()=>session;
  const sent=[],noop=()=>{},database={getDb:()=>null,updateSession:noop,isSessionNameLocked:()=>true,insertConversationMessage:noop,addSessionSummary:noop,addActivityEvent:noop};
  const context={require:createRequire(new URL('../src/main/index.js',import.meta.url)),a7z:()=>{},a01:()=>{},a3:new Set(),i3:class{clear(){}},r:{BrowserWindow:{fromWebContents:()=>null}},r3:new Map(),k5:null,M5:null,KI:noop,Qr:'status',Vr:'message',Hr:'activity',Gr:'name',rq:()=>false,s3:noop,La:id=>id,setImmediate,setTimeout};
  vm.runInNewContext(source.slice(start,end)+';G5',context)(sessions,database,{unregisterSession:noop},{onTaskCompleted:(...args)=>sent.push(args),acknowledge:noop,getActiveCount:()=>0,clearSession:noop},{decrementBadge:noop});
  const status=value=>{session.status=value;sessions.emit('status-change','s',value);};
  status('running');status('waiting_input');await new Promise(resolve=>setTimeout(resolve,200));
  assert.equal(sent.length,0);
  const methodStart=source.indexOf('async["dispatchMessageToAdapter"]'),methodEnd=source.indexOf('["enqueueScheduledMessage"]',methodStart);
  const dispatch=vm.compileFunction('return ({'+source.slice(methodStart,methodEnd)+'}).dispatchMessageToAdapter;',['require','a7z'])(context.require,()=>{});
  Object.assign(sessions,{resolveAdapter:()=>({sendMessage:async()=>{
    status('running');sessions.emit('conversation-message','s',{id:'a',role:'assistant',content:'Fresh answer'});status('waiting_input');
  }}),buildOutboundMessageWithAutoRecall:(_session,_text,text)=>text,markActiveAssistantPlanMode:noop,markActivePlanDocumentPrompt:noop,prependExecutePlanContextForSend:(_session,text)=>text,buildAdapterSendMessageOptions:()=>({})});
  await dispatch.call(sessions,'s',{provider:{}},'A real new request',{source:'user'});
  await new Promise(resolve=>setTimeout(resolve,200));
  status('waiting_input');await new Promise(resolve=>setTimeout(resolve,200));
  assert.deepEqual(sent,[['s','Example']]);
});
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
  for(const [file,patch] of [['main/index.js',patchTaskNotificationsMain],['preload/index.js',patchTaskNotificationsPreload],['renderer/assets/index-0LVJEr5c.js',patchTaskNotificationsRenderer]]) {
    const source=fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
    assert.equal(patch(source),source);
  }
});
