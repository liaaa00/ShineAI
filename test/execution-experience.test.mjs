import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import { createRequire, builtinModules } from 'node:module';
import { patchExecutionMain,patchExecutionRenderer } from '../scripts/patch-execution-experience.mjs';
import { operationInfo,activityCounts,turnEvidence } from '../src/renderer/assets/dev-execution-model.mjs';
const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,'..');
const main=fs.readFileSync(path.join(root,'src/main/index.js'),'utf8');
const policy=require('../src/main/extensions/execution-policy.cjs');
const {handleImageView}=require('../src/main/extensions/image-view-events.cjs');
const {protectRollback}=require('../src/main/extensions/rollback-guard.cjs');
const diagnostics=require('../src/main/extensions/request-diagnostics.cjs');
function method(start,end,bindings={}) {
  const i=main.indexOf(start),j=main.indexOf(end,i+start.length);
  assert.ok(i>=0&&j>i,start);
  return vm.runInNewContext('({'+main.slice(i,j)+'})',{require:name=>require(path.join(root,'src/main',name)),a7z:()=>{},a01:()=>{},...bindings});
}
test('explicit permission choices survive conflicting autoAccept flags',()=>{
  for(const mode of ['manual','balanced','full_auto']) assert.deepEqual(policy.permission({permissionMode:mode,autoAccept:mode!=='full_auto'}),{permissionMode:mode,autoAccept:mode==='full_auto'});
  assert.equal(policy.permission({autoAccept:false}).permissionMode,'manual');
  assert.equal(policy.runtimePermission({sessionConfigs:new Map([['s',{permissionMode:'manual'}]])},'s',true,'full_auto'),'manual');
});
test('actual Claude permission handler requests approval in manual mode and changes at runtime',async()=>{
  const handler=method('["createPermissionHandler"](a02,a03=!0x1,','["emitEvent"](a02,a03){',{h:{isToolDisallowed:()=>false},wN:()=>[]});
  const config={permissionMode:'manual'}; const events=[];
  Object.assign(handler,{pendingPermissions:new Map(),sessionManager:{getSession:()=>({config})},resolveRuntimePermissionMode(id,auto,fallback){return policy.runtimePermission(this,id,auto,fallback)},isToolManagedGatewayTool:()=>false,isBalancedSafeTool:name=>name==='Read',emitEvent:(id,event)=>events.push(event)});
  const canUse=handler.createPermissionHandler('s',true,undefined,'full_auto');
  const pending=canUse('Bash',{command:'write fixture'});
  assert.equal(events[0].type,'permission_request');
  handler.pendingPermissions.get('s').resolve({behavior:'deny'});
  assert.equal((await pending).behavior,'deny');
  config.permissionMode='balanced';assert.equal((await canUse('Read',{path:'x'})).behavior,'allow');
  config.permissionMode='full_auto';assert.equal((await canUse('Bash',{command:'write fixture'})).behavior,'allow');
});
test('directory skill disable blocks actual gateway expansion and survives a fresh gateway',async()=>{
  let enabled=false;
  const database={getSkill:()=>({isEnabled:enabled}),getSkillByCommand:()=>({isEnabled:enabled})};
  const gateway=method('async["expandSkill"](a02,a03,a04){','}class q5e',{r9:()=>true,h$:{expand:async()=> 'expanded'}});
  for(let i=0;i<2;i++) {
    Object.assign(gateway,{database,dirSkillCache:new Map([['webapp-testing',{name:'webapp-testing'}]])});
    assert.equal(await gateway.expandSkill('webapp-testing',''),null);
    assert.equal(policy.directorySkill(gateway,'webapp-testing'),undefined);
  }
  enabled=true;assert.equal(await gateway.expandSkill('webapp-testing',''),'expanded');
  assert.equal(policy.skillEnabled({getSkill:()=>undefined,getAllSkills:()=>[{id:'imported-skill',slashCommand:'/webapp-testing',isEnabled:false}],getSkillByCommand:()=>undefined},'webapp-testing'),false);
});
test('native image start/completion, missing-start recovery, failure and replay produce one operation',()=>{
  const messages=[],events=[];const state={adapter:{messages}};
  const adapter={emit:()=>{},emitEvent:(_id,event)=>events.push(event),trackPendingTool:()=>{},clearPendingTool:()=>{}};
  const item={type:'imageView',id:'img1',path:'D:/work/shot.png'};
  handleImageView(adapter,'s',state,'now',item,false);handleImageView(adapter,'s',state,'now',item,false);
  handleImageView(adapter,'s',state,'now',item,true);handleImageView(adapter,'s',state,'now',item,true);
  assert.deepEqual(messages.map(m=>m.role),['tool_use','tool_result']);assert.equal(events.length,2);
  handleImageView(adapter,'s',state,'now',{type:'image_view',id:'img2',error:{}},true);
  assert.equal(messages[3].isError,true);assert.equal(messages[2].toolUseId,'img2');
  assert.equal(handleImageView(adapter,'s',state,'now',{type:'commandExecution'},true),false);
});
const op=(name,input={},result={},id='t')=>({id,toolUse:{toolName:name,toolInput:input,toolUseId:id},...(result?{result:{toolName:name,...result}}:{})});
test('activity counts distinguish viewed images, screenshots, image reads, skill loading and unfinished work',()=>{
  const operations=[op('view_image',{path:'a.png'}),op('mcp__claw__browser_screenshot',{}, {toolResult:JSON.stringify({structuredContent:{path:'D:/shot.png'}})}),op('Read',{path:'b.png'}),op('Read',{path:'x.md'},null),op('invoke_skill',{command:'webapp-testing'}),op('shell',{command:'npm test'}, {isError:true})];
  const counts=activityCounts(operations);
  assert.equal(counts['查看图片'],1);assert.equal(counts['截图'],1);assert.equal(counts['读取图片'],1);assert.equal(counts['读取文件 · 未完成'],1);assert.equal(counts['测试命令 · 失败'],1);
  assert.equal(operationInfo(operations[1]).evidence,'D:/shot.png');
  assert.equal(operationInfo(operations[4]).detail,'webapp-testing');
  assert.equal(operationInfo(op('shell',{command:'echo "all tests passed"'})).kind,'command');
});
test('delivery evidence uses only the current turn and does not invent test success',()=>{
  const messages=[{id:'old',role:'user'},{role:'tool_result',toolName:'shell'},{id:'current',role:'user'},{role:'file_change',fileChange:{filePath:'D:/new.md',operationDiff:'+new'}},{role:'assistant',content:'测试通过'}];
  const evidence=turnEvidence(messages,()=>[]);
  assert.equal(evidence.anchor,'current');assert.equal(evidence.files.length,1);assert.equal(evidence.tests.length,0);
});
function loadRollback() {
  const source=fs.readFileSync(path.join(root,'src/main/chunks/RollbackService-CtlxtM3f.js'),'utf8');
  const exports={};
  vm.runInNewContext(source,{exports,require:name=>builtinModules.includes(name)||name.startsWith('node:')?require(name):{getGitCommand:()=> 'git'},process,console,setTimeout,clearTimeout},{timeout:10000});
  return exports.RollbackService;
}
test('real shadow snapshot restores pre-task uncommitted edits and rejects edits after preview or undo',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shineai-undo-'));
  try {
    const cwd=path.join(directory,'work');fs.mkdirSync(cwd);fs.writeFileSync(path.join(cwd,'existing.txt'),'user uncommitted edit');
    const Rollback=loadRollback(); assert.equal(typeof Rollback,'function');
    const service=new Rollback({database:{getDb:()=>null},shadowRoot:path.join(directory,'shadow'),resolveWorkingDirectory:()=>cwd,gitCommand:()=> 'git'});
    // This test checks restored file contents. Allow cold Git startup under the
    // full parallel suite; the short automatic-send deadline has separate real
    // subprocess cancellation tests in snapshot-budget.test.cjs.
    require('../src/main/extensions/snapshot-budget.cjs').installSnapshotBudget(service,{budgetMs:15000});
    let snapshot;service.recordSnapshot=(_id,_message,hash)=>snapshot=hash;service.resolveSnapshotCommit=()=>snapshot;service.countDiscardedMessages=()=>1;
    let status='waiting_input';protectRollback(service,{getSession:()=>({status})});
    assert.equal((await service.captureSnapshot('s','anchor')).ok,true);
    fs.writeFileSync(path.join(cwd,'existing.txt'),'agent edit');fs.writeFileSync(path.join(cwd,'new.txt'),'agent new');
    const request={sessionId:'s',targetMessageId:'anchor',mode:'files+dialog'};
    const preview=await service.dryRun(request);assert.equal(preview.snapshotAvailable,true);
    fs.writeFileSync(path.join(cwd,'existing.txt'),'later user edit');
    await assert.rejects(service.applyFilesOnly(request),/预览之后/);assert.equal(fs.readFileSync(path.join(cwd,'existing.txt'),'utf8'),'later user edit');
    await service.dryRun(request);const result=await service.applyFilesOnly(request);assert.equal(result.canRedo,true);
    assert.equal(fs.readFileSync(path.join(cwd,'existing.txt'),'utf8'),'user uncommitted edit');assert.equal(fs.existsSync(path.join(cwd,'new.txt')),false);
    fs.writeFileSync(path.join(cwd,'existing.txt'),'user after undo');await assert.rejects(service.redoFilesOnly({sessionId:'s'}),/新修改/);
    status='running';await assert.rejects(service.dryRun(request),/任务正在运行/);
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('request observer records actual local HTTP parameters without keys, endpoint, prompt or tool schemas',async()=>{
  const server=http.createServer((req,res)=>{req.resume();res.setHeader('content-type','application/json');res.end('{}');});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try {
    const host={fetch:globalThis.fetch};diagnostics.installFetchObserver(host);
    const body={model:'fixture-model',reasoning:{effort:'high'},tools:[{name:'secret-tool-name'}],messages:[{content:'private prompt'}],apiKey:'sk-secret'};
    await host.fetch(`http://127.0.0.1:${server.address().port}/v1/responses`,{method:'POST',headers:{'x-session-id':'test-request',Authorization:'Bearer sk-secret'},body:JSON.stringify(body)});
    const summary=diagnostics.get('test-request');assert.equal(summary.stage,'outbound');assert.equal(summary.httpStatus,200);assert.equal(summary.parameters['reasoning.effort'],'high');assert.equal(summary.toolCount,1);
    assert.doesNotMatch(JSON.stringify(summary),/secret|private|127\.0\.0\.1|messages|Authorization/);
    assert.deepEqual(diagnostics.wireSummary({model:'x',reasoning_effort:'high',output_config:{effort:'max'},thinking:{type:'adaptive'}},'test').parameters,{'reasoning_effort':'high','output_config.effort':'max','thinking.type':'adaptive'});
    assert.equal(diagnostics.get('missing'),null);
  } finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('experience patches are repeatable on the current source',()=>{
  assert.equal(patchExecutionMain(main),main);
  const renderer=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
  assert.equal(patchExecutionRenderer(renderer),renderer);
});
