const {test,after} = require('node:test');
// Synthetic streams have no socket handle; keep the runner alive for the same
// unref'ed AbortSignal deadlines used by actual network streams.
const keepAlive=setInterval(()=>{},1000);
after(()=>clearInterval(keepAlive));
const assert = require('node:assert/strict');
const {downloadBytes} = require('../src/main/extensions/market-download.cjs');
const {installRegistrySkill,marketMcpConfig,installMarketMcp} = require('../src/main/extensions/market-install.cjs');
const {readProbeBody} = require('../src/main/extensions/provider-probe-body.cjs');
const {saveMcp,toggleMcp} = require('../src/main/extensions/mcp-save.cjs');

test('MCP persistence rejects incomplete, missing, duplicate and silently lost writes', () => {
  let saved;
  const database={getMcp:()=>saved,createMcp:s=>{saved={...s};},updateMcp:(_id,s)=>{saved={...s};},toggleMcp:(_id,enabled)=>{saved.isGlobalEnabled=enabled;}};
  assert.throws(()=>saveMcp(database,{id:'test',name:'Test'}),/不完整/);
  assert.throws(()=>saveMcp(database,{name:'Update'},'missing'),/不存在/);
  assert.throws(()=>toggleMcp(database,'missing',true),/不存在/);
  saveMcp(database,{id:'test',name:'Test',command:'node'});
  assert.equal(saved.source,'custom');assert.equal(saved.fallbackMode,'disabled');
  assert.throws(()=>saveMcp(database,{id:'test',name:'Duplicate',command:'node'}),/已存在/);
  saveMcp(database,{envVars:{TEST_VALUE:'saved'}},'test');
  toggleMcp(database,'test',true);assert.equal(saved.isGlobalEnabled,true);
  database.updateMcp=()=>{};
  assert.throws(()=>saveMcp(database,{name:'Lost update'},'test'),/未完整保存/);
  saved=undefined;database.createMcp=()=>{};
  assert.throws(()=>saveMcp(database,{id:'lost',name:'Lost insert',command:'node'}),/未保存成功/);
});

test('downloads retry transient failures, reject 404 immediately, and stop stalled response bodies', async () => {
  let calls=0;
  assert.equal((await downloadBytes(async()=>++calls<3?new Response('',{status:503}):new Response('skill'),'unused',{retryDelayMs:1})).toString(),'skill');
  assert.equal(calls,3); calls=0;
  await assert.rejects(downloadBytes(async()=>{calls++;return new Response('',{status:404});},'unused'),/不存在/);
  assert.equal(calls,1);
  await assert.rejects(downloadBytes(async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([1]));}})),'unused',{timeoutMs:25,retries:0}),/超时/);
});

test('missing, HTML, or empty market skill bodies never write a fake installation', async () => {
  let saved;
  const database={getSkill:()=>saved,createSkill:s=>{saved=s;},updateSkill:(_id,s)=>{saved=s;}};
  for(const body of ['', '<!doctype html><html>Sign in</html>']) {
    await assert.rejects(installRegistrySkill({id:'test',name:'Test',contentUrl:'https://example.invalid/skill'},{database,fetchFile:async()=>new Response(body),parseBody:s=>s}));
    assert.equal(saved,undefined);
  }
  await assert.rejects(installRegistrySkill({id:'test',name:'Test',contentUrl:'https://example.invalid/skill'},{database,fetchFile:async()=>new Response('',{status:404}),parseBody:s=>s}),/不存在/);
  const options={database,fetchFile:()=>{throw Error('unused');},parseBody:s=>s};
  await installRegistrySkill({id:'test',name:'Test',promptTemplate:'Do a thing'},options);
  saved.isEnabled=false;
  await installRegistrySkill({id:'test',name:'Test',promptTemplate:'Updated instructions'},options);
  assert.equal(saved.promptTemplate,'Updated instructions');assert.equal(saved.isEnabled,false);
});

test('MCP market validates runtime configuration and required variables; additions stay disabled until enabled', () => {
  assert.throws(()=>marketMcpConfig({id:'broken',name:'Broken'}),/命令/);
  assert.throws(()=>marketMcpConfig({id:'keyed',name:'Keyed',command:'npx',envVars:[{name:'API_KEY',required:true}]}),/API_KEY/);
  const remote=marketMcpConfig({id:'remote',name:'Remote',transport:'http',url:'https://example.invalid/mcp'});
  assert.equal(remote.transport,'http');assert.equal(remote.isGlobalEnabled,false);
  const old={id:'market-kept',name:'Old',envVars:{API_KEY:'local-secret'},isGlobalEnabled:true};
  const result=installMarketMcp({id:'kept',name:'New',command:'node'},undefined,{getMcp:()=>old,createMcp:()=>assert.fail('Must preserve existing configuration')});
  assert.equal(result.data,old);assert.equal(result.alreadyInstalled,true);assert.equal(result.verified,false);
});

test('all model probes require protocol output rather than HTTP 200, and bound a stalled body', async () => {
  for(const protocol of ['chat','claude','gemini','responses']) {
    for(const body of [{error:{message:'Model unavailable'}},{},'<html>Proxy login</html>']) {
      const response=new Response(typeof body==='string'?body:JSON.stringify(body));
      await assert.rejects(readProbeBody(response,protocol,'test'));
    }
  }
  for(const [protocol,body] of [['chat',{choices:[{message:{content:'Hi'}}]}],['claude',{type:'message',content:[{type:'text',text:'Hi'}]}],['gemini',{candidates:[{content:{parts:[{text:'Hi'}]}}]}],['responses',{output:[{type:'message',content:[{type:'output_text',text:'Hi'}]}]}]]) assert.equal(await readProbeBody(new Response(JSON.stringify(body)),protocol,'test'),'test');
  await assert.rejects(readProbeBody(new Response(new ReadableStream({start(){}})),'chat','test',20),/超时/);
});
