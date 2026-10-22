'use strict';
// The first window has only opening preferences and its own lifecycle controls.
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('development',{startup:{
  get:()=>ipcRenderer.invoke('dev:startup:get'),
  launchContext:()=>ipcRenderer.invoke('dev:startup:launch-context'),
  beginLaunch:()=>ipcRenderer.invoke('dev:startup:begin-launch'),
  completeLaunch:()=>ipcRenderer.invoke('dev:startup:complete-launch')
}});
