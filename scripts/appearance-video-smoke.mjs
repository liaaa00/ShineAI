import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
import {screenshotDifference} from './appearance-pixel-helper.mjs';

const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const artifacts=path.join(root,'artifacts','appearance-video');fs.mkdirSync(artifacts,{recursive:true});
const data=path.join(root,'.test-data','appearance-video-'+Date.now());fs.mkdirSync(data,{recursive:true});
const source=path.join(data,'detail-1440p.mp4');
const ffmpeg=path.join(root,'.runtime/media-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=2560x1440:rate=12','-vf','drawgrid=width=16:height=16:thickness=1:color=white@0.5','-t','1','-c:v','libx264','-crf','14','-pix_fmt','yuv420p',source],{windowsHide:true});
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},errors:[],scope:'Generated SDR video; same Chromium decoded frame and viewport. No native-player/HDR comparison or user media.'};
const backups=[];let app,page;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function open(){({app,page}=await openTestApp(data,{auth:19472,meeting:18242},executable));page.on('pageerror',e=>report.errors.push(e.message));}
async function settings(){await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByText('全部设置',{exact:true}).click();await page.getByRole('button',{name:'外观',exact:true}).click();await page.locator('.dev-appearance').waitFor();}
async function saved(){await page.waitForFunction(()=>document.querySelector('.dev-appearance [role=status]')?.textContent==='已保存到本机');}
try {
 for(const scheme of ['shineai-dev','claudeops-dev']){
  const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(data,scheme+'.reg');
  try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}
 }
 await open();await completeOnboarding(page);await settings();
 await app.evaluate(({dialog},selected)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[selected]});},source);
 await page.locator('[data-action="import"]').click();await saved();
 const imported=await page.evaluate(()=>window.development.appearance.get());
 const bytes=await page.evaluate(async url=>[...new Uint8Array(await(await fetch(url)).arrayBuffer())],imported.media.url);
 assert.equal(sha(Buffer.from(bytes)),sha(fs.readFileSync(source)));report.checks.importPreservesEverySourceByte=true;
 await page.locator('[data-preset="original"]').click();await saved();
 const original=await page.evaluate(()=>window.development.appearance.get());
 const mode=await page.evaluate(()=>document.documentElement.style.colorScheme==='dark'?'dark':'light');
 const {text,...originalMedia}=original.config[mode];
 assert.deepEqual(originalMedia,{strength:100,mask:0,transparency:100,blur:0,panelBlur:0});
 assert.deepEqual(text,imported.config[mode].text,'Video preset must preserve manual text preferences');
 assert.equal(original.config.fit,'contain');assert.equal(original.config.motion,true);
 await page.waitForFunction(()=>{const v=document.querySelector('#dev-background video');return !v.paused&&v.currentTime>0&&v.videoWidth===2560&&v.videoHeight===1440;});
 await page.getByLabel('动态播放',{exact:true}).uncheck();await saved();
 const time=await page.evaluate(()=>document.querySelector('#dev-background video').currentTime);
 await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>document.querySelector('#dev-background video').currentTime),time);
 assert.ok(await page.evaluate(()=>{const v=document.querySelector('#dev-background video');return !v.hidden&&v.videoWidth===2560&&document.querySelector('#dev-background img').hidden;}));
 report.checks.originalPresetAndFullResolutionPause=true;
 await page.getByText('返回工作区',{exact:true}).click();
 await page.evaluate(()=>{
  const style=document.createElement('style');style.id='fidelity-test-style';
  style.textContent='#root>*{visibility:hidden}#dev-edition-banner{visibility:hidden}.fidelity-probe{visibility:visible!important;position:fixed;top:0;bottom:0;width:25%;background:white}.fidelity-nested{backdrop-filter:blur(calc(2px + 8px))}';document.head.append(style);
  for(const [index,kind] of ['utility','nested','inline','dialog'].entries()){
   const panel=document.createElement('div');panel.id='fidelity-'+kind;panel.className='fidelity-probe '+(kind==='utility'?'backdrop-blur-sm':kind==='nested'?'fidelity-nested':'');panel.style.left=index*25+'%';
   if(kind==='inline')panel.style.backdropFilter='blur(12px)';if(kind==='dialog')panel.setAttribute('role','dialog');document.querySelector('#root').append(panel);
  }
 });
 await page.waitForFunction(()=>['utility','nested','inline','dialog'].every(kind=>getComputedStyle(document.querySelector('#fidelity-'+kind)).backdropFilter==='none'));
 await page.waitForFunction(()=>[...document.querySelectorAll('.fidelity-probe')].every(e=>/\/ 0\)/.test(getComputedStyle(e).backgroundColor)));
 await page.waitForTimeout(300);
 report.material=await page.evaluate(()=>({video:{filter:getComputedStyle(document.querySelector('#dev-background video')).filter,opacity:getComputedStyle(document.querySelector('#dev-background video')).opacity},mask:getComputedStyle(document.querySelector('.dev-background-mask')).opacity,root:getComputedStyle(document.querySelector('#root')).backgroundColor,panels:[...document.querySelectorAll('.fidelity-probe')].map(e=>({id:e.id,blur:getComputedStyle(e).backdropFilter,background:getComputedStyle(e).backgroundColor}))}));
 assert.equal(report.material.video.filter,'none');assert.equal(report.material.video.opacity,'1');assert.equal(report.material.mask,'0');
 const actual=path.join(artifacts,'original-background.png'),reference=path.join(artifacts,'unfiltered-reference.png');
 await page.screenshot({path:actual,scale:'css'});
 // Reuse the same paused decoder/frame, above all UI, with only plain video sizing.
 await page.evaluate(()=>{const v=document.querySelector('#dev-background video');v.id='fidelity-reference';v.className='';v.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 50%;filter:none;opacity:1;z-index:2147483647;pointer-events:none';document.body.append(v);});
 await page.screenshot({path:reference,scale:'css'});
 const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
 report.pixelComparison=screenshotDifference(actual,reference,[20,20,viewport.width-20,viewport.height-20],viewport);
 assert.ok(report.pixelComparison.meanDelta<0.5&&report.pixelComparison.changedFraction<0.001,JSON.stringify(report.pixelComparison));
 report.checks.originalBackgroundMatchesUnfilteredDecodedFrame=true;
 await page.evaluate(()=>{const v=document.querySelector('#fidelity-reference');v.removeAttribute('id');v.removeAttribute('style');v.className='dev-background-content';document.querySelector('.dev-background-media').prepend(v);document.querySelector('#fidelity-test-style').remove();document.querySelectorAll('.fidelity-probe').forEach(e=>e.remove());});
 await settings();await page.getByLabel('浮层模糊',{exact:true}).fill('9');await saved();
 await page.evaluate(()=>{const e=document.createElement('div');e.id='blur-probe';e.style.backdropFilter='blur(12px)';document.querySelector('#root').append(e);});
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#blur-probe')).backdropFilter),'blur(9px)');
 await page.getByLabel('启用背景',{exact:true}).uncheck();await saved();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#blur-probe')).backdropFilter),'blur(12px)');
 await page.getByLabel('启用背景',{exact:true}).check();await saved();
 await page.getByText('GitHub Dark',{exact:true}).click();await page.waitForFunction(()=>document.documentElement.style.colorScheme==='dark');
 await page.locator('[data-preset="original"]').click();await saved();
 assert.equal((await page.evaluate(()=>window.development.appearance.get())).config.light.panelBlur,9);
 const final=await page.evaluate(()=>window.development.appearance.get());
 await app.close();app=null;await open();await settings();
 assert.deepEqual((await page.evaluate(()=>window.development.appearance.get())).config,final.config);
 await page.waitForFunction(()=>document.querySelector('#dev-background video')?.videoWidth===2560);
 report.checks.panelBlurAdjustsAndDisablingRestoresOriginalStyles=true;
 report.checks.separateThemePreferencesAndRestartPersist=true;
 await page.screenshot({path:path.join(artifacts,'settings.png')});
 assert.equal(report.errors.length,0,report.errors.join('\n'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(artifacts,'failure.png')}).catch(()=>{});}
finally{
 if(app)await app.close();
 for(const {key,file} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(artifacts,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
