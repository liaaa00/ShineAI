import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const dir=path.join(root,'artifacts/chat-images',executable?'installed':'development');fs.mkdirSync(dir,{recursive:true});
const data=path.join(root,'.test-data','chat-images-'+Date.now()),workspace=path.join(data,'中文 项目');fs.mkdirSync(workspace,{recursive:true});
const image=path.join(workspace,'_login_shot.png'),missing=path.join(workspace,'missing.png');
fs.writeFileSync(image,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=','base64'));
const report={checks:{},errors:[],scope:'Actual Electron chat rendering and native file reader with isolated data. Mixed-prose regression, missing file, process restart, saved-copy fallback and session deletion. No real model requests.'};
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
const backups=[];let app,page,id,content;
async function open(){({app,page}=await openTestApp(data,{auth:19891,meeting:18691},executable));page.on('pageerror',e=>report.errors.push(e.message));}
async function render(){
 await page.evaluate(async({aliases,id,content})=>{const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];await s.getState().fetchSessions();s.setState({selectedSessionId:id});m[aliases.useUIStore].getState().setActiveWorkspace('project');m[aliases.useUIStore].setState({newSessionEntryActive:false});await s.getState().openSessionForChat(id);s.setState({conversations:{[id]:[{id:'fixture-user',sessionId:id,role:'user',content:'检查截图显示',timestamp:Date.now()},{id:'image-incident',sessionId:id,role:'assistant',content,timestamp:Date.now()+1}]},conversationLoading:{},streamingSessions:new Set()});},{aliases,id,content});
}
const files=()=>{const base=path.join(data,'chat-images');return fs.existsSync(base)?fs.readdirSync(base).flatMap(d=>fs.readdirSync(path.join(base,d)).map(f=>path.join(base,d,f))):[];};
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 await open();await completeOnboarding(page);
 const created=await page.evaluate(async workspace=>{await window.shineAI.settings.update('backgroundAiAnalysisEnabled',false);await window.shineAI.provider.create({id:'image-offline',name:'图片离线验证',adapterType:'openai-api',command:'api',enabled:true,apiBaseUrl:'http://127.0.0.1:1/v1',apiKey:'fixture',defaultModel:'offline'});return window.shineAI.session.create({name:'图片路径与历史副本验证',workingDirectory:workspace,providerId:'image-offline',model:'offline',worktreeEnabled:false});},workspace);assert.equal(created.success,true);id=created.sessionId||created.id;
 const tick=String.fromCharCode(96);content='- 产出：'+tick+workspace.replaceAll('\\','/')+'/project'+tick+'（提交 '+tick+'0375042'+tick+'，前有 '+tick+'3d91c16'+tick+'、'+tick+'8cede57'+tick+'）；截图 '+tick+image.replaceAll('\\','/')+tick+'\n\n[图片:'+missing+']';
 const screenshot=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=220;const ctx=canvas.getContext('2d');ctx.fillStyle='#1e293b';ctx.fillRect(0,0,640,220);ctx.fillStyle='#a7f3d0';ctx.font='bold 32px sans-serif';ctx.fillText('ShineAI · 图片预览验证',32,80);ctx.fillStyle='#e2e8f0';ctx.font='22px sans-serif';ctx.fillText('路径识别正确 · 删除原图后仍可查看副本',32,140);return canvas.toDataURL().split(',')[1];});fs.writeFileSync(image,Buffer.from(screenshot,'base64'));
 await render();
 await page.waitForFunction(()=>{const img=document.querySelector('img[alt="_login_shot.png"]');return img?.complete&&img.naturalWidth>0;});
 assert.equal(await page.locator('img[alt="_login_shot.png"]').count(),1);
 await page.getByText('图片文件不存在，且没有可用的会话副本：missing.png',{exact:true}).waitFor();
 assert.ok((await page.locator('body').innerText()).includes('0375042'));
 for(let i=0;i<100&&!files().some(f=>f.endsWith('.json'));i++)await page.waitForTimeout(50);assert.ok(files().some(f=>f.endsWith('.json')));
 report.checks.mixedProseExtractsExactImageAndPreservesText=true;report.checks.missingFileHasClearMessage=true;report.checks.nativeReaderCreatesSessionCopy=true;
 await page.screenshot({path:path.join(dir,'images-visible.png')});
 await app.close();app=null;fs.unlinkSync(image);await open();await render();
 await page.waitForFunction(()=>{const img=document.querySelector('img[alt="_login_shot.png"]');return img?.complete&&img.naturalWidth>0;});
 const cached=await page.evaluate(({image,id})=>window.development.chatFiles.readImage(image,{sessionId:id}),{image,id});assert.equal(cached.fromCache,true);
 report.checks.imageSurvivesProcessRestartAndDeletedOriginal=true;
 await page.screenshot({path:path.join(dir,'saved-copy-visible.png')});
 const deleted=await page.evaluate(id=>window.shineAI.session.delete(id),id);assert.notEqual(deleted?.success,false);
 for(let i=0;i<100&&files().length;i++)await page.waitForTimeout(50);assert.equal(files().length,0);report.checks.deletingSessionRemovesCopies=true;
 assert.equal(report.errors.length,0,report.errors.join('\n'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
finally{if(app)await app.close();for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
