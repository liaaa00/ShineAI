import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
function once(source, before, after) {
  if(source.includes(after)) return source;
  if(source.split(before).length!==2) throw new Error('Notification patch layout changed: '+before.slice(0,90));
  return source.replace(before,after);
}
export function patchTaskNotificationsMain(source) {
  source=once(source,'["sendNotification"](a02,a03){const cSg=a7z;', '["sendNotification"](a02,a03,sessionId){const cSg=a7z;');
  source=once(source,`new r["Notification"]({'title':a02,'body':a03,'silent':!this['config']["sound"]})["show"]();`,
    `require("./extensions/task-notifications.cjs").showTaskNotification({Notification:r.Notification,getMainWindow:YI,title:a02,body:a03,silent:!this.config.sound,sessionId});`);
  for(const type of ['confirmation','taskComplete','error','stuck']) {
    const suffix=type==='error'?",'errorMsg':a04":"";
    const before=`p['t']("mainIpc3:notification.${type}.body",{'sessionName':a03${suffix}}))`;
    source=once(source,before,before.slice(0,-1)+',a02)');
  }
  if(!source.includes('taskCompletionTracker=require(')) source=once(source,'const a0c=new Map(),a0d=new Map(),a0f=new Set(),a0g=new Map();',
    'const a0c=new Map(),a0d=new Map(),taskCompletionTracker=require("./extensions/task-completion-policy.cjs").createTracker({sessions:a02,notifications:a05,isViewed:sessionId=>require("./extensions/task-completion-policy.cjs").isSessionViewed({BrowserWindow:r.BrowserWindow,subscriptions:r3,sessionId})});');
  source=once(source,'notifications:a05,isViewed:sessionId=>', 'notifications:a05,isEligible:session=>!rq(session?.config),isViewed:sessionId=>');
  const oldStart='const a0m=a0g[\'get\'](a0j);';
  const oldEnd='if(a0g["set"](a0j,a0k),';
  const updated='taskCompletionTracker.status(a0j,a0k);if(';
  if (!source.includes(updated)) {
    const start=source.indexOf(oldStart),end=source.indexOf(oldEnd,start);
    if(start<0||end<0)throw new Error('Completion status wiring changed');
    source=source.slice(0,start)+updated+source.slice(end+oldEnd.length);
  }
  source=once(source,'a04["unregisterSession"](),a0f["delete"](a0j),a0g["delete"](a0j);', 'a04["unregisterSession"]();');
  source=once(source,'a02[\'on\']("conversation-message",(a0j,a0k)=>{const bL5=bL2;',
    'a02[\'on\']("conversation-message",(a0j,a0k)=>{const bL5=bL2;taskCompletionTracker.message(a0j,a0k);');
  source=once(source,'a02[\'on\']("activity",(a0j,a0k)=>{const bL9=bL2,',
    'a02[\'on\']("activity",(a0j,a0k)=>{taskCompletionTracker.activity(a0j,a0k);const bL9=bL2,');
  source=once(source,'await a06["sendMessage"](a02,a0a,this["buildAdapterSendMessageOptions"](a03,a07));',
    'const cancelTaskNotificationTurn=require("./extensions/task-completion-policy.cjs").beginTurn(this,a02,a07);try{await a06["sendMessage"](a02,a0a,this["buildAdapterSendMessageOptions"](a03,a07));}catch(error){cancelTaskNotificationTurn();throw error;}');
  source=once(source,'await a09["sendMessage"](a02,a0f,this["buildAdapterSendMessageOptions"](a05,a06))',
    'await require("./extensions/task-completion-policy.cjs").sendTurn(this,a02,a06,()=>a09["sendMessage"](a02,a0f,this["buildAdapterSendMessageOptions"](a05,a06)))');
  source=once(source,'await a05["sendMessage"](a02,a0b,this["buildAdapterSendMessageOptions"](a03,a0a));',
    'await require("./extensions/task-completion-policy.cjs").sendTurn(this,a02,a0a,()=>a05["sendMessage"](a02,a0b,this["buildAdapterSendMessageOptions"](a03,a0a)));');
  source=once(source,'}),"resume"===a0b["mode"]?a0g["resumeSession"]',
    '}),require("./extensions/task-completion-policy.cjs").beginInitialTurn(this,a02,a03,a0b),"resume"===a0b["mode"]?a0g["resumeSession"]');
  return source;
}
export function patchTaskNotificationsPreload(source) {
  const marker='// Buffer navigation until the main React shell subscribes.';
  if(!source.includes(marker)) source=source.replace('const electron = require("electron");',`const electron = require("electron");
${marker}
const taskNavigationListeners = new Set();
let pendingTaskNavigation = null;
electron.ipcRenderer.on("butler:navigate-session", (_event, sessionId) => {
  if (typeof sessionId !== "string" || !sessionId) return;
  if (!taskNavigationListeners.size) pendingTaskNavigation = sessionId;
  else {
    pendingTaskNavigation = null;
    for (const callback of taskNavigationListeners) callback(sessionId);
  }
});`);
  // Keep the public API and event source unchanged; only subscription readiness changes.
  return once(source,`      const listener = (_event, sessionId) => callback(sessionId);
      electron.ipcRenderer.on(IPC.BUTLER_NAVIGATE_SESSION, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_NAVIGATE_SESSION, listener);`.replaceAll('\n',source.includes('\r\n')?'\r\n':'\n'),
    `      taskNavigationListeners.add(callback);
      if (pendingTaskNavigation) {
        const sessionId = pendingTaskNavigation;
        pendingTaskNavigation = null;
        queueMicrotask(() => {
          if (taskNavigationListeners.has(callback)) callback(sessionId);
        });
      }
      return () => taskNavigationListeners.delete(callback);`);
}
export function patchTaskNotificationsRenderer(source) {
  const header='import {observeCompletionViewport} from "./dev-task-notifications.mjs";\n';
  if(!source.includes(header)) source=header+source;
  const start=source.indexOf('const ConversationView ='),end=source.indexOf('function ConversationEmptyGuide',start);
  if(start<0||end<0)throw new Error('Conversation view layout changed');
  let block=source.slice(start,end);
  block=once(block,'  const scrollRef = reactExports.useRef(null);',
    `  const scrollRef = reactExports.useRef(null);
  const completionViewportCleanup = reactExports.useRef(null);
  const completionViewportRef = reactExports.useCallback(element => {
    completionViewportCleanup.current?.();
    scrollRef.current = element;
    completionViewportCleanup.current = observeCompletionViewport(element,sessionId,acquireTopic);
  },[sessionId]);`);
  block=once(block,'ref: scrollRef,\n                className: "h-full overflow-y-auto',
    'ref: completionViewportRef,\n                className: "h-full overflow-y-auto');
  return source.slice(0,start)+block+source.slice(end);
}
export function patchTaskNotificationFiles() {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  for(const [relative,patch] of [['main/index.js',patchTaskNotificationsMain],['preload/index.js',patchTaskNotificationsPreload],['renderer/assets/index-0LVJEr5c.js',patchTaskNotificationsRenderer]]) {
    const file=path.join(root,'src',relative);fs.writeFileSync(file,patch(fs.readFileSync(file,'utf8')));
  }
}
