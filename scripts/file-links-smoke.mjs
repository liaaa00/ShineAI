import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const data=path.join(root,'.test-data','file-links-'+Date.now()),workspace=path.join(data,'中文 项目');
const dir=path.join(workspace,'social-multi-upload'),file=path.join(dir,'SKILL.md');
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,'# Skill fixture\nTarget line two\nLast line\n');
fs.writeFileSync(path.join(workspace,'示例 视频.mp4'),'fixture');
fs.writeFileSync(path.join(workspace,'sample.cmd'),'DO NOT EXECUTE');
fs.writeFileSync(path.join(workspace,'sample.html'),'<script>window.chatFileExecuted=true</script>');
fs.writeFileSync(path.join(workspace,'pixel.png'),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=','base64'));
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},errors:[],scope:'Real rendered chat links open actual file contents beside the conversation through existing validated file IPC; no model calls. Native shell intercepted at its final layer.'};
const backups=[];let app,page;
try {
  for(const scheme of ['shineai-dev','spectrai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,backup=path.join(data,scheme+'.reg');try{execFileSync('reg.exe',['export',key,backup,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,backup});}catch{backups.push({key});}}
  ({app,page}=await openTestApp(data,{auth:19475,meeting:18245},executable));
  assert.equal(path.resolve((await page.evaluate(()=>window.development.getRuntimeInfo())).userData),path.resolve(data));
  // Exercise the old installed bridge as well as the renamed engineering build.
  await page.evaluate(()=>{if(!window.shineAI)window.shineAI=window.spectrAI;});
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
    '[HTML 源码](sample.html)',
    '[图片文件](pixel.png)',
    '[不存在的文件](missing/SKILL.md)',
    '[示例网页](https://example.com/skills)',
    '[危险协议](javascript:alert%281%29)',
    '```js\nconsole.log("SKILL.md")\n```'
  ].join('\n\n');
  const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
  const aliases=Object.fromEntries(['useSessionStore','useUIStore','useFileTabStore'].map(n=>[n,source.match(new RegExp(n+' as (\\w+)'))[1]]));
  await page.evaluate(async({aliases,workspace,content})=>{
    const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore],id='file-links-fixture';
    window.fileLinkTabs=m[aliases.useFileTabStore];
    window.fileLinkReveals=[];
    window.fileLinkTabs.subscribe(state=>{for(const tab of state.tabs)if(tab.pendingReveal)window.fileLinkReveals.push({path:tab.path,...tab.pendingReveal});});
    s.setState({sessions:[{id,name:'文件路径点击测试',status:'idle',startedAt:Date.now(),config:{providerId:'codex',model:'fixture',workingDirectory:workspace},workingDirectory:workspace}],selectedSessionId:id});
    m[aliases.useUIStore].getState().setActiveWorkspace('project');
    m[aliases.useUIStore].setState({newSessionEntryActive:false});
    await s.getState().openSessionForChat(id);
    s.setState({conversations:{[id]:[{id:'answer',role:'assistant',timestamp:Date.now(),content}]},conversationLoading:{}});
  },{aliases,workspace,content});
  await page.getByRole('link',{name:'查看 SKILL.md',exact:true}).waitFor();
  const activeTab=()=>page.evaluate(()=>{const s=window.fileLinkTabs.getState();return s.tabs.find(t=>t.id===s.activeTabId);});
  async function nextNativeCall(count) {
    return app.evaluate(async (_electron,count)=>{
      const deadline=Date.now()+5000;
      while(globalThis.fileLinkCalls.length<=count&&Date.now()<deadline)await new Promise(r=>setTimeout(r,25));
      return globalThis.fileLinkCalls[count];
    },count);
  }
  async function expectFile(expected) {
    await page.waitForFunction(p=>{const s=window.fileLinkTabs.getState(),t=s.tabs.find(t=>t.id===s.activeTabId);return t?.path.replaceAll('\\','/')===p.replaceAll('\\','/')&&!t.isLoading;},expected);
    const tab=await activeTab();
    assert.equal(tab.error,undefined,JSON.stringify(tab));
    return tab;
  }
  for(const [label,expected] of [
    ['查看 SKILL.md',file],
    ['含行号',file],
    ['中文空格 file URL',file],
    ['脚本文件',path.join(workspace,'sample.cmd')],
    ['HTML 源码',path.join(workspace,'sample.html')]
  ]) {
    const count=await app.evaluate(()=>globalThis.fileLinkCalls.length);
    await page.getByRole('link',{name:label,exact:true}).click();
    const tab=await expectFile(expected);
    assert.equal(tab.content,fs.readFileSync(expected,'utf8'));
    assert.equal(await app.evaluate(()=>globalThis.fileLinkCalls.length),count);
    report.checks[label]=true;
    if(label==='含行号') await page.waitForFunction(()=>
      [...document.querySelectorAll('.monaco-editor .line-numbers.active-line-number')].some(e=>e.getBoundingClientRect().width>0&&e.textContent.trim()==='2') ||
      [...document.querySelectorAll('textarea[readonly]')].some(e=>e.getBoundingClientRect().width>0&&e.value.slice(0,e.selectionStart).split('\n').length===2));
    if(label==='查看 SKILL.md') {
      const editor=page.locator('.monaco-editor:visible, textarea[readonly]:visible').last();
      await editor.waitFor();
      await page.waitForFunction(()=>[...document.querySelectorAll('.monaco-editor .view-lines,textarea[readonly]')].some(e=>e.getBoundingClientRect().width>0&&(e.value||e.textContent).replace(/\s/g,' ').includes('Target line two')));
      const chat=await page.getByRole('link',{name:label,exact:true}).boundingBox(),pane=await editor.boundingBox();
      assert.ok(chat&&pane&&pane.x>=chat.x+chat.width,'File editor must be beside the still visible chat');
      await page.screenshot({path:path.join(root,'artifacts/file-links-side-panel.png')});
      report.checks.actualContentVisibleBesideChat=true;
    }
  }
  assert.ok(await page.evaluate(p=>window.fileLinkReveals.some(r=>r.path.replaceAll('\\','/')===p.replaceAll('\\','/')&&r.lineNumber===2&&r.column===1),file));
  assert.equal(await page.evaluate(()=>window.chatFileExecuted),undefined);
  report.checks.lineNumberAndHtmlSource=true;
  await page.getByRole('link',{name:'图片文件',exact:true}).click();
  assert.equal((await expectFile(path.join(workspace,'pixel.png'))).previewMode,'image');
  await page.waitForFunction(()=>{const img=document.querySelector('img[alt="pixel.png"]');return img?.complete&&img.naturalWidth>0;});
  report.checks.imagePreview=true;
  for(const [display,expected] of [['social-multi-upload/SKILL.md',file],[path.join(workspace,'示例 视频.mp4'),path.join(workspace,'示例 视频.mp4')]]) {
    await page.getByRole('button',{name:display,exact:true}).click();await expectFile(expected);
  }
  report.checks.inlineRelativeAndAbsolutePaths=true;
  await page.evaluate(p=>{const s=window.fileLinkTabs.getState(),t=s.tabs.find(t=>t.path.replaceAll('\\','/')===p.replaceAll('\\','/'));s.updateContent(t.id,'Unsaved fixture edit');},file);
  await page.getByRole('link',{name:'查看 SKILL.md',exact:true}).click();
  const dirty=await expectFile(file);
  assert.equal(dirty.content,'Unsaved fixture edit');assert.equal(dirty.isDirty,true);
  assert.equal(await page.evaluate(p=>window.fileLinkTabs.getState().tabs.filter(t=>t.path.replaceAll('\\','/')===p.replaceAll('\\','/')).length,file),1);
  report.checks.repeatClickPreservesUnsavedChanges=true;
  const folderCount=await app.evaluate(()=>globalThis.fileLinkCalls.length);
  await page.getByRole('link',{name:'打开技能文件夹',exact:true}).click();
  // Directory links retain their explicit folder behavior.
  const folder=await nextNativeCall(folderCount);
  assert.equal(folder.kind,'directory');assert.equal(path.normalize(folder.path),dir);
  report.checks.directoryLinksUnchanged=true;
  const before=await app.evaluate(()=>globalThis.fileLinkCalls.length);
  await page.getByRole('link',{name:'不存在的文件',exact:true}).click();
  await page.waitForFunction(()=>{const s=window.fileLinkTabs.getState();return s.tabs.find(t=>t.id===s.activeTabId)?.readStatus==='error';});
  const missing=await activeTab();assert.ok(missing.error);
  await page.getByText(missing.error,{exact:false}).waitFor();
  assert.equal(await app.evaluate(()=>globalThis.fileLinkCalls.length),before);
  report.checks.missingPathShowsErrorWithoutFallback=true;
  await page.getByRole('link',{name:'危险协议',exact:true}).click();await page.waitForTimeout(150);
  assert.equal(await app.evaluate(()=>globalThis.fileLinkCalls.length),before);
  report.checks.unsafeSchemeDoesNotOpen=true;
  await page.getByRole('link',{name:'示例网页',exact:true}).click();
  const external=await nextNativeCall(before);assert.equal(external.kind,'external');assert.equal(external.path,'https://example.com/skills');
  report.checks.webLinksUnchanged=true;
  assert.equal(await page.locator('pre .markdown-filepath-link').count(),0);
  report.checks.codeBlocksUnchanged=true;
  // A persisted session is essential: synthetic IDs fall back to legacy read
  // permissions and cannot reproduce the user's restricted-session failure.
  const sessionResult=await page.evaluate(workingDirectory=>window.shineAI.session.create({name:'File preview permission fixture',providerId:'codex',workingDirectory,directoryAccessMode:'extended',worktreeEnabled:false}),workspace);
  assert.equal(sessionResult.success,true,JSON.stringify(sessionResult));
  const realSessionId=sessionResult.sessionId||sessionResult.session?.id||sessionResult.id;
  assert.ok(realSessionId);
  const externalDir=path.join(root,'.test-data','external-preview-'+Date.now()),outsideFile=path.join(externalDir,'范围外文件.txt');
  fs.mkdirSync(externalDir,{recursive:true});fs.writeFileSync(outsideFile,'EXTERNAL_READ_ONLY_PREVIEW');
  fs.writeFileSync(path.join(externalDir,'neighbor.txt'),'NOT_GRANTED');
  const context={sessionId:realSessionId};
  assert.equal((await page.evaluate(({p,context})=>window.shineAI.fileManager.readFile(p,context),{p:outsideFile,context})).kind,'error');
  await app.evaluate(({dialog})=>{
    globalThis.chatFileDialogs=[];globalThis.chatFileResponse=1;
    dialog.showMessageBox=async(...args)=>{globalThis.chatFileDialogs.push(args.at(-1));return {response:globalThis.chatFileResponse};};
  });
  const canceled=await page.evaluate(({p,context})=>window.development.chatFiles.prepare(p,context),{p:outsideFile,context});
  assert.equal(canceled.canceled,true);
  assert.equal((await page.evaluate(({p,context})=>window.shineAI.fileManager.readFile(p,context),{p:outsideFile,context})).kind,'error');
  report.checks.cancelDoesNotGrantRead=true;
  await app.evaluate(()=>{globalThis.chatFileResponse=0;});
  await page.evaluate(async({aliases,realSessionId,workspace,outsideFile})=>{
    const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];
    s.setState({sessions:[{id:realSessionId,name:'范围外文件预览测试',status:'idle',config:{workingDirectory:workspace,directoryAccessMode:'extended'}}],selectedSessionId:realSessionId});
    await s.getState().openSessionForChat(realSessionId);
    s.setState({conversations:{[realSessionId]:[{id:'outside',role:'assistant',timestamp:Date.now(),content:'[打开范围外文件]('+outsideFile.replaceAll('\\','/')+')'}]},conversationLoading:{}});
  },{aliases,realSessionId,workspace,outsideFile});
  await page.getByRole('link',{name:'打开范围外文件',exact:true}).click();
  const preview=await expectFile(outsideFile);
  assert.equal(preview.content,'EXTERNAL_READ_ONLY_PREVIEW');assert.equal(preview.isEditable,false);
  await page.waitForFunction(()=>[...document.querySelectorAll('.monaco-editor .view-lines,textarea[readonly]')].some(e=>e.getBoundingClientRect().width>0&&(e.value||e.textContent).includes('EXTERNAL_READ_ONLY_PREVIEW')));
  await page.screenshot({path:path.join(root,'artifacts',executable?'installed-outside-file-preview.png':'outside-file-preview.png')});
  const denied=await page.evaluate(async({outsideFile,context})=>({
    write:await window.shineAI.fileManager.writeFile(outsideFile,'MUST_NOT_WRITE',context),
    neighbor:await window.shineAI.fileManager.readFile(outsideFile.replace('范围外文件.txt','neighbor.txt'),context)
  }),{outsideFile,context});
  assert.ok(denied.write.error);assert.equal(denied.neighbor.kind,'error');
  assert.equal(fs.readFileSync(outsideFile,'utf8'),'EXTERNAL_READ_ONLY_PREVIEW');
  const count=await app.evaluate(()=>globalThis.chatFileDialogs.length);
  await page.getByRole('link',{name:'打开范围外文件',exact:true}).click();
  assert.equal(await app.evaluate(()=>globalThis.chatFileDialogs.length),count);
  const system=await page.evaluate(()=>window.development.chatFiles.prepare('C:\\Windows\\System32\\drivers\\etc\\hosts'));
  assert.equal(system.success,false);assert.equal(await app.evaluate(()=>globalThis.chatFileDialogs.length),count);
  report.checks.outsideFileVisibleReadOnlyInSidePanel=true;
  report.checks.previewGrantsNoWriteOrNeighborAccess=true;
  report.checks.repeatPreviewDoesNotPromptAgain=true;
  report.checks.systemPathsRemainProtected=true;
  const outsideImage=path.join(externalDir,'范围外图片.png');
  fs.copyFileSync(path.join(workspace,'pixel.png'),outsideImage);
  await page.evaluate(async({aliases,realSessionId,outsideImage})=>{
    const m=await import('./assets/index-0LVJEr5c.js');
    m[aliases.useSessionStore].setState({conversations:{[realSessionId]:[{id:'outside-image',role:'assistant',timestamp:Date.now(),content:'[打开范围外图片]('+outsideImage.replaceAll('\\','/')+')'}]}});
  },{aliases,realSessionId,outsideImage});
  await page.getByRole('link',{name:'打开范围外图片',exact:true}).click();
  assert.equal((await expectFile(outsideImage)).previewMode,'image');
  await page.waitForFunction(()=>{const img=document.querySelector('img[alt="范围外图片.png"]');return img?.complete&&img.naturalWidth>0;});
  report.checks.outsideImageDecodesAfterConsent=true;
  assert.equal(report.errors.length,0);
} catch(error) {report.errors.push(error.stack);process.exitCode=1;}
finally {
  if(page&&process.exitCode)await page.screenshot({path:path.join(root,'artifacts/file-links-failure.png')}).catch(()=>{});
  if(app)await app.close();
  for(const {key,backup} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(backup)execFileSync('reg.exe',['import',backup],{stdio:'ignore',windowsHide:true});}
  fs.writeFileSync(path.join(root,'artifacts',executable?'installed-file-links-report.json':'file-links-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
