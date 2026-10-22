import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {root,openTestApp,completeOnboarding,waitForStartupHandoff} from './electron-test-helper.mjs';
const {defaults}=createRequire(import.meta.url)('../src/main/extensions/startup-screen.cjs');
const artifacts=path.join(root,'artifacts/startup-screen');fs.mkdirSync(artifacts,{recursive:true});
const data=path.join(root,'.test-data','startup-'+Date.now());fs.mkdirSync(path.join(data,'startup-screen'),{recursive:true});
fs.writeFileSync(path.join(data,'startup-screen/settings.json'),JSON.stringify({...defaults(),duration:'cinematic',theme:'dark'}));
const report={buildFingerprint:JSON.parse(fs.readFileSync(path.join(root,'artifacts/build-manifest.json'),'utf8')).fingerprint,checks:{},errors:[],scope:'Real isolated Electron UI: full cinematic acts and automatic finish, local WAV playback, optional --real-preview Apple clip playback (muted), mocked preview failure and restart persistence. No user profile changes or model requests.'};
const backups=[];let app,page,cdp,remoteRequests=0;
async function open(){({app,page}=await openTestApp(data,{auth:19692,meeting:18492}));app.process().stderr.on('data',chunk=>fs.appendFileSync(path.join(artifacts,'isolated-runtime.log'),chunk));cdp=await page.context().newCDPSession(page);for(const p of app.windows()){p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(r.url().includes('audio-ssl.itunes.apple.com'))remoteRequests++;});}}
async function capture(name,target=page){const session=target===page?cdp:await target.context().newCDPSession(target);const result=await session.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,optimizeForSpeed:true});fs.writeFileSync(path.join(artifacts,name),Buffer.from(result.data,'base64'));if(target!==page)await session.detach();}
async function handedOff(){await waitForStartupHandoff(page);let visible=false;for(let n=0;n<40;n++){visible=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'))?.isVisible());if(visible)break;await page.waitForTimeout(100);}assert.equal(visible,true,JSON.stringify(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({id:w.id,url:w.webContents.getURL(),visible:w.isVisible()})))));assert.equal(app.windows().filter(p=>p.url().includes('/renderer/startup.html')).length,0);assert.equal(await page.locator('#shine-startup').count(),0);}
async function gone(){await page.locator('#shine-startup').waitFor({state:'detached',timeout:35000});assert.equal(await page.locator('#root').evaluate(e=>e.inert),false);}
async function saved(){await page.waitForFunction(()=>document.querySelector('.shine-startup-settings [role=status]')?.textContent==='已保存到本机'&& !document.querySelector('[data-action=startup-preview]')?.disabled);}
async function preview(){await page.locator('[data-action=startup-preview]').click();await page.locator('#shine-startup').waitFor();await page.waitForFunction(()=>getComputedStyle(document.querySelector('#shine-startup')).opacity==='1');}
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(artifacts,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 await open();
 const opening=app.windows().find(p=>p.url().includes('/renderer/startup.html'));assert.ok(opening,'Earliest loading window must be the new cinematic');
 await opening.locator('#shine-startup').waitFor();
 report.firstWindows=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({url:w.webContents.getURL(),title:w.getTitle(),visible:w.isVisible(),sandbox:w.webContents.getLastWebPreferences().sandbox})));
 assert.ok(report.firstWindows.every(w=>!w.url.startsWith('data:')&&!w.title.includes('SpectrAI')));
 assert.equal(report.firstWindows.find(w=>w.url.includes('/renderer/index.html')).visible,false);
 assert.deepEqual(await opening.evaluate(()=>Object.keys(window.development.startup).sort()),['beginLaunch','completeLaunch','get','launchContext']);
 await capture('boot-dark.png',opening);await opening.waitForFunction(()=>document.querySelector('#shine-startup .dsu-reticle')?.classList.contains('dsu-in'));await capture('boot-radar.png',opening);
 await handedOff();report.checks.earliestWindowReplacedAndColdBootFinishesWithoutDuplicate=true;
 await completeOnboarding(page);
 const appearanceBefore=await page.evaluate(()=>window.development.appearance.get());
 await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByText('全部设置',{exact:true}).click();await page.getByRole('button',{name:'外观',exact:true}).click();await page.locator('.shine-startup-settings').waitFor();await saved();
 assert.equal(remoteRequests,0);report.checks.defaultSilentDoesNotRequestRemoteMusic=true;
 await page.locator('.shine-startup-settings [data-key=theme]').selectOption('light');await saved();await preview();await page.waitForFunction(()=>document.querySelector('#shine-startup .dsu-status-zh')?.textContent==='构建无限可能');await capture('preview-light.png');if(await page.locator('[data-ss=skip]').count())await page.locator('[data-ss=skip]').click();await gone();
 report.checks.realSettingsPreviewBothThemes=true;
 await page.locator('.shine-startup-settings [data-key=theme]').selectOption('dark');await saved();await preview();
 await page.waitForFunction(()=>document.querySelector('#shine-startup .dsu-black-inner')?.classList.contains('dsu-in'));
 await capture('cinematic-01-black-logo.png');
 await page.waitForFunction(()=>document.querySelector('#shine-startup .dsu-status-zh')?.textContent==='构建无限可能');
 await capture('cinematic-02-dossier.png');
 await page.waitForFunction(()=>document.querySelector('#shine-startup .dsu-reticle')?.classList.contains('dsu-in'));
 await capture('cinematic-03-radar.png');
 await page.waitForFunction(()=>document.querySelector('#shine-startup .dsu-tear')?.classList.contains('dsu-go'));
 report.finaleStyles=await page.evaluate(()=>Object.fromEntries(['.dsu-center','.dsu-reticle','.dsu-checks'].map(s=>[s,getComputedStyle(document.querySelector('#shine-startup '+s)).opacity])));
 assert.equal(report.finaleStyles['.dsu-center'],'0','Old center must fade before the welcome glitch');
 assert.equal(report.finaleStyles['.dsu-reticle'],'0','Radar must fade before the welcome glitch');
 await capture('cinematic-04-glitch.png');
 await gone();report.checks.fullCinematicVisitsAllActsAndFinishes=true;
 await page.locator('.shine-startup-settings [data-key=theme]').selectOption('light');await saved();
 // The full transparent wallpaper must not make the opening itself translucent.
 const picture=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#e14d8a';ctx.fillRect(0,0,100,100);return c.toDataURL().split(',')[1];});
 const image=path.join(data,'wallpaper.png');fs.writeFileSync(image,Buffer.from(picture,'base64'));
 await app.evaluate(({dialog},image)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[image]});},image);
 const importedBackground=await page.evaluate(()=>window.development.appearance.importMedia());assert.equal(importedBackground.success,true);
 await page.evaluate(async({config,id})=>window.development.appearance.save({...config,enabled:true,media:id,light:{...config.light,transparency:100},dark:{...config.dark,transparency:100}}),{config:appearanceBefore.config,id:importedBackground.media.id});
 await page.waitForFunction(()=>document.documentElement.dataset.devMaterial==='on');await preview();
 assert.equal(await page.locator('#shine-startup').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');await capture('preview-with-wallpaper.png');await page.keyboard.press('Escape');await gone();
 await page.evaluate(config=>window.development.appearance.save(config),appearanceBefore.config);await page.waitForFunction(()=>document.documentElement.dataset.devBackground==='off');report.checks.wallpaperCannotMakeStartupTranslucentAndIsRestored=true;
 await page.locator('.shine-startup-settings [data-key=duration]').selectOption('short');await saved();await preview();await gone();await page.locator('.shine-startup-settings [data-key=duration]').selectOption('cinematic');await saved();report.checks.shortOpeningFinishesAutomatically=true;
 const wav=Buffer.alloc(44+16000*2*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
 const file=path.join(data,'silent-test.wav');fs.writeFileSync(file,wav);
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
 await page.locator('[data-action=startup-import]').click();await saved();fs.renameSync(file,file+'.moved');
 const snapshot=await page.evaluate(()=>window.development.startup.get());assert.equal(snapshot.config.music,'local');
 await page.evaluate(async()=>{const Original=window.Audio;window.Audio=function(...args){const audio=new Original(...args);audio.muted=true;window.testStartupAudio=audio;return audio;};window.Audio.prototype=Original.prototype;const module=await import('./assets/dev-startup.js');const snapshot=await window.development.startup.get();window.testStartupDispose=module.showStartup({...snapshot,config:{...snapshot.config,volume:0}},{preview:true});});
 await page.locator('#shine-startup').waitFor();
 const playback=await page.evaluate(async()=>({url:(await window.development.startup.get()).audio.url}));
 // Inspect the actual Audio instance without replacing media playback.
 if(await page.evaluate(()=>window.testStartupAudio.paused))await page.locator('[data-ss=sound]').click();
 await page.waitForFunction(()=>window.testStartupAudio?.readyState>=2&&!window.testStartupAudio.paused&&window.testStartupAudio.duration>0,undefined,{timeout:6000});
 const range=await page.evaluate(async url=>{const response=await fetch(url,{headers:{Range:'bytes=0-11'}});return {status:response.status,bytes:[...new Uint8Array(await response.arrayBuffer())]};},playback.url);
 assert.equal(range.status,206);assert.deepEqual(range.bytes,[...wav.subarray(0,12)]);
 await page.keyboard.press('Escape');await gone();assert.equal(await page.evaluate(()=>window.testStartupAudio.paused&&!window.testStartupAudio.getAttribute('src')),true);report.checks.importedMusicSurvivesSourceMoveAndActuallyPlays=true;
 await page.locator('.shine-startup-settings [data-key=music]').selectOption('preview');await saved();
 if(process.argv.includes('--real-preview')){await preview();
 if(await page.evaluate(()=>window.testStartupAudio.paused&&!window.testStartupAudio.error))await page.locator('[data-ss=sound]').click();
 await page.waitForFunction(()=>window.testStartupAudio?.readyState>=2&&!window.testStartupAudio.paused&&window.testStartupAudio.currentTime>0,undefined,{timeout:6500});
 report.applePreview=await page.evaluate(()=>({duration:window.testStartupAudio.duration,readyState:window.testStartupAudio.readyState,muted:window.testStartupAudio.muted}));
 await capture('original-music-preview.png');await page.keyboard.press('Escape');await gone();report.checks.originalInCyberpunkPreviewActuallyDecodesAndPlays=true;}

 await page.route('https://audio-ssl.itunes.apple.com/**',r=>r.abort('failed'));
 await preview();
 await page.waitForFunction(()=>document.querySelector('.ss-audio p')?.textContent.includes('音乐暂时无法播放'),undefined,{timeout:6000});await page.keyboard.press('Escape');await gone();report.checks.remotePreviewFailureNeverBlocksOpening=true;
 await page.locator('.shine-startup-settings [data-key=music]').selectOption('silent');await saved();
 await page.evaluate(()=>{window.startupFrames=0;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>raf(time=>{if(fn.toString().includes('frames.delete'))window.startupFrames++;fn(time);});});
 for(let i=0;i<3;i++){await preview();await page.waitForFunction(()=>window.startupFrames>0);await page.keyboard.press('Escape');await gone();}
 const frames=await page.evaluate(()=>window.startupFrames);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.startupFrames),frames);report.checks.repeatedPreviewStopsCanvasAndRestoresFocus=true;
 await page.emulateMedia({reducedMotion:'reduce'});await preview();const beforeReduced=await page.evaluate(()=>window.startupFrames);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.startupFrames),beforeReduced);await page.keyboard.press('Escape');await gone();await page.emulateMedia({reducedMotion:'no-preference'});report.checks.reducedMotionUsesStaticField=true;
 await page.locator('.shine-startup-settings [data-key=frequency]').selectOption('daily');await saved();
 await page.locator('.shine-startup-settings').screenshot({path:path.join(artifacts,'settings.png')});
 assert.deepEqual(await page.evaluate(()=>window.development.appearance.get()),appearanceBefore);
 await page.evaluate(async()=>{const s=await window.development.startup.get();await window.development.startup.save({...s.config,frequency:'always'});});
 await app.close();app=null;await open();const skipOpening=app.windows().find(p=>p.url().includes('/renderer/startup.html'));assert.ok(skipOpening);await skipOpening.locator('#shine-startup').waitFor();await skipOpening.keyboard.press('Escape');await handedOff();report.checks.escapeRevealsWorkbenchWithoutSecondOpening=true;
 await page.reload();await page.waitForFunction(()=>window.development?.startup);assert.equal(await page.locator('#shine-startup').count(),0);assert.equal((await page.evaluate(()=>window.development.startup.launchContext())).pending,false);report.checks.workbenchReloadDoesNotReplayOpening=true;
 await page.evaluate(async()=>{const s=await window.development.startup.get();await window.development.startup.save({...s.config,frequency:'daily'});});
 await app.close();app=null;await open();await handedOff();const restored=await page.evaluate(()=>window.development.startup.get());assert.equal(restored.config.frequency,'daily');assert.equal(restored.config.theme,'light');assert.equal(restored.audio.id,snapshot.audio.id);report.checks.dailyFrequencyAndMusicPersistWithoutChangingAppearance=true;
 await page.evaluate(async()=>{const s=await window.development.startup.get();await window.development.startup.save({...s.config,enabled:false,frequency:'always'});});await app.close();app=null;await open();await handedOff();report.checks.disabledOpeningStaysDisabledAfterRestart=true;
}catch(error){report.errors.push(error.stack);if(app)report.failedContext=await page.evaluate(()=>window.development.startup.launchContext()).catch(()=>null);process.exitCode=1;if(page&&!page.isClosed())await capture('failure.png').catch(()=>{});}
finally{if(app)await app.close();for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2)+'\n');if(report.applePreview)fs.writeFileSync(path.join(artifacts,'real-preview-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
