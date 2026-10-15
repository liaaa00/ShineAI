import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
import {screenshotDifference} from './appearance-pixel-helper.mjs';

const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const artifacts=path.join(root,'artifacts/appearance-board');fs.mkdirSync(artifacts,{recursive:true});
const data=path.join(root,'.test-data','appearance-board-'+Date.now());fs.mkdirSync(data,{recursive:true});
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},pixels:{},errors:[],scope:'Isolated workbench and session UI; generated media only; no model requests'};
const backups=[];let app,page,viewport;
async function settings() {
  await page.locator('button[aria-label="设置"]').click();
  await page.getByText('全部设置',{exact:true}).click();
  await page.getByRole('button',{name:'外观',exact:true}).click();
  await page.locator('.dev-appearance').waitFor();
}
async function save(config) {
  const result=await page.evaluate(config=>window.development.appearance.save(config),config);
  assert.equal(result.success,true,result.error);
  await page.waitForFunction(({media,enabled,opacity})=>document.documentElement.dataset.devBackground===(enabled?'on':'off')&&(!enabled||document.querySelector('#dev-background img:not([hidden])')?.src.endsWith(media))&&document.documentElement.style.getPropertyValue('--dev-surface-opacity')===opacity,{media:config.media,enabled:config.enabled,opacity:(100-config[await page.evaluate(()=>document.documentElement.style.colorScheme==='dark'?'dark':'light')].transparency)+'%'});
  // Allow Chromium to paint the decoded image and the new material.
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.waitForTimeout(400); // Existing theme surfaces animate background-color.
}
async function capture(name) {const file=path.join(artifacts,name+'.png');viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));await page.screenshot({path:file,scale:'css'});return file;}
function difference(first,second,rect) {
  return screenshotDifference(first,second,rect,viewport);
}
try {
  for(const scheme of ['shineai-dev','claudeops-dev']) {
    const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(artifacts,scheme+'.reg');
    try{execFileSync('reg.exe',['export',key,file,'/y'],{windowsHide:true,stdio:'ignore'});backups.push({key,file});}catch{backups.push({key,file:null});}
  }
  ({app,page}=await openTestApp(data,{auth:19463,meeting:18233},executable));
  page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
  await page.locator('button[aria-label="工作台"]').click();await page.locator('.workbench-canvas').waitFor();
  await capture('board-background-off');
  const original=(await page.evaluate(()=>window.development.appearance.get())).config;
  const media=[];
  for(const [name,color] of [['rose','#eb426b'],['teal','#168aa8']]) {
    const bytes=await page.evaluate(color=>{const c=document.createElement('canvas');c.width=640;c.height=360;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,640,360);return c.toDataURL().split(',')[1];},color);
    const file=path.join(data,name+'.png');fs.writeFileSync(file,Buffer.from(bytes,'base64'));
    await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
    const result=await page.evaluate(()=>window.development.appearance.importMedia());assert.equal(result.success,true,result.error);media.push(result.media.id);
  }
  const config=structuredClone(original);config.enabled=true;
  for(const mode of ['light','dark'])Object.assign(config[mode],{strength:100,mask:20,transparency:70,blur:0});
  const box=await page.locator('.workbench-canvas').boundingBox();
  const rect=[Math.ceil(box.x+5),Math.ceil(box.y+5),Math.floor(box.x+box.width-5),Math.floor(box.y+box.height*.64)];
  for(const mode of ['light','dark']) {
    await settings();await page.getByText(mode==='light'?'GitHub Light':'GitHub Dark',{exact:true}).click();
    await page.waitForFunction(mode=>document.documentElement.style.colorScheme===mode,mode);
    await page.getByText('返回工作区',{exact:true}).click();await page.locator('button[aria-label="工作台"]').click();await page.locator('.workbench-canvas').waitFor();
    config.media=media[0];await save(config);const first=await capture('board-'+mode+'-rose');
    config.media=media[1];await save(config);const second=await capture('board-'+mode+'-teal');
    const pixels=difference(first,second,rect);report.pixels[mode]=pixels;
    assert.ok(pixels.changedFraction>.70,mode+' board must visibly transmit wallpaper: '+JSON.stringify(pixels));
    report.checks[mode+'WorkbenchWallpaperVisible']=true;
    config[mode].transparency=0;await save(config);const opaqueFirst=await capture('board-'+mode+'-opaque-teal');
    config.media=media[0];await save(config);const opaqueSecond=await capture('board-'+mode+'-opaque-rose');
    const opaque=difference(opaqueFirst,opaqueSecond,rect);report.pixels[mode+'Opaque']=opaque;
    assert.ok(opaque.changedFraction<.01,mode+' transparency zero must retain opaque material');config[mode].transparency=70;
    config.enabled=false;await save(config);const disabledFirst=await capture('board-'+mode+'-disabled-rose');
    config.media=media[1];await save(config);const disabledSecond=await capture('board-'+mode+'-disabled-teal');
    assert.ok(difference(disabledFirst,disabledSecond,rect).changedFraction<.01,'Disabled background must restore theme');config.enabled=true;await save(config);
  }
  report.checks.transparencyZeroAndDisabledRestoreTheme=true;
  const layers=await page.evaluate(()=>[[400,300],[900,400]].map(([x,y])=>document.elementsFromPoint(x,y).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'svg',background:getComputedStyle(e).backgroundColor,surface:e.dataset.appearanceSurface}))));
  fs.writeFileSync(path.join(artifacts,'layers.json'),JSON.stringify(layers,null,2));
  for(const selector of ['.workbench-canvas .react-flow','.workbench-canvas .react-flow__background']){
    const color=await page.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor);
    assert.ok(color==='rgba(0, 0, 0, 0)'||/\/ 0\)/.test(color),'Canvas background must be transparent: '+color);
  }
  await page.getByRole('button',{name:'框选',exact:true}).click();
  await page.getByRole('button',{name:'框选',exact:true}).click();
  await page.getByRole('button',{name:'适应窗口',exact:true}).click();
  const search=page.getByPlaceholder('搜索画布',{exact:true});await search.fill('本地测试');await search.fill('');
  const composer=page.locator('[class*="bg-bg-primary/95"]').filter({has:page.locator('textarea')});
  report.composerColors=await composer.evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundColor));
  assert.ok(report.composerColors.length>0,'Readable input panel must remain present');
  assert.ok(report.composerColors.every(color=>/\/ 0\.14[0-9]*\)/.test(color)),'Input panel material must follow transparency, including its original 95% alpha');
  report.checks.canvasControlsSearchAndReadableComposer=true;
  await page.locator('button[aria-label="项目会话"]').click();await capture('sessions-dark');
  report.checks.sessionsNavigation=true;
  await settings();await page.getByText('GitHub Light',{exact:true}).click();await page.getByText('返回工作区',{exact:true}).click();await capture('sessions-light');
  await page.locator('button[aria-label="工作台"]').click();
  // A generated landscape shows continuity across the board and activity rail.
  const landscape=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const ctx=c.getContext('2d');const g=ctx.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#263c63');g.addColorStop(.5,'#6888a8');g.addColorStop(1,'#d8aea0');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);ctx.fillStyle='#9ac2d4';ctx.beginPath();ctx.arc(950,220,130,0,7);ctx.fill();return c.toDataURL().split(',')[1];});
  const file=path.join(data,'landscape.png');fs.writeFileSync(file,Buffer.from(landscape,'base64'));await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
  config.media=(await page.evaluate(()=>window.development.appearance.importMedia())).media.id;config.light={strength:80,mask:30,transparency:65,blur:0};await save(config);await capture('board-light-landscape');
  await settings();await page.getByText('GitHub Dark',{exact:true}).click();await page.getByText('返回工作区',{exact:true}).click();await page.locator('button[aria-label="工作台"]').click();await page.locator('.workbench-canvas').waitFor();await capture('board-dark-landscape');
  assert.equal(report.errors.length,0,report.errors.join('\n'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await capture('failure').catch(()=>{});}
finally {
  if(app)await app.close();
  for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{windowsHide:true,stdio:'ignore'});}catch{}if(file)execFileSync('reg.exe',['import',file],{windowsHide:true,stdio:'ignore'});}
  fs.writeFileSync(path.join(artifacts,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
