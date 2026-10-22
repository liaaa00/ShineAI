import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function once(source, from, to) {
  if (source.includes(to)) return source;
  if (source.split(from).length !== 2) throw new Error('Execution experience layout changed: ' + from.slice(0,110));
  return source.replace(from, to);
}
export function patchExecutionMain(s) {
  const policy='require("./extensions/execution-policy.cjs")';
  s=once(s,'a0k="files+dialog"===a0g["mode"]&&a0j["snapshotAvailable"]?"files+dialog":"dialog-only",','a0k=require("./extensions/rollback-guard.cjs").approvedMode(a0g,a0j),');
  s=once(s,'a05=this["database"]["getSkill"](a04)||this["database"]["getSkillByCommand"](a03["slashCommand"]);',`a05=${policy}.skillRecord(this.database,a03.slashCommand);`);
  s=once(s,'return this["fetchViaNode"](a02,a03,a05,a06);','return require("./extensions/request-diagnostics.cjs").observeRequest(this.config.sessionId,a02,a03,()=>this["fetchViaNode"](a02,a03,a05,a06));');
  s=once(s,'const a0g=this["resolveAdapter"](a09);','const a0g=this["resolveAdapter"](a09);require("./extensions/request-diagnostics.cjs").recordAdapter(a0d,a0g);');
  s=once(s,`'PreToolUse':[...a0j['hooks']?.["PreToolUse"]??[],{'matcher':"Bash|PowerShell"`,`'PreToolUse':[${policy}.permissionHook(this,a02,a03),...a0j['hooks']?.["PreToolUse"]??[],{'matcher':"Bash|PowerShell"`);
  s=once(s,`const a0d=(a03["permissionMode"],a03["autoAccept"],{'permissionMode':"full_auto",'autoAccept':!0x0});`,`const a0d=${policy}.permission(a03);`);
  s=once(s,`const a0n=(a07["autoAccept"],{'permissionMode':"full_auto",'autoAccept':!0x0}),`,`const a0n=${policy}.permission(a07),`);
  s=once(s,`"full_auto"==(a73['config'],"full_auto")&&(a07["permissionMode"]="full_auto",a07["autoAccept"]=!0x0);`,`Object.assign(a07,${policy}.permission(a73.config));`);
  s=once(s,`a07["permissionMode"]="full_auto",a07["autoAccept"]=!0x0;const a72=`,`Object.assign(a07,${policy}.permission(a07));const a72=`);
  s=once(s,`'autoAccept':!0x0,'permissionMode':"full_auto",'builtinModelId':a09,`,`...${policy}.permission(a02),'builtinModelId':a09,`);
  s=once(s,'["setRollbackService"](a02){const bi3=a7z;this["rollbackService"]=a02;}','["setRollbackService"](a02){this["rollbackService"]=require("./extensions/rollback-guard.cjs").protectRollback(a02,this);}');
  s=once(s,'a0j=a0i?await a0i[\'dryRun\'](a0g):a0d(a0g),','a0j=a0i?await a0i.previewForApply(a0g):a0d(a0g),');
  const sendOptionsHeader='["buildAdapterSendMessageOptions"](a02,a03){';
  const oldOptionsHeader=sendOptionsHeader+'require("./extensions/request-diagnostics.cjs").recordAdapter(a02,this.resolveAdapter(a02.provider));';
  const newOptionsHeader=oldOptionsHeader+'if(this.rollbackService&&(a03?.source||"user")==="user"&&!a02.config?.internal)this.rollbackService.prepareTurn(a02.id,this.resolveAdapter(a02.provider));';
  if(!s.includes(newOptionsHeader))s=s.replace(oldOptionsHeader,sendOptionsHeader);
  s=once(s,sendOptionsHeader,newOptionsHeader);
  s=once(s,'a03["permissionMode"]="full_auto",a03["autoAccept"]=!0x0;const a09=',`Object.assign(a03,${policy}.permission(a03));const a09=`);
  s=once(s,`'initialPromptVisibility':a03["initialPromptVisibility"],'autoAccept':!0x0,'permissionMode':"full_auto",`,`'initialPromptVisibility':a03["initialPromptVisibility"],...${policy}.permission(a03),`);
  s=once(s,`'initialPromptVisibility':a02["initialPromptVisibility"],'autoAccept':!0x0,'permissionMode':"full_auto",`,`'initialPromptVisibility':a02["initialPromptVisibility"],...${policy}.permission(a02),`);
  s=once(s,`'initialPromptVisibility':"hidden"===a02["initialPromptVisibility"]?"hidden":"visible",'autoAccept':!0x0,'permissionMode':"full_auto",`,`'initialPromptVisibility':"hidden"===a02["initialPromptVisibility"]?"hidden":"visible",...${policy}.permission(a02),`);
  s=once(s,`const a08="full_auto",a09={...a07,'permissionMode':a08,'autoAccept':!0x0};`,`const a08=a03,a09={...a07,...${policy}.permission({permissionMode:a08})};`);
  s=once(s,`return a03?.["config"]||this["database"]?.["getSession"]?.(a02)?.['config']?"full_auto":void 0x0;`,`const config=a03?.config||this.database?.getSession?.(a02)?.config;return config?${policy}.permission(config).permissionMode:void 0x0;`);
  s=once(s,`["resolveRuntimePermissionMode"](a02,a03,a04){const fXZ=a7z;return "full_auto";}`,`["resolveRuntimePermissionMode"](a02,a03,a04){return ${policy}.runtimePermission(this,a02,a03,a04);}`);
  s=once(s,`a04&&(a04["permissionMode"]="full_auto",a04["autoAccept"]=!0x0,this["sessionConfigs"]["set"](a02,a04));`,`a04&&(Object.assign(a04,${policy}.permission({permissionMode:a03})),this["sessionConfigs"]["set"](a02,a04));`);
  s=once(s,`a03["planModeEnabled"]?a0j["permissionMode"]="plan":(a0j["permissionMode"]="bypassPermissions",a0j["allowDangerouslySkipPermissions"]=!0x0),a0j["canUseTool"]=this["createPermissionHandler"](a02,!0x0,a03["sessionMode"],"full_auto",`,`a03["planModeEnabled"]?a0j["permissionMode"]="plan":(a0j["permissionMode"]="default"),a0j["canUseTool"]=this["createPermissionHandler"](a02,a03.autoAccept,a03["sessionMode"],a03.permissionMode,`);
  s=once(s,`'isEnabled':!0x0,'dirPath':a06["dirPath"]`,`'isEnabled':${policy}.skillEnabled(this.database,a07),'dirPath':a06["dirPath"]`);
  s=once(s,`["getDirSkill"](a02){const gEJ=a7z;return this["dirSkillCache"]['get'](a02);}`,`["getDirSkill"](a02){return ${policy}.directorySkill(this,a02);}`);
  s=once(s,`async["expandSkill"](a02,a03,a04){const gER=a7z,a05=this["dirSkillCache"]["get"](a02);`,`async["expandSkill"](a02,a03,a04){if(!${policy}.skillEnabled(this.database,a02))return null;const gER=a7z,a05=this["dirSkillCache"]["get"](a02);`);
  for (const [method,completed] of [['onItemStarted',false],['onItemCompleted',true]]) {
    const anchor=`["${method}"](a02,a03,a04,a05){`;
    s=once(s,anchor,anchor+`if(require("./extensions/image-view-events.cjs").handleImageView(this,a02,a03,a04,a05.item,${completed}))return;`);
  }
  // Persist the turn boundary without Git. Snapshot preparation belongs at the
  // first potentially mutating tool, not in front of every model request.
  const oldCapture=`this["rollbackService"]["captureSnapshot"](a02)["catch"](()=>{})`;
  const prefix=`this["rollbackService"]&&"user"===a07&&!a05["config"]?.['internal']&&`;
  for(const capture of ['await '+oldCapture,oldCapture,`this["rollbackService"].prepareTurn(a02,a09)`])s=s.replace(prefix+capture+',','');
  if(s.includes(oldCapture))throw new Error('Unexpected remaining send-time snapshot capture');
  s=once(s,`async['execute'](a02,a03,a04){const geb=a7z,`,`async['execute'](a02,a03,a04){await require("./extensions/turn-snapshot.cjs").beforeTool(this.options.sessionId,a02,a04?.signal);const geb=a7z,`);
  return s;
}
export function patchExecutionRenderer(s) {
  s=s.replace(/\r\n/g,'\n');
  s=once(s,'  const handleRollbackToMessage = reactExports.useCallback(async (anchorMessageId) => {','  const handleRollbackToMessage = reactExports.useCallback(async (anchorMessageId) => {\n    if(useFileTabStore.getState().tabs.some(tab=>tab.isDirty)){showToast(instance.language.startsWith("zh")?"请先保存或关闭未保存的文件，再预览撤销":"Save or close unsaved files before reviewing an undo", "info");return;}');
  s=once(s,'  const currentPermissionMode = reactExports.useMemo(() => "full_auto", []);','  const currentPermissionMode = isPermissionModeValue(currentSession?.config?.permissionMode) ? currentSession.config.permissionMode : currentSession?.config?.autoAccept === false ? "manual" : "full_auto";');
  s=once(s,'const PERMISSION_MODE_OPTIONS = [\n  { value: "full_auto",',`const PERMISSION_MODE_OPTIONS = [\n  { value:"manual",label:instance.language.startsWith("zh")?"逐次确认":"Manual",title:instance.language.startsWith("zh")?"工具执行前请求确认":"Ask before running tools"},\n  { value:"balanced",label:instance.language.startsWith("zh")?"平衡":"Balanced",title:instance.language.startsWith("zh")?"读取等安全工具自动运行，修改等操作请求确认":"Allow safe reads; ask before changes"},\n  { value: "full_auto",`);
  if(!s.includes('import { activityCounts, operationInfo }'))s='import { activityCounts, operationInfo } from "./dev-execution-model.mjs";\n'+s;
  s=s.replace('import { createExecutionUI } from "./dev-execution-ui.mjs";\n','');
  s=once(s,`            permissionMode: "full_auto",\n            autoAccept: true`,`            permissionMode: result2.permissionMode || result2.data?.permissionMode || mode2,\n            autoAccept: (result2.permissionMode || result2.data?.permissionMode || mode2) === "full_auto"`);
  s=once(s,`      const name2 = getOperationName(operation);\n      counts2[name2] = (counts2[name2] || 0) + 1;`,`      const name2 = Object.keys(activityCounts([operation],instance.language.startsWith("zh")))[0];\n      counts2[name2] = (counts2[name2] || 0) + 1;`);
  s=once(s,'const filePath = FILE_TOOLS.has(effectiveToolName) ? getDisplayText(effectiveToolInput.file_path) || getDisplayText(effectiveToolInput.path) : void 0;','const filePath = operationInfo(resolvedOperation).evidence || (FILE_TOOLS.has(effectiveToolName) ? getDisplayText(effectiveToolInput.file_path) || getDisplayText(effectiveToolInput.path) : void 0);');
  s=once(s,'  const style2 = isConsultExpertsToolName(effectiveToolName) ?',`  const humanInfo = operationInfo(resolvedOperation,instance.language.startsWith("zh"));\n  const style2 = humanInfo.kind!=="other" ? {icon:humanInfo.kind==="image"||humanInfo.kind==="screenshot"?"▧":"◇",color:"text-text-secondary",label:humanInfo.label} : isConsultExpertsToolName(effectiveToolName) ?`);
  s=once(s,'  const showHumanToolLabel = isConsultExpertsToolName(effectiveToolName) || isSpawnAgentToolName(effectiveToolName);','  const showHumanToolLabel = humanInfo.kind!=="other" || isConsultExpertsToolName(effectiveToolName) || isSpawnAgentToolName(effectiveToolName);');
  // Request diagnostics remain available to the backend; the composer does not
  // mount a persistent debug panel. Message menus retain the original review UI.
  s=s.replace('const ExecutionEvidence = createExecutionUI({React:reactExports,jsx:jsxRuntimeExports,aggregate:aggregateOperations,open:path=>useFileManagerStore.getState().openFileInTab(path,{revealInExplorer:true}),preview:path=>openProduct({path,action:"preview"}),language:()=>instance.language,ToolCard:ToolUseCard$1,FileCard:FileChangeCard});\n','');
  return s.replace('                jsxRuntimeExports.jsx(ExecutionEvidence,{messages:messages2,sessionId,busy:isStreaming,onReview:handleRollbackToMessage}),\n','');
}
export function patchExecutionFiles() {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const main=path.join(root,'src/main/index.js'),renderer=path.join(root,'src/renderer/assets/index-0LVJEr5c.js');
  fs.writeFileSync(main,patchExecutionMain(fs.readFileSync(main,'utf8')));
  fs.writeFileSync(renderer,patchExecutionRenderer(fs.readFileSync(renderer,'utf8')));
  const preload=path.join(root,'src/preload/index.js');
  fs.writeFileSync(preload,once(fs.readFileSync(preload,'utf8'),'getRuntimeInfo: () => electron.ipcRenderer.invoke("dev:runtime-info"),','getRequestSummary: (sessionId) => electron.ipcRenderer.invoke("dev:request-summary", sessionId), getRuntimeInfo: () => electron.ipcRenderer.invoke("dev:runtime-info"),'));
}
