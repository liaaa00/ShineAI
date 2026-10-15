import assert from 'node:assert/strict';
import path from 'node:path';
import {screenshotDifference} from './appearance-pixel-helper.mjs';

export async function detachedMaterial({app,page,config,save,media,artifacts,report}) {
  const opened=app.waitForEvent('window');
  await page.evaluate(()=>window.shineAI.workspaceWindow.openWindow('knowledge'));
  const detached=await opened;await detached.waitForLoadState('domcontentloaded');
  detached.on('pageerror',error=>report.errors.push('Detached: '+error.message));
  await detached.waitForFunction(()=>document.querySelector('#root')?.children.length&&document.documentElement.dataset.devMaterial==='on');
  const files=[];
  for(const [index,id]of media.slice(0,2).entries()){
    config.media=id;await save();
    await detached.waitForFunction(id=>document.querySelector('#dev-background img:not([hidden])')?.src.endsWith(id),id);
    await detached.waitForTimeout(400);
    const file=path.join(artifacts,'detached-knowledge-'+index+'.png');await detached.screenshot({path:file});files.push(file);
  }
  report.pixels.detached=screenshotDifference(files[0],files[1],null,null);assert.ok(report.pixels.detached.changedFraction>.65);
  assert.equal(await detached.locator('#dev-background').count(),1,'One shared wallpaper stage per window');
  config.enabled=false;await save();await detached.waitForFunction(()=>document.documentElement.dataset.devMaterial==='off');
  config.enabled=true;await save();await detached.waitForFunction(()=>document.documentElement.dataset.devMaterial==='on');
  report.checks.detachedWindowBackgroundAndSettingsSync=true;
  await detached.close();
}
