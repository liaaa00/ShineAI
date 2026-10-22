import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {patchRunningInputMain,patchRunningInputRenderer,patchRunningInputPreload} from '../scripts/patch-running-input.mjs';
const require=createRequire(import.meta.url),flow=require('../src/main/extensions/running-input.cjs');
const root=path.resolve(import.meta.dirname,'..');
function setup(t,{native=true,hasPlan=true,beforeDispatch}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shine-input-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));flow.configureForTest(dir);
 const calls=[],session={status:'running',provider:{},latestTodos:{items:hasPlan?[{content:'old',status:'pending'}]:[]},runningInputQueue:[],scheduledMessages:[],pendingMessages:[]};
 const adapter={sessions:new Map([['s',{pendingMessages:[]}]]),...(native?{takeRoundInput(){}}:{}),sendMessage:async(id,text)=>{calls.push(text);adapter.sessions.get(id).pendingMessages.push(text);}};
 const manager={sessions:new Map([['s',session]]),resolveAdapter:()=>adapter,sendMessage:async(id,text)=>{if(beforeDispatch){const result=await beforeDispatch();if(result)return result;}const scheduled=['running','starting'].includes(session.status);await manager.resolveAdapter().sendMessage(id,text);return {dispatched:!scheduled,scheduled,strategy:scheduled?'enqueue_while_running':undefined};},getScheduledMessages:()=>session.scheduledMessages,maybeCompleteSessionTodosOnAgentCompletion:()=>{session.autoCompleted=true;},abortSession:async()=>{},emit(){},clearScheduledMessages(){session.scheduledMessages=[];return 1;},findRealQueuedMessage(_s,id){const message=session.scheduledMessages.find(m=>m.id===id);return message?{message}:undefined;},removeScheduledMessage(id,q){session.scheduledMessages=session.scheduledMessages.filter(m=>m.id!==q);return {removed:true};},updateScheduledMessage(id,q,text){session.scheduledMessages.find(m=>m.id===q).text=text;return {updated:true};}};
 flow.installManager(manager);
 return {dir,manager,adapter,session,calls};
}
test('adapter acknowledgement is not a request receipt; stale plan cannot acknowledge newer input',async t=>{
 const {manager,calls}=setup(t);
 const first=await manager.sendMessage('s','先分析，不要修改');
 assert.equal(flow.snapshot('s').inputs[0].state,'submitted');
 assert.equal(flow.strip(calls[0]),'先分析，不要修改');
 const firstWire={messages:[{role:'user',content:calls[0]}]};
 assert.deepEqual(flow.beginRequest('s',firstWire),[first.inputId]);
 assert.equal(flow.snapshot('s').inputs[0].state,'sent');
 await manager.sendMessage('s','保留原来的配置');
 assert.equal(flow.review('s',1),false);
 flow.beginRequest('s',{messages:calls.map(content=>({role:'user',content}))});
 assert.equal(flow.review('s',1),false);assert.equal(flow.review('s',2),true);
 assert.equal(flow.needsReview('s'),false);
 assert.equal(flow.snapshot('s').inputs.length,2);
});
test('duplicate pending sends do not duplicate model input; cancellation is never completion',async t=>{
 const {manager,calls,session}=setup(t);
 await manager.sendMessage('s','change direction');await manager.sendMessage('s','change direction');
 assert.equal(calls.length,1);manager.maybeCompleteSessionTodosOnAgentCompletion('s');assert.equal(session.autoCompleted,undefined);
 session.scheduledMessages=[{id:'queue1',text:calls[0],source:'user'}];
 assert.equal(manager.getScheduledMessages('s')[0].text,'change direction');
 manager.removeScheduledMessage('s','queue1');assert.equal(flow.snapshot('s').inputs[0].state,'cancelled');
 assert.equal(flow.needsReview('s'),false);
});
test('queue edits create a new input version and do not lose the revision marker',async t=>{
 const {manager,calls,session}=setup(t);await manager.sendMessage('s','old input');session.scheduledMessages=[{id:'q',text:calls[0]}];
 manager.updateScheduledMessage('s','q','corrected input');
 const state=flow.snapshot('s');assert.equal(state.inputs[0].state,'cancelled');assert.equal(state.inputs[1].text,'corrected input');
 assert.equal(flow.tokens(session.scheduledMessages[0].text)[0].revision,2);assert.equal(manager.getScheduledMessages('s')[0].text,'corrected input');
});
test('network failure is retryable; historical markers and tool quotes do not invent new receipts',async t=>{
 const {manager,calls}=setup(t);const r=await manager.sendMessage('s','correction');
 assert.deepEqual(flow.beginRequest('s',{messages:[{role:'tool',content:calls[0]}]}),[]);
 const attempt=flow.beginRequest('s',{input:[{role:'user',content:[{type:'input_text',text:calls[0]}]}]});flow.requestFailed('s',attempt);
 assert.equal(flow.snapshot('s').inputs[0].state,'failed');
 flow.beginRequest('s',{messages:[{role:'user',content:calls[0]}]});assert.equal(flow.snapshot('s').inputs[0].state,'sent');
 assert.deepEqual(flow.beginRequest('s',{messages:[{role:'user',content:calls[0]}]}),[]);assert.equal(flow.snapshot('s').inputs[0].id,r.inputId);
});
test('stop removes unsent envelopes and restart keeps them available without automatic replay',async t=>{
 const {manager,adapter,dir}=setup(t);await manager.sendMessage('s','do not lose this');
 await manager.abortSession('s');assert.equal(adapter.sessions.get('s').pendingMessages.length,0);
 assert.equal(flow.snapshot('s').inputs[0].state,'interrupted');
 flow.configureForTest(dir);assert.equal(flow.snapshot('s').inputs[0].state,'interrupted');assert.equal(flow.snapshot('s').inputs[0].text,'do not lose this');
});
test('restart preserves an adapter-only queued input as interrupted, not delivered',async t=>{
 const {manager,dir}=setup(t);await manager.sendMessage('s','pending before restart');
 assert.equal(flow.snapshot('s').inputs[0].state,'submitted');flow.configureForTest(dir);
 assert.equal(flow.snapshot('s').inputs[0].state,'interrupted');
});
test('explicit retry reuses native context instead of appending the same user message twice',async t=>{
 const {manager,adapter,calls}=setup(t);const {inputId}=await manager.sendMessage('s','retry exactly once');
 const attempt=flow.beginRequest('s',{messages:[{role:'user',content:calls[0]}]});flow.requestFailed('s',attempt);
 let retries=0;const native=adapter.sessions.get('s');native.contextManager={getMessages:()=>[{role:'user',content:calls[0]}]};native.agentLoop={getState:()=> 'error',retryLastTurn:async()=>{retries++;}};adapter.emit=()=>{};
 const handlers=new Map();flow.register({handle:(name,fn)=>handlers.set(name,fn)});
 assert.equal((await handlers.get('dev:input-flow:retry')({},'s',inputId)).success,true);
 assert.equal(retries,1);assert.equal(calls.length,1);
});
test('plan acknowledgement does not allow child completion to mark revised tasks finished',async t=>{
 const {manager,calls,session}=setup(t);await manager.sendMessage('s','new requirements');flow.beginRequest('s',{messages:[{role:'user',content:calls[0]}]});flow.review('s',1);
 manager.maybeCompleteSessionTodosOnAgentCompletion('s');assert.equal(session.autoCompleted,undefined);
});
test('SDK adapters expose only unconfirmed submission, while ordinary idle messages stay unchanged',async t=>{
 const {manager,session,calls}=setup(t,{native:false,hasPlan:false});await manager.sendMessage('s','supplement');
 assert.equal(flow.snapshot('s').inputs[0].transport,'sdk');assert.equal(flow.snapshot('s').inputs[0].state,'submitted');
 session.status='waiting_input';await manager.sendMessage('s','ordinary');assert.equal(calls[1],'ordinary');
});

test('finished answer with unfinished plan starts a direct send; preprocessing is not a running queue',async t=>{
 let release;const gate=new Promise(resolve=>release=resolve);
 const {manager,session,calls}=setup(t,{beforeDispatch:()=>gate});session.status='waiting_input';
 const pending=manager.sendMessage('s','下一条问题');
 assert.equal(flow.snapshot('s').inputs[0].state,'dispatching');
 assert.equal(calls.length,0);
 release();const result=await pending;
 assert.equal(result.dispatched,true);assert.equal(result.scheduled,false);
 assert.equal(calls.length,1);assert.equal(flow.strip(calls[0]),'下一条问题');
 flow.beginRequest('s',{messages:[{role:'user',content:calls[0]}]});
 assert.equal(flow.snapshot('s').inputs[0].state,'sent');
});

test('idle direct send becomes queued only when the scheduler actually defers it',async t=>{
 const {manager,session,calls}=setup(t,{beforeDispatch:async()=>({dispatched:false,scheduled:true,reason:'provider_quota_hold'})});session.status='idle';
 await manager.sendMessage('s','额度恢复后发送');
 assert.equal(flow.snapshot('s').inputs[0].state,'queued');assert.equal(calls.length,0);
});

test('restart during direct-send preprocessing keeps the input interrupted and retryable',async t=>{
 let release;const gate=new Promise(resolve=>release=resolve);
 const {manager,session,dir}=setup(t,{beforeDispatch:()=>gate});session.status='waiting_input';
 const pending=manager.sendMessage('s','重启时尚未发出的消息');
 assert.equal(flow.snapshot('s').inputs[0].state,'dispatching');
 flow.configureForTest(dir);assert.equal(flow.snapshot('s').inputs[0].state,'interrupted');
 release();await pending;
});
test('actual native update_plan accepts cancellation, requires matching input revision, and re-emits unchanged reviewed plans',async t=>{
 const {manager,calls}=setup(t);await manager.sendMessage('s','new request');flow.beginRequest('s',{messages:[{role:'user',content:calls[0]}]});
 const source=fs.readFileSync(path.join(root,'src/main/index.js'),'utf8');
 const start=source.indexOf('["registerUpdatePlanTool"](a02,a03){'),end=source.indexOf('["registerAgentLoopTools"]',start);
 const obj=vm.runInNewContext('({'+source.slice(start,end)+'})',{a7z(){},a01(){},require:()=>flow});
 let handler;const emitted=[];obj.emit=(event,id,todos)=>emitted.push(todos);
 const adapterSession={toolExecutor:{registerHandler(name,fn){handler=fn;}}};obj.registerUpdatePlanTool('s',adapterSession);
 const steps=[{step:'old task',status:'cancelled'},{step:'new task',status:'in_progress'}];
 await handler({steps},{});assert.equal(flow.needsReview('s'),true);
 await handler({steps,input_revision:1},{});assert.equal(flow.needsReview('s'),false);assert.equal(emitted.length,2);assert.equal(emitted[1].items[0].status,'cancelled');
});
test('patches remain idempotent on the current source and layout no longer floats into the plan',()=>{
 const main=fs.readFileSync(path.join(root,'src/main/index.js'),'utf8'),renderer=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8'),preload=fs.readFileSync(path.join(root,'src/preload/index.js'),'utf8');
 assert.equal(patchRunningInputMain(main),main);assert.equal(patchRunningInputRenderer(renderer),renderer);assert.equal(patchRunningInputPreload(preload),preload);
 assert.doesNotMatch(renderer,/absolute -top-10 left-0 right-0 flex justify-center/);
});
