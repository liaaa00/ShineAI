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
export function patchTaskNotificationFiles() {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  for(const [relative,patch] of [['main/index.js',patchTaskNotificationsMain],['preload/index.js',patchTaskNotificationsPreload]]) {
    const file=path.join(root,'src',relative);fs.writeFileSync(file,patch(fs.readFileSync(file,'utf8')));
  }
}
