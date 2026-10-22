import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function once(source, before, after) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) throw Error('Background tool patch anchor changed: ' + before.slice(0, 100));
  return source.replace(before, after);
}
export function patchBackgroundMain(s) {
  s = once(s, 'async["sendMessage"](a02,a03,a04){const bnw=a7z,', 'async["sendMessage"](a02,a03,a04){const backgroundHandled=require("./extensions/background-completion-policy.cjs").handleCompletionInput(this,a02,a03,a04);if(backgroundHandled)return backgroundHandled;const bnw=a7z,');
  s = once(s, `'onOutput':a0c?.["onOutput"],'signal':a0c?.["signal"]`, `'onOutput':a0c?.["onOutput"],'signal':a0c?.["signal"],toolUseId:a0c?.toolUseId`);
  s = once(s, `{'sessionId':a0b,'registry':a0c,'command':a04}`, `{'sessionId':a0b,'registry':a0c,'command':a04,toolUseId:a03.toolUseId}`);
  s = once(s, `{'sessionId':a0m["sessionId"],'command':a0m["command"],'cwd':a0i`, `{'sessionId':a0m["sessionId"],toolUseId:a0m.toolUseId,'command':a0m["command"],'cwd':a0i`);
  s = once(s, `'id':m["randomUUID"](),'sessionId':a02["sessionId"],'command':a02["command"]`, `'id':m["randomUUID"](),'sessionId':a02["sessionId"],toolUseId:a02.toolUseId,'command':a02["command"]`);
  s = once(s, `'job':{'id':a05,'sessionId':a02,'command':a08`, `'job':{'id':a05,'sessionId':a02,toolUseId:a07,'command':a08`);
  s = once(s, `Dme=Ome[Rme]??(Ome[Rme]=new Pme());let Nme`, `Dme=Ome[Rme]??(Ome[Rme]=new Pme());require("./extensions/background-tool-history.cjs").install(Cme,Dme);let Nme`);
  s = once(s, `return[...Cme["list"](a02),...Dme["list"](a02)];`, `return require("./extensions/background-tool-history.cjs").list(a02,[...Cme["list"](a02),...Dme["list"](a02)]);`);
  s = once(s, `'forceQueue':!0x0,'displayText':a0K`, `'forceQueue':!0x0,'displayText':require("./extensions/background-tool-history.cjs").displayText(a0H,a0K)`);
  return s;
}
export function patchBackgroundRenderer(s) {
  const collapseImport = 'import { backgroundVisibleGroups } from "./dev-background-collapse.mjs";\n';
  if (!s.includes(collapseImport)) s = collapseImport + s;
  s = once(s, '    const turnGroups = groups2.slice(turn.startIdx, turn.endIdx);', '    const turnGroups = groups2.slice(turn.startIdx, turn.endIdx);\n    const backgroundVisible = backgroundVisibleGroups(turnGroups);');
  s = once(s, '      if (i2 === summaryLocalIdx) continue;\n      hiddenGroupKeys.add(getGroupKey(turnGroups[i2]));', '      if (i2 === summaryLocalIdx || backgroundVisible.has(turnGroups[i2].message?.id)) continue;\n      hiddenGroupKeys.add(getGroupKey(turnGroups[i2]));');
  const imported = 'import { createBackgroundToolUI, backgroundState } from "./dev-background-tools.mjs";\n';
  if (!s.includes(imported)) s = imported + s;
  if (!s.includes('const BackgroundToolUI =')) s = once(s, 'const ToolUseCard = ({', 'const BackgroundToolUI = createBackgroundToolUI({React:reactExports,jsx:jsxRuntimeExports,language:()=>instance.language});\nconst ToolUseCard = ({');
  const start = s.indexOf('const ToolUseCard = ({'), end = s.indexOf('const CopyAllButton =', start);
  let card = s.slice(start, end);
  card = once(card,
    '  const effectiveToolResult = resolvedOperation.result?.toolResult || resolvedOperation.liveResult?.toolResult || primaryMessage?.toolResult || "";',
    '  const effectiveToolResult = resolvedOperation.result?.toolResult || resolvedOperation.liveResult?.toolResult || primaryMessage?.toolResult || "";\n  const backgroundJob = BackgroundToolUI.useJob(primaryMessage?.sessionId || resolvedOperation.toolUse?.sessionId, resolvedOperation.toolUseId || primaryMessage?.toolUseId, effectiveToolResult);');
  card = once(card, 'const isStreamingResult = Boolean(', 'const isStreamingResult = !backgroundJob && Boolean(');
  card = once(card, 'const isPending = Boolean(', 'const isPending = !backgroundJob && Boolean(');
  card = once(card, 'const isResult = Boolean(resolvedOperation.result)', 'const isResult = Boolean(backgroundJob || resolvedOperation.result)');
  card = once(card, 'const isError = resolvedOperation.result?.isError ?? primaryMessage?.isError;', 'const isError = backgroundJob ? backgroundState(backgroundJob).failed : (resolvedOperation.result?.isError ?? primaryMessage?.isError);');
  card = once(card, '() => buildSummary({', '() => backgroundJob ? command2 : buildSummary({');
  card = once(card, '[effectiveToolInput, effectiveToolName, effectiveToolResult, isError, isPending, isStreamingResult, primaryMessage?.content]', '[backgroundJob, command2, effectiveToolInput, effectiveToolName, effectiveToolResult, isError, isPending, isStreamingResult, primaryMessage?.content]');
  card = once(card, 'Boolean(!isStreamingResult && isResult && displayResult)', 'Boolean(!backgroundJob && !isStreamingResult && isResult && displayResult)');
  if (!card.includes('data-tool-use-id')) card = once(card, '{ className: compact ? "my-0.5 mx-1"', '{ "data-tool-use-id": resolvedOperation.toolUseId || primaryMessage?.toolUseId, className: compact ? "my-0.5 mx-1"');
  card = once(card, '          latestStream && isStreamingResult', '          backgroundJob && jsxRuntimeExports.jsx(BackgroundToolUI.Badge, {job:backgroundJob}),\n          latestStream && isStreamingResult');
  card = once(card, '      hasCommandContext &&', '      backgroundJob && jsxRuntimeExports.jsx(BackgroundToolUI.Details, {job:backgroundJob}),\n      hasCommandContext &&');
  return patchBackgroundResultsRenderer(s.slice(0, start) + card + s.slice(end));
}
function patchBackgroundResultsRenderer(s) {
  // Upgrade previously patched sources as well as a fresh baseline.
  s = s.replace('if (turnCollapseData?.hiddenGroupKeys.has(gKey) && !backgroundResults.byAnswer.has(group2.message?.id)) return elements;', 'if (turnCollapseData?.hiddenGroupKeys.has(gKey) && !backgroundResults.preservedAnswers.has(group2.message?.id)) return elements;');
  const resultsImport = 'import { buildBackgroundResults, createBackgroundResultsUI } from "./dev-background-results.mjs";\n';
  if (!s.includes(resultsImport)) s = resultsImport + s;
  s = once(s, 'const ToolUseCard = ({ message: message2, operation, compact = false }) => {', 'const BackgroundResultsUI = createBackgroundResultsUI({jsx:jsxRuntimeExports,language:()=>instance.language});\nconst ToolUseCard = ({ message: message2, operation, compact = false, backgroundReveal }) => {');
  s = once(s, '  const primaryMessage = resolvedOperation.result || resolvedOperation.liveResult || resolvedOperation.toolUse || message2;', '  const primaryMessage = resolvedOperation.result || resolvedOperation.liveResult || resolvedOperation.toolUse || message2;\n  const backgroundCardRef = reactExports.useRef(null);\n  reactExports.useEffect(()=>{if(backgroundReveal?.toolUseId && backgroundReveal.toolUseId===(resolvedOperation.toolUseId || primaryMessage?.toolUseId)){setExpanded(true);const timer=setTimeout(()=>backgroundCardRef.current?.scrollIntoView({block:"center",behavior:"smooth"}),80);return()=>clearTimeout(timer);}},[backgroundReveal,resolvedOperation.toolUseId,primaryMessage?.toolUseId]);');
  s = once(s, '{ "data-tool-use-id": resolvedOperation.toolUseId || primaryMessage?.toolUseId,', '{ ref: backgroundCardRef, "data-tool-use-id": resolvedOperation.toolUseId || primaryMessage?.toolUseId,');
  s = once(s, 'function ToolOperationGroup2({ messages: messages2, isActive: isActive2, isSessionStreaming })', 'function ToolOperationGroup2({ messages: messages2, isActive: isActive2, isSessionStreaming, backgroundReveal })');
  s = once(s, '  const operations = reactExports.useMemo(() => aggregateOperations(messages2), [messages2]);', '  const operations = reactExports.useMemo(() => aggregateOperations(messages2), [messages2]);\n  reactExports.useEffect(()=>{if(backgroundReveal?.toolUseId && operations.some(op=>op.toolUseId===backgroundReveal.toolUseId))setExpanded(true);},[backgroundReveal,operations]);');
  s = once(s, 'jsxRuntimeExports.jsx(ToolUseCard$1, { operation, compact: true }, operation.id)', 'jsxRuntimeExports.jsx(ToolUseCard$1, { operation, compact: true, backgroundReveal }, operation.id)');
  s = once(s, '  displayGroupsLengthRef.current = displayMessageGroups.length;', '  displayGroupsLengthRef.current = displayMessageGroups.length;\n  const backgroundJobs = BackgroundToolUI.useJobs(sessionId);\n  const backgroundResults = reactExports.useMemo(()=>buildBackgroundResults(displayMessageGroups,backgroundJobs,sessionId),[displayMessageGroups,backgroundJobs,sessionId]);\n  const [backgroundReveal,setBackgroundReveal] = reactExports.useState(null);\n  const revealBackgroundTool = reactExports.useCallback(({toolUseId,turnId})=>{setExpandedTurns(prev=>new Set([...prev,turnId]));setBackgroundReveal({toolUseId,request:Date.now()});},[]);');
  s = once(s, 'if (turnCollapseData?.hiddenGroupKeys.has(gKey)) return elements;', 'if (backgroundResults.hiddenNotices.has(group2.message?.id)) return elements;\n                      if (turnCollapseData?.hiddenGroupKeys.has(gKey) && !backgroundResults.preservedAnswers.has(group2.message?.id)) return elements;');
  s = once(s, 'isSessionStreaming: isStreaming\n                            }', 'isSessionStreaming: isStreaming,\n                              backgroundReveal\n                            }');
  const assistantStart = s.indexOf('                      if (msg.role === "assistant") {\n                        const isTurnFinalAssistant');
  const assistantEnd = s.indexOf('                        return elements;', assistantStart);
  if (assistantStart < 0 || assistantEnd < 0) throw Error('Background results assistant render anchor changed');
  let assistant = s.slice(assistantStart, assistantEnd);
  if (!assistant.includes('BackgroundResultsUI.Results')) assistant += '                        if(backgroundResults.byAnswer.has(msg.id)) elements.push(jsxRuntimeExports.jsx("div",{className:processRowIndent,children:jsxRuntimeExports.jsx(BackgroundResultsUI.Results,{rows:backgroundResults.byAnswer.get(msg.id),onReveal:revealBackgroundTool})},"background-results-"+msg.id));\n';
  s = s.slice(0, assistantStart) + assistant + s.slice(assistantEnd);
  return s;
}
export function patchBackgroundFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const [file, patch] of [['src/main/index.js', patchBackgroundMain], ['src/renderer/assets/index-0LVJEr5c.js', patchBackgroundRenderer]]) {
    const target = path.join(root, file); fs.writeFileSync(target, patch(fs.readFileSync(target, 'utf8')));
  }
}
