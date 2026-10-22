import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
function once(s,from,to){if(s.includes(to))return s;if(s.split(from).length!==2)throw Error('Running input anchor changed: '+from.slice(0,100));return s.replace(from,to);}
const flow='require("./extensions/running-input.cjs")';
export function patchRunningInputMain(s){
 s=once(s,`this['database']=a02,this["sessionMemory"]=new xz`, `this['database']=a02,${flow}.installManager(this),this["sessionMemory"]=new xz`);
 // Read at the start of a request round, not just after a tool round. Messages
 // that arrive during retry/backoff are also included at the next safe boundary.
 s=once(s,'for(const a0G of this["roundInputSource"]?.()??[])this["contextManager"]["addMessage"]({\'role\':"user",\'content\':a0G});', '/* Running input is collected before building the next request. */');
 s=once(s,'try{const a0o=this["systemPromptBuilder"]["buildAsMessage"]();','try{for(const input of this["roundInputSource"]?.()??[])this["contextManager"]["addMessage"]({role:"user",content:input});const a0o=this["systemPromptBuilder"]["buildAsMessage"]();');
 s=once(s,`'description':"记录/更新当前多步骤任务的进度列表。任务复杂或需多步时先调用它规划步骤，每完成一步再调用更新状态。",'parameters':{'type':"object",'properties':{'steps':`, `'description':"记录或更新任务计划。收到新的用户要求后，继续操作前先核对计划，并填写该要求中的 input_revision；步骤不变也要确认。过时任务使用 cancelled，不要伪装成 completed。",'parameters':{'type':"object",'properties':{'input_revision':{'type':'integer','description':'本次已核对的最新用户输入版本；仅在核对新要求时填写'},'steps':`);
 // Scope the status enum to update_plan, leaving unrelated tool schemas alone.
 const start=s.indexOf(`{'name':"update_plan",`),end=s.indexOf(`{'name':"ask_user_question",`,start);
 let tool=s.slice(start,end);tool=tool.replace(`'enum':["pending","in_progress","completed"]`,`'enum':["pending","in_progress","completed","cancelled"]`);s=s.slice(0,start)+tool+s.slice(end);
 s=once(s,'"pending"===a0h||"in_progress"===a0h||"completed"===a0h?a0h:null;', '"pending"===a0h||"in_progress"===a0h||"completed"===a0h||"cancelled"===a0h?a0h:null;');
 s=once(s,'if(a07){const a0a=function(a0b){const gfi=gfh;',`if(a07){${flow}.review(a06,a04.input_revision);const a0a=function(a0b){const gfi=gfh;`);
 s=once(s,'a03["lastPlanTodosSignature"]!==a0a&&(a03["lastPlanTodosSignature"]=a0a,',`(a03["lastPlanTodosSignature"]!==a0a||Number.isSafeInteger(a04.input_revision))&&(a03["lastPlanTodosSignature"]=a0a,`);
 return s;
}
export function patchRunningInputRenderer(s){
 s=s.replace(/\r\n/g,'\n');
 if(!s.includes('import { createInputFlowUI }'))s='import { createInputFlowUI } from "./dev-running-input.mjs";\n'+s;
 if(!s.includes('import { createSendPreviewUI }'))s='import { createSendPreviewUI } from "./dev-send-preview.mjs";\n'+s;
 s=once(s,'const ConversationView = ({ sessionId,', 'const {useSendPreview,SendPreview}=createSendPreviewUI({React:reactExports,jsx:jsxRuntimeExports,language:()=>instance.language});\nconst ConversationView = ({ sessionId,');
 s=once(s,'  } = useConversation(sessionId);\n  const [resuming,', '  } = useConversation(sessionId);\n  const sendPreview = useSendPreview(sessionId,messages2);\n  const [resuming,');
 s=once(s,'const sendWithSmartScheduling = reactExports.useCallback(async (text2, options2) => {','const sendWithSmartScheduling = reactExports.useCallback((text2, options2) => sendPreview.run(text2,options2,async () => {');
 s=once(s,'    await refreshQueue();\n  }, [\n    reloadConversation,','    await refreshQueue();\n    return dispatch2;\n  }), [\n    reloadConversation,');
 const sendStart=s.indexOf('const sendWithSmartScheduling ='),sendEnd=s.indexOf('  const handleDecisionTableSubmit',sendStart);
 let sendBlock=s.slice(sendStart,sendEnd);
 sendBlock=sendBlock.replace('showToast(t2("send.failed"), "error");\n      return;', 'showToast(t2("send.failed"), "error");\n      throw Error("消息未进入发送流程");');
 sendBlock=sendBlock.replace('if (queueHint.state === "hidden") {\n      removeTentativeDeferred();\n      return;', 'if (queueHint.state === "hidden") {\n      removeTentativeDeferred();\n      return dispatch2;');
 sendBlock=sendBlock.replace('      return;\n    }\n    removeTentativeDeferred();','      return dispatch2;\n    }\n    removeTentativeDeferred();');
 s=s.slice(0,sendStart)+sendBlock+s.slice(sendEnd);
 s=once(s,'                  decisionPanelItems &&', '                  jsxRuntimeExports.jsx(SendPreview,{flow:sendPreview,sessionId}),\n                  decisionPanelItems &&');
 s=once(s,'  }, [sessionId]);\n  reactExports.useLayoutEffect(() => {\n    const anchor = olderLoadAnchorRef.current;', '  }, [sessionId]);\n  reactExports.useLayoutEffect(() => {\n    if (sendPreview.items.length) handleJumpToBottom();\n  }, [sendPreview.items.at(-1)?.id, handleJumpToBottom]);\n  reactExports.useLayoutEffect(() => {\n    const anchor = olderLoadAnchorRef.current;');
 s=once(s,'console.error("[useConversation] Failed to resume before sending:", resumeResult.error);\n        return void 0;', 'console.error("[useConversation] Failed to resume before sending:", resumeResult.error);\n        throw Error(resumeResult.error || "会话恢复失败");');
 s=once(s,'console.error("[useConversation] Failed to send message:", err);\n      return void 0;', 'console.error("[useConversation] Failed to send message:", err);\n      throw err;');
 s=once(s,'setText((cur) => cur || text2);','setText((cur) => cur || fullMessage);');
 s=once(s,'const STATUS_META = {\n  in_progress:', 'const STATUS_META = {\n  cancelled: {get label(){return instance.language.startsWith("zh")?"已取消":"Cancelled";},dotClass:"bg-text-muted",textClass:"text-text-muted line-through",badgeClass:"border-border/60 text-text-muted"},\n  in_progress:');
 s=once(s,'  const meta2 = STATUS_META[item.status];','  const meta2 = STATUS_META[item.status] || STATUS_META.pending;');
 s=once(s,'const SessionTodoPanel = ({ sessionId }) => {','const { InputFlowStatus, useInputFlow } = createInputFlowUI({React:reactExports,jsx:jsxRuntimeExports,language:()=>instance.language});\nconst SessionTodoPanel = ({ sessionId }) => {\n  const inputFlow = useInputFlow(sessionId);\n  const reviewPending = inputFlow && inputFlow.requiredRevision > inputFlow.reviewedRevision;');
 s=once(s,'    const completed = [];\n    for (const item of todos.items)', '    const completed = [];\n    const cancelled = [];\n    for (const item of todos.items)');
 s=once(s,'      } else {\n        completed.push(item);\n      }\n    }\n    return {\n      total: todos.items.length,', '      } else if(item.status === "cancelled") {\n        cancelled.push(item);\n      } else {\n        completed.push(item);\n      }\n    }\n    return {\n      cancelled,\n      total: todos.items.length,');
 s=once(s,'const completionPercent = Math.round(grouped.completed.length / grouped.total * 100);', 'const completionPercent = Math.round(grouped.completed.length / Math.max(1,grouped.total-grouped.cancelled.length) * 100);');
 s=once(s,'const currentItem = grouped.inProgress[0] ?? grouped.pending[0] ?? grouped.completed[grouped.completed.length - 1];','const currentItem = grouped.inProgress[0] ?? grouped.pending[0] ?? grouped.completed[grouped.completed.length - 1] ?? grouped.cancelled.at(-1);');
 s=once(s,'const currentLabel = grouped.inProgress.length > 0 ? t2("todoPanel.currently") : grouped.pending.length > 0 ? t2("todoPanel.next") : t2("todoPanel.complete");','const currentLabel = grouped.cancelled.length === grouped.total ? (instance.language.startsWith("zh")?"已取消":"Cancelled") : grouped.inProgress.length > 0 ? t2("todoPanel.currently") : grouped.pending.length > 0 ? t2("todoPanel.next") : t2("todoPanel.complete");');
 s=once(s,'${unfinishedCount === 0 ? "bg-accent-green" : grouped.inProgress.length > 0 ? "bg-accent-blue" : "bg-accent-yellow"}','${grouped.cancelled.length === grouped.total ? "bg-text-muted" : unfinishedCount === 0 ? "bg-accent-green" : grouped.inProgress.length > 0 ? "bg-accent-blue" : "bg-accent-yellow"}');
 s=once(s,'            grouped.total,\n            " · ",\n            completionPercent,','            grouped.total-grouped.cancelled.length,\n            " · ",\n            completionPercent,');
 s=once(s,'const statusLabel2 = unfinishedCount === 0 ? t2("todoPanel.allCompleted") : t2("todoPanel.unfinished", { count: unfinishedCount });','const statusLabel2 = reviewPending ? (instance.language.startsWith("zh") ? "计划待核对" : "Plan needs review") : grouped.cancelled.length === grouped.total ? (instance.language.startsWith("zh") ? "任务已取消" : "Tasks cancelled") : unfinishedCount === 0 ? t2("todoPanel.allCompleted") : t2("todoPanel.unfinished", { count: unfinishedCount });');
 s=once(s,'jsxRuntimeExports.jsx("div", { className: "px-4 pb-0.5 pt-0.5", children:', 'jsxRuntimeExports.jsx("div", { "data-testid":"session-todo-panel", className: "px-4 pb-0.5 pt-0.5", children:');
 s=once(s,'items: grouped.completed, muted: true })\n      ]', 'items: grouped.completed, muted: true }),\n        jsxRuntimeExports.jsx(TodoGroup, {title:instance.language.startsWith("zh")?"已取消（不计入完成）":"Cancelled (not completed)",items:grouped.cancelled,muted:true})\n      ]');
 if(!s.includes('jsxRuntimeExports.jsx(InputFlowStatus, { sessionId }),'))s=once(s,'jsxRuntimeExports.jsx(SessionTodoPanel$1, { sessionId }),','jsxRuntimeExports.jsx(InputFlowStatus, { sessionId }),\n          jsxRuntimeExports.jsx(SessionTodoPanel$1, { sessionId }),');
 s=patchStopButtonLayout(s);
 s=once(s,'text: "已插入当前运行输入流，AI 会在当前回合接收"','text: "消息已排队，等待后续模型请求"');
 s=s.replaceAll('已插入当前运行输入流 · AI 会在当前回合接收','消息已排队 · 等待后续模型请求').replaceAll('Inserted into the running input stream · the AI will receive it this turn','Queued · waiting for a subsequent model request');
 // Existing eight-second optimistic notices must not look like delivery proof.
 s=s.replaceAll('已插入当前运行输入流','消息已排队').replaceAll('AI 会在当前回合接收','等待后续模型请求').replaceAll('等待后续模型请求（不是等待下一轮）','等待后续模型请求').replaceAll('Inserted into the current running input stream · the AI receives it this turn (not the next round)','Queued · waiting for a subsequent model request');
 return s;
}
function patchStopButtonLayout(s){
 const centered='"data-testid":"stop-generating-row", className: "flex justify-center px-4 py-2 shrink-0"';
 if(s.includes(centered))return s;
 s=s.replace('className: "absolute -top-10 left-0 right-0 flex justify-center z-10 pointer-events-none"','"data-testid":"stop-generating-row", className: "flex justify-end px-4 py-1"');
 const start='                canAbortCurrentTurn && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-testid":"stop-generating-row", className: "flex justify-end px-4 py-1",';
 const begin=s.indexOf(start),end=s.indexOf('\n                isTeamLeaderSession &&',begin);
 if(begin<0||end<begin||s.indexOf(start,begin+1)!==-1)throw Error('Stop button layout anchor changed');
 const old=s.slice(begin,end);
 const moved=old.replace('canAbortCurrentTurn &&','!isSessionEnded && canAbortCurrentTurn &&').replace('"data-testid":"stop-generating-row", className: "flex justify-end px-4 py-1"',centered);
 s=s.slice(0,begin)+s.slice(end);
 return once(s,'          jsxRuntimeExports.jsx(SessionTodoPanel$1, { sessionId }),',moved+'\n          jsxRuntimeExports.jsx(SessionTodoPanel$1, { sessionId }),');
}
export function patchRunningInputPreload(s){return once(s,'getRequestSummary: (sessionId) => electron.ipcRenderer.invoke("dev:request-summary", sessionId),',`inputFlow: {get: id => electron.ipcRenderer.invoke("dev:input-flow:get",id),retry:(id,inputId)=>electron.ipcRenderer.invoke("dev:input-flow:retry",id,inputId),onChanged:callback=>{const listener=(_event,value)=>callback(value);electron.ipcRenderer.on("dev:input-flow:changed",listener);return()=>electron.ipcRenderer.removeListener("dev:input-flow:changed",listener);}},\n  getRequestSummary: (sessionId) => electron.ipcRenderer.invoke("dev:request-summary", sessionId),`);}
export function patchRunningInputFiles(){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');for(const [name,patch]of [['src/main/index.js',patchRunningInputMain],['src/renderer/assets/index-0LVJEr5c.js',patchRunningInputRenderer],['src/preload/index.js',patchRunningInputPreload]]){const file=path.join(root,name);fs.writeFileSync(file,patch(fs.readFileSync(file,'utf8')));}}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))patchRunningInputFiles();
