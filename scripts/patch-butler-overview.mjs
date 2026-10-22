import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function once(s, before, after) {
  if (s.includes(after)) return s;
  if (s.split(before).length !== 2) throw Error('Butler overview anchor changed: ' + before.slice(0, 100));
  return s.replace(before, after);
}
export function patchButlerRenderer(s) {
  const imported = 'import { describeButlerSession, describeButlerTeam } from "./dev-butler-overview.mjs";\n';
  if (!s.includes(imported)) s = imported + s;
  s = once(s, '      waiting: 0,\n      completed: 0,', '      waiting: 0,\n      idle: 0,\n      completed: 0,');
  s = once(s, 'className: "grid grid-cols-4 gap-1.5", children: STAT_CARDS.map', 'className: "grid grid-cols-5 gap-1.5", children: STAT_CARDS.map');
  s = once(s, 'label: instance.t("butlerButlerAssistant:sessionOverview.stat.waiting"), icon: Clock', 'label: instance.language.startsWith("zh") ? "待处理" : "Needs attention", icon: Clock');
  s = once(s, '  { key: "completed", label: instance.t("butlerButlerAssistant:sessionOverview.stat.completed"),', '  { key: "idle", label: instance.language.startsWith("zh") ? "空闲/暂停" : "Idle / paused", icon: MessageSquare, colorClass: "text-text-muted" },\n  { key: "completed", label: instance.t("butlerButlerAssistant:sessionOverview.stat.completed"),');
  // Keep the layout and original evidence/detail preview. Replace only derived state.
  const a = s.indexOf('function normalizeSessionItem('), b = s.indexOf('function getWaitingLabel(', a);
  if (a < 0 || b < a) throw Error('Missing Butler normalization boundary');
  let section = s.slice(a, b);
  if (!section.includes('const overview = describeButlerSession(')) {
    const waitStart = section.indexOf('  const isWaiting = Boolean('), waitEnd = section.indexOf('  const startedAt', waitStart);
    if (waitStart < 0 || waitEnd < 0) throw Error('Missing Butler attention boundary');
    section = section.slice(0, waitStart) + '  const overview = describeButlerSession(session2, interventionCount, instance.language);\n  const isWaiting = overview.isWaiting;\n' + section.slice(waitEnd);
    section = section.replace('  const statusKind = classifySessionStatus(status2, isWaiting);\n  const progress2 = inferProgress(status2, statusKind, runningTime);', '  const statusKind = overview.statusKind;');
    section = section.replace('    statusLabel: getSessionStatusLabel(status2, isWaiting),', '    statusLabel: overview.statusLabel,');
    section = section.replace('    progress: progress2,\n    progressLabel: `${progress2}%`,', '    progress: overview.progress,\n    progressLabel: overview.progressLabel,');
    section = section.replace('  const statusKind = classifyTeamStatus(team2.status);\n  const progress2 = inferTeamProgress(team2.status);', '  const overview = describeButlerTeam(team2, instance.language);\n  const statusKind = overview.statusKind;');
    section = section.replace('    statusLabel: getTeamStatusLabel(team2.status),', '    statusLabel: overview.statusLabel,');
    section = section.replace('    progress: progress2,\n    progressLabel: `${progress2}%`,', '    progress: overview.progress,\n    progressLabel: overview.progressLabel,');
    // Remove obsolete helpers so no future code can reuse guessed percentages.
    const obsolete = section.indexOf('function classifySessionStatus(');
    if (obsolete < 0) throw Error('Missing obsolete Butler helpers');
    section = section.slice(0, obsolete);
  }
  s = s.slice(0, a) + section + s.slice(b);
  s = once(s, 'const rank = { waiting: 0, running: 1, error: 2, completed: 3, all: 4 };', 'const rank = { waiting: 0, running: 1, error: 2, idle: 3, completed: 4, all: 5 };');
  // Both status dots and progress bars use these maps.
  s = s.replaceAll('    waiting: "bg-accent-yellow",\n    completed: "bg-accent-green",', '    waiting: "bg-accent-yellow",\n    idle: "bg-text-muted",\n    completed: "bg-accent-green",');
  const rowA = s.indexOf('function TaskOverviewRow('), rowB = s.indexOf('function normalizeSessionItem(', rowA);
  let row = s.slice(rowA, rowB);
  row = once(row, '      role: "button",', '      "data-testid": "butler-task-row",\n      "data-status-kind": item.statusKind,\n      "data-task-id": item.id,\n      role: "button",');
  row = once(row, '/* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children:', 'Number.isFinite(item.progress) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-testid": "butler-real-progress", className: "mt-2 flex items-center gap-2", children:');
  row = row.replace('Math.max(5, Math.min(100, item.progress))', 'Math.max(0, Math.min(100, item.progress))');
  s = s.slice(0, rowA) + row + s.slice(rowB);
  return s;
}
export function patchButlerHtml(s) {
  const style = '<style id="dev-auxiliary-banner-policy">html.butler-float-transparent-window #dev-edition-banner{display:none!important}html.butler-float-transparent-window:not([data-butler-view="expanded"]) #dev-background{display:none!important}html.butler-float-transparent-window:not([data-butler-view="expanded"]) body,html.butler-float-transparent-window:not([data-butler-view="expanded"]) #root{background:transparent!important}</style>';
  s = s.replace(/<style id="dev-auxiliary-banner-policy">[^<]*<\/style>/, style);
  if (s.includes(style)) return s;
  if (!s.includes('</head>')) throw Error('Missing renderer head');
  return s.replace('</head>', style + '\n  </head>');
}
export function patchButlerFloat(s) {
  s = once(s, 'children: t("floatWindow.cockpitTitle", { name: persona.name })', 'children: `${persona.name && persona.name !== "Butler" ? persona.name : instance.language.startsWith("zh") ? "小光" : "Assistant"} · ${instance.language.startsWith("zh") ? "任务总览" : "Overview"}`');
  return once(s, '    if (showPopover) {\n      window.shineAI?.butler?.resizeFloatWindow?', '    document.documentElement.dataset.butlerView = showPopover ? "expanded" : toastIntervention ? "toast" : "avatar";\n    if (showPopover) {\n      window.shineAI?.butler?.resizeFloatWindow?');
}
export function patchButlerFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const [file, patch] of [['src/renderer/assets/index-0LVJEr5c.js', patchButlerRenderer], ['src/renderer/index.html', patchButlerHtml], ['src/renderer/assets/ButlerFloatWindow-zp2h9K2r.js', patchButlerFloat]]) {
    const target = path.join(root, file); fs.writeFileSync(target, patch(fs.readFileSync(target, 'utf8')));
  }
}
