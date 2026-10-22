import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function once(source,from,to){if(source.includes(to))return source;if(source.split(from).length!==2)throw Error('Startup integration anchor changed: '+from.slice(0,100));return source.replace(from,to);}
export function patchStartupRenderer(source){
 if(!source.includes('import { mountStartupPanel }'))source='import { mountStartupPanel } from "./dev-startup.js";\n'+source;
 return once(source,'reactExports.useEffect(() => mountAppearancePanel(ref.current), []);','reactExports.useEffect(() => { const unmountAppearance=mountAppearancePanel(ref.current); const startupHost=document.createElement("div"); ref.current.after(startupHost); const unmountStartup=mountStartupPanel(startupHost); return()=>{unmountStartup();startupHost.remove();unmountAppearance();}; }, []);');
}
export function patchStartupPreload(source){
 if(!source.includes('"dev:startup:get"'))source=once(source,'  appearance: {','  startup: {\n    get: () => electron.ipcRenderer.invoke("dev:startup:get"),\n    save: value => electron.ipcRenderer.invoke("dev:startup:save",value),\n    importAudio: () => electron.ipcRenderer.invoke("dev:startup:import-audio"),\n    removeAudio: () => electron.ipcRenderer.invoke("dev:startup:remove-audio")\n  },\n  appearance: {');
 return once(source,'    get: () => electron.ipcRenderer.invoke("dev:startup:get"),','    launchContext: () => electron.ipcRenderer.invoke("dev:startup:launch-context"),\n    get: () => electron.ipcRenderer.invoke("dev:startup:get"),');
}
export function patchStartupMain(source){
 const replacement='(function(){JVt=require("./extensions/startup-window.cjs").createStartupWindow();}())';
 if(!source.includes(replacement)){
  const start='(function(){const hM4=hM3;if(JVt&&!JVt["isDestroyed"]())return;';
  const end='}()),function(){const hM7=hM3,';
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if(a<0||b<a||source.indexOf(start,a+1)!==-1)throw Error('Early startup window anchor changed');
  source=source.slice(0,a)+replacement+source.slice(b+4);
 }
 if(!source.includes('require("./extensions/startup-window.cjs").revealWorkbench(KVt,'))source=once(source,'sYt(),JVt&&!JVt["isDestroyed"]()&&(JVt["close"](),JVt=null)','require("./extensions/startup-window.cjs").revealWorkbench(KVt,()=>{sYt();JVt=null;})');
 if(source.includes('a02["maximized"]&&KVt["maximize"](),require("./extensions/startup-window.cjs").revealWorkbench'))source=once(source,'a02["maximized"]&&KVt["maximize"](),require("./extensions/startup-window.cjs").revealWorkbench(KVt,()=>{sYt();JVt=null;})','require("./extensions/startup-window.cjs").revealWorkbench(KVt,()=>{a02["maximized"]&&KVt["maximize"]();sYt();JVt=null;})');
 return source;
}
export function patchStartupFiles(){
 for(const [name,patch]of [['src/renderer/assets/index-0LVJEr5c.js',patchStartupRenderer],['src/preload/index.js',patchStartupPreload],['src/main/index.js',patchStartupMain]]){const file=path.join(root,name);fs.writeFileSync(file,patch(fs.readFileSync(file,'utf8')));}
 const file=path.join(root,'src/renderer/index.html');let html=fs.readFileSync(file,'utf8');
 if(!html.includes('dev-startup.css'))html=html.replace('</head>','<link rel="stylesheet" href="./assets/dev-startup.css">\n  </head>');
 if(!html.includes('src="./assets/dev-startup.js"'))html=html.replace('    <script type="module" crossorigin src="./assets/index-0LVJEr5c.js"></script>','    <script type="module" src="./assets/dev-startup.js"></script>\n    <script type="module" crossorigin src="./assets/index-0LVJEr5c.js"></script>');
 fs.writeFileSync(file,html);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))patchStartupFiles();
