import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'.runtime/package.json'));
const {parse}=require('acorn'),{ancestor}=require('acorn-walk');
export function patchAppearance() {
  const file=path.join(root,'src/renderer/assets/index-0LVJEr5c.js');
  let source=fs.readFileSync(file,'utf8');
  source=source.replace(/ "data-appearance-surface": "(?:shell|canvas|chrome|reading)",/g,'');
  source=source.replace('import { mountAppearancePanel } from "./dev-appearance.js";','import { mountAppearancePanel, appearanceTerminalTheme, bindTerminalAppearance } from "./dev-appearance.js";');
  if(!source.includes('import { mountAppearancePanel,')) source='import { mountAppearancePanel, appearanceTerminalTheme, bindTerminalAppearance } from "./dev-appearance.js";\n'+source;
  if(!source.includes('const unbindTerminalAppearance = bindTerminalAppearance(')) {
    const constructor='const term = new xtermExports.Terminal({';
    const opened='term.open(containerRef.current);';
    const theme='terminalRef.current.options.theme = getTerminalTheme(theme2);';
    for(const marker of [constructor,opened,theme])if(!source.includes(marker))throw Error('Shell terminal integration changed: '+marker);
    source=source.replace(constructor,constructor+'\n      allowTransparency: true,');
    source=source.replace(opened,opened+'\n    const unbindTerminalAppearance = bindTerminalAppearance(term, () => getTerminalTheme(useUIStore.getState().theme));');
    const start=source.indexOf('function useShellTerminal('),end=source.indexOf('function ShellTerminalView(',start);
    let hook=source.slice(start,end);if(!hook.includes('      term.dispose();'))throw Error('Shell terminal cleanup changed');
    hook=hook.replace('      term.dispose();','      unbindTerminalAppearance();\n      term.dispose();').replace(theme,'terminalRef.current.options.theme = appearanceTerminalTheme(getTerminalTheme(theme2));');
    source=source.slice(0,start)+hook+source.slice(end);
  }
  if(!source.includes('function DevelopmentAppearanceSettings()')) {
    const marker='function AppearanceSettingsSection() {';
    if(!source.includes(marker))throw Error('Appearance settings layout changed');
    source=source.replace(marker,'function DevelopmentAppearanceSettings() {\n  const ref = reactExports.useRef(null);\n  reactExports.useEffect(() => mountAppearancePanel(ref.current), []);\n  return jsxRuntimeExports.jsx("div", { ref });\n}\n'+marker);
    const header='jsxRuntimeExports.jsx(SectionHeader, { title: t2("appearanceSection.title") }),';
    const start=source.indexOf(marker),index=source.indexOf(header,start);
    if(index<0||index-start>20000)throw Error('Appearance heading changed');
    source=source.slice(0,index)+source.slice(index).replace(header,header+'\n    jsxRuntimeExports.jsx(DevelopmentAppearanceSettings, {}),');
  }
  const surfaces={AppLayout:'shell',TitleBar:'chrome',ActivityBar:'chrome',StatusBar:'chrome',UnifiedSidebarPane:'chrome',WorkspaceFrame:'shell',WorkspaceWindow:'shell',ConversationView:'canvas',ConversationEmptyGuide:'shell',SettingsSurface:'reading',DashboardView:'canvas',AnalyticsWorkspace:'canvas',TeamsLayout:'shell',TeamsSurface:'canvas',KnowledgeWorkspace:'canvas',OrgWorkspace:'canvas',SchedulerWorkspace:'canvas',ExpertsLayout:'canvas',ShellTabBar:'chrome',WorkbenchPlaceholder:'canvas',ProjectBoardPage:'canvas',DesignCanvasPlaceholder:'shell',PrototypeGalleryCanvas:'shell',BoardToolbar:'chrome'};
  const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'}),edits=[],marked=new Set();
  Object.assign(surfaces,{ProjectWorkspace:'shell',MainPanel:'canvas',SessionsContent:'shell',SelectedSessionChangesPanel:'shell',SessionDisplayGrid:'shell',WorkspaceSectionHeader:'shell',NewSessionDraftHeader:'chrome',TeamWorkspaceTabContainer:'shell',DesignWorkspace:'canvas'});
  Object.assign(surfaces,{TerminalTabs:'chrome',TerminalHeader:'chrome',MessageInput:'shell',FileManagerPanel:'shell',SearchInFilesPanel:'shell',ShellPanelHost:'shell',ShellTerminalView:'shell',TerminalPanel:'shell',FilePane:'shell',ChatPanel:'shell',BrowserPaneHost:'shell'});
  Object.assign(surfaces,{FileTabs:'chrome',MarkdownViewToolbar:'chrome',PrototypeToolbar:'chrome',PageTabs:'chrome',ProjectToolbar:'chrome',BrowserTabStrip:'chrome',CommandPanelHeader:'chrome',BackgroundShellBar:'chrome'});
  function functionName(ancestors) {
    const functions=ancestors.filter(x=>['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(x.type));
    const fn=functions.at(-1);if(fn?.id)return fn.id.name;
    const owner=[...ancestors].reverse().find(x=>x.type==='VariableDeclarator');
    if(!owner||functions.some(x=>x!==fn&&x.start>owner.start))return null;
    return owner.id?.name;
  }
  function mark(name,props) {
    const value=surfaces[name];if(!value||props?.type!=='ObjectExpression'||!props.properties.some(p=>p.key?.name==='className'))return;
    if(edits.some(edit=>edit.index===props.start+1))return;
    marked.add(name);edits.push({index:props.start+1,text:` "data-appearance-surface": "${value}",`});
  }
  ancestor(ast,{ReturnStatement(node,ancestors) {
    const call=node.argument;if(call?.type!=='CallExpression'||!['jsx','jsxs'].includes(call.callee?.property?.name)||call.arguments[0]?.value!=='div')return;
    mark(functionName(ancestors),call.arguments[1]);
  },CallExpression(node,ancestors) {
    // ProjectWorkspace returns a DndContext around its actual canvas element.
    const props=node.arguments[1];if(props?.type!=='ObjectExpression')return;
    const cls=props.properties.find(p=>p.key?.name==='className');
    if(props.properties.some(p=>p.key?.value==='data-testid'&&p.value?.value==='terminal-tabs-bar'))mark('TerminalTabs',props);
    // Mark actual full-size layout nodes even when a component returns a
    // Fragment/provider. Early-return placeholders are not evidence that its
    // populated branch is covered. Never match buttons, cards or small inputs.
    const tag=node.arguments[0]?.value,classSource=cls?source.slice(cls.value.start,cls.value.end):'';
    const style=props.properties.find(p=>p.key?.name==='style');
    const styleSource=style?source.slice(style.value.start,style.value.end):'';
    // The workflow editor uses inline styles instead of utility classes.
    // Cover its full-height canvas/inspectors, while preserving node cards.
    if(tag==='div'&&/background: v2Colors\.bg(?:Canvas|Elevated|Panel)/.test(styleSource)&&
      !/(?:borderRadius|position: "fixed")/.test(styleSource)&&
      ((/display: "flex"/.test(styleSource)&&/(?:height: "100%"|flex: 1)/.test(styleSource))||
       (functionName(ancestors)==='FlowViewInner'&&/height: 56/.test(styleSource)))) {
      if(!edits.some(edit=>edit.index===props.start+1)) {
        marked.add(functionName(ancestors)||'WorkflowLayout');edits.push({index:props.start+1,text:' "data-appearance-surface": "shell",'});
      }
    }
    // Pane tab strips are short structural rows rather than full-size panels.
    // Do not make dialog or card headers transparent along with the workspace.
    if(['div','header','nav'].includes(tag)&&
      /\bflex\b/.test(classSource)&&/(?:h-[89]|h-10|border-b)/.test(classSource)&&
      /(?:bg-bg-(?:primary|secondary)|bg-v2-(?:canvas|surface))(?=[\s"`])/.test(classSource)&&
      !/(?:rounded|shadow|ring-1|flex-col|flex-wrap)/.test(classSource)&&
      !ancestors.some(x=>x.type==='FunctionDeclaration'&&/(?:Dialog|Modal|Popover|Menu|Card)/.test(x.id?.name||''))) {
      if(!edits.some(edit=>edit.index===props.start+1)) {
        marked.add(functionName(ancestors)||'WorkspaceToolbar');edits.push({index:props.start+1,text:' "data-appearance-surface": "chrome",'});
      }
    }
    if(['div','main','section','aside','nav','header'].includes(tag)&&
      /(?:h-full|h-screen|inset-0|flex-1)/.test(classSource)&&
      /(?:bg-bg-(?:primary|secondary)|bg-v2-(?:canvas|surface|elevated))(?=[\s"`/])/.test(classSource)&&
      /(?:flex|overflow|h-full|inset-0)/.test(classSource)&&
      !/(?:rounded|shadow-2xl|fixed inset-0|ring-1)/.test(classSource)) {
      const name=functionName(ancestors);
      if(!edits.some(edit=>edit.index===props.start+1)) {
        marked.add(name||'LayoutPanel');edits.push({index:props.start+1,text:' "data-appearance-surface": "shell",'});
      }
    }
    if(functionName(ancestors)==='ProjectWorkspace'&&cls?.value?.value==='relative h-full min-h-0 min-w-0 bg-bg-primary flex overflow-hidden')mark('ProjectWorkspace',props);
    if(cls?.value?.value==='h-full min-h-0 bg-bg-secondary flex flex-col overflow-hidden') {
      const owner=ancestors.find(x=>x.type==='FunctionDeclaration'&&['SessionsContent','SelectedSessionChangesPanel'].includes(x.id?.name));
      if(owner&&!edits.some(edit=>edit.index===props.start+1))mark(owner.id.name,props);
    }
  }});
  for(const required of ['AppLayout','UnifiedSidebarPane','SettingsSurface','ConversationView','ProjectWorkspace','MainPanel','SessionsContent','SelectedSessionChangesPanel'])if(!marked.has(required))throw Error('Missing appearance surface '+required);
  for(const edit of edits.sort((a,b)=>b.index-a.index))source=source.slice(0,edit.index)+edit.text+source.slice(edit.index);
  fs.writeFileSync(file,source);
  // The workbench is a lazy chunk, independent of the main UI bundle.
  // Its board and XYFlow background each used to paint a solid theme color.
  const workbenchFile=path.join(root,'src/renderer/assets/index-DKmSc9lP.js');
  let workbench=fs.readFileSync(workbenchFile,'utf8').replace(/ "data-appearance-surface": "(?:shell|canvas|chrome|reading)",/g,'');
  const workbenchSurfaces={WorkbenchView:'shell',WorkbenchCanvas:'shell',CanvasBoard:'canvas',StageInner:'shell',WorkbenchDock:'canvas'};
  const workbenchEdits=[],workbenchMarked=new Set();
  ancestor(parse(workbench,{ecmaVersion:'latest',sourceType:'module'}),{ReturnStatement(node,ancestors) {
    const name=functionName(ancestors),value=workbenchSurfaces[name],call=node.argument,props=call?.arguments?.[1];
    if(!value||call?.type!=='CallExpression'||!['jsx','jsxs'].includes(call.callee?.property?.name)||call.arguments[0]?.value!=='div'||props?.type!=='ObjectExpression')return;
    workbenchMarked.add(name);workbenchEdits.push({index:props.start+1,text:` "data-appearance-surface": "${value}",`});
  },CallExpression(node,ancestors) {
    const name=functionName(ancestors),props=node.arguments[1];
    if(props?.type!=='ObjectExpression'||node.arguments[0]?.value!=='div')return;
    const cls=props.properties.find(p=>p.key?.name==='className')?.value?.value;
    if((name==='CanvasBoard'&&cls==='flex h-full min-h-0 flex-col bg-bg-primary')||(name==='WorkbenchDock'&&cls==='flex min-w-0 flex-1 flex-col bg-bg-primary')) {
      workbenchMarked.add(name);workbenchEdits.push({index:props.start+1,text:` "data-appearance-surface": "canvas",`});
    }
  }});
  for(const required of ['WorkbenchView','CanvasBoard','StageInner'])if(!workbenchMarked.has(required))throw Error('Missing workbench appearance surface '+required);
  for(const edit of workbenchEdits.sort((a,b)=>b.index-a.index))workbench=workbench.slice(0,edit.index)+edit.text+workbench.slice(edit.index);
  fs.writeFileSync(workbenchFile,workbench);
  const html=path.join(root,'src/renderer/index.html');let text=fs.readFileSync(html,'utf8');
  if(!text.includes('dev-appearance.css'))text=text.replace('</head>','<link rel="stylesheet" href="./assets/dev-appearance.css">\n  </head>');
  fs.writeFileSync(html,text);
  const preload=path.join(root,'src/preload/index.js');let code=fs.readFileSync(preload,'utf8');
  const start=code.indexOf('electron.contextBridge.exposeInMainWorld("development",');
  if(start<0)throw Error('Missing development preload bridge');
  // This bridge is the last statement in the baseline and development preload.
  code=code.slice(0,start)+`electron.contextBridge.exposeInMainWorld("development", {
  getRuntimeInfo: () => electron.ipcRenderer.invoke("dev:runtime-info"),
  getServiceAccess: () => electron.ipcRenderer.invoke("dev:service-access"),
  appearance: {
    get: () => electron.ipcRenderer.invoke("dev:appearance:get"),
    importMedia: () => electron.ipcRenderer.invoke("dev:appearance:import"),
    discardMedia: id => electron.ipcRenderer.invoke("dev:appearance:discard", id),
    save: config => electron.ipcRenderer.invoke("dev:appearance:save", config),
    onChanged: callback => {
      const handler = (_event, value) => callback(value);
      electron.ipcRenderer.on("dev:appearance:changed", handler);
      return () => electron.ipcRenderer.removeListener("dev:appearance:changed", handler);
    }
  }
});\n`;
  fs.writeFileSync(preload,code);
  console.log('Patched background settings and '+(marked.size+workbenchMarked.size)+' stable surfaces across main UI and workbench');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))patchAppearance();
