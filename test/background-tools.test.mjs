import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { patchBackgroundMain, patchBackgroundRenderer } from '../scripts/patch-background-tools.mjs';
import { findBackgroundJob, backgroundState, backgroundDetails } from '../src/renderer/assets/dev-background-tools.mjs';
import { backgroundVisibleGroups } from '../src/renderer/assets/dev-background-collapse.mjs';
import { buildBackgroundResults } from '../src/renderer/assets/dev-background-results.mjs';
const require = createRequire(import.meta.url);
const { BackgroundToolHistory, displayText, install } = require('../src/main/extensions/background-tool-history.cjs');
const { decision, handleCompletionInput } = require('../src/main/extensions/background-completion-policy.cjs');
const root = path.resolve(import.meta.dirname, '..');
const main = fs.readFileSync(path.join(root, 'src/main/index.js'), 'utf8');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'shine-background-'));
process.env.SHINEAI_USER_DATA_DIR = data;
function nativeRegistry() {
  const source = main.slice(main.indexOf('class Eme extends'), main.indexOf('const Tme='));
  return new (vm.runInNewContext('(' + source + ')', { c: {EventEmitter}, m: {randomUUID}, a7z: () => {}, cO: () => {}, setTimeout, clearTimeout, console }))();
}
function sdkRegistry() {
  const source = main.slice(main.indexOf('class Pme extends'), main.indexOf('const Rme='));
  return new (vm.runInNewContext('(' + source + ')', { c: {EventEmitter}, a7z: () => {}, Mme: {completed: 'exited', failed: 'error', stopped: 'killed', killed: 'killed'} }))();
}
test('background evidence survives a fresh history instance; stale running PIDs are never treated as live', () => {
  const dir = path.join(data, 'persistence'), history = new BackgroundToolHistory(dir);
  history.remember({id:'ok', sessionId:'a', toolUseId:'tool-a', status:'exited', exitCode:0, startedAt:10, endedAt:20, lastOutput:'build ok'});
  history.remember({id:'live', sessionId:'a', toolUseId:'tool-b', status:'running', startedAt:30}); history.flush('a');
  const restored = new BackgroundToolHistory(dir);
  assert.equal(restored.list('a').find(j=>j.id==='ok').lastOutput,'build ok');
  assert.equal(restored.list('a').find(j=>j.id==='live').status,'interrupted');
  assert.deepEqual(restored.list('b'),[]);
  assert.equal(restored.list('a',[{id:'live',sessionId:'a',status:'running',startedAt:30}]).find(j=>j.id==='live').status,'running');
});
test('only exact successful tool associations suppress the standalone notice', () => {
  const job={toolUseId:'t',status:'exited',exitCode:0};
  assert.equal(displayText(job,'notice'),undefined);
  for (const patch of [{toolUseId:undefined},{exitCode:1},{exitCode:null},{status:'killed'},{status:'error'}]) assert.equal(displayText({...job,...patch},'notice'),'notice');
});
test('actual native registry retains terminal time, trailing output, errors and killed results', () => {
  const native=nativeRegistry(),sdk=sdkRegistry();install(native,sdk);
  const start=(toolUseId)=>{const child=new EventEmitter();child.pid=123;return {child,job:native.register({sessionId:'native',toolUseId,command:'same command',cwd:data},child)};};
  const a=start('tool-1'),b=start('tool-2'); let terminal=0;native.on('terminal',()=>terminal++);
  native.appendOutput(a.job.id,'first'); a.child.emit('exit',0);
  const ended=native.get(a.job.id).endedAt; assert.ok(ended>=a.job.startedAt);
  native.appendOutput(a.job.id,' trailing'); assert.equal(native.get(a.job.id).endedAt,ended);
  native.markError(b.job.id,'failure');assert.equal(native.get(b.job.id).status,'error');
  const c=start('tool-3');native.kill(c.job.id);c.child.emit('exit',null);
  assert.equal(native.get(c.job.id).status,'killed');assert.equal(terminal,3);
  const restored=new BackgroundToolHistory(path.join(data,'background-tool-history')).list('native');
  assert.equal(restored.find(j=>j.id===a.job.id).lastOutput,'first trailing');
  assert.equal(restored.find(j=>j.id===a.job.id).toolUseId,'tool-1');
});
test('actual SDK registry preserves known outcomes, never invents exit code, and keeps running controls accurate', () => {
  const native=nativeRegistry(),sdk=sdkRegistry();install(native,sdk);
  const owner={stopTask:async()=>{}};
  const start=(id,tool)=>{sdk.noteBackgroundToolUse(tool,'same command');sdk.handleSystemMessage('sdk',{task_id:id,tool_use_id:tool,subtype:'task_started',task_type:'local_bash'},owner);};
  start('sdk-ok','s1');assert.equal(sdk.hasRunning('sdk'),true);
  sdk.handleSystemMessage('sdk',{task_id:'sdk-ok',subtype:'task_notification',status:'completed',summary:'completed summary'},owner);
  assert.equal(sdk.hasRunning('sdk'),false);
  start('sdk-fail','s2');sdk.handleSystemMessage('sdk',{task_id:'sdk-fail',subtype:'task_updated',patch:{status:'failed',exit_code:7,output:'error output'}},owner);
  start('sdk-unknown','s3');sdk.handleSystemMessage('sdk',{task_id:'sdk-unknown',subtype:'task_notification'},owner);
  const records=new BackgroundToolHistory(path.join(data,'background-tool-history')).list('sdk');
  assert.equal(records.find(j=>j.id==='sdk-ok').exitCode,undefined);
  assert.equal(records.find(j=>j.id==='sdk-ok').toolUseId,'s1');
  assert.equal(records.find(j=>j.id==='sdk-fail').exitCode,7);
  assert.equal(records.find(j=>j.id==='sdk-fail').lastOutput,'error output');
  assert.equal(records.find(j=>j.id==='sdk-unknown').status,'ended');
  start('sdk-detached','s4');sdk.dropOwner(owner);
  assert.equal(sdk.hasRunning('sdk'),false);
});
test('same command repeated across sessions resolves by tool/job ID; duration freezes at completion', () => {
  const jobs=[{id:'a',toolUseId:'a',sessionId:'s',command:'npm run build',status:'exited',exitCode:0,startedAt:1000,endedAt:26240},
    {id:'b',toolUseId:'b',sessionId:'s',command:'npm run build',status:'running'},
    {id:'c',toolUseId:'a',sessionId:'other',command:'npm run build',status:'error'}];
  assert.equal(findBackgroundJob(jobs,'s','b').id,'b');assert.equal(findBackgroundJob(jobs,'other','a').id,'c');
  assert.equal(findBackgroundJob(jobs,'s','missing'),undefined);
  assert.equal(findBackgroundJob(jobs,'s',undefined,'Background job: a\n').id,'a');
  assert.equal(backgroundDetails(jobs[0],true,999999),'用时：25.24 秒\n退出代码：0（正常结束）');
  assert.equal(backgroundState({...jobs[0],exitCode:2}).failed,true);
  assert.equal(backgroundState({status:'ended'}).label,'已结束（结果未知）');
});
test('patches are repeatable and preserve internal model delivery', () => {
  const renderer=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
  assert.equal(patchBackgroundMain(main),main);assert.equal(patchBackgroundRenderer(renderer),renderer);
  assert.ok(main.includes(`a0E["sendMessage"](a0H["sessionId"],a0J,{'source':"system_internal",'forceQueue':!0x0`));
});

test('completed answers are not restarted; outstanding work continues and old turns cannot steer new requests', () => {
  const user={id:'u',role:'user',content:'build'},tool={id:'t',role:'tool_use',toolUseId:'tool'},result={id:'r',role:'tool_result',toolUseId:'tool'},answer={id:'a',role:'assistant',content:'Build delivered'};
  const jobs=[{toolUseId:'tool'}];
  assert.equal(decision('waiting_input',[user,tool,result,answer],jobs),'record_only');
  assert.equal(decision('idle',[user,tool,result,answer],jobs),'record_only');
  assert.equal(decision('running',[user,tool,result],jobs),'continue');
  assert.equal(decision('waiting_input',[user,tool,result],jobs),'continue');
  assert.equal(decision('waiting_input',[user,tool,result,{...answer,isThinking:true}],jobs),'continue');
  assert.equal(decision('waiting_input',[user,tool,result,{...answer,isDelta:true}],jobs),'continue');
  assert.equal(decision('running',[user,tool,result,answer,{...user,id:'new'}],jobs),'record_only');
  assert.equal(decision('interrupted',[user,tool,result],jobs),'record_only');
});

test('real native history gates idle and queued completions, retaining failure alerts without model requests', () => {
  const native=nativeRegistry(),sdk=sdkRegistry();install(native,sdk);
  const messages=[{id:'u',role:'user',content:'build'},{id:'tool',role:'tool_use',toolUseId:'policy-tool'},{id:'r',role:'tool_result',toolUseId:'policy-tool'}];
  let status='running';const notices=[];
  const manager={getSession:()=>({status}),getConversation:()=>messages,appendSyntheticConversationMessage:(_id,m)=>notices.push(m)};
  const start=()=>{const child=new EventEmitter();return {child,job:native.register({sessionId:'policy',toolUseId:'policy-tool',command:'same',cwd:data},child)};};
  const ok=start();ok.child.emit('exit',0);
  const input=job=>`[SYSTEM][BACKGROUND_SHELL_EXITED]\n- jobId: ${job.id}\n- status: exited`;
  const options={source:'system_internal',forceQueue:true,displayText:'notice'};
  assert.equal(handleCompletionInput(manager,'policy',input(ok.job),options),undefined);
  messages.push({id:'formal',role:'assistant',content:'Delivered'});status='waiting_input';
  assert.equal(handleCompletionInput(manager,'policy',input(ok.job),options).reason,'background_result_recorded');
  assert.equal(notices.length,0);
  const fail=start();fail.child.emit('exit',3);
  assert.equal(handleCompletionInput(manager,'policy',input(fail.job),options).dispatched,false);
  handleCompletionInput(manager,'policy',input(fail.job),options);
  assert.equal(notices.length,0,'matched errors appear in the answer supplement, without a standalone duplicate');
  assert.equal(handleCompletionInput(manager,'policy',input(fail.job),{source:'user'}),undefined);
  const batch=`[SYSTEM][BACKGROUND_SHELL_COALESCED]\n1. jobId=${ok.job.id}; status=exited\n2. jobId=${fail.job.id}; status=exited`;
  assert.equal(handleCompletionInput(manager,'policy',batch,options).scheduled,false);assert.equal(notices.length,0);
  const missing='[SYSTEM][BACKGROUND_SHELL_ERROR]\n- jobId: missing';
  handleCompletionInput(manager,'policy',missing,options);handleCompletionInput(manager,'policy',missing,options);
  assert.equal(notices.length,1,'unmatched errors retain one visible fallback');
});

test('answer supplement groups exact failures once, preserves turn ownership, and hides only represented notices', () => {
  const group=message=>({type:'message',message});
  const use=(id)=>({id,role:'tool_use',toolUseId:id,sessionId:'s'});
  const failure={id:'j1',toolUseId:'t1',sessionId:'s',status:'exited',exitCode:1,endedAt:10000,command:'same'};
  const groups=[group({id:'u1',role:'user'}),{type:'tool_group',messages:[use('t1'),use('t2')]},group({id:'a1',role:'assistant',content:'Delivered'}),group({id:'legacy',role:'system',content:'后台任务已结束 (exited) · exit 1',timestamp:new Date(10100).toISOString()}),group({id:'unmatched',role:'system',content:'后台任务已结束 (exited) · exit 1',timestamp:new Date(50000).toISOString()}),group({id:'u2',role:'user'}),group({id:'a2',role:'assistant',content:'New answer'}),group({id:'exact',role:'system',metadata:{backgroundToolNotice:{jobId:'j1'}}})];
  const result=buildBackgroundResults(groups,[failure,failure,{...failure,id:'j2',toolUseId:'t2'},{...failure,id:'success',exitCode:0},{...failure,id:'other',sessionId:'other'},{...failure,id:'running',status:'running'},{...failure,id:'unknown',toolUseId:'unknown'}],'s');
  assert.deepEqual([...result.byAnswer.keys()],['a1']);
  assert.deepEqual(result.byAnswer.get('a1').map(row=>row.job.id),['j1','j2']);
  assert.equal(result.byAnswer.get('a1')[0].turnId,'u1');
  assert.deepEqual([...result.hiddenNotices].sort(),['exact','legacy']);
  assert.equal(buildBackgroundResults(groups.slice(0,2),[failure],'s').byAnswer.size,0);
});

test('collapsed turns retain the formal answer and background failure alert, including older explicit notices', () => {
  const group=message=>({type:'message',message});
  const groups=[group({id:'formal',role:'assistant',content:'Delivery'}),group({id:'alert',role:'system',content:'后台任务已结束 (exited) · exit 3',metadata:{backgroundToolNotice:{relatedAnswerId:'formal'}}}),group({id:'followup',role:'assistant',content:'Extra explanation'})];
  assert.deepEqual([...backgroundVisibleGroups(groups)],['alert','formal']);
  delete groups[1].message.metadata;
  assert.deepEqual([...backgroundVisibleGroups(groups)],['alert','formal']);
  assert.equal(backgroundVisibleGroups([group({id:'regular',role:'system',content:'Other notice'})]).size,0);
});
