import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'.runtime/package.json'));
const {parse}=require('acorn');
function once(source,from,to){if(source.includes(to))return source;if(source.split(from).length!==2)throw Error('Local 1.0.8 integration anchor changed: '+from.slice(0,90));return source.replace(from,to);}
function component(source,name,transform){const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'});const n=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);if(!n)throw Error('Missing component '+name);return source.slice(0,n.start)+transform(source.slice(n.start,n.end))+source.slice(n.end);}
export function patchUpstream108Files(){
  const mainFile=path.join(root,'src/main/index.js');let main=fs.readFileSync(mainFile,'utf8');
  main=main.replace('register(a02,{facades:()=>AOt,syncMcp:g8});','register(a02,{facades:()=>AOt,syncMcp:g8,createChat:_5});');
  main=once(main,'function obe(a02,a03){','function obe(a02,a03){require("./extensions/upstream108.cjs").register(a02,{facades:()=>AOt,syncMcp:g8,createChat:_5});');
  main=once(main,'const a03=new Set(Y5["map"](a04=>a04[\'id\']));','const a03=new Set([...Y5["map"](a04=>a04[\'id\']),"shineai-web-llm"]);');
  main=once(main,'["partitionFor"](a02){const ceb=a7z;','["partitionFor"](a02){const ceb=a7z;if(a02?.kind==="session"&&a02.sessionId==="web-llm-settings")return ys["SESSION_PARTITION_PREFIX"]+a02.sessionId;');
  fs.writeFileSync(mainFile,main);
  const preload=path.join(root,'src/preload/index.js');let pre=fs.readFileSync(preload,'utf8');
  const invoke=(name,args='')=>`electron.ipcRenderer.invoke(${JSON.stringify(name)}${args?', '+args:''})`;
  if(!pre.includes('  webLlm: {')){
    const api=`  webLlm: {
      list:()=>${invoke('web-llm:list')}, saveSite:input=>${invoke('web-llm:save-site','input')},deleteSite:siteId=>${invoke('web-llm:delete-site','{siteId}')},setDefault:siteId=>${invoke('web-llm:set-default','{siteId}')},test:siteId=>${invoke('web-llm:test','{siteId}')},openLogin:siteId=>${invoke('web-llm:open-login','{siteId}')},stopLoginWatch:siteId=>${invoke('web-llm:stop-login-watch','{siteId}')},pick:(siteId,field)=>${invoke('web-llm:pick','{siteId,field}')},setEnabled:input=>${invoke('web-llm:set-enabled','input')},setSensitiveAllowlist:paths=>${invoke('web-llm:set-sensitive-allowlist','{paths}')},refreshPresets:()=>${invoke('web-llm:refresh-presets')},onProgress:callback=>{const handler=(_event,data)=>callback(data);electron.ipcRenderer.on('web-llm:progress',handler);return()=>electron.ipcRenderer.removeListener('web-llm:progress',handler);}
    },
    dailyBoard: {
      getDay:date=>${invoke('dailyBoard:get-day','date')},generate:date=>${invoke('dailyBoard:generate','{date}')},listRunDates:(from,to)=>${invoke('dailyBoard:list-run-dates','from,to')},getSettings:()=>${invoke('dailyBoard:get-settings')},setSettings:settings=>${invoke('dailyBoard:set-settings','settings')},getScheduleStatus:()=>${invoke('dailyBoard:get-schedule-status')},getChannelAvailability:()=>${invoke('dailyBoard:get-channel-availability')},export:input=>${invoke('dailyBoard:export','input')},model:input=>${invoke('dailyBoard:model','input')},
      ${['editItem','moveLane','merge','split','addEntry','updateEntry','deleteEntry','resolveAiConflict','cancelRefine','cleanupRuns'].map(name=>`${name}:input=>${invoke('dailyBoard:'+name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),'input')}`).join(',\n      ')},
      ${[['onUpdated','dailyBoard:updated'],['onProgress','dailyBoard:progress'],['onScheduledReady','dailyBoard:scheduled-ready']].map(([name,channel])=>`${name}:callback=>{const handler=(_event,data)=>callback(data);electron.ipcRenderer.on('${channel}',handler);return()=>electron.ipcRenderer.removeListener('${channel}',handler);}`).join(',\n      ')}
    },\n`;
    pre=once(pre,'  workspace: {',api+'  workspace: {');
  }
  pre=once(pre,'  workspace: {\n','  workspace: {\n    reorder: ids => electron.ipcRenderer.invoke("workspace:reorder", ids),\n');
  pre=once(pre,'  browser: {\n','  browser: {\n    importCookies: options => electron.ipcRenderer.invoke("browser:cookies:import", options),\n    pageContext: tabId => electron.ipcRenderer.invoke("browser:page-context", tabId),\n');
  fs.writeFileSync(preload,pre);
  const file=path.join(root,'src/renderer/assets/index-0LVJEr5c.js');let ui=fs.readFileSync(file,'utf8');
  const share=JSON.parse(fs.readFileSync(path.join(root,'src/main/upstream108/import-manifest.json'),'utf8')).uiShared;
  ui=once(ui,'const hash = window.location.hash;',`const local108Upstream = createUpstream108UI({${share.join(',')}});\nconst local108Controls = createLocal108Controls({reactExports,jsxRuntimeExports,useUIStore,useSessionStore,upstream:local108Upstream});\nconst hash = window.location.hash;`);
  if(!ui.includes('import { createUpstream108UI }'))ui='import { createUpstream108UI } from "./upstream108.js";\nimport { createLocal108Controls } from "./upstream108-controls.js";\n'+ui;
  ui=once(ui,'const TAB_TO_NAV = {','const TAB_TO_NAV = {\n  "web-llm":"web-llm", "daily-board":"daily-board",');
  ui=once(ui,'const COMMON_VISIBLE_SUBTABS = /* @__PURE__ */ new Set([','const COMMON_VISIBLE_SUBTABS = /* @__PURE__ */ new Set([\n  "web-llm", "daily-board",');
  ui=once(ui,'const buildNavCategories = (t2) => [','const buildNavCategories = (t2) => [\n  {id:"cat-local-tools",label:instance.language.startsWith("zh")?"工作工具":"Work tools",icon:jsxRuntimeExports.jsx(Globe,{className:"w-4 h-4"}),subTabs:[{id:"daily-board",label:instance.language.startsWith("zh")?"工作日报":"Daily report"},{id:"web-llm",label:instance.language.startsWith("zh")?"网页大模型":"Web models"}]},');
  ui=component(ui,'SettingsSurface',block=>once(block,'          activeNav === "general" &&','          activeNav === "web-llm" && jsxRuntimeExports.jsx(local108Upstream.WebLlmSettingsSection, {}),\n          activeNav === "daily-board" && jsxRuntimeExports.jsx(local108Controls.DailyBoardEntry, {}),\n          activeNav === "general" &&'));
  ui=component(ui,'App',block=>once(block,'    /* @__PURE__ */ jsxRuntimeExports.jsx(AppLayout, {}),','    /* @__PURE__ */ jsxRuntimeExports.jsx(AppLayout, {}),\n    jsxRuntimeExports.jsx(local108Controls.Global108Host, {}),'));
  ui=component(ui,'BrowserSettingsSection',block=>{
    const needle='children: [';const index=block.indexOf(needle,block.indexOf('return /*'));
    if(block.includes('local108Controls.CookieImportSection'))return block;if(index<0)throw Error('Missing browser settings surface');return block.slice(0,index)+block.slice(index).replace(needle,needle+'\n      jsxRuntimeExports.jsx(local108Controls.CookieImportSection, {}),\n      jsxRuntimeExports.jsx(local108Controls.BrowserPageToChat, {}),');
  });
  ui=component(ui,'WorkspaceContent',block=>once(block,'    /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspaceTab, {})','    jsxRuntimeExports.jsx(local108Controls.WorkspaceOrderSection, {}),\n    /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspaceTab, {})'));
  ui=component(ui,'BrowserPaneHost',block=>once(block,'      /* @__PURE__ */ jsxRuntimeExports.jsx(\n        "button",\n        {\n          type: "button",\n          title: copy2.back,','      jsxRuntimeExports.jsx(local108Controls.BrowserPageToChat,{compact:true,tabId:activeTabId}),\n      /* @__PURE__ */ jsxRuntimeExports.jsx(\n        "button",\n        {\n          type: "button",\n          title: copy2.back,'));
  ui=once(ui,'    reloadWorkspaces();\n  }, [reloadWorkspaces]);','    reloadWorkspaces();\n    window.addEventListener("shineai:workspaces-reordered",reloadWorkspaces);\n    return()=>window.removeEventListener("shineai:workspaces-reordered",reloadWorkspaces);\n  }, [reloadWorkspaces]);');
  fs.writeFileSync(file,ui);
  const html=path.join(root,'src/renderer/index.html');let markup=fs.readFileSync(html,'utf8');if(!markup.includes('upstream108.css'))markup=markup.replace('</head>','<link rel="stylesheet" href="./assets/upstream108.css">\n  </head>');fs.writeFileSync(html,markup);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))patchUpstream108Files();
