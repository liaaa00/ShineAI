import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const directory=path.join(root,'artifacts/manual-text');fs.mkdirSync(directory,{recursive:true});
const data=path.join(root,'.test-data','manual-text-'+Date.now());fs.mkdirSync(data,{recursive:true});
const report={checks:{},errors:[],scope:'Isolated desktop profile, generated wallpaper, actual controls and computed styles; no model requests'};
const backups=[];let app,page;
async function open(){({app,page}=await openTestApp(data,{auth:19553,meeting:18353},executable));page.on('pageerror',e=>report.errors.push(e.message));}
async function settings(){await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByText('全部设置',{exact:true}).click();await page.getByRole('button',{name:'外观',exact:true}).click();await page.locator('.dev-appearance').waitFor();}
async function saved(){await page.waitForFunction(()=>document.querySelector('.dev-appearance [role=status]')?.textContent==='已保存到本机');}
async function snapshot(){return (await page.evaluate(()=>window.development.appearance.get())).config;}
async function sample(){return page.locator('.dev-preview h4').evaluate(e=>{const s=getComputedStyle(e);return {color:s.color,shadow:s.textShadow,font:s.fontFamily,weight:s.fontWeight,size:s.fontSize};});}
async function pickColor(label,color){await page.getByLabel(label,{exact:true}).evaluate((e,c)=>{e.value=c;e.dispatchEvent(new Event('input',{bubbles:true}));},color);await saved();}
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){
  const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(directory,scheme+'.reg');
  try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}
 }
 await open();await completeOnboarding(page);await settings();
 const baseline=await sample();const initial=await snapshot();
 assert.equal(initial.light.text.enabled,false);assert.equal(initial.dark.text.enabled,false);
 assert.equal(await page.getByLabel('手动调整文字',{exact:true}).isChecked(),false);
 const image=path.join(data,'wallpaper.png');
 const encoded=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const g=c.getContext('2d');const gradient=g.createLinearGradient(0,0,1280,0);gradient.addColorStop(0,'#0a1729');gradient.addColorStop(0.5,'#7f8ba5');gradient.addColorStop(1,'#f4efe6');g.fillStyle=gradient;g.fillRect(0,0,1280,720);return c.toDataURL().split(',')[1];});
 fs.writeFileSync(image,Buffer.from(encoded,'base64'));
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},image);
 await page.locator('[data-action="import"]').click();await saved();
 await page.locator('[data-preset="original"]').click();await saved();
 assert.deepEqual(await sample(),baseline);
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.devTextOutline),'off');
 report.checks.defaultFontAndColorUnchangedWithWallpaper=true;
 const wallpaperBefore=await snapshot();
 await page.getByLabel('手动调整文字',{exact:true}).check();await saved();
 const outlined=await sample();assert.notEqual(outlined.shadow,'none');
 for(const field of ['font','weight','size','color'])assert.equal(outlined[field],baseline[field]);
 report.checks.outlineDoesNotReplaceFontOrIncreaseWeight=true;
 await page.getByLabel('描边宽度',{exact:true}).fill('0.3');await saved();
 await page.getByLabel('描边强度',{exact:true}).fill('35');await saved();
 const protectedBefore=await page.locator('.dev-preview code').evaluate(e=>({color:getComputedStyle(e).color,shadow:getComputedStyle(e).textShadow}));
 await page.getByLabel('文字颜色模式',{exact:true}).selectOption('custom');await saved();
 await pickColor('自定义文字颜色','#f4e7b7');await pickColor('描边颜色','#101820');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.dev-preview h4')).color==='rgb(244, 231, 183)');
 const protectedAfter=await page.locator('.dev-preview code').evaluate(e=>({color:getComputedStyle(e).color,shadow:getComputedStyle(e).textShadow}));
 assert.deepEqual(protectedAfter,protectedBefore);assert.equal(protectedAfter.shadow,'none');
 const controlsColor=await page.locator('.dev-text-heading').evaluate(e=>getComputedStyle(e).color);assert.notEqual(controlsColor,'rgb(244, 231, 183)');
 // A semantic color is an explicit child color, so normal status/link palettes survive.
 assert.equal(await page.evaluate(()=>{const e=document.createElement('span');e.style.color='#cf222e';document.querySelector('#root').append(e);const value=getComputedStyle(e).color;e.remove();return value;}),'rgb(207, 34, 46)');
 report.checks.manualColorPreservesCodeSemanticColorsAndSettingReadability=true;
 const configured=await snapshot();
 for(const key of ['strength','mask','transparency','blur','panelBlur'])assert.equal(configured.light[key],wallpaperBefore.light[key]);
 assert.equal(await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=getComputedStyle(document.querySelector('#root')).backgroundColor;ctx.fillRect(0,0,1,1);return ctx.getImageData(0,0,1,1).data[3];}),0);
 report.checks.manualTextDoesNotChangeWallpaperSettings=true;
 await page.screenshot({path:path.join(directory,'light-manual.png')});
 await page.getByLabel('描边强度',{exact:true}).fill('0');await saved();assert.equal((await sample()).shadow,'none');
 await page.getByLabel('描边强度',{exact:true}).fill('35');await saved();
 await page.getByLabel('启用背景',{exact:true}).uncheck();await saved();assert.deepEqual(await sample(),baseline);
 await page.getByLabel('启用背景',{exact:true}).check();await saved();
 report.checks.zeroOutlineAndBackgroundOffRestoreTheme=true;
 await page.getByText('GitHub Dark',{exact:true}).click();await page.waitForFunction(()=>document.documentElement.style.colorScheme==='dark');
 assert.equal(await page.getByLabel('手动调整文字',{exact:true}).isChecked(),false);
 const darkBaseline=await sample();assert.equal(darkBaseline.shadow,'none');
 await page.getByLabel('手动调整文字',{exact:true}).check();await saved();
 await page.getByLabel('描边宽度',{exact:true}).fill('0');await saved();
 const both=await snapshot();assert.deepEqual(both.light.text,configured.light.text);assert.equal(both.dark.text.outlineWidth,0);
 report.checks.lightAndDarkHaveIndependentManualPreferences=true;
 await app.close();app=null;await open();await settings();
 assert.deepEqual(await snapshot(),both);assert.equal((await sample()).shadow,'none');
 report.checks.restartRestoresManualPreferences=true;
 await page.locator('[data-action="reset-text"]').click();await saved();
 const reset=await snapshot();assert.equal(reset.dark.text.enabled,false);assert.deepEqual(reset.light.text,both.light.text);
 const withoutText=c=>{const v=structuredClone(c);delete v.light.text;delete v.dark.text;return v;};
 assert.deepEqual(withoutText(reset),withoutText(both));
 report.checks.resetOnlyCurrentThemeTextAndKeepWallpaper=true;
 await page.screenshot({path:path.join(directory,'dark-default.png')});
 assert.deepEqual(report.errors,[]);
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});}
finally{
 if(app)await app.close();
 for(const {key,file} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(directory,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
