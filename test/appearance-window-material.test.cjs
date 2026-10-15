const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {registerWindowMaterial}=require('../src/main/extensions/appearance-window-material.cjs');
test('native caption strip follows wallpaper and restores the latest theme without losing symbol colors',async()=>{
  const app=new EventEmitter(),window=new EventEmitter(),calls=[];let enabled=false;
  Object.assign(window,{getBackgroundColor:()=> '#ffffff',isDestroyed:()=>false,setTitleBarOverlay:options=>calls.push(options)});
  const refresh=registerWindowMaterial({app,BrowserWindow:{getAllWindows:()=>[window]},isEnabled:()=>enabled,ready:Promise.resolve()});
  await Promise.resolve();enabled=true;refresh();assert.equal(calls.at(-1).color,'#00000000');
  window.setTitleBarOverlay({color:'#101827',symbolColor:'#eeeeee',height:36});assert.equal(calls.at(-1).color,'#00000000');assert.equal(calls.at(-1).symbolColor,'#eeeeee');
  enabled=false;refresh();assert.deepEqual(calls.at(-1),{color:'#101827',symbolColor:'#eeeeee',height:36});
});
