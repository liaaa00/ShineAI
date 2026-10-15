'use strict';
// Windows caption buttons are native; renderer styles cannot tint their strip.
function registerWindowMaterial({app,BrowserWindow,isEnabled,ready}) {
  const windows=new Map();
  const track=window=>{
    if(windows.has(window)||typeof window.setTitleBarOverlay!=='function')return;
    const native=window.setTitleBarOverlay.bind(window);
    const entry={native,normal:{color:window.getBackgroundColor?.()||'#ffffff',symbolColor:'#1f2328',height:36}};
    windows.set(window,entry);
    window.setTitleBarOverlay=options=>{
      entry.normal={...entry.normal,...options};
      return native({...options,...(isEnabled()?{color:'#00000000'}:{})});
    };
    window.on?.('closed',()=>windows.delete(window));
  };
  const refresh=()=>{
    for(const window of BrowserWindow.getAllWindows()) {
      track(window);if(window.isDestroyed())continue;
      const entry=windows.get(window);if(!entry)continue;
      try{entry.native({...entry.normal,...(isEnabled()?{color:'#00000000'}:{})});}catch{/* Window has no native overlay. */}
    }
  };
  app.on?.('browser-window-created',(_event,window)=>{track(window);ready.then(refresh);});
  ready.then(refresh);
  return refresh;
}
module.exports={registerWindowMaterial};
