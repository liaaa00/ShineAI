import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function once(source, from, to) {
  if (source.includes(to)) return source;
  if (source.split(from).length !== 2) throw new Error('Task progress anchor changed: ' + from.slice(0, 100));
  return source.replace(from, to);
}

export function patchTaskProgressRenderer(source) {
  source = source.replace(/\r\n/g, '\n');
  const imported = 'import { createTaskProgressUI, displayRuntimeActivity } from "./dev-task-progress.mjs";\n';
  source = source.replace('import { createTaskProgressUI } from "./dev-task-progress.mjs";\n', imported);
  if (!source.includes(imported)) source = imported + source;
  if (!source.includes('const TaskProgressUI = createTaskProgressUI')) {
    source = once(source, 'const ConversationView = ({ sessionId,', 'const TaskProgressUI = createTaskProgressUI({React:reactExports,jsx:jsxRuntimeExports,language:()=>instance.language});\nconst ConversationView = ({ sessionId,');
  }
  if (!source.includes('/* shine-task-progress: strip */')) {
    const previous = '                  isStreaming && jsxRuntimeExports.jsx(TaskProgressUI.TaskProgress, {';
    const original = '                  isStreaming && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className:';
    const start = source.indexOf(previous) >= 0 ? source.indexOf(previous) : source.indexOf(original);
    const end = source.indexOf('                  pendingPermission &&', start);
    if (start < 0 || end < start) throw new Error('Task progress streaming block changed');
    source = source.slice(0, start) + source.slice(end);
    source = once(source, '          /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserPolicyWaitCard, { sessionId }),', `          /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserPolicyWaitCard, { sessionId }),
          /* shine-task-progress: strip */ jsxRuntimeExports.jsx(TaskProgressUI.TaskProgress, {
            sessionId, status:status2, messages:messages2, jobs:backgroundJobs,
            streaming:sessionLive || isStreaming, hasActiveAgents,
            startedAt:streamingStartTimes.get(sessionId), heartbeat:heartbeat2,
            lastActivity, liveProgressText, toolStatus:toolStatus2,
            pendingPermission, pendingAskQuestion, pendingPlanApproval
          }),`);
  }
  // This is the plan's status, not evidence that a provider or background
  // process has finished. Preserve its existing controls and layout.
  source = source.replace('allCompleted: "全部完成",', 'allCompleted: "计划步骤已完成",');
  source = source.replace('allCompleted: "All done",', 'allCompleted: "Plan steps completed",');
  source = source.replace('  alwaysReplyInChinese: false,', '  alwaysReplyInChinese: true,');
  source = once(source, '  if (!detail2.includes("[object Object]")) return detail2;', '  if (!detail2.includes("[object Object]")) return displayRuntimeActivity(detail2, instance.language.startsWith("zh"));');
  return source;
}

export function patchTaskProgressHtml(source) {
  return source.includes('./assets/dev-task-progress.css') ? source : source.replace('</head>', '<link rel="stylesheet" href="./assets/dev-task-progress.css">\n  </head>');
}

export function patchTaskProgressMain(source) {
  source = once(source, "'alwaysReplyInChinese':!0x1,", "'alwaysReplyInChinese':!0x0,");
  const from = '进度说明可选且宜短，不必逐步播报工具前后动作。';
  const to = '面向用户的过程说明、执行进度和最终交付默认都用简明中文；技能中的英文模板不能覆盖这一语言要求。不要逐条翻译工具日志；命令、路径、代码和用户要求的外语产出保留原文。说明下一步真实动作，不能把计划打勾当成执行或验证成功。';
  return source.includes(to) ? source : once(source, from, to);
}

export function patchTaskProgressFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const [file, patch] of [['src/renderer/assets/index-0LVJEr5c.js', patchTaskProgressRenderer], ['src/renderer/index.html', patchTaskProgressHtml], ['src/main/index.js', patchTaskProgressMain]]) {
    const target = path.join(root, file);
    fs.writeFileSync(target, patch(fs.readFileSync(target, 'utf8')));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) patchTaskProgressFiles();
