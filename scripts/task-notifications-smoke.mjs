import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const data=path.join(root,'.test-data','task-notifications-'+Date.now());
fs.mkdirSync(data,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore'].map(name=>[name,source.match(new RegExp(name+' as (\\w+)'))[1]]));
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},errors:[],scope:'Actual task notification manager from the application bundle, native Notification display replaced with EventEmitter. Emitted clicks exercise the real BrowserWindow, preload event and rendered conversation. No model calls or OS toast clicks.'};
const backups=[];let app,page;
try {
  for(const scheme of ['shineai-dev','spectrai-dev','claudeops-dev']) {
    const key='HKCU\\Software\\Classes\\'+scheme,backup=path.join(data,scheme+'.reg');
    try{execFileSync('reg.exe',['export',key,backup,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,backup});}catch{backups.push({key});}
  }
  ({app,page}=await openTestApp(data,{auth:19477,meeting:18247},executable));
  assert.equal(path.resolve((await page.evaluate(()=>window.development.getRuntimeInfo())).userData),path.resolve(data));
  page.on('pageerror',error=>report.errors.push(error.message));await completeOnboarding(page);
  await app.evaluate(({app,BrowserWindow})=>{
    const fs=process.getBuiltinModule('fs'),path=process.getBuiltinModule('path'),vm=process.getBuiltinModule('vm');
    const {createRequire}=process.getBuiltinModule('module');const require=createRequire(path.join(app.getAppPath(),'out/main/index.js'));
    const source=fs.readFileSync(path.join(app.getAppPath(),'out/main/index.js'),'utf8');
    const start=source.indexOf('class Jwe extends'),end=source.indexOf('class Zwe',start);
    if(start<0||end<0)throw Error('Notification manager layout changed');
    const {EventEmitter}=require('node:events');
    globalThis.taskNotifications=[];
    class Notification extends EventEmitter {
      constructor(options){super();this.options=options;}
      show(){globalThis.taskNotifications.push(this);}
    }
    const getWindow=()=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));
    const Manager=vm.compileFunction(source.slice(start,end)+';return Jwe;',['c','r','p','a7z','require','YI'])({EventEmitter},{Notification},{t:key=>key},()=>{},require,getWindow);
    globalThis.taskNotificationManager=new Manager();globalThis.taskNotificationWindow=getWindow;
  });
  async function fixtures() {
    await page.evaluate(async({aliases,data})=>{
      const m=await import('./assets/index-0LVJEr5c.js');window.notificationSessions=m[aliases.useSessionStore];window.notificationUI=m[aliases.useUIStore];
      const sessions=['idle','completed'].map((status,i)=>({id:'notification-'+i,name:'通知目标 '+i,status,startedAt:Date.now(),workingDirectory:data,config:{providerId:'codex',model:'fixture',workingDirectory:data}}));
      const conversations=Object.fromEntries(sessions.map(s=>[s.id,[{id:'answer-'+s.id,role:'assistant',timestamp:Date.now(),content:'NOTIFICATION_CONVERSATION_'+s.id}]]));
      window.notificationSessions.setState({sessions,selectedSessionId:null,conversations,conversationLoading:{}});
      window.notificationUI.getState().setActiveWorkspace('settings');
    },{aliases,data});
  }
  await fixtures();
  for(const [i,mode] of [[0,'hidden'],[1,'minimized']]) {
    await page.evaluate(()=>window.notificationUI.getState().setActiveWorkspace('settings'));
    const hidden=await app.evaluate(async(_electron,{i,mode})=>{
      const manager=globalThis.taskNotificationManager,window=globalThis.taskNotificationWindow();
      const count=globalThis.taskNotifications.length;
      manager.onTaskCompleted('notification-'+i,'通知目标 '+i);
      if(globalThis.taskNotifications.length!==count+1)throw Error('Task notification not shown');
      if(mode==='hidden')window.hide();else window.minimize();
      const deadline=Date.now()+4000;
      while((mode==='hidden'?window.isVisible():!window.isMinimized())&&Date.now()<deadline)await new Promise(r=>setTimeout(r,30));
      const before=mode==='hidden'?!window.isVisible():window.isMinimized();
      globalThis.taskNotifications.at(-1).emit('click');return before;
    },{i,mode});
    assert.equal(hidden,true,'Window must actually be hidden/minimized before click');
    await page.getByText('NOTIFICATION_CONVERSATION_notification-'+i,{exact:true}).waitFor({timeout:15000});
    await page.waitForFunction(id=>window.notificationSessions.getState().selectedSessionId===id,'notification-'+i);
    const state=await app.evaluate(()=>{const w=globalThis.taskNotificationWindow();return {visible:w.isVisible(),minimized:w.isMinimized(),focused:w.isFocused()};});
    assert.deepEqual(state,{visible:true,minimized:false,focused:true});
    assert.equal(await page.evaluate(()=>window.notificationUI.getState().activeWorkspace),'project');
    report.checks[mode+'WindowOpensCorrectConversation']=true;
  }
  assert.equal(await page.evaluate(()=>window.notificationSessions.getState().sessions.find(s=>s.id==='notification-1').status),'completed');
  report.checks.completedTaskOpensWithoutRestartingModel=true;
  await app.evaluate(()=>{
    const m=globalThis.taskNotificationManager;
    m.onTaskCompleted('notification-1','重复通知');
    if(globalThis.taskNotifications.length!==2)throw Error('Duplicate notification suppression changed');
    m.updateConfig({enabled:false});m.onError('muted','静音','fixture');
    if(globalThis.taskNotifications.length!==2)throw Error('Disabled notifications must not show');
    m.updateConfig({enabled:true,doNotDisturb:{enabled:true,start:'00:00',end:'24:00'}});
    m.onSessionStuck('dnd','勿扰');if(globalThis.taskNotifications.length!==2)throw Error('Do not disturb changed');
    m.updateConfig({doNotDisturb:{enabled:false},sound:false});m.onConfirmationNeeded('notification-0','确认');
    if(globalThis.taskNotifications.at(-1).options.silent!==true)throw Error('Silent setting changed');
    globalThis.taskNotificationWindow().hide();globalThis.taskNotifications.at(-1).emit('click');
  });
  await page.getByText('NOTIFICATION_CONVERSATION_notification-0',{exact:true}).waitFor();
  report.checks.confirmationClickAndNotificationSettingsPreserved=true;
  // Verify the real event subscription is restored after a renderer reload.
  await page.reload();
  await page.waitForFunction(()=>!!(window.shineAI||window.spectrAI)?.session);
  await fixtures();
  await page.evaluate(()=>window.notificationUI.getState().setActiveWorkspace('settings'));
  await app.evaluate(()=>{const w=globalThis.taskNotificationWindow();w.webContents.send('butler:navigate-session','notification-1');});
  await page.getByText('NOTIFICATION_CONVERSATION_notification-1',{exact:true}).waitFor();
  report.checks.navigationAfterReload=true;
  await page.screenshot({path:path.join(root,'artifacts',executable?'installed-task-notifications.png':'task-notifications.png')});
  assert.equal(report.errors.length,0);
} catch(error){report.errors.push(error.stack);process.exitCode=1;}
finally {
  if(app)await app.close();
  for(const {key,backup} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(backup)execFileSync('reg.exe',['import',backup],{stdio:'ignore',windowsHide:true});}
  fs.writeFileSync(path.join(root,'artifacts',executable?'installed-task-notifications-report.json':'task-notifications-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
