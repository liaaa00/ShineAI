import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const artifacts=path.join(root,'artifacts','appearance-smoke');fs.mkdirSync(artifacts,{recursive:true});
const data=path.join(root,'.test-data','appearance-'+Date.now());
const fixtures=path.join(data,'fixtures');fs.mkdirSync(fixtures,{recursive:true});
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},errors:[],scope:'Isolated local media and UI; no account credentials or model requests'};
const backups=[];let app,page;
async function open() {({app,page}=await openTestApp(data,{auth:19462,meeting:18232},executable));page.on('pageerror',e=>report.errors.push(e.message));page.on('console',message=>{if(message.type()==='error') console.log(message.text().slice(0,600));});}
async function settings() {
 await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByText('全部设置',{exact:true}).click();await page.getByRole('button',{name:'外观',exact:true}).click();await page.locator('.dev-appearance').waitFor();
}
async function choose(file) {
 await app.evaluate(({dialog},selected)=>{dialog.showOpenDialog=async()=>({canceled:!selected,filePaths:selected?[selected]:[]});},file);
 await page.locator('[data-action="import"]').click();
 await page.locator('[data-action="import"]').waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.querySelector('[data-action="import"]').disabled);
}
async function saved() {await page.waitForFunction(()=>{const status=document.querySelector('.dev-appearance [role=status]');return status?.textContent==='已保存到本机'||status?.dataset.error==='true';});assert.equal(await page.locator('.dev-appearance [role=status]').textContent(),'已保存到本机');}
async function close() {await app.close();app=null;}
try {
 for(const scheme of ['shineai-dev','claudeops-dev']) {
  const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(artifacts,scheme+'.reg');
  try{execFileSync('reg.exe',['export',key,file,'/y'],{windowsHide:true,stdio:'ignore'});backups.push({key,file});}catch{backups.push({key,file:null});}
 }
 await open();await completeOnboarding(page);await settings();
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.devBackground),'off');
 await page.screenshot({path:path.join(artifacts,'before.png')});
 const png=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=1280;c.height=720;const ctx=c.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,1280,720);grad.addColorStop(0,'#263c63');grad.addColorStop(.5,'#6888a8');grad.addColorStop(1,'#d8aea0');ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle='#9ac2d4';ctx.beginPath();ctx.arc(950,220,130,0,Math.PI*2);ctx.fill();ctx.fillStyle='#334e69';ctx.beginPath();ctx.moveTo(0,620);ctx.lineTo(430,200);ctx.lineTo(860,720);ctx.closePath();ctx.fill();return c.toDataURL().split(',')[1];
 });
 const image=path.join(fixtures,'landscape.png');fs.writeFileSync(image,Buffer.from(png,'base64'));
 await choose(image);await saved();
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.devBackground),'on');
 const snapshot=await page.evaluate(()=>window.development.appearance.get());assert.equal(snapshot.success,true);assert.ok(snapshot.media.id);
 fs.renameSync(image,image+'.moved');
 const bytes=await page.evaluate(async url=>{const response=await fetch(url,{headers:{Range:'bytes=0-7'}});return {status:response.status,type:response.headers.get('Content-Type'),range:response.headers.get('Content-Range'),bytes:[...new Uint8Array(await response.arrayBuffer())]};},snapshot.media.url);
 assert.equal(bytes.status,206);assert.equal(bytes.type,'image/png');assert.deepEqual(bytes.bytes,[137,80,78,71,13,10,26,10]);
 report.checks.imageImportedDecodedAndCopied=true;report.checks.mediaProtocolByteRanges=true;
 await page.locator('[data-preset="glass"]').click();await saved();
 assert.equal(await page.getByLabel('背景模糊',{exact:true}).inputValue(),'8');
 await page.getByLabel('面板透明度',{exact:true}).fill('62');await saved();
 const colors=await page.evaluate(()=>{const css=getComputedStyle(document.documentElement);return ['--color-bg-primary','--color-bg-secondary'].map(key=>css.getPropertyValue(key).trim());});
 assert.ok(colors.every(color=>/^#[0-9a-f]{6}$/i.test(color)),JSON.stringify(colors));
 await page.screenshot({path:path.join(artifacts,'light-glass.png')});
 const lightConfig=await page.evaluate(()=>window.development.appearance.get());assert.equal(lightConfig.config.light.transparency,62);
 await page.getByText('GitHub Dark',{exact:true}).click();
 await page.waitForFunction(()=>document.documentElement.style.colorScheme==='dark');
 assert.equal(await page.getByLabel('面板透明度',{exact:true}).inputValue(),'45');
 await page.locator('[data-preset="wallpaper"]').click();await saved();
 const darkConfig=await page.evaluate(()=>window.development.appearance.get());assert.equal(darkConfig.config.light.transparency,62);assert.equal(darkConfig.config.dark.transparency,65);
 await page.screenshot({path:path.join(artifacts,'dark-wallpaper.png')});
 await page.getByText('返回工作区',{exact:true}).click();
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(artifacts,'workspace-wallpaper.png')});
 report.workspaceLayers=await page.evaluate(()=>[...[[300,300],[1000,600]]].map(([x,y])=>document.elementsFromPoint(x,y).map(e=>({tag:e.tagName,cls:e.className,surface:e.dataset.appearanceSurface,background:getComputedStyle(e).backgroundColor,style:e.getAttribute('style')}))));
 fs.writeFileSync(path.join(artifacts,'workspace-layers.json'),JSON.stringify(report.workspaceLayers,null,2));
 report.stageDetails=await page.evaluate(()=>[...document.querySelectorAll('#dev-background,#dev-background *')].map(e=>({tag:e.tagName,cls:e.className,src:e.getAttribute('src')?.slice(0,80),hidden:e.hidden,rect:e.getBoundingClientRect().toJSON(),style:{opacity:getComputedStyle(e).opacity,display:getComputedStyle(e).display,zIndex:getComputedStyle(e).zIndex,position:getComputedStyle(e).position}})));
 assert.ok(report.workspaceLayers.every(layers=>layers.every(layer=>layer.background==='rgba(0, 0, 0, 0)'||/\/ (?:0|0\.35)\)/.test(layer.background))),'Workspace backgrounds must actually transmit the wallpaper');
 report.checks.workspaceAndSidebarGlassSurfaces=true;
 await settings();
 report.checks.presetsSlidersAndSeparateThemePreferences=true;report.checks.editorBaseColorsRemainHex=true;
 const corrupt=path.join(fixtures,'corrupt.png');fs.writeFileSync(corrupt,Buffer.from([137,80,78,71,13,10,26,10,0,1,2]));
 await choose(corrupt);await page.locator('.dev-appearance [data-error="true"]').waitFor();
 assert.equal((await page.evaluate(()=>window.development.appearance.get())).config.media,darkConfig.config.media);
 report.checks.invalidMediaRetainsPreviousBackground=true;
 await choose(null);assert.equal((await page.evaluate(()=>window.development.appearance.get())).config.media,darkConfig.config.media);
 // Make a real two-frame GIF; only test media, never user files.
 const gif=path.join(fixtures,'animated.gif');
 fs.copyFileSync(path.join(root,'scripts/fixtures/appearance/animated.gif'),gif);
 await choose(gif);await saved();
 const animatedColors=new Set();
 for(let i=0;i<6;i++) {
  const pixels=await page.screenshot();
  animatedColors.add(execFileSync('python',['-c',"from PIL import Image;import sys,io;print(Image.open(io.BytesIO(sys.stdin.buffer.read())).getpixel((100,2)))"],{input:pixels,encoding:'utf8',windowsHide:true}).trim());
  await page.waitForTimeout(110);
 }
 assert.ok(animatedColors.size>1,'GIF must show different actual rendered frames');
 await page.getByLabel('动态播放',{exact:true}).uncheck();await saved();
 assert.ok(await page.evaluate(()=>{const host=document.querySelector('.dev-background-media');return host.querySelector('img:not([hidden])')?.src.startsWith('data:image/png')&&host.querySelector('img[hidden]')?.getAttribute('src')===null;}));
 await page.getByLabel('动态播放',{exact:true}).check();await saved();
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#dev-background img:not([hidden])')?.src.startsWith('data:'));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('#dev-background img:not([hidden])')?.src.startsWith('shineai-media:'));
 assert.ok(await page.evaluate(()=>document.querySelector('.dev-background-media img:not([hidden])')?.src.startsWith('shineai-media:')));
 report.checks.gifPauseUsesStaticFrameAndResumeRestarts=true;
 const webp=path.join(fixtures,'animated.webp');fs.copyFileSync(path.join(root,'scripts/fixtures/appearance/animated.webp'),webp);
 await choose(webp);await saved();
 assert.ok(await page.evaluate(()=>document.querySelector('#dev-background img:not([hidden])')?.src.endsWith('.webp')));
 await page.getByLabel('动态播放',{exact:true}).uncheck();await saved();
 assert.ok(await page.evaluate(()=>document.querySelector('#dev-background img:not([hidden])')?.src.startsWith('data:')));
 await page.getByLabel('动态播放',{exact:true}).check();await saved();
 report.checks.animatedWebpDecodeAndStaticPause=true;
 const video=path.join(fixtures,'animated.webm');
 fs.copyFileSync(path.join(root,'scripts/fixtures/appearance/animated.webm'),video);
 await choose(video);await saved();
 await page.waitForFunction(()=>{const v=document.querySelector('#dev-background video');return v&&!v.paused&&v.currentTime>0;});
 await page.getByLabel('动态播放',{exact:true}).uncheck();await saved();
 assert.ok(await page.evaluate(()=>document.querySelector('#dev-background video').paused));
 assert.ok(await page.evaluate(()=>!document.querySelector('#dev-background video').hidden&&document.querySelector('#dev-background img').hidden));
 const pausedTime=await page.evaluate(()=>document.querySelector('#dev-background video').currentTime);
 await page.waitForTimeout(180);
 assert.equal(await page.evaluate(()=>document.querySelector('#dev-background video').currentTime),pausedTime);
 await page.getByLabel('动态播放',{exact:true}).check();await saved();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>{const v=document.querySelector('#dev-background video');return v.paused&&!v.hidden&&document.querySelector('#dev-background img').hidden;});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(()=>!document.querySelector('#dev-background video').paused);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 assert.ok(await page.evaluate(()=>document.querySelector('#dev-background video').paused));
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForFunction(()=>!document.querySelector('#dev-background video').paused);
 report.checks.realWebmPlaybackPauseAndVisibilityResume=true;
 const mp4=path.join(fixtures,'animated.mp4');fs.copyFileSync(path.join(root,'scripts/fixtures/appearance/animated.mp4'),mp4);
 await choose(mp4);await saved();await page.waitForFunction(()=>{const video=document.querySelector('#dev-background video');return video&&!video.paused&&video.currentTime>0;});
 report.checks.h264Mp4DecodedAndPlaying=true;
 await page.getByLabel('背景显示方式',{exact:true}).selectOption('contain');await saved();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#dev-background video')).objectFit),'contain');
 await page.getByLabel('水平位置',{exact:true}).fill('35');await saved();
 const final=await page.evaluate(()=>window.development.appearance.get());
 await close();await open();await settings();
 await page.waitForFunction(()=>document.documentElement.dataset.devBackground==='on');
 const restarted=await page.evaluate(()=>window.development.appearance.get());assert.deepEqual(restarted.config,final.config);
 report.checks.restartPreservesMediaFitAndParameters=true;
 await page.getByText('返回工作区',{exact:true}).click();
 await page.screenshot({path:path.join(artifacts,'workspace-background.png')});
 assert.ok(await page.evaluate(()=>{const shell=document.querySelector('[data-appearance-surface="shell"]');return shell&&getComputedStyle(shell).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(document.querySelector('#dev-background')).pointerEvents==='none';}));
 await settings();
 report.checks.workspaceBackgroundDoesNotInterceptClicks=true;
 await page.locator('[data-action="reset"]').click();await saved();
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.devBackground),'off');
 assert.ok((await page.evaluate(()=>window.development.appearance.get())).media);
 await page.getByLabel('启用背景',{exact:true}).check();await saved();
 await page.locator('[data-action="clear"]').click();await saved();
 assert.equal((await page.evaluate(()=>window.development.appearance.get())).config.media,null);
 report.checks.restoreDefaultsAndClearWork=true;
 assert.equal(report.errors.length,0,report.errors.join('\n'));
} catch(error) {report.errors.push(error.stack);if(page&&!page.isClosed()){report.uiStatus=await page.locator('.dev-appearance [role=status]').textContent().catch(()=>null);await page.screenshot({path:path.join(artifacts,'failure.png')}).catch(()=>{});}process.exitCode=1;}
finally {
 if(app)await app.close();
 for(const {key,file} of backups) {try{execFileSync('reg.exe',['delete',key,'/f'],{windowsHide:true,stdio:'ignore'});}catch{}if(file)execFileSync('reg.exe',['import',file],{windowsHide:true,stdio:'ignore'});}
 fs.writeFileSync(path.join(artifacts,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks,errors:report.errors,uiStatus:report.uiStatus},null,2));
}
