import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const installed=process.argv.includes('--installed'),normal=process.argv.includes('--normal');
const actualWorkspace=process.argv.includes('--actual-workspace');
const dir=path.join(root,'artifacts',actualWorkspace?'snapshot-latency-'+(installed?'installed':'source'):installed?'send-preview-installed-'+(normal?'normal':'drawer'):'send-preview'),data=path.join(root,'.test-data','send-preview-'+Date.now()),workspace=actualWorkspace?'D:/AI/SpeceAppDate/中转站':path.join(data,'workspace');
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(workspace,{recursive:true});
const report={checks:{},errors:[],scope:'Isolated profile, actual composer and native adapter; only the send IPC entry is held/rejected to reproduce slow preprocessing. Model requests use a local deterministic HTTP fixture.'};
const requests=[],requestTimes=[],backups=[];let app,page,id;
const server=http.createServer((req,res)=>{let raw='';req.on('data',b=>raw+=b);req.on('end',()=>{
 const body=JSON.parse(raw);if(!body.stream){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{role:'assistant',content:'发送显示验证'}}]}));return;}
 requests.push(body);requestTimes.push(Date.now());res.setHeader('Content-Type','text/event-stream');
 const content=requests.length===1?Array.from({length:60},(_,i)=>`LOCAL_HISTORY_${i+1}`).join('\n\n'):'LOCAL_REPLY';
 res.write('data: '+JSON.stringify({id:'preview-fixture',choices:[{index:0,delta:{content},finish_reason:null}]})+'\n\n');
 res.write('data: '+JSON.stringify({id:'preview-fixture',choices:[{index:0,delta:{},finish_reason:'stop'}]})+'\n\n');res.end('data: [DONE]\n\n');
});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
async function until(fn,label){const end=Date.now()+45000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+label);}
async function idle(){await until(async()=>(await page.evaluate(()=>window.shineAI.session.getAll())).find(s=>s.id===id)?.status==='waiting_input','session idle');}
async function assertCanonicalOnce(scope,text){const result=await page.evaluate(id=>window.shineAI.session.getConversation(id),id),messages=Array.isArray(result)?result:result.messages||result.data?.messages||result.data;assert.ok(Array.isArray(messages),'Conversation messages unavailable');const hits=messages.filter(m=>m.role==='user'&&m.content===text);assert.equal(hits.length,1);assert.equal(await scope.locator(`[data-message-id="${hits[0].id}"]`).count(),1);}
async function release(){await app.evaluate(()=>{globalThis.__previewRelease?.();});}
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 ({app,page}=await openTestApp(data,{auth:19778,meeting:18578},installed?'E:/AI/ShineAI/ShineAI.exe':undefined));report.executable=installed?'E:/AI/ShineAI/ShineAI.exe':'project Electron';report.view=normal?'normal conversation':'canvas drawer';page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
 await page.evaluate(()=>window.shineAI.settings.update('backgroundAiAnalysisEnabled',false));
 const created=await page.evaluate(async({workspace,url})=>{const p=await window.shineAI.provider.create({id:'preview-fixture',name:'本地固定模型',adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:url,apiKey:'fixture-only',defaultModel:'preview-fixture'});return window.shineAI.session.create({name:'发送显示验证',workingDirectory:workspace,providerId:p.provider?.id||p.data?.id||p.id,model:'preview-fixture',permissionMode:'full_auto',worktreeEnabled:false});},{workspace,url:'http://127.0.0.1:'+server.address().port+'/v1'});
 assert.equal(created.success,true,JSON.stringify(created));id=created.sessionId||created.id;await idle();
 const sendStarted=Date.now();assert.equal((await page.evaluate(id=>window.shineAI.session.sendMessage(id,'本地固定首轮'),id)).success,true);await until(()=>requests.length===1,'seed request');await idle();
 if(actualWorkspace){
  report.realProjectFirstRequestMs=requestTimes[0]-sendStarted;
  report.firstRequestUnderFiveSecondTarget=report.realProjectFirstRequestMs<5000;
  assert.ok(report.firstRequestUnderFiveSecondTarget,'A plain chat must reach the model without the previous automatic snapshot wait');
  const log=fs.readFileSync(path.join(data,installed?'':'dev','logs/main.log'),'utf8');
  assert.equal(log.includes('[SnapshotBudget]'),false,'Plain chat must not start a file snapshot');
  report.checks.plainChatSkipsFileSnapshotEntirely=true;
 }
 const card=page.locator(`[data-node-id="session:${id}"]`),drawer=page.locator('[data-canvas-drawer="session"]');
 if(normal){
  const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8'),aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
  await page.evaluate(async({aliases,id})=>{const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];await s.getState().fetchSessions();s.setState({selectedSessionId:id});m[aliases.useUIStore].getState().setActiveWorkspace('project');m[aliases.useUIStore].setState({newSessionEntryActive:false});await s.getState().openSessionForChat(id);},{aliases,id});
 }else{await card.click();await drawer.waitFor();await drawer.locator('[data-drawer-tab="chat"]').click();}
 const scope=normal?page.locator('#root'):page.locator('[data-drawer-conversation]'),input=scope.locator('textarea').first();await input.waitFor();
 await app.evaluate(({ipcMain})=>{
  const entry=ipcMain._invokeHandlers.get('session:send-message'),original=typeof entry==='function'?entry:entry?.handler;if(typeof original!=='function')throw Error('Test IPC entry unavailable');
  globalThis.__previewMode='hold';ipcMain.removeHandler('session:send-message');
  ipcMain.handle('session:send-message',async(event,...args)=>{
   if(globalThis.__previewMode==='reject')return {success:false,error:'LOCAL_PREPROCESS_FAILURE'};
   await new Promise(resolve=>{globalThis.__previewRelease=resolve;});return original(event,...args);
  });
 });
 const text='发送后立即显示，不能先消失';await input.fill(text);const sentAt=Date.now();await input.press('Enter');
 const preview=scope.getByTestId('send-preview');await preview.waitFor({timeout:2500});assert.match(await preview.innerText(),new RegExp(text));assert.equal(await preview.getAttribute('data-send-state'),'sending');assert.equal(await input.inputValue(),'');assert.equal(requests.length,1);
 report.previewVisibleWithinMs=Date.now()-sentAt;const inView=await preview.evaluate(el=>{const r=el.getBoundingClientRect(),parent=el.closest('[class*="overflow-y-auto"]'),p=parent?.getBoundingClientRect();return !!p&&r.bottom<=p.bottom+1&&r.top>=p.top;});assert.equal(inView,true,'The new message must scroll into the conversation viewport');report.checks.pendingMessageScrollsIntoViewWithLongHistory=true;
 await page.screenshot({path:path.join(dir,'before-backend-accepts.png')});report.checks.messageVisibleWhileBackendIsStillPreparing=true;
 if(!normal){await drawer.locator('header > button').first().click();await drawer.waitFor({state:'detached'});await card.click();await drawer.waitFor();await drawer.locator('[data-drawer-tab="chat"]').click();await preview.waitFor();assert.match(await preview.innerText(),new RegExp(text));report.checks.pendingTextSurvivesClosingAndReopeningDrawer=true;}
 const releaseStarted=Date.now();await release();await until(()=>requests.length===2,'actual send');
 if(actualWorkspace){report.realProjectWarmRequestMs=requestTimes[1]-releaseStarted;assert.ok(report.realProjectWarmRequestMs<5000,'Subsequent chat must not wait for a file snapshot');report.checks.nextChatDoesNotWaitForFileSnapshot=true;}
 await idle();await preview.waitFor({state:'detached'});await assertCanonicalOnce(scope,text);assert.equal(await (normal?input:drawer).isVisible(),true);report.checks.actualEchoReplacesPreviewOnceAndConversationRemainsOpen=true;
 await app.evaluate(()=>{globalThis.__previewMode='reject';});
 const failed='失败时保留消息 [文件: D:/fixture/example.md]';await input.fill(failed);await input.press('Enter');await scope.locator('[data-send-state="failed"]').waitFor();await until(async()=>(await input.inputValue())===failed,'failed text restored to composer');assert.equal(requests.length,2);assert.equal(await (normal?input:drawer).isVisible(),true);report.checks.failedSendRetainsFullTextAndRestoresDraft=true;
 await app.evaluate(()=>{globalThis.__previewMode='hold';});await input.press('Enter');await scope.locator('[data-send-state="sending"]').waitFor();await release();await until(()=>requests.length===3,'explicit retry request');await idle();await preview.waitFor({state:'detached'});await assertCanonicalOnce(scope,failed);report.checks.explicitResendDoesNotDuplicatePreviewOrRequest=true;
 report.requestCount=requests.length;assert.equal(report.errors.length,0,JSON.stringify(report.errors));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
finally{
 if(app){
  await release().catch(()=>{});
  const child=app.process();let timer;
  try{
   const closed=await Promise.race([app.close().then(()=>true),new Promise(r=>{timer=setTimeout(()=>r(false),10000);})]);
   if(!closed){
    // Playwright can miss the close event after Electron has already exited.
    // Only terminate the isolated test child if it actually remains alive.
    if(child.exitCode===null&&child.signalCode===null){child.kill();report.errors.push('Isolated test app did not close in time');process.exitCode=1;}
    else report.cleanupNote='Electron exited; Playwright close acknowledgement timed out';
   }
  }finally{clearTimeout(timer);}
 }server.closeAllConnections();await new Promise(r=>server.close(r));
 for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(dir,'smoke-report.json'),JSON.stringify(report,null,2)+'\n');
 if(report.cleanupNote)process.stdout.write(JSON.stringify(report,null,2)+'\n',()=>process.exit(process.exitCode||0));
 else console.log(JSON.stringify(report,null,2));
}
