import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const { createRemoteServer } = createRequire(import.meta.url)('../remote/server/app.cjs');
const data = path.join(root, '.test-data', 'remote-e2e-' + Date.now());
fs.mkdirSync(data, {recursive:true});
const report = {date:new Date().toISOString(),checks:{},errors:[],scope:'Real Electron desktop + mobile-sized browser + local relay + actual Claude CLI against a local fixture. No user credentials or paid model requests.'};
const publicUrl = process.env.SHINEAI_REMOTE_E2E_URL;
const owner = publicUrl ? process.env.SHINEAI_REMOTE_E2E_USER : 'remote-owner';
const password = publicUrl ? process.env.SHINEAI_REMOTE_E2E_PASSWORD : 'local-fixture-password-12345';
const reportName = publicUrl ? 'remote-public' : 'remote';
if(publicUrl) { assert.ok(owner && password,'Public relay test requires owner credentials'); report.scope='Real Electron desktop + mobile-sized browser + deployed HTTPS relay + actual Claude CLI against a local model fixture. No paid model requests.';report.target=new URL(publicUrl).origin; }
let app, page, phone, remote, server, sessionId, privateId, initialCommandId, mockRequests = 0, activeLongRequests = 0, completedLongRequests = 0;
const model = http.createServer((request,response)=>{
  let body=''; request.on('data',chunk=>body+=chunk); request.on('end',()=>{
    if(request.url.includes('count_tokens')) {response.setHeader('Content-Type','application/json');return response.end('{"input_tokens":100}');}
    if(!request.url.startsWith('/v1/messages')){response.writeHead(404);return response.end();}
    const input=JSON.parse(body);
    if(input.max_tokens===1){response.writeHead(400,{'Content-Type':'application/json'});return response.end('{"type":"error","error":{"type":"invalid_request_error","message":"Fixture probe disabled"}}');}
    if(!input.stream){response.setHeader('Content-Type','application/json');return response.end(JSON.stringify({id:'aux',type:'message',role:'assistant',model:input.model,content:[{type:'text',text:'Remote fixture'}],stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:1}}));}
    mockRequests++;
    const last=JSON.stringify(input.messages?.filter(m=>m.role==='user').at(-1)||{}), long=last.includes('LONG_REMOTE_TASK');
    response.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});
    const event=payload=>response.write(`event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`);
    event({type:'message_start',message:{id:'remote_'+mockRequests,type:'message',role:'assistant',model:input.model,content:[],stop_reason:null,stop_sequence:null,usage:{input_tokens:10,output_tokens:0}}});
    event({type:'content_block_start',index:0,content_block:{type:'text',text:''}});
    event({type:'content_block_delta',index:0,delta:{type:'text_delta',text:long?'SHINEAI_REMOTE_RUNNING':'SHINEAI_REMOTE_READY · 手机指令已由电脑接收，结果已同步。'}});
    const finish=()=>{event({type:'content_block_stop',index:0});event({type:'message_delta',delta:{stop_reason:'end_turn',stop_sequence:null},usage:{output_tokens:15}});event({type:'message_stop'});response.end();};
    if(long) activeLongRequests++;
    const timer=setTimeout(()=>{if(long)completedLongRequests++;finish();},long?120000:100);
    response.on('close',()=>{clearTimeout(timer);if(long)activeLongRequests--;});
  });
});
const passed = name => {report.checks[name]=true;console.log('PASS '+name);};
async function openPhone(url) {
  const opened=app.waitForEvent('window');
  await app.evaluate(({BrowserWindow},url)=>{const w=new BrowserWindow({width:420,height:900,webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true}});w.loadURL(url);},url);
  phone=await opened;
  phone.on('pageerror',e=>report.errors.push(e.message));
  await phone.waitForLoadState('domcontentloaded');
  phone.on('request',request=>{if(request.method()==='POST' && /\/messages$/.test(request.url())){try{initialCommandId ||= JSON.parse(request.postData()).commandId;}catch{}}});
}
try {
  let url=publicUrl;
  if(!url){
    const reserve=http.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
    url='http://127.0.0.1:'+port;
    remote=await createRemoteServer({directory:path.join(data,'relay'),publicUrl:url,username:owner,password,heartbeatMs:1000});server=remote.server;
    await new Promise(r=>server.listen(port,'127.0.0.1',r));
  }
  await new Promise(r=>model.listen(0,'127.0.0.1',r));
  ({app,page}=await openTestApp(path.join(data,'desktop'),{auth:19561,meeting:18361}));
  app.process().stderr.on('data',chunk=>fs.appendFileSync(path.join(root,'artifacts/remote-runtime.log'),chunk));
  page.on('pageerror',e=>report.errors.push(e.message));
  await completeOnboarding(page);
  assert.equal((await page.evaluate(()=>window.development.remote.get())).enabled,false);passed('remoteDisabledByDefault');
  const workspace=path.join(data,'workspace');fs.mkdirSync(workspace,{recursive:true});
  const project=await page.evaluate(dir=>window.shineAI.workspace.create({name:'手机协同验收',rootPath:dir,repos:[{repoPath:dir,name:'workspace',isPrimary:true}]}),workspace);assert.ok(project.success);
  const configDir=path.join(data,'claude-config'),modelUrl='http://127.0.0.1:'+model.address().port;
  const provider=await page.evaluate(input=>window.shineAI.provider.create(input),{id:'remote-fixture',name:'Remote local fixture',adapterType:'claude-sdk',command:'claude',enabled:true,defaultModel:'claude-opus-5-5',apiBaseUrl:modelUrl,apiKey:'local-fixture-only',executablePath:path.join(root,'scripts/fixtures/claude-capture/cli.js'),envOverrides:{SHINEAI_CLAUDE_CAPTURE_URL:modelUrl,SHINEAI_CLAUDE_CAPTURE_DIR:configDir,CLAUDE_CONFIG_DIR:configDir,CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:'1',DISABLE_TELEMETRY:'1',DISABLE_ERROR_REPORTING:'1',ANTHROPIC_API_KEY:'local-fixture-only',ANTHROPIC_AUTH_TOKEN:'',CLAUDE_CODE_OAUTH_TOKEN:''}});
  assert.ok(provider.success,JSON.stringify(provider));
  // Separate fixture config directories so two fresh CLI initializations do not
  // race over the same .claude-capture settings and startup locks.
  const privateWorkspace=path.join(data,'private-workspace');fs.mkdirSync(privateWorkspace,{recursive:true});
  const create=async (name,workingDirectory=workspace)=>{const result=await page.evaluate(config=>window.shineAI.session.create(config),{name,workingDirectory,workspaceId:project.workspaceId,model:'claude-opus-5-5',providerId:'remote-fixture',worktreeEnabled:false,supervisorMode:false,missionMode:false});assert.ok(result.success,JSON.stringify(result));return result.sessionId||result.session?.id||result.id;};
  sessionId=await create('手机协同 · 开发会话');privateId=await create('不共享的私密会话',privateWorkspace);
  await openPhone(url);
  await phone.locator('#username').fill(owner);await phone.locator('#password').fill(password);await phone.getByRole('button',{name:/进入工作台/}).click();
  await phone.locator('#workspace-view').waitFor({state:'visible'});await phone.getByRole('button',{name:'＋ 连接电脑'}).click();
  await phone.waitForFunction(()=>document.querySelector('#pair-code').textContent.length===10);const code=await phone.locator('#pair-code').textContent();
  await page.getByRole('button',{name:'手机协同',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'手机协同'});
  await dialog.locator('[name=serverUrl]').fill(url);await dialog.locator('[name=name]').fill('我的开发电脑');await dialog.locator('[name=code]').fill(code);await dialog.getByRole('button',{name:'绑定这台电脑'}).click();
  await dialog.getByRole('button',{name:'保存访问设置'}).waitFor();
  assert.equal((await page.evaluate(()=>window.development.remote.get())).enabled,false);passed('mobileLoginAndDesktopPairing');
  await dialog.locator(`[name=sessionId][value="${sessionId}"]`).check();await dialog.locator('[name=enabled]').check();await dialog.getByRole('button',{name:'保存访问设置'}).click();
  await dialog.locator('[data-connection=online]').waitFor({timeout:30000});
  await phone.locator('#session-title').filter({hasText:'手机协同 · 开发会话'}).waitFor({timeout:30000});
  assert.equal(await phone.locator('#session-list').getByText('不共享的私密会话').count(),0);passed('onlySelectedSessionsVisible');
  const privateResult=await phone.evaluate(async({deviceId,privateId})=>{const r=await fetch(`/api/devices/${deviceId}/sessions/${privateId}`);return r.json();},{deviceId:(await page.evaluate(()=>window.development.remote.get())).deviceId,privateId});assert.equal(privateResult.error,'NOT_SHARED');passed('privateSessionReadRejected');
  await phone.locator('#prompt').fill('Reply SHINEAI_REMOTE_READY without using tools.');await phone.getByRole('button',{name:'发送到电脑 ↑'}).click();
  await phone.locator('#messages').getByText(/SHINEAI_REMOTE_READY ·/).waitFor({timeout:90000});
  assert.ok((await page.evaluate(id=>window.shineAI.session.getConversation(id),sessionId)).some(m=>m.role==='assistant'&&JSON.stringify(m.content).includes('SHINEAI_REMOTE_READY')));passed('phoneToDesktopCliAndReplySync');
  await phone.screenshot({path:path.join(root,`artifacts/${reportName}-mobile.png`)});
  assert.equal(await phone.evaluate(()=>Boolean(window.development||window.shineAI||window.require)),false);passed('mobileHasNoDesktopPrivileges');
  await phone.locator('#prompt').fill('LONG_REMOTE_TASK Reply slowly without tools.');await phone.getByRole('button',{name:'发送到电脑 ↑'}).click();
  const longDeadline=Date.now()+30000;
  while(!activeLongRequests){assert.ok(Date.now()<longDeadline,'Long-running CLI request did not start');await new Promise(r=>setTimeout(r,100));}
  assert.equal((await page.evaluate(id=>window.shineAI.session.getAll().then(s=>s.find(s=>s.id===id)?.status),sessionId)),'running');
  await phone.getByRole('button',{name:'停止任务'}).click();
  await page.waitForFunction(async id=>(await window.shineAI.session.getAll()).find(s=>s.id===id)?.status!=='running',sessionId,{timeout:30000});
  assert.equal(completedLongRequests,0,'Stop must interrupt the request before the model finishes');passed('phoneStopsActualRunningSession');
  await phone.locator('#prompt').fill('保留这条未发送的草稿');
  if(!await dialog.isVisible())await page.getByRole('button',{name:'手机协同',exact:true}).click();
  await dialog.getByRole('button',{name:'立即断开'}).click();
  await phone.locator('#prompt').waitFor({state:'visible'});await phone.waitForFunction(()=>document.querySelector('#prompt').disabled);passed('desktopDisconnectDisablesPhone');
  await dialog.locator('[name=enabled]').check();await dialog.getByRole('button',{name:'保存访问设置'}).click();
  await phone.waitForFunction(()=>!document.querySelector('#prompt').disabled,{timeout:30000});
  assert.equal(await phone.locator('#prompt').inputValue(),'保留这条未发送的草稿');passed('reconnectRetainsUnsentDraft');
  const before=mockRequests;
  await app.close();app=null;
  ({app,page}=await openTestApp(path.join(data,'desktop'),{auth:19561,meeting:18361}));
  await page.waitForFunction(async()=> (await window.development.remote.get()).connection==='online',undefined,{timeout:30000});
  const restored=await page.evaluate(()=>window.development.remote.get());assert.ok(restored.sessionIds.includes(sessionId));assert.equal(mockRequests,before);passed('desktopRestartRestoresAccessWithoutReplaying');
  await openPhone(url);await phone.locator('#workspace-view').waitFor({state:'visible',timeout:30000});
  phone.on('dialog',d=>d.accept());await phone.getByRole('button',{name:'解除绑定',exact:true}).click();
  await page.waitForFunction(async()=>!(await window.development.remote.get()).deviceId,undefined,{timeout:30000});passed('phoneRevocationStopsDeviceAndInvalidatesBinding');
  assert.equal(report.errors.length,0,JSON.stringify(report.errors));
} catch(error){
  report.errors.push(error.stack);process.exitCode=1;
  report.diagnostics = {mockRequests,activeLongRequests,completedLongRequests};
  if(page && !page.isClosed()) try { report.diagnostics.desktop = await page.evaluate(async id=>({remote:await window.development.remote.get(),sessions:(await window.shineAI.session.getAll()).map(s=>({id:s.id,status:s.status})),conversation:id?await window.shineAI.session.getConversation(id):[]}),sessionId); } catch {}
  if(phone && !phone.isClosed()) try { report.diagnostics.phone = await phone.evaluate(()=>({hidden:document.hidden,notice:document.querySelector('#notice')?.textContent,messages:document.querySelector('#messages')?.textContent,state:document.querySelector('#device-state')?.textContent})); } catch {}
}
finally{
  if(app)await app.close();if(remote)await remote.close();model.closeAllConnections();await new Promise(r=>model.close(r));
  fs.writeFileSync(path.join(root,`artifacts/${reportName}-e2e-report.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
