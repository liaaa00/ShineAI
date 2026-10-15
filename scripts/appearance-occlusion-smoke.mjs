import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
import {screenshotDifference} from './appearance-pixel-helper.mjs';

const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const artifacts=path.join(root,'artifacts/appearance-occlusion');fs.mkdirSync(artifacts,{recursive:true});
const data=path.join(root,'.test-data','appearance-occlusion-'+Date.now());fs.mkdirSync(data,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(name=>[name,source.match(new RegExp(name+' as (\\w+)'))?.[1]]));
const report={date:new Date().toISOString(),checks:{},pixels:{},errors:[],scope:'Isolated real goals, session drawer, nested menu and settings; screenshot comparisons with and without underlying UI; no model requests'};
const backups=[];let app,page,config,viewport;
async function frames(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForTimeout(200);}
async function save(){assert.equal((await page.evaluate(c=>window.development.appearance.save(c),config)).success,true);await frames();}
async function capture(name){const file=path.join(artifacts,name+'.png');viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));await page.screenshot({path:file,scale:'css'});return file;}
async function settings(){await page.locator('button[aria-label="设置"]').click();await page.getByText('全部设置',{exact:true}).click();await page.getByRole('button',{name:'常规',exact:true}).click();await page.getByRole('button',{name:'外观',exact:true}).click();await page.locator('.dev-appearance').waitFor();}
async function underlayCheck(name,panel){
  await page.mouse.move(15,15);
  await frames();
  const count=await page.locator('[data-dev-occluded]').count();assert.ok(count>0,name+' has lower UI to occlude');
  const box=await panel.boundingBox();assert.ok(box);
  const rect=[Math.ceil(box.x+4),Math.ceil(box.y+4),Math.floor(Math.min(innerViewport.width,box.x+box.width-4)),Math.floor(Math.min(innerViewport.height,box.y+box.height-4))];
  const actual=await capture(name+'-normal');
  if(name.startsWith('goals-')){
    await page.evaluate(()=>{const s=document.createElement('style');s.id='occlusion-disabled-reference';s.textContent='html[data-dev-material="on"] [data-dev-occluded]{clip-path:none!important}';document.head.append(s);});
    const unfixed=await capture(name+'-without-fix');
    await page.evaluate(()=>document.querySelector('#occlusion-disabled-reference').remove());
    const before=screenshotDifference(actual,unfixed,rect,viewport);report.pixels[name+'OriginalOverlap']=before;
    assert.ok(before.changedFraction>.01,'Fixture must reproduce the original text overlap when occlusion is disabled');
  }
  // Removing already covered content must not change any pixel in the panel.
  // This checks text and controls, not just whether a surface is transparent.
  await panel.evaluate(target=>{document.querySelectorAll('[data-dev-occluded]').forEach(e=>{if(!e.contains(target))e.setAttribute('data-occlusion-reference','');});const s=document.createElement('style');s.id='occlusion-reference';s.textContent='[data-occlusion-reference]{opacity:0!important}';document.head.append(s);});
  const reference=await capture(name+'-underlay-hidden');
  await page.evaluate(()=>{document.querySelector('#occlusion-reference').remove();document.querySelectorAll('[data-occlusion-reference]').forEach(e=>e.removeAttribute('data-occlusion-reference'));window.dispatchEvent(new Event('resize'));});await frames();
  const pixels=screenshotDifference(actual,reference,rect,viewport);report.pixels[name]=pixels;
  assert.ok(pixels.changedFraction<.002,name+' must not reveal lower UI: '+JSON.stringify(pixels));
  report.checks[name+'NoUnderlayText']=true;
}
let innerViewport;
try{
  for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(artifacts,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key,file:null});}}
  ({app,page}=await openTestApp(data,{auth:19473,meeting:18243},executable));page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
  innerViewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  config=(await page.evaluate(()=>window.development.appearance.get())).config;config.enabled=true;
  for(const mode of ['light','dark'])Object.assign(config[mode],{strength:100,mask:0,transparency:100,blur:0,panelBlur:0});
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const ctx=c.getContext('2d');const g=ctx.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#98c1db');g.addColorStop(1,'#e9d9ba');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);return c.toDataURL().split(',')[1];});
  const file=path.join(data,'wallpaper.png');fs.writeFileSync(file,Buffer.from(png,'base64'));await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
  config.media=(await page.evaluate(()=>window.development.appearance.importMedia())).media.id;await save();
  for(const mode of ['light','dark']){
    await settings();await page.getByText(mode==='light'?'GitHub Light':'GitHub Dark',{exact:true}).click();await page.waitForFunction(m=>document.documentElement.style.colorScheme===m,mode);await page.getByText('返回工作区',{exact:true}).click();
    await page.evaluate(async({aliases,data})=>{
      const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];
      m[aliases.useUIStore].getState().setActiveWorkspace('workbench');
      s.setState({sessions:[{id:'occlusion-fixture',name:'后层会话不应穿透目标面板',status:'waiting_input',startedAt:Date.now(),estimatedTokens:50,workingDirectory:data,config:{providerId:'codex',model:'local-fixture'},provider:{id:'codex',name:'Codex CLI'}}]});
    },{aliases,data});
    const card=page.locator('.cn-node[data-kind="session"]').first();await card.waitFor();await page.getByRole('button',{name:'适应窗口',exact:true}).click();await page.mouse.move(15,15);await frames();
    await page.locator('[data-workbench-goals-open]').click();const goals=page.locator('[data-workbench-goals]');await goals.waitFor();await goals.getByText('还没有目标',{exact:true}).waitFor();
    await underlayCheck('goals-'+mode,goals);
    // A covered lower toolbar must not receive clicks; uncovered navigation stays usable.
    const box=await goals.boundingBox();
    assert.equal(await page.evaluate(({x,y})=>document.elementsFromPoint(x,y).some(e=>e.matches('[data-toolbar-density],.cn-node')),{x:box.x+100,y:box.y+35}),false);
    await goals.press('Escape');await goals.waitFor({state:'hidden'});await frames();assert.equal(await page.locator('[data-dev-occluded]').count(),0,'Closing goals restores the entire workbench');
    await card.click();const drawer=page.locator('[data-canvas-drawer="session"]');await drawer.waitFor();await underlayCheck('session-drawer-'+mode,drawer);
    await page.locator('[data-drawer-more]').click();const menu=page.locator('[data-drawer-more-menu]');await menu.waitFor();await underlayCheck('nested-menu-'+mode,menu);
    await page.locator('[data-drawer-more]').click();
    const before=await drawer.boundingBox();await page.locator('[data-drawer-resize]').focus();await page.locator('[data-drawer-resize]').press('ArrowLeft');await frames();assert.ok((await drawer.boundingBox()).width>before.width);await underlayCheck('resized-drawer-'+mode,drawer);
    config.enabled=false;await save();assert.equal(await page.locator('[data-dev-occluded]').count(),0,'Disabling wallpaper restores native rendering');config.enabled=true;await save();await underlayCheck('reenabled-drawer-'+mode,drawer);
    await page.keyboard.press('Escape');await drawer.waitFor({state:'hidden'});await frames();assert.equal(await page.locator('[data-dev-occluded]').count(),0);
    await settings();await capture('settings-'+mode);assert.equal(await page.getByText('应用渲染异常',{exact:true}).count(),0);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('open-settings-tab',{detail:'skills'})));
    await page.getByRole('button',{name:'📥 导入',exact:true}).click();
    const importMenu=page.locator('div.absolute[class*="z-50"]').filter({has:page.getByRole('button',{name:/从 URL \/ GitHub 导入/})});await importMenu.waitFor();await underlayCheck('skill-import-menu-'+mode,importMenu);
    await importMenu.getByRole('button',{name:/从 URL \/ GitHub 导入/}).click();
    const dialog=page.locator('div.fixed.inset-0').filter({has:page.locator('input[placeholder*="GitHub"]')}).last();await dialog.waitFor();await underlayCheck('skill-import-dialog-'+mode,dialog.locator(':scope > div').first());
    await dialog.getByRole('button',{name:'取消',exact:true}).click();await dialog.waitFor({state:'hidden'});
    await page.getByText('返回工作区',{exact:true}).click();await frames();
    report.checks[mode+'CloseResizeDisableAndSettings']=true;
  }
  assert.equal(report.errors.length,0,report.errors.join('\n'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed()){await capture('failure').catch(()=>{});report.layers=await page.evaluate(()=>[...document.querySelectorAll('[data-dev-occluded]')].map(e=>({tag:e.tagName,cls:e.className,clip:e.style.getPropertyValue('--dev-occlusion-clip')}))).catch(()=>[]);}}
finally{if(app)await app.close();for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}fs.writeFileSync(path.join(artifacts,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
