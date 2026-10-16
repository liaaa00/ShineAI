import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root, openTestApp, completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const data = path.join(root, '.test-data', 'workbench-startup-' + Date.now());
const artifacts = path.join(root, 'artifacts', executable ? 'installed-workbench-startup' : 'workbench-startup');
fs.mkdirSync(data, {recursive:true}); fs.mkdirSync(artifacts, {recursive:true});
const report = {executable:executable||'project Electron', checks:{}, errors:[], scope:'Real empty workbench at multiple window sizes and zoom levels, starter input, help, task transition and reload. No model calls.'};
let app, page;
const backups=[];
async function settle() {
  await page.waitForFunction(() => {
    const stage = document.querySelector('.workbench-canvas');
    return stage && parseFloat(getComputedStyle(stage).getPropertyValue('--workbench-composer-space')) > 40;
  });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}
async function checkLayout(name) {
  await settle();
  await page.locator('[data-canvas-onboarding="empty"]').waitFor();
  assert.equal(await page.locator('.react-flow__node-canvasGroup').count(), 0, 'Empty default groups must not overlap the welcome');
  assert.equal(await page.locator('[data-canvas-hint]').count(), 0, 'Detailed help must be closed on startup');
  const geometry=await page.evaluate(() => {
    const box = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    return {welcome:box('[data-canvas-onboarding="empty"]'),composer:box('[data-canvas-composer]'),bodyWidth:innerWidth};
  });
  assert.ok(geometry.welcome.height > 60, JSON.stringify(geometry));
  assert.ok(geometry.welcome.bottom <= geometry.composer.y - 8, JSON.stringify(geometry));
  assert.ok(geometry.composer.x >= 0 && geometry.composer.right <= geometry.bodyWidth, JSON.stringify(geometry));
  // Scrolling the welcome, when needed, must make every starter actionable.
  for (const key of ['code','ask','goal','schedule']) {
    const button=page.locator(`[data-onboarding-starter="${key}"]`);
    await button.scrollIntoViewIfNeeded();
    await button.click({trial:true});
  }
  await page.locator('[data-onboarding-starter="code"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(artifacts,name+'.png'),scale:'css'});
  report.checks[name]=geometry;
}
try {
  for(const scheme of ['shineai-dev','spectrai-dev','claudeops-dev']) {
    const key='HKCU\\Software\\Classes\\'+scheme, file=path.join(data,scheme+'.reg');
    try {execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}
    catch {backups.push({key});}
  }
  ({app,page}=await openTestApp(data,{auth:19476,meeting:18246},executable));
  assert.equal(path.resolve((await page.evaluate(()=>window.development.getRuntimeInfo())).userData).toLowerCase(), path.resolve(data).toLowerCase(), 'UI checks must use an isolated profile');
  report.checks.isolatedProfile=true;
  page.on('pageerror',e=>report.errors.push(e.message));
  await completeOnboarding(page);
  await page.locator('button[aria-label="工作台"]').click();
  for (const [name,width,height,zoom] of [['normal',1400,900,1],['short',1100,680,1],['large-text',1100,680,1.25]]) {
    await app.evaluate(({BrowserWindow},{width,height,zoom})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));w.setContentSize(width,height);w.webContents.setZoomFactor(zoom);},{width,height,zoom});
    await checkLayout(name);
  }
  await page.locator('[data-onboarding-starter="ask"]').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-canvas-composer] textarea')].some(e=>e.value.length>0));
  report.checks.starterPrefillsWithoutRunning=true;
  // The detailed guide remains reachable through the existing toolbar menu.
  const overflow=page.locator('[data-toolbar-density]').getByRole('button',{name:'更多',exact:true});
  await overflow.click();
  const help=page.getByRole('menuitem',{name:'使用说明',exact:true});
  await help.click();
  await page.locator('[data-canvas-hint]').waitFor();
  const guide=await page.locator('[data-canvas-hint]').boundingBox(), composer=await page.locator('[data-canvas-composer]').boundingBox();
  assert.ok(guide.y+guide.height<composer.y);
  await page.locator('[data-canvas-hint] button').click();
  report.checks.helpOpensAwayFromInput=true;
  await page.evaluate(async()=>{
    const m=await import('./assets/index-0LVJEr5c.js');
    m.c.setState({sessions:[{id:'startup-fixture',name:'实际任务仍正常显示',status:'waiting_input',startedAt:Date.now(),config:{providerId:'codex',model:'fixture'},provider:{id:'codex',name:'Codex CLI'}}]});
  });
  await page.locator('.cn-node[data-kind="session"]').waitFor();
  assert.equal(await page.locator('[data-canvas-onboarding="empty"]').count(),0);
  assert.ok(await page.locator('.react-flow__node-canvasGroup').count()>0);
  report.checks.realTasksAndGroupsRemainVisible=true;
  await page.reload();
  await page.locator('button[aria-label="工作台"]').click();
  await checkLayout('reopened');
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));w.setContentSize(1400,900);w.webContents.setZoomFactor(1);});
  await page.locator('[data-toolbar-density]').getByRole('button',{name:'自定义分组',exact:true}).click();
  await page.locator('.react-flow__node-canvasGroup').waitFor();
  assert.equal(await page.locator('[data-canvas-onboarding="empty"]').count(),0);
  report.checks.customGroupsRemainUsableOnEmptyBoard=true;
  assert.equal(report.errors.length,0,report.errors.join('\n'));
} catch(error) {report.errors.push(error.stack);process.exitCode=1;if(page)await page.screenshot({path:path.join(artifacts,'failure.png')}).catch(()=>{});}
finally {
  if(app)await app.close();
  for(const {key,file} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
  fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
