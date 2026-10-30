import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const executable=process.argv.includes('--installed')?'E:/AI/ShineAI/ShineAI.exe':undefined;
const data=path.join(root,'.test-data','queue-echo-'+Date.now()),workspace=path.join(data,'workspace');
const dir=path.join(root,'artifacts','queue-echo',...(executable?['installed']:[]));
fs.mkdirSync(workspace,{recursive:true});fs.mkdirSync(dir,{recursive:true});
const report={checks:{},errors:[],scope:'Isolated actual Electron and native adapter, delayed local HTTP fixture, real composer sends. Numeric echo regression injected only into isolated renderer history. No live conversation edits or paid model requests.'},requests=[],backups=[];
let app,page,id,release;
const gate=new Promise(r=>release=r);
const server=http.createServer((req,res)=>{
 let raw='';req.on('data',b=>raw+=b);req.on('end',async()=>{
  const body=JSON.parse(raw);if(!body.stream){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{role:'assistant',content:'队列测试'}}]}));return;}
  requests.push(body);if(requests.length===1)await gate;
  res.setHeader('Content-Type','text/event-stream');
  for(const item of [{delta:{content:'本轮检查已经结束，等待下一条消息。'},finish_reason:null},{delta:{},finish_reason:'stop'}])res.write('data: '+JSON.stringify({id:'queue-fixture',choices:[{index:0,...item}]})+'\n\n');res.end('data: [DONE]\n\n');
 });
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
async function until(fn,label,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+label);}
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 ({app,page}=await openTestApp(data,{auth:19989,meeting:18989},executable,{SHINEAI_TEST_LANGUAGE:'zh-CN'}));
 page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
 const aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(name=>[name,fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8').match(new RegExp(name+' as (\\w+)'))[1]]));
 const created=await page.evaluate(async({workspace,base})=>{
  await window.shineAI.settings.update('backgroundAiAnalysisEnabled',false);
  await window.shineAI.provider.create({id:'queue-echo-fixture',name:'本地队列验证',adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:base,apiKey:'fixture-only',defaultModel:'fixture'});
  return window.shineAI.session.create({name:'消息排队验证',workingDirectory:workspace,providerId:'queue-echo-fixture',model:'fixture',worktreeEnabled:false});
 },{workspace,base:'http://127.0.0.1:'+server.address().port+'/v1'});
 assert.equal(created.success,true);id=created.sessionId||created.id;
 await page.evaluate(async({aliases,id})=>{
  const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];await s.getState().fetchSessions();s.setState({selectedSessionId:id});m[aliases.useUIStore].getState().setActiveWorkspace('project');m[aliases.useUIStore].setState({newSessionEntryActive:false});await s.getState().openSessionForChat(id);
 },{aliases,id});
 const composer=page.locator('textarea').first();
 await composer.fill('先检查当前工程');await composer.press('Enter');
 await until(()=>requests.length===1,'actual request held');
 await composer.fill('继续');await composer.press('Enter');
 await until(async()=>(await page.evaluate(id=>window.development.inputFlow.get(id),id)).inputs.some(i=>i.text==='继续'&&i.canCancel),'physical queue owns message');
 await composer.fill('继续');await composer.press('Enter');
 await page.waitForTimeout(300);
 assert.equal((await page.evaluate(id=>window.development.inputFlow.get(id),id)).inputs.filter(i=>i.text==='继续').length,1);
 const preview=page.getByTestId('send-preview').filter({hasText:'继续'});
 assert.ok(await preview.count()<=1,'same owned input cannot create two previews');
 report.checks.sameOwnedQueuedInputHasOneRecordAndPreview=true;
 await page.screenshot({path:path.join(dir,'queued.png')});
 release();
 await until(()=>requests.length===2,'queued input reaches next real request');
 assert.ok(requests[1].messages.some(m=>m.role==='user'&&String(m.content).includes('继续')));
 await until(async()=>(await page.evaluate(id=>window.development.inputFlow.get(id),id)).inputs.find(i=>i.text==='继续')?.state==='sent','actual transport receipt');
 await until(async()=>await preview.count()===0,'receipt clears queued preview');
 await until(async()=>(await page.evaluate(()=>window.shineAI.session.getAll())).find(s=>s.id===id)?.status==='waiting_input','settled native state');
 assert.equal(await page.getByTestId('input-flow-status').count(),0);
 assert.equal(await page.getByTestId('task-progress').getAttribute('data-animating'),'false');
 report.checks.receiptClearsQueueAndCompletionStopsSpinner=true;
 // Once the earlier input is sent, an identical new message must be a real send.
 await composer.fill('继续');await composer.press('Enter');
 await until(()=>requests.length===3,'new identical input is not swallowed');
 await until(async()=>await page.getByTestId('send-preview').count()===0,'second continue reconciles');
 report.checks.newIdenticalMessageAfterCompletionActuallySends=true;
 // Render a numeric timestamp echo through the real store and chat component.
 await composer.fill('数字时间戳确认样例');await composer.press('Enter');
 await until(()=>requests.length===4,'numeric sample sends');
 await page.evaluate(async({aliases,id})=>{
  const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];s.setState(state=>({conversations:{...state.conversations,[id]:state.conversations[id].map(row=>row.role==='user'&&row.content.includes('数字时间戳确认样例')?{...row,timestamp:Date.now()}:row)}}));
 },{aliases,id});
 await until(async()=>await page.getByTestId('send-preview').count()===0,'numeric echo removes preview');
 report.checks.numericEchoDoesNotRemainQueued=true;
 await page.screenshot({path:path.join(dir,'settled.png')});
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
finally{
 release();if(app){const child=app.process();let timer;const done=await Promise.race([app.close().then(()=>true).catch(()=>false),new Promise(r=>timer=setTimeout(()=>r(false),10000))]);clearTimeout(timer);if(!done&&child.exitCode===null){try{execFileSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{child.kill();}}}
 server.closeAllConnections();await new Promise(r=>server.close(r));
 for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
process.exit(process.exitCode||0);
