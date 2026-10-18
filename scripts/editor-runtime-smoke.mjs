import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const data=path.join(root,'.test-data','editor-runtime-'+Date.now());
const file=path.join(data,'README-二开.md');
fs.mkdirSync(data,{recursive:true});fs.writeFileSync(file,'# Local README\nEDITOR_OFFLINE_FIXTURE\n');
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useFileTabStore','useUIStore'].map(name=>[name,source.match(new RegExp(name+' as (\\w+)'))[1]]));
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},errors:[],scope:'Real Monaco renderer, local CSS, worker diagnostics and file contents with network disabled. Slow/error scenarios intercept only insertion of the loader script; the subsequent loader and editor assets are real.'};
const backups=[];let app,page;
try {
  for(const scheme of ['shineai-dev','spectrai-dev','claudeops-dev']) {
    const key='HKCU\\Software\\Classes\\'+scheme,backup=path.join(data,scheme+'.reg');
    try{execFileSync('reg.exe',['export',key,backup,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,backup});}catch{backups.push({key});}
  }
  ({app,page}=await openTestApp(data,{auth:19476,meeting:18246},executable));
  assert.equal(path.resolve((await page.evaluate(()=>window.development.getRuntimeInfo())).userData),path.resolve(data));
  page.on('pageerror',error=>report.errors.push(error.message));
  const remote=[];
  page.on('request',request=>{if(/^https?:/.test(request.url())&&/monaco|\/vs\//.test(request.url()))remote.push(request.url());});
  await completeOnboarding(page);
  await page.context().setOffline(true);
  async function openReadme() {
    await page.evaluate(async({aliases,file})=>{
      const m=await import('./assets/index-0LVJEr5c.js');
      m[aliases.useUIStore].getState().setActiveWorkspace('project');
      m[aliases.useUIStore].setState({newSessionEntryActive:false});
      window.editorTestTabs=m[aliases.useFileTabStore];
      await window.editorTestTabs.getState().openFile(file);
      m[aliases.useUIStore].getState().setMarkdownViewMode('source');
      m[aliases.useUIStore].getState().openViewBesideMain('files');
    },{aliases,file});
  }
  async function expectEditor() {
    await page.locator('.monaco-editor:visible').waitFor({timeout:20000});
    await page.waitForFunction(()=>window.monaco?.editor.getModels().some(m=>m.getValue().includes('EDITOR_OFFLINE_FIXTURE')));
    assert.equal(await page.locator('textarea[readonly].resize-none:visible').count(),0);
  }
  await openReadme();await expectEditor();
  const details=await page.evaluate(async()=>{
    const css=[...document.styleSheets].find(sheet=>sheet.href?.includes('/monaco/vs/editor/editor.main.css'));
    const model=window.monaco.editor.createModel('{"value": }','json',window.monaco.Uri.parse('inmemory://editor-test/invalid.json'));
    try {
      const createWorker=await window.monaco.languages.json.getWorker(),worker=await createWorker(model.uri);
      const diagnostics=await worker.doValidation(model.uri.toString());
      return {localLoader:[...document.scripts].some(s=>s.src.startsWith('file:')&&s.src.endsWith('/monaco/vs/loader.js')),cssLoaded:!!css?.cssRules.length,diagnostics:diagnostics.length};
    } finally { model.dispose(); }
  });
  assert.equal(details.localLoader,true);assert.equal(details.cssLoaded,true);assert.ok(details.diagnostics>0);
  assert.ok(page.workers().length>0,'Language diagnostics must use a real local worker');
  assert.equal(remote.length,0);report.checks.offlineReadmeEditorAndStyles=true;report.checks.localJsonWorkerDiagnostics=true;
  await page.screenshot({path:path.join(root,'artifacts',executable?'installed-editor-offline.png':'editor-offline.png')});
  await page.addInitScript(()=>{
    const append=Node.prototype.appendChild;
    Node.prototype.appendChild=function(node){
      if(node instanceof HTMLScriptElement&&node.src.endsWith('/monaco/vs/loader.js')) {
        if(sessionStorage.editorTestScenario==='slow') {setTimeout(()=>append.call(this,node),6200);return node;}
        if(sessionStorage.editorTestScenario==='fail') {sessionStorage.editorTestScenario='retry';setTimeout(()=>node.onerror?.(new Event('error')),0);return node;}
      }
      return append.call(this,node);
    };
  });
  await page.evaluate(()=>{sessionStorage.editorTestScenario='slow';});await page.reload();
  await page.waitForFunction(()=>!!window.development?.chatFiles&&document.querySelector('#root')?.children.length);
  await openReadme();
  await page.getByText('编辑器加载较慢，完成后会自动恢复。',{exact:true}).waitFor({timeout:10000});
  await expectEditor();assert.equal(await page.getByText('编辑器加载较慢，完成后会自动恢复。',{exact:true}).count(),0);
  report.checks.slowLoadAutomaticallyRecoversAfterFiveSeconds=true;
  await page.evaluate(()=>{sessionStorage.editorTestScenario='fail';});await page.reload();
  await page.waitForFunction(()=>!!window.development?.chatFiles&&document.querySelector('#root')?.children.length);
  await openReadme();
  await page.getByRole('button',{name:'重试编辑器',exact:true}).waitFor();
  await page.getByRole('button',{name:'重试编辑器',exact:true}).click();
  await expectEditor();report.checks.failedLoadRetriesSuccessfully=true;
  // The previous file-boundary fix must remain read-only after Monaco is ready.
  await page.evaluate(()=>{const store=window.editorTestTabs;store.setState(s=>({tabs:s.tabs.map(t=>({...t,isEditable:false}))}));});
  await page.waitForFunction(()=>window.monaco.editor.getEditors().some(editor=>editor.getModel()?.getValue().includes('EDITOR_OFFLINE_FIXTURE')&&editor.getOption(window.monaco.editor.EditorOption.readOnly)));
  report.checks.readOnlyTabsStayReadOnlyInMonaco=true;
  assert.equal(remote.length,0);assert.equal(report.errors.length,0);
} catch(error) {report.errors.push(error.stack);process.exitCode=1;
  if(page&&!page.isClosed())report.failureState=await page.evaluate(()=>({
    development:!!window.development,chatFiles:!!window.development?.chatFiles,
    bridge:!!window.shineAI,rootChildren:document.querySelector('#root')?.children.length,
    readyState:document.readyState
  })).catch(()=>null);
}
finally {
  if(page&&process.exitCode)await page.screenshot({path:path.join(root,'artifacts/editor-runtime-failure.png')}).catch(()=>{});
  if(app)await app.close();
  for(const {key,backup} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(backup)execFileSync('reg.exe',['import',backup],{stdio:'ignore',windowsHide:true});}
  fs.writeFileSync(path.join(root,'artifacts',executable?'installed-editor-runtime-report.json':'editor-runtime-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
