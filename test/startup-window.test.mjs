import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
const {createStartupCoordinator}=createRequire(import.meta.url)('../src/main/extensions/startup-window.cjs');
function setup(options={}){
 const app=new EventEmitter();app.quit=()=>{app.emit('before-quit');app.quitted=true;};
 class Window extends EventEmitter{
  constructor(preferences){super();this.preferences=preferences;this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=()=>{};}
  isDestroyed(){return !!this.destroyed;}
  loadFile(file){this.file=file;return Promise.resolve();}
  show(){this.visible=true;this.shows=(this.shows||0)+1;}
  focus(){}
  destroy(){this.destroyed=true;this.emit('closed');}
 }
 const area={x:0,y:0,width:1440,height:900};
 const coordinator=createStartupCoordinator({app,BrowserWindow:Window,screen:{getPrimaryDisplay:()=>({workArea:area}),getAllDisplays:()=>[{workArea:area}]},config:{userData:'nonexistent-test-profile'},...options});
 const opening=coordinator.create(),event={sender:opening.webContents},main=new Window();
 return {app,coordinator,opening,event,main};
}
test('first opening owns playback and hides a ready workbench until completion',t=>{
 const {app,coordinator:c,opening,event,main}=setup();t.after(()=>app.quit());
 assert.equal(c.create(),opening);assert.equal(opening.preferences.show,false);
 assert.equal(opening.preferences.webPreferences.sandbox,true);assert.equal(opening.preferences.webPreferences.contextIsolation,true);assert.equal(opening.preferences.webPreferences.nodeIntegration,false);
 assert.match(opening.file,/renderer[\\/]startup.html$/);
 c.reveal(main,()=>main.show());assert.equal(main.visible,undefined);
 assert.deepEqual(c.context(event),{managed:true,openingWindow:true,pending:true});
 c.begin(event);assert.equal(opening.visible,true);c.end(event);
 assert.equal(main.shows,1);assert.equal(opening.destroyed,true);c.complete();assert.equal(main.shows,1);
 assert.deepEqual(c.context({sender:main.webContents}),{managed:true,openingWindow:false,pending:false});
});
test('skipped or disabled opening never flashes and waits for main readiness',t=>{
 const {app,coordinator:c,opening,event,main}=setup();t.after(()=>app.quit());
 c.end(event);assert.equal(opening.visible,undefined);assert.equal(main.visible,undefined);
 c.reveal(main,()=>main.show());assert.equal(main.shows,1);assert.equal(opening.destroyed,true);
});
test('other windows cannot control the opening; renderer failure releases the workbench',t=>{
 const {app,coordinator:c,opening,main}=setup();t.after(()=>app.quit());
 assert.throws(()=>c.begin({sender:main.webContents}));assert.throws(()=>c.end({sender:main.webContents}));
 c.reveal(main,()=>main.show());opening.webContents.emit('did-fail-load',{},-3,'','','true');assert.equal(main.visible,undefined);
 opening.webContents.emit('render-process-gone');assert.equal(main.shows,1);assert.equal(opening.destroyed,true);
});
test('native close quits; the watchdog cannot reveal the workbench during shutdown',t=>{
 const {app,coordinator:c,opening,main}=setup();t.after(()=>app.quit());
 c.reveal(main,()=>main.show());opening.emit('close');assert.equal(app.quitted,true);c.complete();assert.equal(main.visible,undefined);
});
test('watchdog releases the workbench even without renderer IPC',async t=>{
 const {app,coordinator:c,opening,main}=setup({deadlineMs:10});t.after(()=>app.quit());
 c.reveal(main,()=>main.show());await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(main.shows,1);assert.equal(opening.destroyed,true);
});
test('a failing recovered show callback cannot strand the opening',t=>{
 const {app,coordinator:c,opening,event,main}=setup();t.after(()=>app.quit());
 c.reveal(main,()=>{throw Error('Simulated recovered callback failure');});c.end(event);
 assert.equal(main.shows,1);assert.equal(opening.destroyed,true);
});
