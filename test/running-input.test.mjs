import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {patchRunningInputMain,patchRunningInputRenderer,patchRunningInputPreload} from '../scripts/patch-running-input.mjs';
import {pruneWithdrawnNotices,visibleInputFlowItems} from '../src/renderer/assets/dev-running-input.mjs';
const require=createRequire(import.meta.url),flow=require('../src/main/extensions/running-input.cjs');
const root=path.resolve(import.meta.dirname,'..');
function setup(t,{native=true,hasPlan=true,beforeDispatch,database}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shine-input-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));flow.configureForTest(dir);
 const calls=[],session={status:'running',provider:{},latestTodos:{items:hasPlan?[{content:'old',status:'pending'}]:[]},runningInputQueue:[],scheduledMessages:[],pendingMessages:[]};
 const adapter={sessions:new Map([['s',{pendingMessages:[]}]]),...(native?{takeRoundInput(){}}:{}),sendMessage:async(id,text)=>{calls.push(text);adapter.sessions.get(id).pendingMessages.push(text);}};
 const manager={sessions:new Map([['s',session]]),resolveAdapter:()=>adapter,sendMessage:async(id,text)=>{if(beforeDispatch){const result=await beforeDispatch();if(result)return result;}const scheduled=['running','starting'].includes(session.status);await manager.resolveAdapter().sendMessage(id,text);return {dispatched:!scheduled,scheduled,strategy:scheduled?'enqueue_while_running':undefined};},getScheduledMessages:()=>session.scheduledMessages,maybeCompleteSessionTodosOnAgentCompletion:()=>{session.autoCompleted=true;},abortSession:async()=>{},emit(){},clearScheduledMessages(){session.scheduledMessages=[];return 1;},findRealQueuedMessage(_s,id){const message=session.scheduledMessages.find(m=>m.id===id);return message?{message}:undefined;},removeScheduledMessage(id,q){session.scheduledMessages=session.scheduledMessages.filter(m=>m.id!==q);return {removed:true};},updateScheduledMessage(id,q,text){session.scheduledMessages.find(m=>m.id===q).text=text;return {updated:true};}};
 manager.database=database;manager.getConversation=()=>adapter.sessions.get('s').messages||[];
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
test('submitted records leave the queue UI independently of streaming, preserving local queues and recovery',()=>{
 const submitted={id:'a',state:'submitted',canCancel:false,text:'请先确认再执行'};
 const queued={id:'b',state:'submitted',canCancel:true,text:'保留这条待处理消息'};
 const interrupted={id:'c',state:'interrupted',canCancel:false,text:'上次关闭时未确认'};
 const failed={id:'d',state:'failed',text:'发送失败'};
 assert.deepEqual(visibleInputFlowItems([submitted,queued,interrupted,failed]),[queued,interrupted,failed]);
 assert.deepEqual(visibleInputFlowItems([submitted,{...submitted,id:'sent',state:'sent',sentAt:new Date().toISOString()}]),[]);
 assert.deepEqual(visibleInputFlowItems([queued,...Array.from({length:6},(_,i)=>({...submitted,id:'hidden-'+i}))]),[queued]);
 assert.deepEqual(visibleInputFlowItems([{...queued,canCancel:false}]),[]);
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
test('an old SDK handoff cannot swallow a new identical user message as queued',async t=>{
 const {manager,calls}=setup(t,{native:false,hasPlan:false});
 const first=await manager.sendMessage('s','继续');
 assert.equal(flow.snapshot('s').inputs[0].state,'submitted');
 assert.equal(flow.snapshot('s').inputs[0].canCancel,false);
 const next=await manager.sendMessage('s','继续');
 assert.notEqual(next.inputId,first.inputId);assert.equal(calls.length,2);
 assert.equal(flow.snapshot('s').inputs.length,2);
});
test('an in-flight dispatch still deduplicates before adapter acknowledgement',async t=>{
 const {manager,adapter,calls}=setup(t,{native:false});let release;
 adapter.sendMessage=async(id,text)=>{calls.push(text);await new Promise(r=>release=r);};
 const first=manager.sendMessage('s','继续');
 const next=await manager.sendMessage('s','继续');
 assert.equal(calls.length,1);assert.equal(next.inputId,flow.snapshot('s').inputs[0].id);
 release();await first;
 const later=manager.sendMessage('s','继续');assert.equal(calls.length,2);release();await later;
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

test('restart persists interruption once and lets the user restore or dismiss without replay',async t=>{
 const {manager,dir}=setup(t,{native:false});const {inputId}=await manager.sendMessage('s','ambiguous delivery');
 flow.configureForTest(dir);assert.equal(flow.snapshot('s').inputs[0].state,'interrupted');
 const saved=JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.endsWith('.json'))),'utf8'));
 assert.equal(saved.inputs[0].state,'interrupted');
 flow.configureForTest(dir);assert.equal(flow.snapshot('s').inputs[0].state,'interrupted');
 const handlers=new Map();flow.register({handle:(name,fn)=>handlers.set(name,fn)});
 const restored=await handlers.get('dev:input-flow:resolve')({},'s',inputId,'restore');
 assert.equal(restored.success,true);assert.equal(restored.text,'ambiguous delivery');
 assert.equal(flow.snapshot('s').inputs[0].state,'restored');assert.equal(flow.snapshot('s').requiredRevision,1,'hiding a notice must not retract a possibly delivered requirement');
 flow.configureForTest(dir);assert.equal(flow.snapshot('s').inputs[0].state,'restored');
 const second=await manager.sendMessage('s','ambiguous delivery');
 flow.configureForTest(dir);
 assert.equal((await handlers.get('dev:input-flow:resolve')({},'s',second.inputId,'dismiss')).success,true);
 assert.equal(flow.snapshot('s').inputs.find(i=>i.id===second.inputId).state,'dismissed');
 assert.equal((await handlers.get('dev:input-flow:resolve')({},'s',second.inputId,'dismiss')).success,false);
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

test('withdrawal removes only the exact input from every local queue and preserves other work',async t=>{
 const {manager,session,adapter,calls}=setup(t);
 const first=await manager.sendMessage('s','撤回这一条'),second=await manager.sendMessage('s','保留这一条');
 session.pendingMessages=[{text:calls[0],source:'user'}];session.runningInputQueue=[{id:'q',text:calls[0],source:'user'}];
 assert.equal(flow.snapshot('s').inputs[0].canCancel,true);
 assert.deepEqual(flow.cancelInput('s',first.inputId),{success:true,removed:true,text:'撤回这一条',inputId:first.inputId});
 assert.equal(session.pendingMessages.length,0);assert.equal(session.runningInputQueue.length,0);
 assert.deepEqual(adapter.sessions.get('s').pendingMessages,[calls[1]]);assert.equal(session.status,'running');
 assert.equal(flow.snapshot('s').inputs[0].state,'cancelled');assert.equal(flow.snapshot('s').requiredRevision,2);
 assert.equal(flow.snapshot('s').inputs[1].id,second.inputId);
 assert.equal(flow.cancelInput('s',first.inputId).removed,false);
});

test('a stale withdraw button cannot claim success once native input is consumed or sent',async t=>{
 const {manager,adapter,calls}=setup(t);const {inputId}=await manager.sendMessage('s','too late');
 assert.equal(flow.snapshot('s').inputs[0].canCancel,true);
 adapter.sessions.get('s').pendingMessages.shift();
 assert.equal(flow.cancelInput('s',inputId).success,false);
 assert.equal(flow.snapshot('s').inputs[0].state,'submitted');
 flow.beginRequest('s',{messages:[{role:'user',content:calls[0]}]});
 adapter.sessions.get('s').pendingMessages.push(calls[0]);
 assert.equal(flow.cancelInput('s',inputId).reason,'sent');
 assert.equal(adapter.sessions.get('s').pendingMessages.length,1);
});

test('SDK handoff and bulk clear never invent withdrawal, while Codex delayed input can be removed',async t=>{
 const {manager,adapter,calls}=setup(t,{native:false});const {inputId}=await manager.sendMessage('s','sdk input');
 assert.equal(flow.snapshot('s').inputs[0].canCancel,false,'unknown SDK pendingMessages has no proven queue contract');
 assert.equal(flow.cancelInput('s',inputId).success,false);manager.clearScheduledMessages('s');
 assert.equal(flow.snapshot('s').inputs[0].state,'submitted');
 const a=adapter.sessions.get('s');a.pendingMessages=[];a.delayedInputQueue=[calls[0]];
 assert.equal(flow.cancelInput('s',inputId).removed,true);assert.equal(a.delayedInputQueue.length,0);
});

test('real Claude async iterator distinguishes buffered input from immediate SDK handoff',async t=>{
 const source=fs.readFileSync(path.join(root,'src/main/index.js'),'utf8');
 const start=source.indexOf('class TJe{'),end=source.indexOf('class xJe',start);
 const Stream=vm.runInNewContext('('+source.slice(start,end)+')',{a7z(){}});
 const rows=[];const database={getConversationMessages:()=>rows};
 const {manager,adapter,dir}=setup(t,{native:false,database});const a=adapter.sessions.get('s');a.pendingMessages=[];a.messages=[];
 const stream=new Stream();adapter.inputStreams=new Map([['s',stream]]);
 adapter.sendMessage=async(id,text)=>{stream.enqueue({type:'user',message:{role:'user',content:[{type:'text',text}]}});rows.push({role:'user',content:text});a.messages.push(rows.at(-1));};
 const first=await manager.sendMessage('s','buffered');
 assert.equal(flow.snapshot('s').inputs[0].canCancel,true);assert.equal(flow.cancelInput('s',first.inputId).removed,true);
 assert.equal(stream.queue.length,0);assert.equal(manager.getConversation('s').length,0);assert.equal(database.getConversationMessages('s').length,0);
 // Retained disk audit rows must remain excluded after ledger reload as well.
 flow.configureForTest(dir);assert.equal(database.getConversationMessages('s').length,0);
 // Use a fresh isolated setup for the immediate-resolver branch.
 const next=setup(t,{native:false});const stream2=new Stream();next.adapter.inputStreams=new Map([['s',stream2]]);
 const waiting=stream2[Symbol.asyncIterator]().next();
 next.adapter.sendMessage=async(id,text)=>stream2.enqueue({type:'user',message:{role:'user',content:text}});
 const second=await next.manager.sendMessage('s','immediate');await waiting;
 assert.equal(flow.snapshot('s').inputs[0].canCancel,false);assert.equal(flow.cancelInput('s',second.inputId).success,false);
});

test('merged recovery prompts and non-user queued data cannot be deleted as one input',async t=>{
 const {manager,adapter,calls}=setup(t);const {inputId}=await manager.sendMessage('s','one input');
 adapter.sessions.get('s').pendingMessages=['rebuild context\n'+calls[0]];
 assert.equal(flow.cancelInput('s',inputId).success,false);
 adapter.sessions.get('s').pendingMessages=[];
 adapter.inputStreams=new Map([['s',{queue:[{type:'user',message:{role:'user',content:[{type:'text',text:calls[0]},{type:'image',source:{}}]}}]}]]);
 assert.equal(flow.cancelInput('s',inputId).success,false);assert.equal(adapter.inputStreams.get('s').queue.length,1);
});

test('cancel IPC validates the target and never cancels a different chat',async t=>{
 const {manager}=setup(t);const {inputId}=await manager.sendMessage('s','keep target scoped');
 const handlers=new Map();flow.register({handle:(name,fn)=>handlers.set(name,fn)});
 assert.equal(handlers.get('dev:input-flow:cancel')({},'other',inputId).removed,false);
 assert.equal(flow.snapshot('s').inputs[0].state,'submitted');
 assert.equal(handlers.get('dev:input-flow:cancel')({},'s',{}).success,false);
 assert.equal(handlers.get('dev:input-flow:cancel')({},'s',inputId).removed,true);
});

test('a late adapter failure cannot revive a withdrawn message as retryable',async t=>{
 const {manager,adapter}=setup(t);let reject;
 adapter.sendMessage=(id,text)=>{adapter.sessions.get(id).pendingMessages.push(text);return new Promise((_resolve,r)=>reject=r);};
 const sending=manager.sendMessage('s','withdraw while adapter waits');
 const item=flow.snapshot('s').inputs[0];assert.equal(flow.cancelInput('s',item.id).removed,true);
 reject(Error('late failure'));await assert.rejects(sending,/late failure/);
 assert.equal(flow.snapshot('s').inputs[0].state,'cancelled');
});

test('withdrawal replay protection survives the recent-input limit and a restart',async t=>{
 const rows=[];const database={getConversationMessages:()=>rows};
 const {manager,calls,dir}=setup(t,{database});
 for(let i=0;i<42;i++){
  const sent=await manager.sendMessage('s','withdraw '+i);if(i===0)rows.push({role:'user',content:calls[0]});
  assert.equal(flow.cancelInput('s',sent.inputId).removed,true);
 }
 assert.equal(flow.snapshot('s').inputs.length,40);assert.equal(database.getConversationMessages('s').length,0);
 flow.configureForTest(dir);assert.equal(database.getConversationMessages('s').length,0);
});

test('Claude buffered thinking suffix remains withdrawable without deleting a rebuild prompt',async t=>{
 const {manager,adapter,calls}=setup(t,{native:false});const {inputId}=await manager.sendMessage('s','with thinking');
 adapter.sessions.get('s').pendingMessages=[];
 adapter.inputStreams=new Map([['s',{queue:[{type:'user',message:{role:'user',content:[{type:'text',text:calls[0]+'\nultrathink'}]}}]}]]);
 assert.equal(flow.cancelInput('s',inputId).removed,true);assert.equal(adapter.inputStreams.get('s').queue.length,0);
});

test('legacy queued notices are removed by exact input id, preserving identical text for another input',()=>{
 const notices=[{inputId:'one',text:'same'},{inputId:'two',text:'same'},{text:'untracked'}];
 assert.equal(pruneWithdrawnNotices(notices,[]),notices);
 assert.deepEqual(pruneWithdrawnNotices(notices,[{id:'one',state:'cancelled'}]),[notices[1],notices[2]]);
});
