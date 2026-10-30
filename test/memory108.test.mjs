import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {patchMemory108Main} from '../scripts/patch-memory108.mjs';
const require=createRequire(import.meta.url);
const {MemoryContextBuilder}=require('../src/main/upstream108/memory.cjs');
const {ensureMemoryBackup}=require('../src/main/extensions/memory108-backup.cjs');
const policy=require('../src/main/extensions/memory-policy.cjs');
const {parse}=require('../.runtime/node_modules/acorn');
const source=fs.readFileSync(new URL('../src/main/index.js',import.meta.url),'utf8');
const ast=parse(source,{ecmaVersion:'latest'});
const service=ast.body.find(n=>n.type==='ClassDeclaration'&&n.id.name==='Dq');
const method=name=>{const n=service.body.body.find(n=>(n.key.name||n.key.value)===name);return source.slice(n.start,n.end);};
const memory=(id,extra={})=>({id,type:'user',name:id,claim:'每次改动必须验证相关行为并报告实际结果',description:'每次改动必须验证相关行为并报告实际结果',status:'active',trustTier:'active',archived:false,decayTier:'warm',decayScore:0.5,tags:[],...extra});
const builder=entries=>new MemoryContextBuilder({query:({type})=>entries.filter(m=>m.type===type&&!m.archived)});

test('official injection caps retain six pinned and twelve normal memories within 3500 characters',()=>{
  const items=[...Array.from({length:9},(_,i)=>memory('pinned-'+i,{tags:['pinned']})),...Array.from({length:17},(_,i)=>memory('normal-'+i))];
  const result=builder(items).buildMemoryContextWithDetails('代码改动','验证实际结果','D:/project');
  assert.equal(result.budgetChars,3500);assert.equal(result.maxItems,18);assert.equal(result.injectedItems.length,18);
  assert.equal(result.injectedMemories.filter(m=>m.tags.includes('pinned')).length,6);
  assert.ok(result.context.length<=3500);assert.ok(result.usedChars<=3500);assert.match(result.context,/outcome\/action\/pending\/persisted/);
  const long=builder(items.map(m=>({...m,claim:'每次改动必须验证相关行为并报告实际结果，'.repeat(8)}))).buildMemoryContextWithDetails('代码改动');
  assert.ok(long.context.length<=3500);assert.ok(long.skippedItems.some(m=>m.code==='budget'));
});

test('pinned memories bypass topic filtering while pending, frozen, stale and other-project memories stay excluded',()=>{
  const claim='处理 https://docs.alpha.invalid 时必须核验原文';
  const entries=[memory('pin',{claim,tags:['pinned']}),memory('off-topic',{claim}),memory('pending',{tags:['pinned','pending-review']}),memory('frozen',{tags:['pinned'],decayTier:'frozen'}),memory('other-project',{tags:['pinned'],projectPath:'D:/other'}),memory('obsolete',{tags:['pinned'],status:'obsolete'}),memory('project',{type:'project',tags:['pinned'],projectPath:'D:/current'})];
  const result=builder(entries).buildMemoryContextWithDetails('unrelated discussion','no target website','D:/current');
  assert.deepEqual(result.injectedMemories.map(m=>m.id),['pin']);
  assert.ok(result.skippedItems.some(m=>m.id==='project'&&m.code==='project_recall'));
});

test('cold explicit rules remain eligible, unconfirmed cold rules do not, and topic matches rank before unrelated memories',()=>{
  const entries=[memory('cold-explicit',{decayTier:'cold',tags:['user-explicit']}),memory('cold-automatic',{decayTier:'cold'}),memory('unrelated',{claim:'每次编写说明必须使用简洁的语言',decayScore:0.9}),memory('topic',{claim:'每次修改画布框选必须验证追加选择与吸附',decayScore:0.2})];
  const result=builder(entries).buildMemoryContextWithDetails('画布框选追加选择吸附');
  assert.ok(result.injectedMemories.some(m=>m.id==='cold-explicit'));assert.ok(!result.injectedMemories.some(m=>m.id==='cold-automatic'));
  assert.ok(result.injectedMemories.findIndex(m=>m.id==='topic')<result.injectedMemories.findIndex(m=>m.id==='unrelated'));
});

test('official prompt includes general classification without losing semantic distinctions and failed-save instructions',()=>{
  const prompt=policy.evaluationPrompt('以后必须核验来源',{metadata:{explicitRemember:true}});
  assert.match(prompt,/general/);assert.match(prompt,/任何会话都该遵守/);assert.match(prompt,/不要调用任何工具/);
  assert.ok(!prompt.includes('无用户审核'));assert.match(prompt,/词本身不是拒绝理由/);
  for(const value of [undefined,'true','false',1,false])assert.equal(policy.parseEvaluation(JSON.stringify({worthRemembering:true,confidence:'high',suggestedType:'feedback',memoryText:'每次操作必须验证结果',general:value})).general,false);
  assert.equal(policy.parseEvaluation('{"worthRemembering":true,"confidence":"high","suggestedType":"user","memoryText":"每次操作必须验证结果","general":true}').general,true);
});

test('real automatic-save method pins only effective nonproject general rules under the existing permission policy',async()=>{
  let mode='balanced',verdict={worthRemembering:true,confidence:'high',suggestedType:'feedback',memoryText:'每次操作必须核验实际结果',general:true};
  const entries=[],events=[];
  const policyNode=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='Cq');
  const context=vm.createContext({a7z:null,a01:null,Tq:()=>mode,require:()=>policy,console,Date,VP:'user-explicit',YP:'pending-review',XP:'auto-captured',_j:(s,n)=>s.slice(0,n),Sj:(s,t)=>t+':'+s,iR:()=>false,Mq:(...args)=>events.push(args)});
  vm.runInContext(source.slice(policyNode.start,policyNode.end)+';this.Harness=class{'+method('runMemoryEvaluation')+'}',context);
  const h=new context.Harness();Object.assign(h,{activeMemoryEvals:0,sanitizeMemoryContent:s=>s,isLowQualityContent:()=>false,isDurableMemoryText:s=>policy.validate(s).ok,getMemoryStore:()=>({evaluateWorthiness:async()=>verdict,upsertMemory:entry=>{entries.push(entry);return {action:'inserted',memory:entry}}}),buildRecentConversationSnippet:()=>[],buildExistingRelatedSummary:()=>[],resolveSubjectKeyWithSemantic:async({seededKey})=>({subjectKey:seededKey}),pumpAutoMemoryEvaluations:()=>{},pumpExplicitMemoryEvaluations:()=>{}});
  await h.runMemoryEvaluation('每次操作必须核验实际结果',{source:'user_input',metadata:{}});
  assert.ok(entries.at(-1).tags.includes('pinned'));assert.equal(entries.at(-1).confirmed,true);assert.equal(events.length,1);
  mode='cautious';await h.runMemoryEvaluation('每次操作必须核验实际结果',{source:'user_input',metadata:{}});
  assert.ok(entries.at(-1).tags.includes('pending-review'));assert.ok(!entries.at(-1).tags.includes('pinned'));assert.equal(events.length,1);
  mode='balanced';verdict={...verdict,suggestedType:'project'};await h.runMemoryEvaluation('每次操作必须核验实际结果',{source:'session_summary',metadata:{projectPath:'D:/project'}});
  assert.ok(!entries.at(-1).tags.includes('pinned'));
  const count=entries.length;verdict=policy.evaluationFailure('evaluation_failed');await h.runMemoryEvaluation('每次操作必须核验实际结果',{source:'user_input',metadata:{}});assert.equal(entries.length,count);
});

test('upgrade backup preserves legacy bytes and IDs once without rewriting the source',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shine-memory108-'));
  try{assert.equal(ensureMemoryBackup(dir),null);const file=path.join(dir,'memory','user','legacy.md');fs.mkdirSync(path.dirname(file),{recursive:true});const bytes=Buffer.from('---\nid: legacy-id\ntags: [user-explicit]\n---\n必须保留已有记忆\r\n');fs.writeFileSync(file,bytes);
    const record=ensureMemoryBackup(dir);assert.deepEqual(fs.readFileSync(file),bytes);assert.deepEqual(fs.readFileSync(path.join(record.backup,'memory/user/legacy.md')),bytes);
    fs.writeFileSync(file,'later change');assert.equal(ensureMemoryBackup(dir).backup,record.backup);assert.deepEqual(fs.readFileSync(path.join(record.backup,'memory/user/legacy.md')),bytes);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('memory core patch is idempotent and reports official limits before the first injection',()=>{
  assert.equal(patchMemory108Main(source),source);
  const Context=vm.runInNewContext('(class{'+method('createEmptyInjectionStatus')+'})',{VR:3500});
  assert.equal(Context.createEmptyInjectionStatus().budgetChars,3500);assert.equal(Context.createEmptyInjectionStatus().maxItems,18);
});
