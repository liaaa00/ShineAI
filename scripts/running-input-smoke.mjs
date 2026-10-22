import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const dir=path.join(root,'artifacts/running-input');fs.mkdirSync(dir,{recursive:true});
const data=path.join(root,'.test-data','running-input-'+Date.now()),workspace=path.join(data,'workspace');fs.mkdirSync(workspace,{recursive:true});
const report={checks:{},errors:[],scope:'Isolated profile; actual native adapter and renderer against local deterministic HTTP fixture. Proves request delivery, version checks and layout; does not prove a third-party model will follow instructions.'};
const requests=[],gates=new Map(),waiting=new Map();
let app,page,sessionId,holdStop=false;
const disconnected=new Set();
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
const answer=(res,message,finish='stop')=>{res.setHeader('Content-Type','text/event-stream');res.write('data: '+JSON.stringify({id:'local-fixture',object:'chat.completion.chunk',choices:[{index:0,delta:message,finish_reason:null}]})+'\n\n');res.write('data: '+JSON.stringify({id:'local-fixture',object:'chat.completion.chunk',choices:[{index:0,delta:{},finish_reason:finish}],usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}})+'\n\n');res.end('data: [DONE]\n\n');};
const plan=(res,index,steps,revision)=>answer(res,{tool_calls:[{index:0,id:'plan-'+index,type:'function',function:{name:'update_plan',arguments:JSON.stringify({steps,...revision?{input_revision:revision}:{}})}}]},'tool_calls');
const server=http.createServer((req,res)=>{let raw='';req.on('data',b=>raw+=b);req.on('end',async()=>{
 try{
  const body=JSON.parse(raw||'{}'),index=requests.push(body);
  res.on('close',()=>disconnected.add(index));
  if(index===2||index===4||index===5||holdStop){waiting.set(index,true);await new Promise(resolve=>gates.set(index,resolve));if(res.destroyed)return;}
  if(index===1||index===2)plan(res,index,[{step:'旧方案：直接改配置',status:index===2?'completed':'in_progress'},{step:'继续执行旧方案',status:'pending'}]);
  else if(index===3)plan(res,index,[{step:'旧方案：直接改配置',status:'cancelled'},{step:'按最新要求先分析，保留配置',status:'in_progress'}],1);
  else answer(res,{content:'LOCAL_FIXTURE_DONE'});
 }catch(error){report.errors.push(error.stack);res.statusCode=500;res.end();}
});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
async function until(fn,label,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+label);}
async function state(){return page.evaluate(id=>window.development.inputFlow.get(id),sessionId);}
async function select(){await page.evaluate(async({aliases,sessionId})=>{const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];await s.getState().fetchSessions();s.setState({selectedSessionId:sessionId});m[aliases.useUIStore].getState().setActiveWorkspace('project');m[aliases.useUIStore].setState({newSessionEntryActive:false});await s.getState().openSessionForChat(sessionId);},{aliases,sessionId});}
const backups=[];
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 ({app,page}=await openTestApp(data,{auth:19777,meeting:18577}));page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
 await page.evaluate(()=>window.shineAI.settings.update('backgroundAiAnalysisEnabled',false));
 const created=await page.evaluate(async({workspace,url})=>{
  const p=await window.shineAI.provider.create({id:'input-fixture',name:'本地消息投递验证',adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:url,apiKey:'local-fixture-only',defaultModel:'input-fixture'});
  const providerId=p.provider?.id||p.data?.id||p.id;
  return window.shineAI.session.create({name:'运行中消息验证',workingDirectory:workspace,providerId,model:'input-fixture',permissionMode:'full_auto',worktreeEnabled:false});
 },{workspace,url:'http://127.0.0.1:'+server.address().port+'/v1'});
 assert.equal(created.success,true,JSON.stringify(created));sessionId=created.sessionId||created.id;await select();
 const initial=await page.evaluate(id=>window.shineAI.session.sendMessage(id,'先执行旧计划（本地固定样例）'),sessionId);assert.equal(initial.success,true,JSON.stringify(initial));
 await until(()=>waiting.has(2),'second request held');
 const correction='先分析，不要修改，保留现有配置';
 const sent=await page.evaluate(({id,text})=>window.shineAI.session.sendMessage(id,text,{runningStrategy:'enqueue_while_running'}),{id:sessionId,text:correction});assert.equal(sent.success,true,JSON.stringify(sent));
 await until(async()=>['queued','submitted'].includes((await state()).inputs[0]?.state),'pending delivery');
 assert.equal(requests.length,2);await page.getByTestId('session-todo-panel').getByText('计划待核对',{exact:true}).waitFor();
 await page.getByTestId('input-flow-status').getByText(/排队中|等待投递确认/).first().waitFor();
 await page.waitForTimeout(3200);
 assert.equal(await page.getByTestId('input-flow-status').getByText(/排队中|等待投递确认/).first().isVisible(),true);
 assert.match(await page.getByTestId('input-flow-status').innerText(),/先分析，不要修改，保留现有配置/);
 report.checks.queuedMessageKeepsDetailsUntilDelivered=true;
 await page.screenshot({path:path.join(dir,'queued-correction.png')});
 report.checks.queueRemovalDoesNotClaimRequestDelivery=true;
 gates.get(2)();await until(()=>waiting.has(4),'reviewed-plan fourth request held');
 const wire=requests[2];assert.ok(wire.messages.some(m=>m.role==='user'&&typeof m.content==='string'&&m.content.includes(correction)));
 const marker=wire.messages.find(m=>m.role==='user'&&m.content?.includes?.('data-shine-input='));assert.ok(marker);assert.match(marker.content,/input_revision: 1/);
 const delivery=await state();assert.equal(delivery.inputs[0].state,'sent');assert.equal(delivery.reviewedRevision,1);
 await page.getByTestId('input-flow-status').getByText('消息已送出',{exact:true}).waitFor();
 assert.equal((await page.getByTestId('input-flow-status').innerText()).trim(),'消息已送出');
 await page.getByTestId('input-flow-status').waitFor({state:'detached',timeout:10000});
 assert.equal((await state()).inputs[0].state,'sent');
 assert.equal((await state()).inputs[0].text,correction);
 await app.evaluate(({webContents},value)=>{webContents.getAllWebContents().find(w=>w.getURL().includes('/renderer/index.html')).send('dev:input-flow:changed',value);},await state());
 await page.waitForTimeout(150);assert.equal(await page.getByTestId('input-flow-status').count(),0);
 report.checks.repeatedSnapshotDoesNotReplayExpiredSuccess=true;
 report.checks.successNoticeHidesAfterThreeSecondsWithoutClearingDeliveryRecord=true;
 await until(async()=>!await page.getByTestId('session-todo-panel').getByText('计划待核对',{exact:true}).count(),'plan reviewed');
 const board=page.getByTestId('session-todo-panel');await board.locator('button').first().click();await board.getByText('已取消（不计入完成）',{exact:true}).waitFor();
 assert.match(await board.innerText(),/旧方案：直接改配置/);
 report.checks.actualNextRequestContainsCorrectionAndReviewInstruction=true;report.checks.explicitRevisionUpdatesPlanAndCancellationIsSeparate=true;
 const row=page.getByTestId('stop-generating-row');await row.waitFor();
 const measure=async label=>{const b=await board.boundingBox(),r=await row.boundingBox(),button=row.locator('button'),buttonBox=await button.boundingBox();assert.ok(b&&r&&buttonBox);assert.ok(r.y+r.height<=b.y+1,'stop button row must be above the plan');assert.ok(Math.abs(buttonBox.x+buttonBox.width/2-(b.x+b.width/2))<2,'stop button must be centered in the chat pane');assert.ok(await button.isEnabled());const hit=await button.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});assert.ok(hit,'stop button is covered');assert.equal(await page.getByTestId('execution-evidence').count(),0,'debug panel must not occupy the composer');report.checks[label]=true;};
 await measure('expandedBoardDoesNotOverlapStop');await page.screenshot({path:path.join(dir,'reviewed-plan-expanded.png')});
 await board.locator('button').first().click();await measure('collapsedBoardDoesNotOverlapStop');
 await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));w.setSize(920,760);});
 await page.waitForTimeout(300);await measure('smallWindowDoesNotOverlapStop');await page.screenshot({path:path.join(dir,'small-window.png')});
 // Two messages arrive while a final text response is in flight. The existing
 // native end-of-turn flush must deliver both in order, exactly once each.
 for(const text of ['补充一：保留文件','补充二：不要部署'])await page.evaluate(({id,text})=>window.shineAI.session.sendMessage(id,text,{runningStrategy:'enqueue_while_running'}),{id:sessionId,text});
 await until(async()=>(await state()).inputs.length===3,'two new inputs queued');gates.get(4)();await until(()=>waiting.has(5),'next turn request held');
 const firstFive=requests[4];assert.ok(JSON.stringify(firstFive).includes('补充一：保留文件'));
 gates.get(5)();await until(async()=>(await state()).inputs.every(i=>i.state==='sent'),'all inputs sent after text-only finish');
 assert.ok(requests.some(r=>JSON.stringify(r).includes('补充二：不要部署')));
 report.checks.textOnlyFinishDrainsQueuedInputsInOrder=true;
 await until(async()=>(await page.evaluate(()=>window.shineAI.session.getAll())).find(s=>s.id===sessionId)?.status==='waiting_input','fixture finished');
 // An unfinished board must not turn an idle follow-up into a running input.
 async function idleFollowup(text,label){
  const beforeCount=requests.length,beforeInputs=(await state()).inputs.length,observed=[];
  await page.evaluate(()=>{window.__idleInputStates=[];window.__idleInputOff=window.development.inputFlow.onChanged(s=>window.__idleInputStates.push(...s.inputs.filter(i=>i.text===window.__idleInputText).map(i=>i.state)));});
  await page.evaluate(text=>{window.__idleInputText=text;},text);
  const result=await page.evaluate(({id,text})=>window.shineAI.session.sendMessage(id,text),{id:sessionId,text});
  assert.equal(result.success,true,JSON.stringify(result));assert.equal(result.dispatch?.dispatched,true,JSON.stringify(result));assert.equal(result.dispatch?.scheduled,false,JSON.stringify(result));
  await until(()=>requests.slice(beforeCount).some(r=>JSON.stringify(r).includes(text)),'idle follow-up reaches actual transport');
  await until(async()=>(await page.evaluate(()=>window.shineAI.session.getAll())).find(s=>s.id===sessionId)?.status==='waiting_input','idle follow-up completed');
  observed.push(...await page.evaluate(()=>{window.__idleInputOff();return window.__idleInputStates;}));
  const afterInputs=(await state()).inputs;
  if(afterInputs.length>beforeInputs){assert.ok(observed.includes('dispatching'),JSON.stringify(observed));assert.equal(afterInputs.at(-1).state,'sent');}
  else assert.equal(observed.length,0,'ordinary idle send does not need a running-input record');
  assert.ok(!observed.includes('queued'),JSON.stringify(observed));assert.equal(requests.slice(beforeCount).length,1);
  report.checks[label]=true;
 }
 await idleFollowup('上一条已结束后的普通新问题','finishedAnswerWithUnfinishedPlanSendsDirectly');
 // A held real request verifies that the relocated button still aborts it.
 holdStop=true;const stopIndex=requests.length+1;
 assert.equal((await page.evaluate(id=>window.shineAI.session.sendMessage(id,'验证停止按钮（本地固定样例）'),sessionId)).success,true);
 await until(()=>waiting.has(stopIndex),'request held for stop');await row.waitFor();
 await page.evaluate(async({aliases,sessionId})=>{const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];s.setState({sessionTodos:{...s.getState().sessionTodos,[sessionId]:null}});},{aliases,sessionId});
 await board.waitFor({state:'detached'});assert.equal(await row.locator('button').isEnabled(),true);
 await row.locator('button').click();await row.waitFor({state:'hidden'});
 await until(()=>disconnected.has(stopIndex),'stop aborts actual HTTP request');
 report.checks.stopRemainsAvailableWithoutBoardAndAbortsRequest=true;
 assert.equal(await page.getByTestId('execution-evidence').count(),0);
 report.checks.composerDoesNotShowTurnDebugPanel=true;
 const before=await state();await app.close();app=null;
 ({app,page}=await openTestApp(data,{auth:19777,meeting:18577}));page.on('pageerror',e=>report.errors.push(e.message));
 await until(async()=>(await page.evaluate(()=>window.shineAI.session.getAll())).some(s=>s.id===sessionId),'restored session');await select();
 const after=await state();assert.deepEqual(after.inputs.map(i=>[i.id,i.state]),before.inputs.map(i=>[i.id,i.state]));assert.equal(after.reviewedRevision,before.reviewedRevision);
 report.checks.deliveryAndReviewStatePersistAcrossRestart=true;
 const failure=page.getByTestId('input-flow-status').getByText('发送失败',{exact:true});await failure.waitFor();
 await page.waitForTimeout(3200);assert.equal(await failure.isVisible(),true);
 assert.equal(await page.getByTestId('input-flow-status').getByRole('button',{name:'重试',exact:true}).isEnabled(),true);
 report.checks.failedMessageAndRetryRemainVisible=true;
 holdStop=false;
 await until(async()=>(await page.evaluate(()=>window.shineAI.session.getAll())).find(s=>s.id===sessionId)?.status==='waiting_input','chat restoration completed before idle follow-up');
 await idleFollowup('重新打开已结束会话后的新问题','finishedChatFollowupAfterRestartReachesTransport');
 report.requestCount=requests.length;report.inputStates=after.inputs.map(({revision,state,transport})=>({revision,state,transport}));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
finally{
 for(const resolve of gates.values())resolve();if(app)await app.close();server.closeAllConnections();await new Promise(r=>server.close(r));
 for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(dir,'smoke-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
