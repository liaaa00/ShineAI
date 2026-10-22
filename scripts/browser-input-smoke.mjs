import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const require=createRequire(path.join(root,'package.json'));
const WebSocket=require('ws');
const installed=process.argv.includes('--installed');
const canvasOrigin=new URL(process.env.SHINEAI_CANVAS_TEST_URL || 'http://127.0.0.1:5173').origin;
const dir=path.join(root,'artifacts/browser-input',installed?'installed':'development'),data=path.join(root,'.test-data','browser-input-smoke-'+Date.now());
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(data,{recursive:true});
const report={checks:{},errors:[],scope:'Complete ShineAI application, actual native API tool dispatcher, session-owned built-in browser, CDP facade, permission gate and loopback browser fixture. Isolated data, no real model or user data.'};
const backups=[],calls=[];let app,page,ws;
const html=`<!doctype html><meta charset="utf-8"><title>ShineAI input regression</title><body style="margin:0"><button id="click" style="width:200px;height:100px">Click</button><div id="surface" style="height:900px;background:#abc">Drag</div><script>window.events=[];window.clicks=0;document.querySelector('button').onclick=()=>window.clicks++;['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','click','keydown','keyup'].forEach(t=>document.addEventListener(t,e=>window.events.push({type:t,x:e.clientX,y:e.clientY,key:e.key,shift:e.shiftKey,buttons:e.buttons}),true));</script>`;
function answer(res,delta,finish='stop'){res.setHeader('content-type','text/event-stream');res.write('data: '+JSON.stringify({id:'fixture',object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:null}]})+'\n\n');res.write('data: '+JSON.stringify({id:'fixture',object:'chat.completion.chunk',choices:[{index:0,delta:{},finish_reason:finish}]})+'\n\n');res.end('data: [DONE]\n\n');}
const server=http.createServer((req,res)=>{if(req.method==='GET'){res.setHeader('content-type','text/html');res.end(html);return;}let raw='';req.on('data',b=>raw+=b);req.on('end',()=>{const body=JSON.parse(raw);calls.push(body);const results=(body.messages||[]).filter(m=>m.role==='tool');if(results.length>=2){answer(res,{content:'BROWSER_READY'});return;}const name=results.length?'browser_get_capabilities':'browser_navigate',args=results.length?{}:{url:base+'/fixture'};answer(res,{tool_calls:[{index:0,id:'browser-'+results.length,type:'function',function:{name:'call_mcp_tool',arguments:JSON.stringify({server_id:'shineai-claw',tool_name:name,arguments:args})}}]},'tool_calls');});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
async function until(fn,label,timeout=60000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout '+label);}
function parsedResults(){return calls.flatMap(b=>(b.messages||[]).filter(m=>m.role==='tool').map(m=>{try{return JSON.parse(m.content);}catch{return {};}}));}
let seq=0;const pending=new Map();
async function connect(url){ws=new WebSocket(url);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});ws.on('message',data=>{const m=JSON.parse(String(data));if(pending.has(m.id)){const {resolve,reject,timer}=pending.get(m.id);clearTimeout(timer);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}});}
function send(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result?.value;}
async function mouse(type,x,y,buttons=0,modifiers=0){return send('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'?'none':'left',buttons,modifiers,clickCount:type==='mouseMoved'?0:1});}
async function click(){await mouse('mouseMoved',50,40);await mouse('mousePressed',50,40,1);await mouse('mouseReleased',50,40);}
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 ({app,page}=await openTestApp(data,{auth:19873,meeting:18673},installed?'E:/AI/ShineAI/ShineAI.exe':undefined,{SHINEAI_DEV_BUTLER_DIR:path.join(data,'butler'),SHINEAI_BROWSER_CDP:'1',SHINEAI_INTERNAL_CDP_PORT:'28773',SHINEAI_BROWSER_CDP_FACADE_PORT:'19874'}));await completeOnboarding(page);
 await page.evaluate(url=>window.shineAI.provider.create({id:'browser-fixture',name:'Browser fixture',adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:url,apiKey:'fixture',defaultModel:'fixture'}),base+'/v1');
 const created=await page.evaluate(workspace=>window.shineAI.session.create({name:'Browser regression',workingDirectory:workspace,providerId:'browser-fixture',model:'fixture',permissionMode:'full_auto',worktreeEnabled:false}),data);assert.equal(created.success,true);const id=created.sessionId||created.id;
 await page.evaluate(id=>window.shineAI.session.sendMessage(id,'Run browser fixture tools'),id);
 await until(()=>parsedResults().some(v=>v.endpoint?.port),'browser capability tool response');
 const cap=parsedResults().find(v=>v.endpoint?.port);report.capability=cap;const facade='http://127.0.0.1:'+cap.endpoint.port;
 const targets=await (await fetch(facade+'/json/list')).json(),target=targets.find(t=>t.url===base+'/fixture');assert.ok(target,'session browser target');await connect(target.webSocketDebuggerUrl);
 await click();assert.equal(await evaluate('window.clicks'),1);report.checks.actualSessionFacadeDeliversMouseDownUpAndClick=true;
 await page.evaluate(()=>window.shineAI.browser.detachEmbed());await evaluate('window.events=[]');
 await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Shift',code:'ShiftLeft',windowsVirtualKeyCode:16,modifiers:8});
 await mouse('mousePressed',300,150,1,8);await mouse('mouseMoved',450,250,1,8);await mouse('mouseReleased',450,250,0,8);
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Shift',code:'ShiftLeft',windowsVirtualKeyCode:16,modifiers:0});
 const events=await evaluate('window.events');assert.ok(events.some(e=>e.type==='mousedown'&&e.shift));assert.ok(events.some(e=>e.type==='mousemove'&&e.buttons===1));assert.ok(events.some(e=>e.type==='mouseup'));report.checks.backgroundDragAndModifierEventsReachPage=true;
 const owned=(await page.evaluate(()=>window.shineAI.browser.getState())).tabs.find(t=>t.url===base+'/fixture');await page.evaluate(tab=>window.shineAI.browser.takeoverTab(tab),owned.tabId);
 await assert.rejects(click(),/confirm|确认|用户|tab/i);report.checks.userTakeoverStillRequiresPermission=true;
 const policy=await page.evaluate(()=>window.shineAI.browser.getState());assert.equal(policy.policy?.kind,'lease-pending');
 await page.evaluate(()=>window.shineAI.browser.resolvePolicy('allow'));await click();assert.equal(await evaluate('window.clicks'),2);report.checks.explicitLeaseRestoresAllowedInput=true;
 if(process.argv.includes('--canvas')){
  await send('Page.navigate',{url:canvasOrigin+'/'});
  await until(async()=>await evaluate('location.origin==='+JSON.stringify(canvasOrigin)+' && document.readyState==="complete"'),'canvas loads');
  await until(async()=>await evaluate(`import('/src/stores/canvas/use-canvas-store.ts').then(m=>m.useCanvasStore.getState().hydrated)`),'canvas store hydration');
  const project=await evaluate(`(async()=>{const {useCanvasStore}=await import('/src/stores/canvas/use-canvas-store.ts');const s=useCanvasStore.getState();const id=s.createProject('ShineAI browser input regression');s.updateProject(id,{nodes:[{id:'test-a',type:'text',title:'Test A',position:{x:300,y:200},width:220,height:180,metadata:{content:'A',status:'idle'}},{id:'test-b',type:'text',title:'Test B',position:{x:750,y:250},width:220,height:180,metadata:{content:'B',status:'idle'}}],viewport:{x:0,y:0,k:1}});return id;})()`);
  await until(async()=>await evaluate(`import('/src/lib/localforage-storage.ts').then(async m=>{const raw=await m.localForageStorage.getItem('infinite-canvas:canvas_store:p:'+${JSON.stringify(project)});return raw&&JSON.parse(raw).nodes.length===2})`),'canvas fixture persisted');
  await send('Page.navigate',{url:canvasOrigin+'/canvas/'+project});
  await until(async()=>await evaluate('document.querySelectorAll(".react-flow__node").length===2'),'two actual canvas nodes');
  const dismiss=await evaluate(`(()=>{const b=[...document.querySelectorAll('.sub2-bridge-overlay button')].find(e=>e.textContent.includes('先逛画布'));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  if(dismiss){await mouse('mouseMoved',dismiss.x,dismiss.y);await mouse('mousePressed',dismiss.x,dismiss.y,1);await mouse('mouseReleased',dismiss.x,dismiss.y);await until(async()=>await evaluate('!document.querySelector(".sub2-bridge-overlay")'),'optional canvas login dismissed');}
  const geometry=await evaluate(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};window.__inputEvents=[];['pointerdown','pointermove','pointerup','mousedown','mouseup','keydown','keyup','blur','focus'].forEach(t=>window.addEventListener(t,e=>window.__inputEvents.push({type:t,key:e.key,x:e.clientX,y:e.clientY,shift:e.shiftKey,buttons:e.buttons,target:e.target?.className}),true));return {pane:rect(document.querySelector('.react-flow__pane')),nodes:[...document.querySelectorAll('.react-flow__node')].map(rect),focus:document.hasFocus()}})()`);report.canvas={project,geometry};
  async function dragBox(a,b,additive=true){const modifiers=additive?8:0;if(additive){await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Shift',code:'ShiftLeft',windowsVirtualKeyCode:16,modifiers});await new Promise(r=>setTimeout(r,120));}await mouse('mouseMoved',a.x,a.y,0,modifiers);await mouse('mousePressed',a.x,a.y,1,modifiers);for(let i=1;i<=12;i++)await mouse('mouseMoved',a.x+(b.x-a.x)*i/12,a.y+(b.y-a.y)*i/12,1,modifiers);await mouse('mouseReleased',b.x,b.y,0,modifiers);if(additive)await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Shift',code:'ShiftLeft',windowsVirtualKeyCode:16});await new Promise(r=>setTimeout(r,150));return evaluate('document.querySelectorAll(".react-flow__node.selected").length');}
  const ns=geometry.nodes;const count=await dragBox({x:Math.min(...ns.map(n=>n.x))-25,y:Math.min(...ns.map(n=>n.y))-25},{x:Math.max(...ns.map(n=>n.x+n.width))+25,y:Math.max(...ns.map(n=>n.y+n.height))+25});report.canvas.selected=count;report.canvas.events=await evaluate('window.__inputEvents');
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'canvas-box-selection.png'),Buffer.from(shot.data,'base64'));
  assert.equal(count,2,'actual React Flow shift box selects both');report.checks.actualCanvasShiftBoxSelectsTwoNodes=true;
  await send('Page.reload');await until(async()=>await evaluate('document.querySelectorAll(".react-flow__node").length===2 && !document.querySelector(".sub2-bridge-overlay")'),'fresh canvas selection state');
  const first=await dragBox({x:275,y:175},{x:545,y:405});assert.equal(first,1,'first box selects one node');
  const appended=await dragBox({x:725,y:225},{x:995,y:455});report.canvas.appendSelected=appended;report.checks.actualCanvasShiftAppendSelectsBoth=appended===2;
  if(appended!==2){report.errors.push('External canvas Shift append selected '+appended+' nodes; expected 2. Browser input and initial Shift box tests passed; canvas application behavior remains unresolved.');process.exitCode=1;}
  const appendShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'canvas-shift-append.png'),Buffer.from(appendShot.data,'base64'));
  const repeated=await dragBox({x:1050,y:175},{x:700,y:480});assert.equal(repeated,2,'repeating Shift box retains both selected nodes');report.checks.actualCanvasRepeatedShiftBoxRetainsSelection=true;
  const tools=await evaluate(`(()=>{const e=document.querySelector('[aria-label="画布操作"]');if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);assert.ok(tools,'canvas tools button');await mouse('mouseMoved',tools.x,tools.y);await mouse('mousePressed',tools.x,tools.y,1);await mouse('mouseReleased',tools.x,tools.y);
  const select=await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('切换为框选节点'));if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);assert.ok(select,'select tool action');await mouse('mouseMoved',select.x,select.y);await mouse('mousePressed',select.x,select.y,1);await mouse('mouseReleased',select.x,select.y);
  await until(async()=>await evaluate(`!!document.querySelector('[aria-label="画布操作"] .lucide-mouse-pointer-2') && ![...document.querySelectorAll('[role="dialog"][aria-label="画布操作"]')].some(e=>e.getBoundingClientRect().width>0)`),'select mode and closed tools popup');
  const replaced=await dragBox({x:1050,y:175},{x:700,y:480},false);report.canvas.normalBoxSelected=replaced;report.checks.actualCanvasNormalBoxReplacesSelection=replaced===1;
  if(replaced!==1){report.errors.push('After Shift append, ordinary selection box selected '+replaced+' nodes; expected 1.');process.exitCode=1;}
  const normalShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'canvas-normal-selection.png'),Buffer.from(normalShot.data,'base64'));
  await mouse('mouseMoved',1080,500);await mouse('mousePressed',1080,500,1);await mouse('mouseReleased',1080,500);await evaluate('document.activeElement?.blur()');
  const beforePan=await evaluate('document.querySelector(".react-flow__viewport").style.transform');
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await new Promise(r=>setTimeout(r,120));
  await mouse('mouseMoved',1080,500);await mouse('mousePressed',1080,500,1);for(let i=1;i<=8;i++)await mouse('mouseMoved',1080-i*10,500+i*5,1);await mouse('mouseReleased',1000,540);await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await until(async()=>await evaluate('document.querySelector(".react-flow__viewport").style.transform')!==beforePan,'Space hand pans canvas');report.checks.actualCanvasSpaceHandPans=true;
 }
 report.focusedWindowAfter=await app.evaluate(({BrowserWindow})=>BrowserWindow.getFocusedWindow()?.id??null);
}catch(e){report.errors.push(e.stack);process.exitCode=1;}
finally{ws?.close();if(app){const pid=app.process().pid;await Promise.race([app.close(),new Promise(r=>setTimeout(r,15000))]);try{process.kill(pid,0);execFileSync('taskkill',['/PID',String(pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{}}server.closeAllConnections();await new Promise(r=>server.close(r));for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
