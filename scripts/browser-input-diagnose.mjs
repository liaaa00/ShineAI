import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const installed = process.argv.includes('--installed');
const dir = path.join(root, 'artifacts/browser-input-diagnosis', installed ? 'installed' : 'development');
const data = path.join(root, '.test-data', 'browser-input-' + Date.now());
fs.mkdirSync(dir, {recursive:true}); fs.mkdirSync(data, {recursive:true});
const report = {scope:'Complete ShineAI application and its actual built-in WebContentsView tabs. Isolated profile and loopback fixture, no user chats or business page edits.', results:[], errors:[]};
const backups=[];let app,page;
const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(`<!doctype html><title>Browser input ${req.url}</title><body style="margin:0"><button id="button" style="width:200px;height:100px">Click test</button><div style="height:900px;background:#abc">Drag test surface</div><script>window.events=[];['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','click','keydown','keyup'].forEach(t=>document.addEventListener(t,e=>window.events.push({type:t,x:e.clientX,y:e.clientY,buttons:e.buttons,key:e.key}),true));window.clicks=0;document.querySelector('button').onclick=()=>window.clicks++;</script>`);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
async function until(fn,label){const end=Date.now()+15000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout: '+label);}
async function snapshot(){return app.evaluate(({BrowserWindow,webContents},base)=>({windows:BrowserWindow.getAllWindows().map(w=>({id:w.id,visible:w.isVisible(),focused:w.isFocused(),bounds:w.getBounds(),children:w.contentView.children.map(v=>({wc:v.webContents?.id,bounds:v.getBounds()}))})),contents:webContents.getAllWebContents().filter(w=>w.getURL().startsWith(base)).map(w=>({id:w.id,url:w.getURL(),focused:w.isFocused()}))}),base);}
async function input(label,url){
  const result=await app.evaluate(async({webContents},url)=>{
    const all=webContents.getAllWebContents().filter(w=>w.getURL().startsWith(url.slice(0,url.lastIndexOf('/'))));
    for(const w of all)await w.executeJavaScript('window.events=[];window.clicks=0');
    const w=all.find(w=>w.getURL()===url);if(!w)throw Error('Missing browser tab');
    w.debugger.attach('1.3');
    try{
      for(const [type,x,y,buttons]of[['mouseMoved',50,40,0],['mousePressed',50,40,1],['mouseMoved',80,50,1],['mouseReleased',80,50,0]])await w.debugger.sendCommand('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'?'none':'left',buttons,clickCount:type==='mouseMoved'?0:1});
      await new Promise(r=>setTimeout(r,200));
      return await Promise.all(all.map(async wc=>({url:wc.getURL(),...await wc.executeJavaScript('({events:window.events,clicks:window.clicks,focus:document.hasFocus(),visibility:document.visibilityState})')})));
    }finally{w.debugger.detach();}
  },url);
  report.results.push({label,target:url,result,snapshot:await snapshot()});
  console.log(label,JSON.stringify(result.map(r=>({url:r.url,events:r.events.map(e=>e.type),clicks:r.clicks}))));
}
try{
  for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
  ({app,page}=await openTestApp(data,{auth:19871,meeting:18671},installed?'E:/AI/ShineAI/ShineAI.exe':undefined,{SHINEAI_DEV_BUTLER_DIR:path.join(data,'butler'),SHINEAI_BROWSER_CDP:'1',SHINEAI_INTERNAL_CDP_PORT:'28771',SHINEAI_BROWSER_CDP_FACADE_PORT:'19872'}));
  await completeOnboarding(page);
  report.cdp=await page.evaluate(()=>window.shineAI.browser.getCdpSettings());
  const a=await page.evaluate(url=>window.shineAI.browser.createTab(url),base+'/a');
  await until(()=>app.evaluate(({webContents},url)=>webContents.getAllWebContents().some(w=>w.getURL()===url&&!w.isLoading()),base+'/a'),'tab a');
  await input('single-active',base+'/a');
  const b=await page.evaluate(url=>window.shineAI.browser.createTab(url),base+'/b');
  await until(()=>app.evaluate(({webContents},url)=>webContents.getAllWebContents().some(w=>w.getURL()===url&&!w.isLoading()),base+'/b'),'tab b');
  await input('first-background-second-active',base+'/a');
  await page.evaluate(()=>window.shineAI.browser.detachEmbed());
  await page.waitForTimeout(300);
  await input('both-parked-first',base+'/a');
  await input('both-parked-second',base+'/b');
  await page.evaluate(tab=>window.shineAI.browser.activateTab(tab),a.tabId);
  await page.evaluate(async()=>{await window.shineAI.browser.attachEmbed();window.shineAI.browser.setEmbedRect({x:300,y:120,width:700,height:500});});
  await page.waitForTimeout(300);
  await input('first-reattached',base+'/a');
  report.tabs={a,b};
  await page.screenshot({path:path.join(dir,'embedded.png')});
}catch(error){report.errors.push(error.stack);process.exitCode=1;}
finally{if(app)await app.close();server.closeAllConnections();await new Promise(r=>server.close(r));for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({report:path.join(dir,'report.json'),errors:report.errors}));}
