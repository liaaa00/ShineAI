import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding,waitForStartupHandoff} from './electron-test-helper.mjs';
const installed=process.argv.includes('--installed');
const dir=path.join(root,'artifacts/background-tools'+(installed?'-installed':'')),data=path.join(root,'.test-data','background-tools-'+Date.now()),workspace=path.join(data,'workspace');
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(workspace,{recursive:true});
const report={checks:{},errors:[],scope:'Isolated profile, real native Bash process and renderer, deterministic local HTTP model. No user conversations or paid model calls.'},requests=[],backups=[];
let app,page,id;
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8'),aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
const answer=(res,delta,finish='stop')=>{res.setHeader('Content-Type','text/event-stream');for(const item of [{delta,finish_reason:null},{delta:{},finish_reason:finish}])res.write('data: '+JSON.stringify({id:'background-fixture',choices:[{index:0,...item}]})+'\n\n');res.end('data: [DONE]\n\n');};
let scenario='success';
const command=()=>scenario==='retry' ? 'sleep 1; if [ -f .background-retry ]; then echo BACKGROUND_CARD_OUTPUT; exit 0; fi; touch .background-retry; sleep 5; echo BACKGROUND_CARD_OUTPUT; exit 3' : `sleep 6; echo BACKGROUND_CARD_OUTPUT; exit ${scenario.includes('fail')?3:0}`;
const server=http.createServer((req,res)=>{let raw='';req.on('data',b=>raw+=b);req.on('end',()=>{
 const body=JSON.parse(raw);if(!body.stream){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{role:'assistant',content:'后台命令测试'}}]}));return;}
 requests.push(body);
 if(requests.length===1)answer(res,{tool_calls:Array.from({length:scenario==='two-failures'?2:1},(_,index)=>({index,id:'background-tool-'+(index+1),type:'function',function:{name:'bash',arguments:JSON.stringify({command:command(),run_in_background:true,timeout:500})}}))},'tool_calls');
 else if(requests.length===2 && scenario==='retry')setTimeout(()=>answer(res,{tool_calls:[{index:0,id:'background-tool-2',type:'function',function:{name:'bash',arguments:JSON.stringify({command:command(),run_in_background:true,timeout:500})}}]},'tool_calls'),7000);
 else if(requests.length===3 && scenario==='retry')setTimeout(()=>answer(res,{content:'LOCAL_FORMAL_ANSWER_RETRY'}),2000);
 else if(requests.length===2 && ['queued','early-failure'].includes(scenario))setTimeout(()=>answer(res,{content:'LOCAL_FORMAL_ANSWER_'+scenario.toUpperCase()}),9000);
 else if(requests.length===2 && scenario==='waiting')answer(res,{content:''});
 else answer(res,{content:requests.length===2?'LOCAL_FORMAL_ANSWER_'+scenario.toUpperCase():'LOCAL_CONTINUED_RESULT'});
});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
async function until(fn,label,timeout=60000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+label);}
async function select(){await page.evaluate(async({aliases,id})=>{const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];await s.getState().fetchSessions();s.setState({selectedSessionId:id});m[aliases.useUIStore].getState().setActiveWorkspace('project');m[aliases.useUIStore].setState({newSessionEntryActive:false});await s.getState().openSessionForChat(id);},{aliases,id});}
async function open(){({app,page}=await openTestApp(data,{auth:19779,meeting:18579},installed?'E:/AI/ShineAI/ShineAI.exe':undefined));page.on('pageerror',e=>report.errors.push(e.message));}
async function revealCard(){
 await until(async()=>{
  if(await page.locator('[data-testid=background-tool-status]:visible').count())return true;
  const collapsed=page.locator('button[aria-expanded="false"]:visible').filter({hasText:/已处理|处理中|执行|操作/}).first();
  if(await collapsed.count())await collapsed.click();
  return false;
 },'expand existing turn and command group');
}
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 await open();await completeOnboarding(page);await page.evaluate(()=>window.shineAI.settings.update('backgroundAiAnalysisEnabled',false));
 for (scenario of ['success','queued','waiting','early-failure','retry','two-failures','failure']) {
 requests.length=0;
 const created=await page.evaluate(async({workspace,url,scenario})=>{const p=await window.shineAI.provider.create({id:'background-fixture-'+scenario,name:'本地后台命令验证 '+scenario,adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:url,apiKey:'fixture-only',defaultModel:'background-fixture'});return window.shineAI.session.create({name:'后台命令卡片验证 '+scenario,workingDirectory:workspace,providerId:p.provider?.id||p.data?.id||p.id,model:'background-fixture',permissionMode:'full_auto',worktreeEnabled:false});},{workspace,scenario,url:'http://127.0.0.1:'+server.address().port+'/v1'});
 assert.equal(created.success,true,JSON.stringify(created));id=created.sessionId||created.id;await select();
 assert.equal((await page.evaluate(({id,scenario})=>window.shineAI.session.sendMessage(id,'运行固定的本地后台命令 '+scenario),{id,scenario})).success,true);
 await until(()=>requests.length>=2,'tool launched and model sees its result');
 await until(async()=>(await page.evaluate(id=>window.shineAI.session.listBackgroundShells(id),id)).some(j=>j.status==='exited'),'real command exit');
 await until(async()=>(await page.evaluate(()=>window.shineAI.session.getAll())).find(s=>s.id===id)?.status==='waiting_input','model round settles');
 if(scenario==='waiting'){
  await until(()=>requests.length===3,'outstanding task still continues');
  await page.getByText('LOCAL_CONTINUED_RESULT',{exact:true}).waitFor();
  assert.ok(requests.some(r=>JSON.stringify(r).includes('[BACKGROUND_SHELL_EXITED]')));
 }else{
  const formal=page.getByText('LOCAL_FORMAL_ANSWER_'+scenario.toUpperCase(),{exact:true});
  await formal.waitFor();assert.equal(await formal.isVisible(),true,'formal answer must remain outside folded content');
  await page.waitForTimeout(1200);
  assert.equal(requests.length,scenario==='retry'?3:2,'completion must not cause an extra model request');
  assert.equal(await page.locator(':text-is("LOCAL_CONTINUED_RESULT"):visible').count(),0);
 }
 const lateFailure=['two-failures','failure'].includes(scenario);
 assert.equal(await page.getByText('⚠ 后台执行结果',{exact:true}).count(),0,'large result heading is removed');
 if(lateFailure) {
  const summary=page.locator('[data-testid=background-results]:visible');await summary.waitFor();
  assert.equal(await summary.getByTestId('background-result-row').count(),scenario==='two-failures'?2:1);
  assert.equal(await summary.locator('pre,.font-mono').count(),0,'late hint does not repeat the command or logs');
  assert.equal(await page.locator(':text-is(\"后台任务已结束 (exited) · exit 3\"):visible').count(),0);
  await summary.getByRole('button',{name:'查看详情'}).first().click();
  await page.locator('[data-tool-use-id=\"background-tool-1\"]:visible [data-testid=background-tool-details]').waitFor();
  if(scenario==='two-failures'){
   await summary.getByRole('button',{name:'查看详情'}).nth(1).click();
   await page.locator('[data-tool-use-id=\"background-tool-2\"]:visible [data-testid=background-tool-details]').waitFor();
  }
 }
 else {
  assert.equal(await page.locator('[data-testid=background-results]:visible').count(),0,'already-ended commands do not add answer supplements');
  assert.equal(await page.getByText('后台任务已结束 (exited) · exit 0',{exact:true}).count(),0);
 }
 await page.screenshot({path:path.join(dir,scenario+'-answer-preserved.png')});
 await revealCard();const status=page.locator('[data-testid=background-tool-status]:visible').first();
 assert.equal(await status.innerText(),scenario.includes('fail')||scenario==='retry'?'执行失败':'已完成');
 const jobs=await page.evaluate(id=>window.shineAI.session.listBackgroundShells(id),id),job=jobs.find(j=>j.status==='exited'&&j.toolUseId==='background-tool-1');
 assert.equal(job.exitCode,scenario.includes('fail')||scenario==='retry'?3:0);assert.equal(job.toolUseId,'background-tool-1');assert.match(job.lastOutput,/BACKGROUND_CARD_OUTPUT/);
 if(scenario==='retry')assert.equal(jobs.find(j=>j.toolUseId==='background-tool-2')?.exitCode,0,'retry succeeded while original failure remains in history');
 const card=page.locator('[data-tool-use-id="background-tool-1"]:visible').first();
 const details=card.getByTestId('background-tool-details');
 if(!await details.isVisible())await card.locator('button').first().click();
 await details.waitFor();assert.match(await details.innerText(),/BACKGROUND_CARD_OUTPUT/);
 await page.screenshot({path:path.join(dir,scenario+'-completed-expanded.png')});
 report.checks[scenario]={modelRequests:requests.length,originalAnswerVisible:scenario!=='waiting',detailsVerified:true,compactLateHintVisible:lateFailure};report.job=job;
 }
 const job=report.job;
 await app.close();app=null;await open();await waitForStartupHandoff(page);await select();
 const restored=await page.evaluate(id=>window.shineAI.session.listBackgroundShells(id),id);assert.equal(restored.find(j=>j.id===job.id).lastOutput,job.lastOutput);
 await revealCard();await page.locator('[data-testid=background-tool-status]:visible').first().waitFor();assert.equal(await page.locator('[data-testid=background-tool-status]:visible').first().innerText(),'执行失败');
 const restoredCard=page.locator('[data-tool-use-id="background-tool-1"]:visible').first();
 if(!await restoredCard.getByTestId('background-tool-details').isVisible())await restoredCard.locator('button').first().click();
 await restoredCard.getByTestId('background-tool-details').waitFor();
 assert.match(await page.getByTestId('background-tool-details').first().innerText(),/BACKGROUND_CARD_OUTPUT/);report.checks.cardAndDetailsSurviveAppRestart=true;
 await page.getByText('LOCAL_FORMAL_ANSWER_FAILURE',{exact:true}).waitFor();await page.locator('[data-testid=background-results]:visible').waitFor();
 await page.screenshot({path:path.join(dir,'after-restart.png')});assert.equal(report.errors.length,0,JSON.stringify(report.errors));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
finally{
 if(app){const child=app.process();let timer;const closed=await Promise.race([app.close().then(()=>true),new Promise(r=>{timer=setTimeout(()=>r(false),10000);})]);clearTimeout(timer);if(!closed&&child.exitCode===null&&child.signalCode===null)child.kill();}
 server.closeAllConnections();await new Promise(r=>server.close(r));
 for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(dir,'smoke-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
