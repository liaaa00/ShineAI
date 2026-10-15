import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const data=path.join(root,'.test-data','file-links-'+Date.now()),workspace=path.join(data,'中文 项目');
const dir=path.join(workspace,'social-multi-upload'),file=path.join(dir,'SKILL.md');
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,'# Skill fixture');
fs.writeFileSync(path.join(workspace,'示例 视频.mp4'),'fixture');
fs.writeFileSync(path.join(workspace,'sample.cmd'),'DO NOT EXECUTE');
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},errors:[],scope:'Real rendered conversation clicks through validated IPC; Explorer shell calls intercepted to assert exact paths without launching files or opening many windows'};
const backups=[];let app,page;
try {
  for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,backup=path.join(data,scheme+'.reg');try{execFileSync('reg.exe',['export',key,backup,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,backup});}catch{backups.push({key});}}
  ({app,page}=await openTestApp(data,{auth:19475,meeting:18245},executable));
  page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
  const created=await page.evaluate(rootPath=>window.shineAI.workspace.create({name:'File link smoke',rootPath,repos:[{repoPath:rootPath,name:'fixture',isPrimary:true}]}),workspace);
  assert.equal(created.success,true);
  await app.evaluate(({shell,ipcMain})=>{
    globalThis.fileLinkCalls=[];
    shell.showItemInFolder=p=>globalThis.fileLinkCalls.push({kind:'select',path:p});
    shell.openPath=async p=>{globalThis.fileLinkCalls.push({kind:'directory',path:p});return '';};
    // The application routes web links through its existing system IPC and
    // may open the built-in browser rather than Electron shell.openExternal.
    ipcMain.removeHandler('system:open-external');
    ipcMain.handle('system:open-external',(_event,p)=>{globalThis.fileLinkCalls.push({kind:'external',path:p});return {success:true};});
  });
  const content=[
    '[查看 SKILL.md](social-multi-upload/SKILL.md)',
    '`social-multi-upload/SKILL.md`',
    '`'+path.join(workspace,'示例 视频.mp4')+'`',
    '[打开技能文件夹](social-multi-upload/)',
    '[含行号](social-multi-upload/SKILL.md#L2)',
    '[中文空格 file URL]('+new URL('file:///'+file.replaceAll('\\','/')).href+')',
    '[脚本文件](sample.cmd)',
    '[不存在的文件](missing/SKILL.md)',
    '[示例网页](https://example.com/skills)',
    '[危险协议](javascript:alert%281%29)',
    '```js\nconsole.log("SKILL.md")\n```'
  ].join('\n\n');
  const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
  const aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
  await page.evaluate(async({aliases,workspace,content})=>{
    const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore],id='file-links-fixture';
    s.setState({sessions:[{id,name:'文件路径点击测试',status:'idle',startedAt:Date.now(),config:{providerId:'codex',model:'fixture',workingDirectory:workspace},workingDirectory:workspace}],selectedSessionId:id});
    m[aliases.useUIStore].getState().setActiveWorkspace('project');
    m[aliases.useUIStore].setState({newSessionEntryActive:false});
    await s.getState().openSessionForChat(id);
    s.setState({conversations:{[id]:[{id:'answer',role:'assistant',timestamp:Date.now(),content}]},conversationLoading:{}});
  },{aliases,workspace,content});
  await page.getByRole('link',{name:'查看 SKILL.md',exact:true}).waitFor();
  for(const [label,expected,kind] of [
    ['查看 SKILL.md',file,'select'],
    ['打开技能文件夹',dir,'directory'],
    ['含行号',file,'select'],
    ['中文空格 file URL',file,'select'],
    ['脚本文件',path.join(workspace,'sample.cmd'),'select']
  ]) {
    const count=await app.evaluate(()=>globalThis.fileLinkCalls.length);
    await page.getByRole('link',{name:label,exact:true}).click();
    await page.waitForFunction(()=>!document.body.innerText.includes('应用渲染异常'));
    await page.waitForTimeout(400);
    const calls=await app.evaluate(()=>globalThis.fileLinkCalls);
    assert.equal(calls.length,count+1,JSON.stringify({label,calls}));
    assert.equal(calls.at(-1).kind,kind);assert.equal(path.normalize(calls.at(-1).path),expected);
    report.checks[label]=true;
  }
  for(const [display,expected] of [['social-multi-upload/SKILL.md',file],[path.join(workspace,'示例 视频.mp4'),path.join(workspace,'示例 视频.mp4')]]) {
    await page.getByRole('button',{name:display,exact:true}).click();await page.waitForTimeout(350);
    const call=await app.evaluate(()=>globalThis.fileLinkCalls.at(-1));assert.equal(call.kind,'select');assert.equal(path.normalize(call.path),expected);
  }
  report.checks.inlineRelativeAndAbsolutePaths=true;
  const before=await app.evaluate(()=>globalThis.fileLinkCalls.length);
  await page.getByRole('link',{name:'不存在的文件',exact:true}).click();
  await page.getByText(/文件或文件夹不存在/).waitFor();
  assert.equal(await app.evaluate(()=>globalThis.fileLinkCalls.length),before);
  report.checks.missingPathShowsErrorWithoutFallback=true;
  await page.getByRole('link',{name:'危险协议',exact:true}).click();await page.waitForTimeout(150);
  assert.equal(await app.evaluate(()=>globalThis.fileLinkCalls.length),before);
  report.checks.unsafeSchemeDoesNotOpen=true;
  await page.getByRole('link',{name:'示例网页',exact:true}).click();await page.waitForTimeout(250);
  const external=await app.evaluate(()=>globalThis.fileLinkCalls.at(-1));assert.equal(external.kind,'external');assert.equal(external.path,'https://example.com/skills');
  report.checks.webLinksUnchanged=true;
  assert.equal(await page.locator('pre .markdown-filepath-link').count(),0);
  report.checks.codeBlocksUnchanged=true;
  assert.equal(report.errors.length,0);
} catch(error) {report.errors.push(error.stack);process.exitCode=1;}
finally {
  if(app)await app.close();
  for(const {key,backup} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(backup)execFileSync('reg.exe',['import',backup],{stdio:'ignore',windowsHide:true});}
  fs.writeFileSync(path.join(root,'artifacts',executable?'installed-file-links-report.json':'file-links-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
