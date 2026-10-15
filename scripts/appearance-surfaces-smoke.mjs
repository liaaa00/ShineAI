import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
import {screenshotDifference} from './appearance-pixel-helper.mjs';
import {componentSurfaces} from './appearance-components-helper.mjs';
import {materialLifecycle} from './appearance-lifecycle-helper.mjs';
import {detachedMaterial} from './appearance-window-helper.mjs';
import {routeDetails,settingsDetails} from './appearance-details-helper.mjs';

const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const artifacts=path.join(root,'artifacts/appearance-surfaces');fs.mkdirSync(artifacts,{recursive:true});
const data=path.join(root,'.test-data','appearance-surfaces-'+Date.now());fs.mkdirSync(data,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore','useShellTerminalStore','useWorkflowStore'].map(name=>[name,source.match(new RegExp(name+' as (\\w+)'))?.[1]]));
assert.ok(Object.values(aliases).every(Boolean),'Recovered UI store exports changed');
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},pixels:{},errors:[],scope:'Populated local conversation fixture, file sidebar, real shell terminal and main routes; generated images; no account or model requests'};
const backups=[];let app,page,config,media,viewport;
async function settings(){await page.locator('button[aria-label="设置"]').click();await page.getByText('全部设置',{exact:true}).click();await page.getByRole('button',{name:'外观',exact:true}).click();await page.locator('.dev-appearance').waitFor();}
async function save(){const result=await page.evaluate(config=>window.development.appearance.save(config),config);assert.equal(result.success,true,result.error);await page.waitForFunction(({id,on})=>document.documentElement.dataset.devBackground===(on?'on':'off')&&(!on||document.querySelector('#dev-background img:not([hidden])')?.src.endsWith(id)),{id:config.media,on:config.enabled});await page.waitForTimeout(450);}
async function capture(name,locator){const file=path.join(artifacts,name+'.png');viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));
  // Capture the Electron compositor directly. CDP page screenshots can stall
  // on animated board layers even after fonts are ready. Keep the same visible
  // rectangle and pixel assertions without scrolling or changing UI styles.
  const box=locator?await locator.boundingBox():null;
  if(locator)assert.ok(box,'Screenshot target must be rendered');
  const clip=box?{x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.min(viewport.width,box.x+box.width)-Math.max(0,box.x),height:Math.min(viewport.height,box.y+box.height)-Math.max(0,box.y)}:undefined;
  const png=await app.evaluate(async({webContents},{url,clip})=>{
    const contents=webContents.getAllWebContents().find(c=>c.getURL()===url);
    if(!contents)throw new Error('Screenshot window is no longer available');
    const rect=clip?{x:Math.floor(clip.x),y:Math.floor(clip.y),width:Math.ceil(clip.width),height:Math.ceil(clip.height)}:undefined;
    const image=await contents.capturePage(rect);
    if(image.isEmpty())throw new Error('Electron returned an empty screenshot');
    return image.toPNG().toString('base64');
  },{url:page.url(),clip});
  fs.writeFileSync(file,Buffer.from(png,'base64'));return file;}
function difference(first,second,rect){
  // Terminal canvases can extend beyond the window. Compare the visible
  // intersection, matching the compositor screenshot rather than offscreen UI.
  const visible=rect?[Math.max(0,rect[0]),Math.max(0,rect[1]),Math.min(viewport.width,rect[2]),Math.min(viewport.height,rect[3])]:null;
  return screenshotDifference(first,second,visible,visible?viewport:null);
}
async function pair(name,rect,minimum=.70,locator,prepare){assert.equal(await page.getByText('应用渲染异常',{exact:true}).count(),0,'Main renderer error boundary must not count as a working route');config.media=media[0];await save();if(prepare)await prepare();const first=await capture(name+'-rose',locator);config.media=media[1];await save();if(prepare)await prepare();const second=await capture(name+'-teal',locator);const pixels=difference(first,second,rect);report.pixels[name]=pixels;assert.ok(pixels.changedFraction>minimum,name+' must actually show wallpaper: '+JSON.stringify(pixels));}
async function stores(action,args={}){return page.evaluate(async({aliases,action,args})=>{const module=await import('./assets/index-0LVJEr5c.js');const sessions=module[aliases.useSessionStore],ui=module[aliases.useUIStore],shell=module[aliases.useShellTerminalStore];if(action==='seed'){
  const id='appearance-content-fixture';sessions.setState({sessions:[{id,name:'整体背景测试',status:'idle',startedAt:Date.now(),estimatedTokens:1234,workingDirectory:args.data,config:{providerId:'codex',model:'local-fixture'},provider:{id:'codex',name:'Codex CLI'}}],selectedSessionId:id});
  ui.getState().setActiveWorkspace('project');ui.setState({newSessionEntryActive:false,projectSidebarTab:'explorer'});await sessions.getState().openSessionForChat(id);
}else if(action==='messages')sessions.setState({conversations:{'appearance-content-fixture':[{id:'appearance-msg',role:'assistant',timestamp:Date.now(),content:'## GLOBAL_CONTENT_TEST\n\n这里是实际会话正文，用来检查整块聊天区域是否透出同一张壁纸。\n\n- 保留文字颜色\n- 连续背景\n\n```js\nconsole.log("readable code");\n```\n\n'+'这是一段较长的示例正文。\n\n'.repeat(14)}]},conversationLoading:{}});
else if(action==='clearFixture')sessions.setState({sessions:[],selectedSessionId:null,conversations:{}});
else if(action==='route')ui.getState().setActiveWorkspace(args.route);
else if(action==='shell')return shell.getState().tabs.map(tab=>({id:tab.id,ptyId:tab.ptyId}));
}, {aliases,action,args});}
try {
  for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(artifacts,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key,file:null});}}
  ({app,page}=await openTestApp(data,{auth:19464,meeting:18234},executable));page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
  config=(await page.evaluate(()=>window.development.appearance.get())).config;config.enabled=true;for(const mode of ['light','dark'])Object.assign(config[mode],{strength:100,mask:20,transparency:70,blur:0});media=[];
  for(const [name,color]of [['rose','#eb426b'],['teal','#168aa8']]){const png=await page.evaluate(color=>{const c=document.createElement('canvas');c.width=640;c.height=360;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,640,360);return c.toDataURL().split(',')[1];},color);const file=path.join(data,name+'.png');fs.writeFileSync(file,Buffer.from(png,'base64'));await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);const imported=await page.evaluate(()=>window.development.appearance.importMedia());assert.equal(imported.success,true);media.push(imported.media.id);}
  const landscape=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const ctx=c.getContext('2d');const g=ctx.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#263c63');g.addColorStop(.5,'#6888a8');g.addColorStop(1,'#d8aea0');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);ctx.fillStyle='#9ac2d4';ctx.beginPath();ctx.arc(950,220,130,0,7);ctx.fill();return c.toDataURL().split(',')[1];});
  const landscapeFile=path.join(data,'landscape.png');fs.writeFileSync(landscapeFile,Buffer.from(landscape,'base64'));await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},landscapeFile);const landscapeMedia=await page.evaluate(()=>window.development.appearance.importMedia());assert.equal(landscapeMedia.success,true);media.push(landscapeMedia.media.id);
  config.media=media[0];await save();
  for(const mode of ['light','dark']){
    await settings();await page.getByText(mode==='light'?'GitHub Light':'GitHub Dark',{exact:true}).click();await page.waitForFunction(mode=>document.documentElement.style.colorScheme===mode,mode);await page.getByText('返回工作区',{exact:true}).click();
    await stores('seed',{data});await page.waitForTimeout(800);await stores('messages');await page.getByText('GLOBAL_CONTENT_TEST',{exact:true}).waitFor();
    const size=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
    await pair('conversation-'+mode,[Math.round(size.width*.35),150,size.width-15,Math.round(size.height*.65)],.55);
    report.conversationChromeLayers=await page.evaluate(()=>[[innerWidth*.7,40],[innerWidth*.93,77],[innerWidth*.7,innerHeight-40]].map(([x,y])=>document.elementsFromPoint(x,y).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'svg',surface:e.dataset.appearanceSurface,bg:getComputedStyle(e).backgroundColor}))));
    fs.writeFileSync(path.join(artifacts,'conversation-chrome-layers.json'),JSON.stringify(report.conversationChromeLayers,null,2));
    const tabs=page.locator('[class="flex h-8 flex-shrink-0 items-center gap-1 bg-bg-primary px-2"]').first();
    assert.equal(await tabs.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','Conversation pane tabs must not have an opaque background');
    await pair('conversation-tabs-'+mode,null,.75,tabs);
    report.checks[mode+'ConversationTabsWallpaper']=true;
    const explorer=await page.locator('[data-explorer-scope]').boundingBox();assert.ok(explorer,'File sidebar must actually be rendered');await pair('files-'+mode,[Math.round(explorer.x+10),Math.round(explorer.y+50),Math.round(explorer.x+explorer.width-10),Math.round(explorer.y+explorer.height-10)]);
    report.checks[mode+'PopulatedConversationAndFileSidebar']=true;
    config.media=media[2];await save();await capture('conversation-files-'+mode+'-landscape');config.media=media[1];await save();
    await page.locator('button[aria-label="终端"]').click();await page.locator('.xterm-screen').first().waitFor();
    const input=page.locator('.xterm-helper-textarea').first();await input.focus();await input.pressSequentially('echo SHINEAI_GLOBAL_TERMINAL');await input.press('Enter');
    await page.waitForFunction(async({aliases})=>{const module=await import('./assets/index-0LVJEr5c.js');for(const tab of module[aliases.useShellTerminalStore].getState().tabs){if(tab.ptyId&&String(await window.shineAI.pty.getOutput(tab.ptyId)).includes('SHINEAI_GLOBAL_TERMINAL'))return true;}return false;},{aliases});
    const terminal=await page.locator('.xterm-screen').first().boundingBox();await pair('terminal-'+mode,[Math.round(terminal.x+5),Math.round(terminal.y+60),Math.round(terminal.x+terminal.width-5),Math.round(terminal.y+terminal.height-10)],.85);
    config.enabled=false;await save();const offFirst=await capture('terminal-'+mode+'-disabled-rose');config.media=media[0];await save();const offSecond=await capture('terminal-'+mode+'-disabled-teal');assert.ok(difference(offFirst,offSecond,[Math.round(terminal.x+5),Math.round(terminal.y+60),Math.round(terminal.x+terminal.width-5),Math.round(terminal.y+terminal.height-10)]).changedFraction<.01,'Disabled terminal must restore its original theme');config.enabled=true;await save();
    report.checks[mode+'RealTerminalCommandAndWallpaper']=true;
    config.media=media[2];await save();await capture('workbench-terminal-'+mode+'-landscape');config.media=media[1];await save();
    await componentSurfaces({app,page,aliases,config,mode,data,save,pair,capture,media,report});
    await page.locator('button[aria-label="终端"]').click();
  }
  await stores('clearFixture');
  for(const route of ['workbench','analytics','project-board','knowledge','scheduler','experts','workflow','design']){
    await stores('route',{route});await page.waitForTimeout(600);const size=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
    const rect=[Math.round(size.width*.40),Math.round(size.height*.20),Math.round(size.width*.85),Math.round(size.height*.70)];
    await pair('route-'+route,rect,.65);report.checks[route+'RouteWallpaper']=true;
    await routeDetails({page,route,pair,report,aliases});
  }
  await settings();await pair('settings',[250,170,700,400],.20);report.checks.settingsWallpaper=true;
  await materialLifecycle({page,config,save,report});
  await settingsDetails({page,pair,report});
  await detachedMaterial({app,page,config,save,media,artifacts,report});
  report.layers=await page.evaluate(()=>[[400,300],[900,500]].map(([x,y])=>document.elementsFromPoint(x,y).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'svg',surface:e.dataset.appearanceSurface,bg:getComputedStyle(e).backgroundColor}))));
  assert.equal(report.errors.length,0,report.errors.join('\n'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await capture('failure').catch(()=>{});}
finally{if(app)await app.close();for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}fs.writeFileSync(path.join(artifacts,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
