import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const dir=path.join(root,'artifacts/codex-experience');fs.mkdirSync(dir,{recursive:true});
const data=path.join(root,'.test-data','execution-'+Date.now()),workspace=path.join(data,'workspace');fs.mkdirSync(workspace,{recursive:true});
const readme=path.join(workspace,'README.md');fs.writeFileSync(readme,'# Execution evidence\nUser content before the task.\n');
const png=path.join(workspace,'screenshot.png');fs.writeFileSync(png,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=','base64'));
const report={checks:{},errors:[],scope:'Isolated app, actual skill IPC and permissions persistence, actual native OpenAI adapter -> local HTTP fixture. Original message menus use explicit synthetic tool messages; no paid or external model requests.'};
const requests=[];
const server=http.createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{const value=JSON.parse(body||'{}');requests.push({model:value.model,effort:value.reasoning_effort});res.setHeader('content-type','application/json');res.end(JSON.stringify({id:'fixture-completion',object:'chat.completion',model:value.model,choices:[{index:0,message:{role:'assistant',content:'EXECUTION_FIXTURE_OK'},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}}));});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const backups=[];let app,page;
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore','useFileTabStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
async function open(){({app,page}=await openTestApp(data,{auth:19677,meeting:18477}));page.on('pageerror',e=>report.errors.push(e.message));}
try {
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 await open();await completeOnboarding(page);
 await page.evaluate(()=>window.shineAI.settings.update('backgroundAiAnalysisEnabled',false));
 const skill=(await page.evaluate(()=>window.shineAI.skill.getByCommand('webapp-testing'))).data;
 assert.equal((await page.evaluate(id=>window.shineAI.skill.toggle(id,false),skill.id)).success,true);
 assert.equal((await page.evaluate(()=>window.shineAI.skill.execute('/webapp-testing','fixture'))).success,false);
 report.checks.actualDisabledDirectorySkillCannotExpand=true;
 const p=await page.evaluate(config=>window.shineAI.provider.create(config),{id:'execution-local',name:'本地请求验证',adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:'http://127.0.0.1:'+server.address().port+'/v1',apiKey:'local-fixture-only',defaultModel:'fixture-model',reasoningEffort:'high'});
 assert.equal(p.success,true,JSON.stringify(p));const providerId=p.provider?.id||p.data?.id||p.id;
 const created=await page.evaluate(config=>window.shineAI.session.create(config),{name:'执行与交付验证',workingDirectory:workspace,providerId,model:'fixture-model',permissionMode:'manual',autoAccept:true,worktreeEnabled:false});
 assert.equal(created.success,true,JSON.stringify(created));const sessionId=created.sessionId||created.id;
 const sessions=await page.evaluate(()=>window.shineAI.session.getAll());
 assert.equal(sessions.find(s=>s.id===sessionId).config.permissionMode,'manual');assert.equal(sessions.find(s=>s.id===sessionId).config.autoAccept,false);
 for(const mode of ['balanced','full_auto','manual']) {
  const result=await page.evaluate(({sessionId,mode})=>window.shineAI.session.setPermissionMode(sessionId,mode),{sessionId,mode});assert.equal(result.success,true);assert.equal(result.permissionMode,mode);
 }
 report.checks.actualCreateAndPermissionSetterHonorChoice=true;
 const sent=await page.evaluate(id=>window.shineAI.session.sendMessage(id,'Reply with the local fixture marker.'),sessionId);assert.equal(sent.success,true,JSON.stringify(sent));
 await page.waitForFunction(async id=>(await window.shineAI.session.getConversation(id)).some(m=>m.role==='assistant'&&m.content?.includes('EXECUTION_FIXTURE_OK')),sessionId,{timeout:90000});
 await page.waitForFunction(async id=>(await window.development.getRequestSummary(id))?.httpStatus===200,sessionId,{timeout:30000});
 const summary=await page.evaluate(id=>window.development.getRequestSummary(id),sessionId);report.requestSummary=summary;report.requests=requests;
 assert.equal(summary.stage,'outbound',JSON.stringify(summary));assert.equal(summary.parameters.reasoning_effort,'high');assert.equal(summary.httpStatus,200);assert.equal(summary.model,'fixture-model');assert.ok(requests.some(r=>r.effort==='high'));
 report.checks.nativeAdapterRequestSummaryMatchesActualLocalRequest=true;
 // Synthetic record fixtures exercise rendering and opening; they are not model outcomes.
 await page.evaluate(async({aliases,sessionId,workspace,readme,png})=>{
  const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];window.executionTabs=m[aliases.useFileTabStore];
  await s.getState().fetchSessions();s.setState({selectedSessionId:sessionId});m[aliases.useUIStore].getState().setActiveWorkspace('project');m[aliases.useUIStore].setState({newSessionEntryActive:false});await s.getState().openSessionForChat(sessionId);
  const timestamp=new Date().toISOString(),messages=[{id:'fixture-user',sessionId,role:'user',content:'执行记录界面测试（固定样例）',timestamp}];
  let index=0;const operation=(name,input,result,isError=false,pending=false)=>{const id='fixture-tool-'+(++index);messages.push({id:id+'-use',sessionId,role:'tool_use',toolUseId:id,toolName:name,toolInput:input,content:name,timestamp});if(!pending)messages.push({id:id+'-result',sessionId,role:'tool_result',toolUseId:id,toolName:name,toolInput:input,toolResult:result,content:result,isError,timestamp});};
  operation('Read',{file_path:readme},'README contents');operation('view_image',{path:png},'图片查看工具已完成');operation('mcp__claw__browser_screenshot',{},JSON.stringify({structuredContent:{path:png}}));operation('invoke_skill',{command:'webapp-testing'},'Skill instructions loaded');operation('shell',{command:'npm test'},'fixture assertion failed',true);operation('Read',{path:readme},'',false,true);
  messages.push({id:'fixture-change',sessionId,role:'file_change',timestamp,fileChange:{filePath:readme,changeType:'edit',operationDiff:'--- a/README.md\n+++ b/README.md\n@@ -1 +1 @@\n-old\n+new'}});
  messages.push({id:'fixture-answer',sessionId,role:'assistant',content:'记录展示样例：包含失败、未完成、图片和技能。',timestamp});
  messages.forEach((message,index)=>message.timestamp=new Date(Date.now()+index*100).toISOString());
  s.setState({conversations:{[sessionId]:messages},conversationLoading:{},streamingSessions:new Set()});
 },{aliases,sessionId,workspace,readme,png});
 await page.getByRole('button',{name:/^更多（Skill/}).click();
 await page.getByRole('button',{name:'平衡',exact:true}).click();
 await page.waitForFunction(async id=>(await window.shineAI.session.getAll()).find(s=>s.id===id)?.config.permissionMode==='balanced',sessionId);
 await page.getByRole('button',{name:'逐次确认',exact:true}).click();
 await page.waitForFunction(async id=>(await window.shineAI.session.getAll()).find(s=>s.id===id)?.config.permissionMode==='manual',sessionId);
 await page.screenshot({path:path.join(dir,'permission-options.png')});await page.keyboard.press('Escape');
 report.checks.realPermissionMenuUpdatesBackendAndSelection=true;
 assert.equal(await page.getByTestId('execution-evidence').count(),0);
 report.checks.composerDoesNotContainPersistentDebugPanel=true;
 // Review remains in the existing message menu. Synthetic message IDs cannot
 // establish a real database rollback; snapshot restoration is tested separately.
 await page.locator('div.whitespace-pre-wrap').filter({hasText:/^执行记录界面测试（固定样例）$/}).click({button:'right'});
 const review=page.getByText('回滚到此处',{exact:true});await review.waitFor();assert.equal(await review.isEnabled(),true);
 await page.keyboard.press('Escape');report.checks.originalMessageMenuRetainsReviewEntry=true;
 await app.close();app=null;await open();
 assert.equal((await page.evaluate(id=>window.shineAI.skill.get(id),skill.id)).data.isEnabled,false);
 assert.equal((await page.evaluate(()=>window.shineAI.skill.execute('/webapp-testing','fixture'))).success,false);
 const persisted=(await page.evaluate(()=>window.shineAI.session.getAll())).find(s=>s.id===sessionId);assert.equal(persisted.config.permissionMode,'manual');
 await page.evaluate(id=>window.shineAI.skill.toggle(id,true),skill.id);assert.equal((await page.evaluate(()=>window.shineAI.skill.execute('/webapp-testing','fixture'))).success,true);
 const restartedSummary=await page.evaluate(id=>window.development.getRequestSummary(id),sessionId);
 // Restoring an adapter may record fresh configuration, never the old request body/status.
 if(restartedSummary){assert.equal(restartedSummary.stage,'adapter');assert.equal(restartedSummary.parameters,null);assert.equal(restartedSummary.httpStatus,undefined);}
 report.checks.skillAndPermissionPersistAcrossRestartAndRequestMemoryClears=true;
} catch(error) {report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
finally {
 if(app)await app.close();server.closeAllConnections();await new Promise(r=>server.close(r));
 for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(dir,'smoke-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
