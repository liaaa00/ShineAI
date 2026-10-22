import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const dir=path.join(root,'artifacts/diagram-viewer');fs.mkdirSync(dir,{recursive:true});
const data=path.join(root,'.test-data','diagram-viewer-'+Date.now());fs.mkdirSync(data,{recursive:true});
const report={checks:{},errors:[],scope:'Actual strict Mermaid rendering in isolated Electron using synthetic Markdown. No model calls or user profile changes.'};
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
const long='flowchart TD\n'+Array.from({length:23},(_,i)=>`N${i}["步骤 ${i+1}：验证完整图表可见"] --> N${i+1}`).join('\n');
const wide='flowchart LR\n A[开始] --> B[检查配置] --> C[确认结果]';
const backups=[];let app,page;
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 ({app,page}=await openTestApp(data,{auth:19778,meeting:18578}));page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
 const created=await page.evaluate(async workspace=>{
  await window.shineAI.settings.update('backgroundAiAnalysisEnabled',false);
  const p=await window.shineAI.provider.create({id:'diagram-offline',name:'离线图表验证',adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:'http://127.0.0.1:1/v1',apiKey:'offline-fixture-only',defaultModel:'offline'});
  return window.shineAI.session.create({name:'图表放大查看',workingDirectory:workspace,providerId:p.provider?.id||p.data?.id||p.id,model:'offline',worktreeEnabled:false});
 },data);assert.equal(created.success,true);const id=created.sessionId||created.id;
 await page.evaluate(async({aliases,id,long,wide})=>{
  const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];await s.getState().fetchSessions();s.setState({selectedSessionId:id});m[aliases.useUIStore].getState().setActiveWorkspace('project');m[aliases.useUIStore].setState({newSessionEntryActive:false});await s.getState().openSessionForChat(id);
  const now=Date.now();s.setState({conversations:{[id]:[{id:'fixture-user',sessionId:id,role:'user',content:'图表查看固定样例',timestamp:new Date(now).toISOString()},{id:'fixture-diagrams',sessionId:id,role:'assistant',content:'长流程图：\n\n```mermaid\n'+long+'\n```\n\n横向流程图：\n\n```mermaid\n'+wide+'\n```',timestamp:new Date(now+100).toISOString()}]},conversationLoading:{},streamingSessions:new Set()});
 },{aliases,id,long,wide});
 const expand=page.getByTestId('diagram-expand');await expand.nth(1).waitFor({timeout:90000});assert.equal(await expand.count(),2);
 const first=expand.first(),inline=page.locator('.mermaid-block').first();await first.scrollIntoViewIfNeeded();
 const original=await inline.locator('.mermaid-block__svg').getAttribute('style');
 const appearanceBefore=await page.evaluate(()=>window.development.appearance.get());
 await first.click();const viewer=page.getByTestId('diagram-viewer');await viewer.waitFor();
 assert.equal(await viewer.evaluate(el=>el.matches(':modal')),true);
 const fits=async()=>{await page.waitForTimeout(150);const c=await viewer.getByTestId('diagram-viewer-canvas').boundingBox(),s=await viewer.locator('svg').boundingBox();assert.ok(c&&s);assert.ok(s.x>=c.x-1&&s.y>=c.y-1&&s.x+s.width<=c.x+c.width+1&&s.y+s.height<=c.y+c.height+1,'full diagram must fit the canvas');};
 await fits();assert.ok(parseInt(await viewer.getByTestId('diagram-viewer-zoom').innerText())<50);
 report.checks.longDiagramFitsEntireWindowBelowInlineZoomLimit=true;
 await page.screenshot({path:path.join(dir,'long-fit.png')});
 await viewer.getByRole('button',{name:'100%',exact:true}).click();assert.equal(await viewer.getByTestId('diagram-viewer-zoom').innerText(),'100%');
 await viewer.getByRole('button',{name:'放大',exact:true}).click();assert.equal(await viewer.getByTestId('diagram-viewer-zoom').innerText(),'120%');
 await viewer.getByRole('button',{name:'缩小',exact:true}).click();assert.equal(await viewer.getByTestId('diagram-viewer-zoom').innerText(),'100%');
 const canvas=viewer.getByTestId('diagram-viewer-canvas'),box=await canvas.boundingBox(),before=await viewer.locator('.dev-diagram-viewer-image').getAttribute('style');
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+40,{steps:4});await page.mouse.up();assert.notEqual(await viewer.locator('.dev-diagram-viewer-image').getAttribute('style'),before);
 const wheelBefore=await viewer.getByTestId('diagram-viewer-zoom').innerText();await page.keyboard.down('Control');await page.mouse.wheel(0,-120);await page.keyboard.up('Control');await page.waitForTimeout(150);assert.notEqual(await viewer.getByTestId('diagram-viewer-zoom').innerText(),wheelBefore);
 report.checks.actualSizeZoomDragAndCtrlWheelWork=true;
 await viewer.getByRole('button',{name:'适合窗口',exact:true}).click();await fits();
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html')).setSize(920,760));await fits();
 report.checks.fitRecalculatesAfterWindowResize=true;
 const originalIds=await inline.locator('svg [id]').evaluateAll(nodes=>nodes.map(n=>n.id));const expandedIds=await viewer.locator('svg [id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.ok(!expandedIds.some(id=>originalIds.includes(id)));
 report.checks.svgIdsDoNotCollideWithInlineDiagram=true;
 await page.keyboard.press('Escape');await viewer.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>document.getElementById('root').style.visibility),'');assert.equal(await inline.locator('.mermaid-block__svg').getAttribute('style'),original);assert.equal(await first.evaluate(el=>el===document.activeElement),true);
 report.checks.escapeRestoresInlineStateAndKeyboardFocus=true;
 assert.deepEqual(await page.evaluate(()=>window.development.appearance.get()),appearanceBefore);
 // Exercise the viewer over an actual imported wallpaper in this isolated profile.
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#263c63');g.addColorStop(.5,'#6888a8');g.addColorStop(1,'#d8aea0');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);return c.toDataURL().split(',')[1];});
 const image=path.join(data,'wallpaper.png');fs.writeFileSync(image,Buffer.from(png,'base64'));
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},image);
 const imported=await page.evaluate(()=>window.development.appearance.importMedia());assert.equal(imported.success,true);
 const config=(await page.evaluate(()=>window.development.appearance.get())).config;config.enabled=true;config.media=imported.media.id;
 assert.equal((await page.evaluate(config=>window.development.appearance.save(config),config)).success,true);
 await page.waitForFunction(()=>document.documentElement.dataset.devBackground==='on'&&document.querySelector('#dev-background img:not([hidden])')?.complete);
 const wallpaperAppearance=await page.evaluate(()=>window.development.appearance.get());
 await expand.nth(1).click();await viewer.waitFor();await fits();
 assert.match(await viewer.evaluate(el=>getComputedStyle(el).backgroundColor),/^(rgba\(0, 0, 0, 0\)|color\(srgb 0 0 0 \/ 0\))$/);
 assert.equal(await page.locator('#root').evaluate(el=>getComputedStyle(el).opacity),'0');
 assert.equal(await page.locator('#dev-background').evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.screenshot({path:path.join(dir,'wide-wallpaper-fit.png')});
 const exported=path.join(dir,'diagram.svg');fs.rmSync(exported,{force:true});
 await app.evaluate(({BrowserWindow},file)=>{globalThis.__diagramDownload=null;const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));w.webContents.session.once('will-download',(_event,item)=>{item.setSavePath(file);item.once('done',(_event,state)=>{globalThis.__diagramDownload=state;});});},exported);
 await viewer.getByRole('button',{name:'导出 SVG',exact:true}).click();
 let downloaded;for(let n=0;n<100;n++){downloaded=await app.evaluate(()=>globalThis.__diagramDownload);if(downloaded)break;await page.waitForTimeout(100);}
 assert.equal(downloaded,'completed');assert.match(fs.readFileSync(exported,'utf8'),/<svg/);
 // Verify the existing copy handler without overwriting the user's clipboard.
 await page.evaluate(()=>{Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async text=>{window.__diagramCopiedSource=text;}});});
 await viewer.getByRole('button',{name:'复制源码',exact:true}).click();await viewer.getByRole('button',{name:'已复制',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.__diagramCopiedSource),wide);
 await viewer.getByTestId('diagram-viewer-close').click();await viewer.waitFor({state:'detached'});
 assert.deepEqual(await page.evaluate(()=>window.development.appearance.get()),wallpaperAppearance);
 report.checks.copyExportCloseAndAppearancePreserved=true;
 report.checks.transparentViewerRetainsWallpaper=true;
 assert.ok(await inline.locator('.mermaid-block__toolbar').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'narrow chat toolbar must not overflow');
 report.checks.narrowToolbarRemainsUsable=true;
 await page.screenshot({path:path.join(dir,'returned-to-chat.png')});
 assert.equal(report.errors.length,0,report.errors.join('\n'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
finally{if(app)await app.close();for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}fs.writeFileSync(path.join(dir,'smoke-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
