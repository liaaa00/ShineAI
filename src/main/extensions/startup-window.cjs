'use strict';
const fs = require('node:fs');
const path = require('node:path');

function createStartupCoordinator({app, BrowserWindow, screen, config, deadlineMs=35000}) {
  let window=null, claimed=false, finished=false, quitting=false, deadline=null, handoff=null;
  function flush() {
    if (!finished || quitting || !handoff) return;
    const {main, show}=handoff;handoff=null;
    try {
      if (!main.isDestroyed()) {
        try {show();} catch(error) {
          console.warn('[ShineAI opening] Workbench handoff failed:',error.message);
          main.show();main.focus();
        }
      }
    } finally {
      if (window && !window.isDestroyed()) window.destroy();
      window=null;
    }
  }
  function complete() {if (finished) return;finished=true;clearTimeout(deadline);deadline=null;flush();}
  function create() {
    if (claimed) return window;
    claimed=true;
    let state={};
    try {const file=path.join(config.userData,'window-state.json');if(fs.statSync(file).size<4096)state=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
    const finite=v=>typeof v==='number'&&Number.isFinite(v);
    const area=screen.getPrimaryDisplay().workArea;
    const width=Math.min(area.width,Math.max(800,finite(state.width)?state.width:1200));
    const height=Math.min(area.height,Math.max(600,finite(state.height)?state.height:800));
    const coordinates=finite(state.x)&&finite(state.y)&&screen.getAllDisplays().some(d=>state.x+width>d.workArea.x&&state.x<d.workArea.x+d.workArea.width&&state.y+height>d.workArea.y&&state.y<d.workArea.y+d.workArea.height)?{x:state.x,y:state.y}:{};
    window=new BrowserWindow({width,height,...coordinates,title:'ShineAI',show:false,frame:true,titleBarStyle:'hidden',titleBarOverlay:{color:'#000000',symbolColor:'#eeeeee',height:36},autoHideMenuBar:true,backgroundColor:'#000000',webPreferences:{preload:path.join(__dirname,'../../preload/startup.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
    const current=window;
    current.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    current.webContents.on('will-navigate',event=>event.preventDefault());
    current.webContents.on('render-process-gone',complete);
    current.webContents.on('did-fail-load',(_event,code,_description,_url,isMainFrame)=>{if(code!==-3&&isMainFrame)complete();});
    current.on('unresponsive',complete);
    current.on('close',()=>{if(!finished&&!quitting)app.quit();});
    current.on('closed',()=>{if(window===current)window=null;if(!quitting)complete();});
    deadline=setTimeout(complete,deadlineMs);deadline.unref?.();
    current.loadFile(path.join(__dirname,'../../renderer/startup.html')).catch(complete);
    return current;
  }
  function owns(event) {return !!window&&!window.isDestroyed()&&event.sender===window.webContents;}
  function context(event) {return {managed:claimed,openingWindow:owns(event),pending:claimed&&!finished};}
  function begin(event) {
    if(!owns(event))throw Error('Only the opening window can begin the opening');
    if(!finished&&!quitting){window.show();window.focus();}
    return {success:true};
  }
  function end(event) {if(!owns(event))throw Error('Only the opening window can complete the opening');complete();return {success:true};}
  function reveal(main,show) {
    if(!claimed||quitting){if(!quitting&&!main.isDestroyed())show();return;}
    handoff={main,show};flush();
  }
  app.on('before-quit',()=>{quitting=true;clearTimeout(deadline);deadline=null;handoff=null;});
  return {create,context,begin,end,reveal,complete};
}
let runtime;
function registerStartupWindow({ipcMain,...options}) {
  runtime=createStartupCoordinator(options);
  ipcMain.handle('dev:startup:launch-context',event=>runtime.context(event));
  ipcMain.handle('dev:startup:begin-launch',event=>runtime.begin(event));
  ipcMain.handle('dev:startup:complete-launch',event=>runtime.end(event));
}
module.exports={createStartupCoordinator,registerStartupWindow,createStartupWindow:()=>runtime.create(),revealWorkbench:(main,show)=>runtime.reveal(main,show)};
