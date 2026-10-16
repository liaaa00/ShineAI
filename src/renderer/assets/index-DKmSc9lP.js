import { bindWorkbenchLayout } from "./dev-workbench.js";
const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./TerminalDockPanel-2hrQHTSz.js","./index-0LVJEr5c.js","./index-qrggy75z.css","./KnowledgeDockPanel-DsA1k2lc.js"])))=>i.map(i=>d[i]);
import { bM as ts$1, bN as childrenIndex, bO as resolveScheduleGoalIds, bP as isScheduledGoal, bQ as scheduledGoalNextRunAt, bR as describeCron, bS as isGoalLineActive, bT as isGoalAbandoned, bU as isGoalClosed, bV as sessionStepText, bW as navigateToSessionForChat, c as useSessionStore, bX as useSchedulerStore, bY as openWorkspaceSurface, bZ as navigateToSession, b_ as useWorkflowStore, b$ as useProposalStore, c0 as useGoalStore, d as useTeamStore, u as useTranslation, j as jsxRuntimeExports, r as reactExports, c1 as useWorkGroupStore, c2 as PRIORITY_HEX, c3 as WorkGroupDot, c4 as useUIStore, c5 as create, c6 as getDriveModeLockState, c7 as getExecutionModeLockState, c8 as executionModeOfWho, c9 as Select, ca as pickExpertDisplayName, cb as getVisibleWorkflowTemplates, cc as listRolePresets, cd as ListTodo, ce as CalendarClock, cf as Repeat, cg as Play, ch as ChevronDown, ci as reactDomExports, cj as GitBranch, ck as Users, aI as Bot, cl as MessageSquare, az as Lock, cm as useCurrentPlan, cn as NOVICE_HERO_DRAFT_KEY, co as useWorkGroupComposerStore, cp as injectMainSessionExpertInstruction, cq as toExpertMentionSelection, X, cr as Plus, cs as Flag, ct as PenLine, cu as NoviceHeroScreen, cv as NewGoalDialog, cw as focusOnCanvasWhenReady, cx as SquareTerminal, b as useSettingsStore, aj as getSessionById, cy as useFileManagerStore, cz as Inbox, cA as Stamp, cB as Target, cC as Workflow, cD as useProviders, aF as Star, cE as useSessionWorkGroup, cF as PriorityBadge, cG as WORK_GROUP_HEX, cH as AutoGroupBadge, cI as ChatImage, cJ as ChevronRight, aD as cn, cK as useReactFlow, cL as index, cM as SelectionMode, cN as Background, cO as BackgroundVariant, cP as useWorkbenchGoalsView, cQ as Maximize, cR as SquareDashedMousePointer, cS as LayoutGrid, cT as FolderPlus, cU as ListChecks, cV as Compass, cW as Eye, cX as WandSparkles, cY as Clock3, cZ as CircleHelp, aE as Search, al as Pin, c_ as useWorkbenchDockStore, c$ as Ellipsis, d0 as Check, d1 as openGoalsView, d2 as useStore, d3 as NodeResizer, aG as History, d4 as getBezierPath, d5 as BaseEdge, d6 as Pencil, d7 as Tag, d8 as Trash2, d9 as Handle, da as Position, db as ChevronLeft, dc as shouldShowPendingPermission, dd as getActiveInteractiveActivity, de as l3ShouldYieldToUser, df as isInteractiveActivityExpired, dg as buildSourcePathCandidatesFromLocator, dh as useFileTabStore, K as instance, di as LoaderCircle, ay as RefreshCw, aC as ExternalLink, dj as useShellTerminalStore, dk as ShellTerminalView, dl as MarkdownRenderer, dm as openProduct, dn as inferProductKind, dp as toPdfPreviewSrc, dq as OfficePreviewPane, dr as isPdfPath, ds as previewImage, dt as openExternalLink, du as EMPTY_ATTACHMENT_TEXTAREA_PAYLOAD, dv as AskUserQuestionPanel, dw as AttachmentTextarea, dx as parseMessageContentWithImages, dy as extractLocalFilePaths, dz as inferProductKind$1, p as useButlerStore, dA as selectL3Guard, dB as useConversation, dC as useSessionGoalTitle, dD as getActiveReplySuggestions, dE as DeleteConfirmDialog, am as ConversationView, dF as buildTurnDurationMetaMap, dG as MessageImages, dH as formatMessageTime, dI as formatExactTime, dJ as MessageBubble, dK as deriveGoalTitle, dL as openAdvancedScheduler, aV as Settings2, dM as useNeedsHumanStore, dN as mergeSessionTokens, dO as splitTeamTasks, dP as isLeaderRoleName, dQ as TeamMessageFlow, dR as getTeamTaskStatusMeta, dS as buildNodeRuntimeData, dT as getReviewContent, dU as RejectReasonForm, dV as getReworkTargets, dW as NodeResultView, dX as isTopLevelListSession, dY as ConfirmDialog, dZ as useStoreApi, d_ as registerCanvasFocus, d$ as navigateToProposalTarget, e0 as applyNodeChanges, e1 as SessionShareDialog, e2 as createDerivedSession, e3 as ensureProviders, e4 as peekProviders, e5 as findFocusNode, e6 as CANVAS_MIN_W, e7 as DOCK_PANELS, e8 as canDockPanelHere, e9 as ArrowLeftRight, n as Maximize2, ea as openDockPanelFullscreen, eb as BrowserPaneHost, ec as acquireEmbeddedBrowserSuppression, ed as dragDockWidth, bh as __vitePreload, ee as focusOnCanvas, ef as indexGoalsBySession, eg as startWorkGroupSync, eh as useGoalsSync, ei as goalsBridge, ej as loadWorkbenchGoalScope, ek as mergeGoalLists, el as describeSchedule, em as getFirstQuestionText, en as isAgentChildSession, eo as isButlerGoalSessionConfig, ep as groupSessionsByProject, eq as getSessionProjectRoot, er as normalizeDirectoryKey, es as getShortPath, et as ReactFlowProvider } from "./index-0LVJEr5c.js";
import MessageCircleQuestion from "./message-circle-question-BIsODvjB.js";
import Crosshair from "./crosshair-a6pbCt7b.js";
import BellDot from "./bell-dot-B1Fi_jDO.js";
const CANVAS_NODE_KINDS = ["session", "pipeline", "goal", "team", "proposal", "idea", "inbox"];
const CANVAS_GROUP_ATTENTION = "attention";
const CANVAS_GROUP_SCHEDULED = "scheduled";
const CANVAS_GROUP_OTHER = "other";
const CANVAS_GROUP_FAVORITES = "favorites";
const CANVAS_GROUP_TEAMS = "teams";
const CANVAS_GROUP_WORKFLOWS = "workflows";
const CANVAS_IDEA_TAGS = ["thought", "todo", "ref"];
const CANVAS_LAYOUT_VERSION = 2;
const CANVAS_LAYOUT_SETTING_KEY = "workbenchCanvasLayout";
const isUserIntentGroup = (kind) => kind === "user" || kind === "work";
function emptyLayout() {
  return { version: CANVAS_LAYOUT_VERSION, nodes: {}, groups: [], edges: [], inboxes: [], ideas: [], viewport: { x: 0, y: 0, zoom: 1 } };
}
const isRec = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v, d = 0) => typeof v === "number" && Number.isFinite(v) ? v : d;
const str = (v) => typeof v === "string" && v ? v : null;
const arr = (v) => Array.isArray(v) ? v : [];
const GROUP_KINDS = ["attention", "project", "scheduled", "favorites", "teams", "workflows", "other", "user", "work"];
const INBOX_SUBS = ["list", "sheet", "folder"];
function parseGroup(v) {
  if (!isRec(v)) return null;
  const id = str(v.id);
  if (!id) return null;
  const kind = GROUP_KINDS.includes(v.kind) ? v.kind : "user";
  return {
    id,
    kind,
    title: str(v.title) ?? id,
    x: num(v.x),
    y: num(v.y),
    w: Math.max(80, num(v.w, 560)),
    h: Math.max(60, num(v.h, 240)),
    projectKey: str(v.projectKey),
    // 旧数据（原型 frames）一律视为用户动过
    userTouched: v.userTouched === void 0 ? true : v.userTouched === true,
    collapsed: v.collapsed === true,
    ...v.locked === true ? { locked: true } : {}
  };
}
function parseNodeLayout(v) {
  if (!isRec(v)) return null;
  if (typeof v.x !== "number" || typeof v.y !== "number" || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
  const out = { x: v.x, y: v.y };
  const g = str(v.groupId) ?? str(v.frame);
  if (g) out.groupId = g;
  if (v.pinned === true) out.pinned = true;
  if (v.hidden === true) out.hidden = true;
  const parkedAt = str(v.parkedAt);
  if (parkedAt) out.parkedAt = parkedAt;
  if (v.unplaced === true) out.unplaced = true;
  return out;
}
function parseEdge(v) {
  if (Array.isArray(v)) return str(v[0]) && str(v[1]) ? { source: v[0], target: v[1] } : null;
  if (!isRec(v)) return null;
  const source = str(v.source);
  const target = str(v.target);
  return source && target ? { source, target } : null;
}
function parseIdea(v) {
  if (!isRec(v)) return null;
  const id = str(v.id);
  if (!id || typeof v.text !== "string") return null;
  const tag = CANVAS_IDEA_TAGS.includes(v.tag) ? v.tag : void 0;
  const w = num(v.w);
  const h = num(v.h);
  return { id, text: v.text, createdAt: str(v.createdAt) ?? (/* @__PURE__ */ new Date(0)).toISOString(), x: num(v.x), y: num(v.y), groupId: str(v.groupId), ...tag ? { tag } : {}, ...w > 0 && h > 0 ? { w, h } : {} };
}
function parseInbox(v) {
  if (!isRec(v)) return null;
  const id = str(v.id);
  if (!id) return null;
  const subKind = INBOX_SUBS.includes(v.subKind) ? v.subKind : "list";
  return { id, title: str(v.title) ?? id, subKind, x: num(v.x), y: num(v.y), groupId: str(v.groupId), openTarget: str(v.openTarget) };
}
function parseViewport(v) {
  if (!isRec(v)) return { x: 0, y: 0, zoom: 1 };
  const zoom = num(v.zoom ?? v.z ?? v.k, 1);
  return { x: num(v.x), y: num(v.y), zoom: zoom > 0.05 && zoom < 10 ? zoom : 1 };
}
const compact = (list) => list.filter((v) => v !== null);
function parseLayout(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return emptyLayout();
    }
  }
  if (!isRec(data)) return emptyLayout();
  const nodes = {};
  if (Array.isArray(data.nodes)) {
    for (const n of data.nodes) {
      const id = isRec(n) ? str(n.id) : null;
      const parsed = id ? parseNodeLayout(n) : null;
      if (id && parsed) nodes[id] = parsed;
    }
  } else if (isRec(data.nodes)) {
    for (const [id, n] of Object.entries(data.nodes)) {
      const parsed = parseNodeLayout(n);
      if (parsed) nodes[id] = parsed;
    }
  }
  const seenGroups = /* @__PURE__ */ new Set();
  const groups = compact(arr(data.groups ?? data.frames).map(parseGroup)).filter((g) => !seenGroups.has(g.id) && seenGroups.add(g.id));
  const edgeKeys = /* @__PURE__ */ new Set();
  const edges = compact(arr(data.edges).map(parseEdge)).filter((e) => {
    const k = `${e.source}->${e.target}`;
    return e.source !== e.target && !edgeKeys.has(k) && edgeKeys.add(k);
  });
  const layout = {
    version: CANVAS_LAYOUT_VERSION,
    nodes,
    groups,
    edges,
    inboxes: compact(arr(data.inboxes).map(parseInbox)),
    ideas: compact(arr(data.ideas).map(parseIdea)),
    viewport: parseViewport(data.viewport ?? data.cam),
    updatedAt: str(data.updatedAt) ?? void 0
  };
  if (typeof data.version === "number" && data.version < 2) return { ...resetAutoGroups(layout, true), viewport: { x: 0, y: 0, zoom: 1 } };
  return layout;
}
function serializeLayout(layout, now = Date.now()) {
  return { ...layout, version: CANVAS_LAYOUT_VERSION, updatedAt: new Date(now).toISOString() };
}
function patchNode(layout, id, patch, fallback) {
  const prev = layout.nodes[id] ?? (fallback ? { x: fallback.x, y: fallback.y } : null);
  if (!prev) return layout;
  return { ...layout, nodes: { ...layout.nodes, [id]: { ...prev, ...patch } } };
}
function moveNode(layout, id, x, y, groupId) {
  const next = patchNode(layout, id, groupId === void 0 ? { x, y } : { x, y, groupId }, { x, y });
  if (!next.nodes[id]?.unplaced) return next;
  const { unplaced: _drop, ...placed } = next.nodes[id];
  return { ...next, nodes: { ...next.nodes, [id]: placed } };
}
function pinNode(layout, id, pinned, at) {
  return patchNode(layout, id, { pinned }, at);
}
function hideNode(layout, id, hidden, at) {
  return patchNode(layout, id, { hidden }, at);
}
function parkNode(layout, id, parkedAt, at) {
  const next = patchNode(layout, id, {}, at);
  const cur = next.nodes[id];
  if (!cur) return next;
  const { parkedAt: _drop, ...rest } = cur;
  return { ...next, nodes: { ...next.nodes, [id]: parkedAt ? { ...rest, parkedAt } : rest } };
}
function upsertGroup(layout, group) {
  const next = { ...group, userTouched: true };
  const i = layout.groups.findIndex((g) => g.id === group.id);
  const groups = i < 0 ? [...layout.groups, next] : layout.groups.map((g, j) => j === i ? next : g);
  return { ...layout, groups };
}
function setGroupCollapsed(layout, group, collapsed) {
  const i = layout.groups.findIndex((g) => g.id === group.id);
  const groups = i < 0 ? [...layout.groups, { ...group, collapsed }] : layout.groups.map((g, j) => j === i ? { ...g, collapsed } : g);
  return { ...layout, groups };
}
function resetAutoGroups(layout, includeTouched) {
  const groups = layout.groups.map((g) => !isUserIntentGroup(g.kind) && (includeTouched || g.userTouched === false) ? { ...g, userTouched: false } : g);
  const fixed = new Set(groups.filter((g) => isUserIntentGroup(g.kind) || g.userTouched !== false).map((g) => g.id));
  const nodes = {};
  for (const [id, n] of Object.entries(layout.nodes)) {
    if (id.startsWith("idea:") || id.startsWith("inbox:") || n.groupId != null && fixed.has(n.groupId)) nodes[id] = n;
    else if (n.pinned || n.hidden || n.parkedAt) nodes[id] = { ...n, unplaced: true };
  }
  return { ...layout, nodes, groups };
}
function removeGroup(layout, id) {
  const nodes = {};
  for (const [k, n] of Object.entries(layout.nodes)) nodes[k] = n.groupId === id ? { ...n, groupId: null } : n;
  return { ...layout, nodes, groups: layout.groups.filter((g) => g.id !== id) };
}
const legacyUserGroups = (layout) => layout.groups.filter((g) => g.kind === "user");
function legacyGroupSessionIds(layout, groupId) {
  return Object.entries(layout.nodes).filter(([id, n]) => n.groupId === groupId && id.startsWith("session:")).map(([id]) => id.slice("session:".length));
}
function rekeyLegacyGroup(layout, oldId, newCanvasId) {
  const old = layout.groups.find((g) => g.id === oldId && g.kind === "user");
  if (!old) return layout;
  const nodes = {};
  for (const [k, n] of Object.entries(layout.nodes)) nodes[k] = n.groupId === oldId ? { ...n, groupId: newCanvasId } : n;
  const exists = layout.groups.some((g) => g.id === newCanvasId);
  return {
    ...layout,
    nodes,
    groups: exists ? layout.groups.filter((g) => g.id !== oldId) : layout.groups.map((g) => g.id === oldId ? { ...g, id: newCanvasId, kind: "work", userTouched: true } : g),
    ideas: layout.ideas.map((i) => i.groupId === oldId ? { ...i, groupId: newCanvasId } : i),
    inboxes: layout.inboxes.map((i) => i.groupId === oldId ? { ...i, groupId: newCanvasId } : i)
  };
}
function addUserEdge(layout, source, target) {
  if (source === target || layout.edges.some((e) => e.source === source && e.target === target)) return layout;
  return { ...layout, edges: [...layout.edges, { source, target }] };
}
function removeUserEdge(layout, source, target) {
  return { ...layout, edges: layout.edges.filter((e) => !(e.source === source && e.target === target)) };
}
function upsertIdea(layout, idea) {
  const exists = layout.ideas.some((i) => i.id === idea.id);
  return { ...layout, ideas: exists ? layout.ideas.map((i) => i.id === idea.id ? idea : i) : [...layout.ideas, idea] };
}
function removeIdea(layout, id) {
  return dropNodeRefs({ ...layout, ideas: layout.ideas.filter((i) => i.id !== id) }, `idea:${id}`);
}
function handoffIdea(layout, id, nodeId2) {
  const from = `idea:${id}`;
  let next = removeIdea(layout, id);
  for (const e of layout.edges) {
    if (e.source === from) next = addUserEdge(next, nodeId2, e.target);
    else if (e.target === from) next = addUserEdge(next, e.source, nodeId2);
  }
  return next;
}
function updateIdeaText(layout, id, text) {
  const body = text.trim();
  if (!body || !layout.ideas.some((i) => i.id === id)) return layout;
  return { ...layout, ideas: layout.ideas.map((i) => i.id === id ? { ...i, text: body } : i) };
}
function setIdeaSize(layout, id, w, h) {
  if (!(w > 0 && h > 0) || !layout.ideas.some((i) => i.id === id)) return layout;
  return { ...layout, ideas: layout.ideas.map((i) => i.id === id ? { ...i, w: Math.round(w), h: Math.round(h) } : i) };
}
function setIdeaTag(layout, id, tag) {
  if (!layout.ideas.some((i) => i.id === id)) return layout;
  return {
    ...layout,
    ideas: layout.ideas.map((i) => {
      if (i.id !== id) return i;
      const { tag: _old, ...rest } = i;
      return tag ? { ...rest, tag } : rest;
    })
  };
}
function upsertInbox(layout, inbox) {
  const exists = layout.inboxes.some((i) => i.id === inbox.id);
  return { ...layout, inboxes: exists ? layout.inboxes.map((i) => i.id === inbox.id ? inbox : i) : [...layout.inboxes, inbox] };
}
function removeInbox(layout, id) {
  return dropNodeRefs({ ...layout, inboxes: layout.inboxes.filter((i) => i.id !== id) }, `inbox:${id}`);
}
function setViewport(layout, viewport) {
  return { ...layout, viewport };
}
function dropNodeRefs(layout, nodeId2) {
  const { [nodeId2]: _drop, ...nodes } = layout.nodes;
  return { ...layout, nodes, edges: layout.edges.filter((e) => e.source !== nodeId2 && e.target !== nodeId2) };
}
const CANVAS_COPY_ZH = {
  lang: "zh",
  status: { running: "在跑", sleeping: "在睡", queued: "排队", succeeded: "完成", partial: "部分完成", failed: "失败", stopped: "已停", awaiting: "等你" },
  groupScheduled: "定时流水线",
  groupOther: "其他",
  groupAttention: "待处理",
  attentionEmpty: "✓ 暂无待处理",
  workflowsEmpty: "暂无工作流在跑",
  groupTeams: "团队运行",
  groupWorkflows: "工作流",
  interruptedResumable: "已中断，可恢复",
  quietFor: (h) => `${h}h 无动静`,
  lastRun: (t2, note) => note ? `上一轮 ${t2} · ${note}` : `上一轮 ${t2}`,
  firstRunPending: "刚建好，等第一轮",
  nextRun: (t2) => `下一轮 ${t2}`,
  subTasksRunning: (n) => `${n} 个子任务在跑`,
  runReason: { userStopped: "手动停止", timeout: "超时", restarted: "应用重启中断", providerError: "模型接口报错", noCompletion: "没有正常收尾", started: "已启动" },
  teamRunning: (r, n) => `${r}/${n} 个成员在跑`,
  workflowProgress: (d, n) => `${d}/${n} 步完成`,
  workflowFallback: "工作流",
  workflowHistory: "已运行的工作流",
  workflowHistoryTail: (n) => `最近 ${n} 次执行，点开逐个查看`,
  goalProgress: (d, n) => `进度 ${d}/${n}`,
  inboxToday: (n) => `今天收到 ${n} 条`,
  summaryNeedsYou: (n) => `${n} 件待处理`,
  summaryRunning: (n) => `${n} 个在跑`,
  summaryNext: (t2) => `下一轮 ${t2}`,
  summarySep: " · "
};
const CANVAS_COPY_EN = {
  lang: "en",
  status: { running: "Running", sleeping: "Sleeping", queued: "Queued", succeeded: "Done", partial: "Partly done", failed: "Failed", stopped: "Stopped", awaiting: "Needs you" },
  groupScheduled: "Scheduled pipelines",
  groupOther: "Other",
  groupAttention: "Needs you",
  attentionEmpty: "✓ Nothing needs you",
  workflowsEmpty: "No workflows running",
  groupTeams: "Team runs",
  groupWorkflows: "Workflows",
  interruptedResumable: "Interrupted, can resume",
  quietFor: (h) => `Quiet for ${h}h`,
  lastRun: (t2, note) => note ? `Last run ${t2} · ${note}` : `Last run ${t2}`,
  firstRunPending: "Just created, waiting for the first run",
  nextRun: (t2) => `Next ${t2}`,
  subTasksRunning: (n) => `${n} subtask${n === 1 ? "" : "s"} running`,
  runReason: { userStopped: "Stopped by you", timeout: "Timed out", restarted: "Interrupted by app restart", providerError: "Model API error", noCompletion: "Ended without finishing", started: "Started" },
  teamRunning: (r, n) => `${r}/${n} members running`,
  workflowProgress: (d, n) => `${d}/${n} steps done`,
  workflowFallback: "Workflow",
  workflowHistory: "Finished workflows",
  workflowHistoryTail: (n) => `Last ${n} runs, open to inspect each`,
  goalProgress: (d, n) => `Progress ${d}/${n}`,
  inboxToday: (n) => `${n} received today`,
  summaryNeedsYou: (n) => `${n} need you`,
  summaryRunning: (n) => `${n} running`,
  summaryNext: (t2) => `next ${t2}`,
  summarySep: " · "
};
function canvasCopyFor(lang) {
  return lang?.toLowerCase().startsWith("en") ? CANVAS_COPY_EN : CANVAS_COPY_ZH;
}
function hhmm$3(iso) {
  if (iso === null || iso === void 0 || iso === "") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
const WORK_GROUP_COLORS = ["blue", "green", "amber", "purple", "pink", "teal", "slate", "orange"];
const WORK_PRIORITIES = ["urgent_important", "important", "urgent", "neither"];
const WORK_GROUP_CANVAS_PREFIX = "group:";
const workGroupCanvasId = (groupId) => `${WORK_GROUP_CANVAS_PREFIX}${groupId}`;
const workGroupIdFromCanvas = (canvasId) => canvasId && canvasId.startsWith(WORK_GROUP_CANVAS_PREFIX) ? canvasId.slice(WORK_GROUP_CANVAS_PREFIX.length) : null;
function matchDirRule(dir, rules) {
  const norm = (s) => s.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  const d = norm(dir);
  return rules.some((r) => {
    const raw = norm(r.trim());
    if (!raw) return false;
    if (raw.endsWith("*")) return d.startsWith(raw.slice(0, -1));
    return d === raw || d.startsWith(`${raw}/`);
  });
}
function skyline(items, maxW, gap) {
  let segs = [{ x: 0, w: Number.POSITIVE_INFINITY, y: 0 }];
  const pos = {};
  let w = 0;
  let h = 0;
  for (const it of items) {
    let best = null;
    for (let i = 0; i < segs.length; i++) {
      const x = segs[i].x;
      if (x > 0 && x + it.w > maxW) break;
      let y = 0;
      for (let j = i; j < segs.length && segs[j].x < x + it.w; j++) y = Math.max(y, segs[j].y);
      if (!best || y < best.y) best = { x, y };
    }
    const at = best;
    pos[it.id] = at;
    w = Math.max(w, at.x + it.w);
    h = Math.max(h, at.y + it.h);
    const l = at.x;
    const r = at.x + it.w + gap;
    const next = [];
    for (const s of segs) {
      const se = s.x + s.w;
      if (se <= l || s.x >= r) {
        next.push(s);
        continue;
      }
      if (s.x < l) next.push({ x: s.x, w: l - s.x, y: s.y });
      if (se > r) next.push({ x: r, w: se - r, y: s.y });
    }
    next.push({ x: l, w: r - l, y: at.y + it.h + gap });
    next.sort((a, b) => a.x - b.x);
    segs = next;
  }
  return { pos, w, h };
}
const fitScore = (w, h, aspect) => Math.min(aspect / Math.max(w, 1), 1 / Math.max(h, 1));
function packGroups(items, aspect, gap) {
  if (items.length === 0) return { pos: {}, w: 0, h: 0 };
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const maxItem = Math.max(...items.map((i) => i.w));
  const total = items.reduce((s, i) => s + i.w + gap, 0);
  const step = Math.max(24, (total - maxItem) / 80);
  let best = null;
  let bestScore = -1;
  for (let W = maxItem; W <= total + step; W += step) {
    const r = skyline(items, W, gap);
    const s = fitScore(r.w, r.h, a);
    if (s > bestScore + 1e-12 || Math.abs(s - bestScore) <= 1e-12 && best && r.w * r.h < best.w * best.h) {
      best = r;
      bestScore = s;
    }
  }
  return best;
}
function fitViewport(bounds, view, opts) {
  const p = opts.padding;
  const viewH = Math.max(view.height - Math.max(0, opts.bottomInset ?? 0), p * 2 + 1);
  const raw = Math.min((view.width - p * 2) / Math.max(bounds.w, 1), (viewH - p * 2) / Math.max(bounds.h, 1));
  const zoom = Math.min(opts.maxZoom, Math.max(opts.minZoom, raw));
  if (raw < opts.minZoom) {
    const f = opts.focus ?? bounds;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    return {
      x: clamp(p - f.x * zoom, view.width - p - (bounds.x + bounds.w) * zoom, p - bounds.x * zoom),
      y: clamp(p - f.y * zoom, viewH - p - (bounds.y + bounds.h) * zoom, p - bounds.y * zoom),
      zoom
    };
  }
  const slackY = raw > opts.maxZoom ? (viewH - p * 2 - bounds.h * zoom) / 2 : 0;
  return {
    x: (view.width - bounds.w * zoom) / 2 - bounds.x * zoom,
    y: p + slackY - bounds.y * zoom,
    zoom
  };
}
function mapSessionStatus(status) {
  switch (status) {
    case "starting":
    case "running":
      return "running";
    case "waiting_input":
      return "awaiting";
    case "idle":
      return "sleeping";
    case "completed":
      return "succeeded";
    case "error":
      return "failed";
    default:
      return "stopped";
  }
}
function mapExecutionStatus(status) {
  switch (status) {
    case "running":
    case "compacting":
      return "running";
    case "pending":
    case "queued":
      return "queued";
    case "waiting_input":
    case "waiting_user":
      return "awaiting";
    case "completed":
    case "finalized":
      return "succeeded";
    case "failed":
      return "failed";
    default:
      return "stopped";
  }
}
function mapGoalStatus(goal) {
  if (goal.drive?.pendingApproval || goal.drive?.status === "waiting_approval") return "awaiting";
  switch (goal.drive?.status) {
    case "running":
      return "running";
    case "sleeping":
      return "sleeping";
    case "done":
      return "succeeded";
    case "failed":
      return "failed";
    case "paused":
    case "cancelled":
      return "stopped";
    case "draft":
      return "queued";
  }
  switch (goal.boardStatus) {
    case "in_progress":
      return "running";
    case "review":
    case "waiting":
      return "awaiting";
    case "done":
      return "succeeded";
    default:
      return "queued";
  }
}
function mapRunResult(status) {
  switch (status) {
    case "running":
      return null;
    case "success":
    case "completed":
    case "finalized":
      return "ok";
    case "partial":
      return "partial";
    default:
      return "failed";
  }
}
function runResultStatus(result) {
  return result === "ok" ? "succeeded" : result;
}
function mapScheduleStatus(input) {
  if (!input.enabled) return "stopped";
  if (input.running) return "running";
  if ((input.consecutiveFailures ?? 0) > 0) return "failed";
  if (input.lastRunStatus === "partial") return "partial";
  return "sleeping";
}
function mapTeamStatus(status) {
  switch (status) {
    case "starting":
    case "running":
      return "running";
    case "waiting_user":
      return "awaiting";
    case "completed":
      return "succeeded";
    case "failed":
      return "failed";
    default:
      return "stopped";
  }
}
function mapTeamMemberStatus(status) {
  switch (status) {
    case "starting":
    case "running":
      return "running";
    case "pending":
      return "queued";
    case "completed":
      return "succeeded";
    case "failed":
    case "unreachable":
      return "failed";
    case "idle":
      return "sleeping";
    default:
      return "stopped";
  }
}
const WORKFLOW_ENDED_STATUS = /* @__PURE__ */ new Set(["completed", "failed", "cancelled"]);
function mapWorkflowRunStatus(status) {
  return status === "running" ? "running" : status === "completed" ? "succeeded" : status === "failed" ? "failed" : "stopped";
}
function mapWorkflowStepStatus(status) {
  switch (status) {
    case "running":
      return "running";
    case "pending":
    case "waiting_deps":
    case "ready":
      return "queued";
    case "waiting_review":
    case "waiting_interaction":
      return "awaiting";
    case "completed":
    case "skipped":
      return "succeeded";
    case "failed":
      return "failed";
    default:
      return "stopped";
  }
}
function isNeedsYou(status) {
  return status === "awaiting" || status === "failed";
}
const CANVAS_OPEN_SESSION_STATUSES = /* @__PURE__ */ new Set(["starting", "running", "waiting_input", "error", "idle", "interrupted"]);
const BUSY_SESSION = /* @__PURE__ */ new Set(["starting", "running", "waiting_input"]);
const RUN_SESSIONS_MAX = 10;
const HOUR$1 = 36e5;
const FAILED_KEEP_MS = 24 * HOUR$1;
const nodeId = (kind, raw) => `${kind}:${raw}`;
const modelOf = (providerId, modelId) => providerId || modelId ? { providerId: providerId || null, modelId: modelId || null } : null;
function cleanStream(list) {
  const out = [];
  for (const raw of list ?? []) {
    const s = sessionStepText(raw);
    if (s && out[out.length - 1] !== s) out.push(s);
  }
  return out.slice(-5);
}
const SCHEDULER_PARENT = "scheduler:";
const SCHEDULER_NAME = /^(?:Agent:\s*)?scheduler-(?:skill-)?(.+)$/i;
function canvasSessionRole(s) {
  if (s.unlisted) return "hidden";
  if (s.parentSessionId?.startsWith(SCHEDULER_PARENT) || SCHEDULER_NAME.test(s.name)) return "scheduled";
  if (s.teamInstanceId) return "team_member";
  if (s.isAgentChild ?? Boolean(s.parentSessionId)) return "agent";
  return "top";
}
const WORKTREE_SEGMENT = /[\\/]\.shineai-worktrees(?:[\\/].*)?$/i;
const SYSTEM_DIR = /^[a-z]:[\\/](?:windows|program files(?: \(x86\))?)(?:[\\/]|$)|[\\/]butler-goals(?:[\\/]|$)/i;
function stripWorktreePath(path) {
  return path.replace(WORKTREE_SEGMENT, "");
}
function isSystemWorkingDirectory(path) {
  return Boolean(path && SYSTEM_DIR.test(path.trim()));
}
const RUN_REASONS = [
  [/user_termination|(?:terminated|cancell?ed|stopped) by user/i, "userStopped"],
  [/^timeout after\b/i, "timeout"],
  [/interrupted on process restart|进程重启时任务中断/i, "restarted"],
  [/^provider_api_error\b|api request failed/i, "providerError"],
  [/oneShot ended before valid completion/i, "noCompletion"]
];
const EXEC_STATUS_LINE = /^Execution session status:\s*(\w+)/i;
const INTERNAL_ID = /\b(?:[a-z]+Id|id|ID|uuid)\s*[:：=]\s*[\w-]+/g;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const RAW_CODE = /^(?:[a-z]+(?:_[a-z]+)+|success|completed|failed|cancell?ed|timeout|interrupted|partial|running|ok)$/i;
const EN_PREAMBLE = /^(?:I'll|I will|I'm going to|Let me|Now I'll|OK[,.]|Okay[,.])\s/i;
const EDGE_PUNCT = /^[\s，,：:;；、。.]+|[\s，,：:;；、]+$/g;
function humanizeRunNote(text, copy) {
  const raw = (text ?? "").trim();
  if (!raw) return null;
  for (const [re, key] of RUN_REASONS) if (re.test(raw)) return copy.runReason[key];
  const exec = EXEC_STATUS_LINE.exec(raw);
  if (exec) return copy.status[mapExecutionStatus(exec[1])];
  let strippedId = false;
  for (const line of raw.split(/\r?\n/)) {
    if (/^\s*\|/.test(line)) continue;
    const noId = line.replace(INTERNAL_ID, "").replace(UUID, "");
    if (noId !== line) strippedId = true;
    const cleaned = noId.replace(EDGE_PUNCT, "").trim();
    if (!cleaned || RAW_CODE.test(cleaned) || EN_PREAMBLE.test(cleaned)) continue;
    const s = sessionStepText(cleaned);
    if (s) return s;
  }
  return strippedId ? copy.runReason.started : null;
}
function runRecord(run, copy) {
  const result = mapRunResult(run.status);
  if (!result) return null;
  return {
    id: run.id,
    at: run.startedAt,
    result,
    durationSec: typeof run.durationMs === "number" ? Math.round(run.durationMs / 1e3) : null,
    note: result === "failed" ? humanizeRunNote(run.error, copy) ?? humanizeRunNote(run.output, copy) : humanizeRunNote(run.output, copy)
  };
}
function execRecords(goal, copy) {
  const out = [];
  for (const e of goal.executions ?? []) {
    const st = mapExecutionStatus(e.status);
    if (st !== "succeeded" && st !== "failed" && st !== "stopped") continue;
    const at = e.startedAt ?? e.createdAt;
    const end = e.endedAt ? ts$1(e.endedAt) : 0;
    out.push({
      id: e.id,
      at,
      result: st === "succeeded" ? "ok" : "failed",
      durationSec: end && ts$1(at) ? Math.max(0, Math.round((end - ts$1(at)) / 1e3)) : null,
      note: st === "succeeded" ? null : humanizeRunNote(e.errorMessage, copy)
    });
  }
  return out;
}
const byAtDesc = (a, b) => ts$1(b.at) - ts$1(a.at);
function statusTail(status, lastAt, now, copy) {
  const quiet = lastAt ? Math.floor((now - ts$1(lastAt)) / HOUR$1) : 0;
  return status === "sleeping" && quiet >= 1 ? copy.quietFor(quiet) : copy.status[status];
}
function collectCanvasNodes(input) {
  const { now, copy, layout } = input;
  const nodes = [];
  const projects = /* @__PURE__ */ new Map();
  const hostOfSession = /* @__PURE__ */ new Map();
  const pinned = (id) => layout.nodes[id]?.pinned === true;
  const push = (node, project) => {
    const l = layout.nodes[node.id];
    if (l?.hidden) node.hidden = true;
    if (project) node.project = { key: project.key, title: project.title };
    node.density = canvasNodeDensity(node, now);
    nodes.push(node);
    projects.set(node.id, project ?? null);
  };
  const sessionsById = new Map(input.sessions.map((s) => [s.id, s]));
  const goals = input.goals.filter((g) => !g.archivedAt && !g.mergedIntoGoalId);
  const goalsById = new Map(goals.map((g) => [g.id, g]));
  const kids = childrenIndex(goals);
  const rootOf = (g) => {
    let cur = g;
    for (let i = 0; i < 10 && cur.parentGoalId && cur.parentGoalId !== cur.id; i++) {
      const p = goalsById.get(cur.parentGoalId);
      if (!p) break;
      cur = p;
    }
    return cur;
  };
  const goalOfSession = /* @__PURE__ */ new Map();
  for (const s of input.sessions) if (s.goalId && goalsById.has(s.goalId)) goalOfSession.set(s.id, s.goalId);
  for (const g of goals) {
    for (const sid of [g.activeSessionId, g.drive?.sessionId, ...(g.executions ?? []).map((e) => e.sessionId)]) {
      if (sid && !goalOfSession.has(sid)) goalOfSession.set(sid, g.id);
    }
  }
  const goalNodeId = /* @__PURE__ */ new Map();
  const resolved = resolveScheduleGoalIds(goals, input.schedules);
  const schedulesByGoal = /* @__PURE__ */ new Map();
  for (const s of input.schedules) {
    const gid = resolved.get(s.id);
    if (!gid || !goalsById.has(gid)) continue;
    schedulesByGoal.set(gid, [...schedulesByGoal.get(gid) ?? [], s]);
  }
  const runSessionsFor = (sessionIds) => {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const sid of sessionIds) {
      const s = sessionsById.get(sid);
      if (!s || seen.has(sid)) continue;
      seen.add(sid);
      out.push({ sessionId: sid, title: s.name, status: mapSessionStatus(s.status), lastActivityAt: s.lastActivityAt ?? s.startedAt });
    }
    return out.sort((a, b) => ts$1(b.lastActivityAt) - ts$1(a.lastActivityAt)).slice(0, RUN_SESSIONS_MAX);
  };
  const goalSessionIds = (g) => {
    const family = [g, ...kids.get(g.id) ?? []];
    const ids2 = [];
    for (const s of input.sessions) {
      const gid = goalOfSession.get(s.id);
      if (gid && family.some((f) => f.id === gid) && s.isGoalSession) ids2.push(s.id);
    }
    return ids2;
  };
  const keptScheduled = /* @__PURE__ */ new Map();
  const scheduledRank = (g) => schedulesByGoal.has(g.id) ? 1 : 0;
  for (const g of goals) {
    if (g.origin !== "schedule" || !isScheduledGoal(g) || g.parentGoalId) continue;
    const cur = keptScheduled.get(g.title);
    if (!cur || scheduledRank(g) > scheduledRank(cur) || scheduledRank(g) === scheduledRank(cur) && ts$1(g.updatedAt) > ts$1(cur.updatedAt)) keptScheduled.set(g.title, g);
  }
  const pipelineOfSchedule = /* @__PURE__ */ new Map();
  const pipelineByName = /* @__PURE__ */ new Map();
  for (const g of goals) {
    if (!isScheduledGoal(g) || g.parentGoalId) continue;
    const kept = g.origin === "schedule" && !schedulesByGoal.has(g.id) ? keptScheduled.get(g.title) : void 0;
    if (kept && kept !== g) {
      goalNodeId.set(g.id, nodeId("pipeline", kept.id));
      continue;
    }
    const id = nodeId("pipeline", g.id);
    goalNodeId.set(g.id, id);
    const scheds = schedulesByGoal.get(g.id) ?? [];
    for (const s of scheds) {
      pipelineOfSchedule.set(s.id, id);
      pipelineByName.set(s.name, id);
    }
    pipelineByName.set(g.title, id);
    const runs = scheds.flatMap((s) => s.runs ?? []);
    const runningRun = runs.filter((r) => r.status === "running").sort((a, b) => ts$1(b.startedAt) - ts$1(a.startedAt))[0];
    const history = runs.map((r) => runRecord(r, copy)).filter((r) => r !== null);
    if (!history.length) history.push(...execRecords(g, copy));
    history.sort(byAtDesc);
    const latest = [...scheds].sort((a, b) => ts$1(b.lastRunAt) - ts$1(a.lastRunAt))[0];
    let status = mapGoalStatus(g);
    if (!["awaiting", "running", "stopped", "failed"].includes(status)) {
      status = scheds.length ? mapScheduleStatus({
        enabled: scheds.some((s) => s.enabled),
        running: Boolean(runningRun),
        lastRunStatus: latest?.lastRunStatus,
        consecutiveFailures: Math.max(...scheds.map((s) => s.consecutiveFailures))
      }) : "sleeping";
    } else if (runningRun && status !== "stopped") status = "running";
    const nextRunAt = scheduledGoalNextRunAt(g, input.schedules, resolved);
    const last = history[0];
    const lastRunAt = last?.at ?? latest?.lastRunAt ?? g.drive?.lastRunAt ?? null;
    const ask = g.drive?.pendingApproval?.question ?? null;
    const tail = ask ?? (status === "running" ? humanizeRunNote(g.progressSummary, copy) ?? copy.status.running : null) ?? (lastRunAt ? copy.lastRun(hhmm$3(lastRunAt) ?? "", last?.note ?? null) : null) ?? (nextRunAt ? copy.nextRun(hhmm$3(nextRunAt) ?? "") : copy.firstRunPending);
    const scheduleText = scheds.find((s) => s.scheduleText)?.scheduleText ?? (g.drive?.schedule ? describeCron(g.drive.schedule, copy.lang) : null);
    const sessionIds = [...goalSessionIds(g), ...runs.map((r) => r.sessionId).filter((v) => Boolean(v))];
    for (const sid of sessionIds) hostOfSession.set(sid, id);
    push({
      id,
      kind: "pipeline",
      subKind: g.drive?.mode === "cadence" ? "cadence" : "schedule",
      title: g.title,
      status,
      statusSource: { from: "goal", status: g.drive?.status ?? g.boardStatus, mode: g.drive?.mode ?? null },
      tail,
      ask,
      since: runningRun?.startedAt ?? g.drive?.lastRunAt ?? null,
      lastActivityAt: lastRunAt,
      nextRunAt,
      scheduleText,
      history,
      runSessions: runSessionsFor(sessionIds),
      // 目标没单独设就看调度行 action（迁移来的定时目标）
      model: modelOf(g.drive?.providerId, g.drive?.modelId) ?? modelOf(scheds[0]?.providerId, scheds[0]?.modelId),
      groupId: CANVAS_GROUP_SCHEDULED,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: { goalId: g.id, scheduleId: scheds[0]?.id }
    }, input.projectOfGoal?.(g));
  }
  for (const s of input.schedules) {
    if (resolved.get(s.id) && goalsById.has(resolved.get(s.id))) continue;
    const id = nodeId("pipeline", s.id);
    pipelineOfSchedule.set(s.id, id);
    if (!pipelineByName.has(s.name)) pipelineByName.set(s.name, id);
    const runs = s.runs ?? [];
    const runningRun = runs.find((r) => r.status === "running");
    const history = runs.map((r) => runRecord(r, copy)).filter((r) => r !== null).sort(byAtDesc);
    const status = mapScheduleStatus({ enabled: s.enabled, running: Boolean(runningRun), lastRunStatus: s.lastRunStatus, consecutiveFailures: s.consecutiveFailures });
    const nextRunAt = s.enabled ? s.nextRunAt ?? null : null;
    const last = history[0];
    const sessionIds = runs.map((r) => r.sessionId).filter((v) => Boolean(v));
    for (const sid of sessionIds) hostOfSession.set(sid, id);
    push({
      id,
      kind: "pipeline",
      subKind: "standalone",
      title: s.name,
      status,
      statusSource: { from: "schedule", enabled: s.enabled, lastRunStatus: s.lastRunStatus, consecutiveFailures: s.consecutiveFailures },
      tail: status === "running" ? copy.status.running : last ? copy.lastRun(hhmm$3(last.at) ?? "", last.note) : nextRunAt ? copy.nextRun(hhmm$3(nextRunAt) ?? "") : copy.status[status],
      since: runningRun?.startedAt ?? s.lastRunAt ?? null,
      lastActivityAt: last?.at ?? s.lastRunAt ?? null,
      nextRunAt,
      scheduleText: s.scheduleText ?? null,
      history,
      runSessions: runSessionsFor(sessionIds),
      model: modelOf(s.providerId, s.modelId),
      groupId: CANVAS_GROUP_SCHEDULED,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: { scheduleId: s.id }
    }, null);
  }
  for (const g of goals) {
    if (isScheduledGoal(g) || g.parentGoalId && goalsById.has(g.parentGoalId)) continue;
    const id = nodeId("goal", g.id);
    const children = kids.get(g.id) ?? [];
    if (!isGoalLineActive(g, children) && !pinned(id)) continue;
    goalNodeId.set(g.id, id);
    const live = children.filter((c) => !isGoalAbandoned(c));
    const progress = live.length ? { done: live.filter(isGoalClosed).length, total: live.length } : g.acceptance.length ? { done: g.acceptance.filter((a) => a.done).length, total: g.acceptance.length } : null;
    const status = mapGoalStatus(g);
    const ask = g.drive?.pendingApproval?.question ?? null;
    const tail = ask ?? humanizeRunNote(g.progressSummary, copy) ?? sessionStepText(g.acceptance.find((a) => !a.done)?.text) ?? (progress ? copy.goalProgress(progress.done, progress.total) : copy.status[status]);
    const sessionIds = goalSessionIds(g);
    for (const sid of sessionIds) hostOfSession.set(sid, id);
    push({
      id,
      kind: "goal",
      subKind: children.length ? "parent" : g.drive?.mode === "in_session" ? "in_session" : "once",
      title: g.title,
      status,
      statusSource: { from: "goal", status: g.drive?.status ?? g.boardStatus, mode: g.drive?.mode ?? null },
      tail,
      ask,
      since: g.createdAt,
      lastActivityAt: g.drive?.lastRunAt ?? g.updatedAt,
      nextRunAt: g.drive?.nextRunAt ?? null,
      history: execRecords(g, copy).sort(byAtDesc),
      progress,
      runSessions: runSessionsFor(sessionIds),
      model: modelOf(g.drive?.providerId, g.drive?.modelId),
      groupId: CANVAS_GROUP_OTHER,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: { goalId: g.id }
    }, input.projectOfGoal?.(g));
  }
  for (const [sid, gid] of goalOfSession) {
    const g = goalsById.get(gid);
    const host = g && goalNodeId.get(rootOf(g).id);
    if (host && sessionsById.get(sid)?.isGoalSession && !hostOfSession.has(sid)) hostOfSession.set(sid, host);
  }
  const teamIsLive = (t2) => {
    if (TEAM_ENDED_STATUS.has(t2.status ?? "")) return false;
    const live = (sid) => !!sid && BUSY_SESSION.has(sessionsById.get(sid)?.status ?? "");
    const memberSessions = /* @__PURE__ */ new Set();
    for (const m of t2.members) if (m.sessionId) memberSessions.add(m.sessionId);
    for (const x of input.sessions) if (x.teamInstanceId === t2.id) memberSessions.add(x.id);
    if (memberSessions.size) return [...memberSessions].some((sid) => live(sid));
    return t2.status === "starting" && live(t2.parentSessionId);
  };
  const teamIds = /* @__PURE__ */ new Set();
  const zombieTeamIds = /* @__PURE__ */ new Set();
  for (const t2 of input.teams) {
    const id = nodeId("team", t2.id);
    const status = mapTeamStatus(t2.status);
    const endedAt = t2.endedAt ?? t2.startedAt;
    const recentlyFailed = t2.status === "failed" && input.now - ts$1(endedAt) < FAILED_KEEP_MS;
    if (!pinned(id) && !teamIsLive(t2) && !recentlyFailed) {
      zombieTeamIds.add(t2.id);
      continue;
    }
    teamIds.add(t2.id);
    const members = t2.members.map((m) => ({ name: m.name, status: mapTeamMemberStatus(m.status), sessionId: m.sessionId ?? null }));
    for (const m of members) if (m.sessionId) hostOfSession.set(m.sessionId, id);
    const runningCount = members.filter((m) => m.status === "running").length;
    push({
      id,
      kind: "team",
      subKind: "team",
      title: t2.name,
      status,
      statusSource: { from: "team", status: t2.status },
      tail: members.length ? copy.teamRunning(runningCount, members.length) : copy.status[status],
      stream: t2.task ? cleanStream([t2.task]) : void 0,
      since: t2.startedAt,
      lastActivityAt: recentlyFailed ? endedAt : t2.startedAt,
      members,
      groupId: CANVAS_GROUP_OTHER,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: { teamId: t2.id }
    }, t2.project ?? (t2.parentSessionId ? sessionsById.get(t2.parentSessionId)?.project : null));
  }
  const endedWorkflows = [];
  for (const w of input.workflows ?? []) {
    const failed = w.status === "failed";
    if (WORKFLOW_ENDED_STATUS.has(w.status)) endedWorkflows.push(w);
    if (failed ? input.now - ts$1(w.completedAt ?? w.startedAt) >= FAILED_KEEP_MS : w.status !== "running") continue;
    const id = nodeId("team", `workflow:${w.id}`);
    const members = w.steps.map((s) => ({ name: s.name, status: mapWorkflowStepStatus(s.status) }));
    const status = failed ? "failed" : members.some((m) => m.status === "awaiting") ? "awaiting" : "running";
    const doneCount = members.filter((m) => m.status === "succeeded").length;
    push({
      id,
      kind: "team",
      subKind: "workflow",
      title: w.name,
      status,
      statusSource: { from: "workflow", status: w.status },
      tail: copy.workflowProgress(doneCount, members.length),
      since: w.startedAt,
      lastActivityAt: failed ? w.completedAt ?? w.startedAt : w.startedAt,
      members,
      groupId: CANVAS_GROUP_OTHER,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: { workflowExecutionId: w.id }
    }, null);
  }
  if (endedWorkflows.length) {
    const endAt2 = (w) => w.completedAt ?? w.startedAt;
    const runs = endedWorkflows.sort((a, b) => ts$1(endAt2(b)) - ts$1(endAt2(a)));
    const id = nodeId("team", "workflow-history");
    push({
      // 状态固定「完成」（不是等你 / 失败，不被「待处理」收走）；各次成败看成员点的颜色
      id,
      kind: "team",
      subKind: "workflowHistory",
      title: copy.workflowHistory,
      status: "succeeded",
      statusSource: { from: "workflow", status: "history" },
      tail: copy.workflowHistoryTail(runs.length),
      count: runs.length,
      since: runs[0].startedAt,
      lastActivityAt: endAt2(runs[0]),
      members: runs.slice(0, WORKFLOW_HISTORY_SHOWN).map((w) => ({ name: w.name, status: mapWorkflowRunStatus(w.status) })),
      groupId: CANVAS_GROUP_OTHER,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: {}
    }, null);
  }
  const childSessions = [];
  for (const s of input.sessions) {
    if (s.isGoalSession) continue;
    const role = canvasSessionRole(s);
    if (role === "hidden") continue;
    if (role !== "top") {
      childSessions.push({ s, role });
      continue;
    }
    const id = nodeId("session", s.id);
    if (!CANVAS_OPEN_SESSION_STATUSES.has(s.status) && !pinned(id) && !s.favorite) continue;
    const lastAt = s.lastActivityAt ?? s.startedAt;
    hostOfSession.set(s.id, id);
    const parkedAt = layout.nodes[id]?.parkedAt;
    const blocked = !!s.blockedOnUser && BUSY_SESSION.has(s.status);
    const parked = (s.status === "waiting_input" || blocked) && !!parkedAt && ts$1(lastAt) <= ts$1(parkedAt);
    const status = parked ? "sleeping" : blocked ? "awaiting" : mapSessionStatus(s.status);
    const stream = cleanStream(s.stream);
    const step = sessionStepText(s.lastActivityText) ?? stream[stream.length - 1] ?? null;
    const ask = status === "awaiting" ? sessionStepText(s.ask) : null;
    push({
      id,
      kind: "session",
      subKind: s.missionMode ? "mission" : "chat",
      title: s.name,
      status,
      statusSource: { from: "session", status: s.status },
      tail: s.status === "interrupted" ? copy.interruptedResumable : ask ?? step ?? statusTail(status, lastAt, now, copy),
      stream,
      ask,
      since: s.startedAt,
      lastActivityAt: lastAt,
      ...status === "awaiting" && s.questions?.length ? { questions: s.questions, askId: s.askId } : {},
      model: modelOf(s.providerId, s.modelId),
      groupId: CANVAS_GROUP_OTHER,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: { sessionId: s.id },
      ...parked ? { parked } : {},
      ...s.favorite ? { favorite: true } : {}
    }, s.project);
  }
  const folded = /* @__PURE__ */ new Set();
  const subTasks = /* @__PURE__ */ new Map();
  const hostOfChild = (s, role, depth = 0) => {
    const direct = hostOfSession.get(s.id);
    if (direct) return direct;
    if (role === "scheduled") {
      const schedId = s.parentSessionId?.startsWith(SCHEDULER_PARENT) ? s.parentSessionId.slice(SCHEDULER_PARENT.length) : null;
      return (schedId ? pipelineOfSchedule.get(schedId) : void 0) ?? pipelineByName.get(SCHEDULER_NAME.exec(s.name)?.[1]?.trim() ?? "");
    }
    if (role === "team_member" && s.teamInstanceId && teamIds.has(s.teamInstanceId)) return nodeId("team", s.teamInstanceId);
    const pid = s.parentSessionId;
    if (!pid || depth > 8) return void 0;
    const parent = sessionsById.get(pid);
    const parentRole = parent && !parent.isGoalSession ? canvasSessionRole(parent) : "top";
    return parent && parentRole !== "top" && parentRole !== "hidden" ? hostOfChild(parent, parentRole, depth + 1) : hostOfSession.get(pid);
  };
  for (const { s, role } of childSessions) {
    if (!BUSY_SESSION.has(s.status)) continue;
    const host = hostOfChild(s, role);
    if (!host) continue;
    folded.add(s.id);
    hostOfSession.set(s.id, host);
    subTasks.set(host, [...subTasks.get(host) ?? [], { sessionId: s.id, title: s.name, status: mapSessionStatus(s.status), lastActivityAt: s.lastActivityAt ?? s.startedAt }]);
  }
  for (const n of nodes) {
    const list = subTasks.get(n.id);
    if (!list) continue;
    n.subTasks = list.sort((a, b) => ts$1(b.lastActivityAt) - ts$1(a.lastActivityAt));
    n.density = "full";
    const host = n.kind === "session" && n.ref.sessionId ? sessionsById.get(n.ref.sessionId) : void 0;
    if (n.status === "awaiting" && host?.status === "waiting_input" && !host.asksUser && list.some((t2) => t2.status === "running")) n.status = "running";
  }
  const ids = new Set(nodes.map((n) => n.id));
  for (const p of input.proposals) {
    const host = p.sessionId && !folded.has(p.sessionId) && hostOfSession.get(p.sessionId) || p.goalId && (goalNodeId.get(p.goalId) ?? (goalsById.get(p.goalId) && goalNodeId.get(rootOf(goalsById.get(p.goalId)).id))) || (p.source.type === "team" && ids.has(nodeId("team", p.source.id)) ? nodeId("team", p.source.id) : null) || null;
    if (p.kind === "team_needs_human" && p.source.type === "team" && zombieTeamIds.has(p.source.id)) continue;
    if (host && (p.kind === "session_waiting" || p.kind === "goal_approval" || p.kind === "team_needs_human")) continue;
    const id = nodeId("proposal", p.id);
    push({
      id,
      kind: "proposal",
      subKind: p.kind,
      title: p.title,
      status: "awaiting",
      statusSource: { from: "local" },
      tail: sessionStepText(p.detail) ?? p.title,
      text: p.detail ?? null,
      from: p.source.type,
      since: p.createdAt,
      lastActivityAt: p.createdAt,
      groupId: CANVAS_GROUP_OTHER,
      x: 0,
      y: 0,
      pinned: pinned(id),
      ref: { proposalId: p.id, sessionId: p.sessionId, goalId: p.goalId }
    }, projects.get(host || p.sessionId && hostOfSession.get(p.sessionId) || "") ?? null);
  }
  for (const idea of layout.ideas) {
    const { body, images } = splitIdeaImages(idea.text);
    const [title = "", ...rest] = body.split("\n");
    const id = nodeId("idea", idea.id);
    push({
      id,
      kind: "idea",
      subKind: idea.tag ?? "note",
      title: title.trim() || (images[0]?.split(/[\\/]/).pop() ?? idea.text.slice(0, 40)),
      status: "queued",
      statusSource: { from: "local" },
      // 保留换行：便签正文按 pre-line 多行显示；附图另列，不进正文
      tail: rest.join("\n").trim(),
      text: idea.text,
      images: images.length ? images : void 0,
      since: idea.createdAt,
      groupId: idea.groupId ?? CANVAS_GROUP_OTHER,
      x: idea.x,
      y: idea.y,
      pinned: true,
      ref: { localId: idea.id },
      ...idea.w && idea.h ? { size: { w: idea.w, h: idea.h } } : {}
    }, null);
  }
  for (const box of layout.inboxes) {
    const id = nodeId("inbox", box.id);
    push({
      id,
      kind: "inbox",
      subKind: box.subKind,
      title: box.title,
      status: "sleeping",
      statusSource: { from: "local" },
      tail: copy.inboxToday(0),
      count: 0,
      groupId: box.groupId ?? CANVAS_GROUP_OTHER,
      x: box.x,
      y: box.y,
      pinned: true,
      ref: { localId: box.id }
    }, null);
  }
  return { nodes, projects, hostOfSession };
}
function buildCanvasEdges(input, collected) {
  const byId = new Map(collected.nodes.map((n) => [n.id, n]));
  const edges = /* @__PURE__ */ new Map();
  const add = (kind, source, target) => {
    if (!source || !target || source === target || !byId.has(source) || !byId.has(target)) return;
    const id = `${kind}:${source}->${target}`;
    if (!edges.has(id)) edges.set(id, { id, kind, source, target, active: byId.get(source).status === "running" });
  };
  const host = (sid) => sid ? collected.hostOfSession.get(sid) : void 0;
  for (const s of input.sessions) {
    if (s.isGoalSession || !s.goalId) continue;
    add("runs", `goal:${s.goalId}`, host(s.id));
    add("runs", `pipeline:${s.goalId}`, host(s.id));
  }
  for (const g of input.goals) {
    for (const e of g.executions ?? []) {
      if (!e.teamInstanceId) continue;
      add("runs", `goal:${g.id}`, `team:${e.teamInstanceId}`);
      add("runs", `pipeline:${g.id}`, `team:${e.teamInstanceId}`);
    }
  }
  for (const s of input.schedules) for (const r of s.runs ?? []) if (r.teamInstanceId) add("runs", `pipeline:${s.goalId ?? s.id}`, `team:${r.teamInstanceId}`);
  for (const s of input.sessions) {
    add("spawned", host(s.parentSessionId ?? s.spawnedBySessionId), host(s.id));
  }
  for (const t2 of input.teams) add("spawned", host(t2.parentSessionId), `team:${t2.id}`);
  for (const w of input.watches ?? []) add("watches", host(w.watcherSessionId), host(w.targetSessionId));
  for (const e of input.layout.edges) add("user", e.source, e.target);
  return [...edges.values()];
}
const CANVAS_NODE_W = 240;
const WORKFLOW_HISTORY_SHOWN = 6;
const TEAM_ENDED_STATUS = /* @__PURE__ */ new Set(["completed", "failed", "cancelled", "stopped", "disbanded"]);
const CANVAS_NODE_H = 108;
const CANVAS_MEMBERS_SHOWN = 3;
const MEMBER_ROW_H = 18;
const MEMBER_ROW_GAP = 4;
const MEMBER_BLOCK_GAP = 4;
const CANVAS_SUBTASKS_SHOWN = 3;
const CANVAS_NODE_H_COMPACT = 62;
const CANVAS_NODE_H_CHIP = 40;
const CANVAS_FULL_WITHIN_MS = 24 * HOUR$1;
const CANVAS_COMPACT_WITHIN_MS = 7 * 24 * HOUR$1;
function canvasNodeDensity(n, now) {
  if (n.kind === "idea" || n.kind === "inbox" || n.kind === "proposal" || isNeedsYou(n.status)) return "full";
  if (n.kind === "pipeline") return "compact";
  if (n.status === "running") return "full";
  const at = ts$1(n.lastActivityAt ?? n.since);
  if (!at) return "compact";
  const age = now - at;
  return age < CANVAS_FULL_WITHIN_MS ? "full" : age < CANVAS_COMPACT_WITHIN_MS ? "compact" : "chip";
}
function canvasAskRows(questions) {
  return (questions ?? []).reduce((rows, q) => rows + 1 + Math.ceil(q.options.length / 2), 0);
}
const IDEA_IMAGE_LINE = /^\[图片: (.+)\]$/;
function splitIdeaImages(text) {
  const body = [];
  const images = [];
  for (const line of text.split(/\r?\n/)) {
    const m = IDEA_IMAGE_LINE.exec(line.trim());
    if (m) images.push(m[1]);
    else body.push(line);
  }
  return { body: body.join("\n").trim(), images };
}
const IDEA_SHORT_TEXT = 14;
const IDEA_EXTRA_H = 18 + 3 * 16;
const IDEA_IMAGES_H = 48;
function canvasNodeHeight(n) {
  if (n.size) return n.size.h;
  if (n.density === "chip") return CANVAS_NODE_H_CHIP;
  if (n.density === "compact") return CANVAS_NODE_H_COMPACT;
  let h = CANVAS_NODE_H;
  if (n.kind === "idea" && splitIdeaImages(n.text ?? "").body.length > IDEA_SHORT_TEXT) h += IDEA_EXTRA_H;
  if (n.kind === "idea" && n.images?.length) h += IDEA_IMAGES_H;
  const count = n.kind === "team" ? n.members?.length ?? 0 : 0;
  if (count) {
    const chips = Math.min(count, CANVAS_MEMBERS_SHOWN) + (count > CANVAS_MEMBERS_SHOWN ? 1 : 0);
    const rows = Math.ceil(chips / 2);
    h += MEMBER_BLOCK_GAP + rows * MEMBER_ROW_H + (rows - 1) * MEMBER_ROW_GAP;
  }
  const subs = n.subTasks?.length ?? 0;
  if (subs) {
    const rows = Math.min(subs, CANVAS_SUBTASKS_SHOWN) + (subs > CANVAS_SUBTASKS_SHOWN ? 1 : 0);
    h += MEMBER_BLOCK_GAP + rows * MEMBER_ROW_H + (rows - 1) * MEMBER_ROW_GAP;
  }
  const askRows = canvasAskRows(n.questions);
  if (askRows) h += MEMBER_BLOCK_GAP + askRows * MEMBER_ROW_H + (askRows - 1) * MEMBER_ROW_GAP;
  return h;
}
const GAP$1 = 16;
const PAD_X = 16;
const PAD_TOP = 42;
const PAD_BOTTOM = 16;
const MAX_COLS = 5;
const GROUP_GAP$1 = 40;
const COLLAPSED_H = 40;
const groupW = (cols) => PAD_X * 2 + cols * CANVAS_NODE_W + (cols - 1) * GAP$1;
const colsFor = (n) => Math.min(MAX_COLS, Math.max(1, Math.ceil(Math.sqrt(n / 2))));
const KIND_ORDER = ["pipeline", "goal", "team", "session", "proposal", "inbox", "idea"];
const DENSITY_ORDER = ["full", "compact", "chip"];
const densityRank = (n) => DENSITY_ORDER.indexOf(n.density ?? "full");
const waitedSince$1 = (n) => ts$1(n.lastActivityAt ?? n.since);
function compareGroupMembers(a, b) {
  const ra = a.status === "running" ? 0 : 1;
  const rb = b.status === "running" ? 0 : 1;
  return densityRank(a) - densityRank(b) || ra - rb || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || (ra === 0 ? ts$1(a.since) - ts$1(b.since) : waitedSince$1(b) - waitedSince$1(a)) || a.id.localeCompare(b.id);
}
const overlaps$1 = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const SPOT_RINGS = 12;
function freeSpotNear(at, taken, w = CANVAS_NODE_W, h = CANVAS_NODE_H) {
  let best = at;
  let bestD = Infinity;
  for (let i = -SPOT_RINGS; i <= SPOT_RINGS; i++) {
    for (let j = -SPOT_RINGS; j <= SPOT_RINGS; j++) {
      const r = { x: at.x + i * (w + GAP$1), y: at.y + j * (h + GAP$1), w, h };
      const d = Math.hypot(r.x - at.x, r.y - at.y);
      if (d < bestD && !taken.some((o) => overlaps$1(o, r))) {
        best = { x: r.x, y: r.y };
        bestD = d;
      }
    }
  }
  return best;
}
function canvasFamilies(nodes, edges) {
  const ok = new Set(nodes.filter((n) => !n.hidden && (n.kind === "session" || n.kind === "team")).map((n) => n.id));
  const up = /* @__PURE__ */ new Map();
  const find = (x) => {
    let r = x;
    while (up.has(r)) r = up.get(r);
    return r;
  };
  const hasParent = /* @__PURE__ */ new Set();
  for (const e of edges) {
    if (e.kind !== "spawned" && e.kind !== "watches" || !ok.has(e.source) || !ok.has(e.target)) continue;
    hasParent.add(e.target);
    const a = find(e.source);
    const b = find(e.target);
    if (a !== b) up.set(b, a);
  }
  const members = /* @__PURE__ */ new Map();
  for (const id of ok) {
    const r = find(id);
    members.set(r, [...members.get(r) ?? [], id]);
  }
  const out = /* @__PURE__ */ new Map();
  for (const list of members.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort();
    const root = sorted.find((id) => !hasParent.has(id)) ?? sorted[0];
    for (const id of list) out.set(id, { id: `family:${root}`, root });
  }
  return out;
}
function clusterFamilies(list, roots) {
  const out = [];
  const done = /* @__PURE__ */ new Set();
  for (const n of list) {
    if (done.has(n.id)) continue;
    const fam = n.familyId ? list.filter((m) => m.familyId === n.familyId) : [n];
    fam.sort((a, b) => Number(roots.has(b.id)) - Number(roots.has(a.id)));
    for (const m of fam) {
      out.push(m);
      done.add(m.id);
    }
  }
  return out;
}
const familyBreak = (slot, c, prev, cur) => cur !== prev && slot % c ? slot + c - slot % c : slot;
const TREE_INDENT = 48;
const cellX = (cell) => cell.col * (CANVAS_NODE_W + GAP$1) + (cell.tree ? cell.col * TREE_INDENT : 0);
function familyTree(members, edges) {
  const ids = new Set(members.map((m) => m.id));
  const order = new Map(members.map((m, i) => [m.id, i]));
  const kids = /* @__PURE__ */ new Map();
  const peers = /* @__PURE__ */ new Map();
  const spawnedIn = /* @__PURE__ */ new Set();
  const push = (m, k, v) => m.set(k, [...m.get(k) ?? [], v]);
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target) || e.source === e.target) continue;
    if (e.kind === "spawned") {
      push(kids, e.source, e.target);
      spawnedIn.add(e.target);
    } else if (e.kind === "watches") {
      push(peers, e.source, e.target);
      push(peers, e.target, e.source);
    }
  }
  const byOrder = (a, b) => order.get(a) - order.get(b);
  const out = /* @__PURE__ */ new Map();
  const place = (id, col, row) => {
    out.set(id, { row, col });
    let end2 = row + 1;
    let next = row;
    for (const k of [...kids.get(id) ?? []].sort(byOrder)) if (!out.has(k)) {
      next = place(k, col + 1, next);
      end2 = Math.max(end2, next);
    }
    for (const p of [...peers.get(id) ?? []].sort(byOrder)) if (!out.has(p)) end2 = place(p, col, end2);
    return end2;
  };
  const root = members.find((m) => !spawnedIn.has(m.id) && kids.has(m.id)) ?? members[0];
  let end = 0;
  for (const m of [root, ...members]) if (!out.has(m.id)) end = place(m.id, 0, end);
  return out;
}
function planFlow(flow, c, edges) {
  const cells = /* @__PURE__ */ new Map();
  let need = 1;
  let slot = 0;
  let prev = null;
  for (let i = 0; i < flow.length; i++) {
    const fam = flow[i].familyId ?? null;
    slot = familyBreak(slot, c, prev, fam);
    prev = fam;
    if (!fam) {
      cells.set(flow[i].id, { row: Math.floor(slot / c), col: slot % c });
      slot++;
      continue;
    }
    let j = i;
    while (j < flow.length && flow[j].familyId === fam) j++;
    const row0 = Math.floor(slot / c);
    let rows = 0;
    for (const [id, cell] of familyTree(flow.slice(i, j), edges)) {
      cells.set(id, { row: row0 + cell.row, col: Math.min(cell.col, c - 1), tree: true });
      rows = Math.max(rows, cell.row + 1);
      need = Math.max(need, cell.col + 1);
    }
    slot = (row0 + rows) * c;
    i = j - 1;
  }
  return { cells, need };
}
function planWithCols(flow, c, edges) {
  const p = planFlow(flow, c, edges);
  if (p.need <= c || c >= MAX_COLS) return { cells: p.cells, c };
  const wide = Math.min(MAX_COLS, p.need);
  return { cells: planFlow(flow, wide, edges).cells, c: wide };
}
const planW = (cells, c) => Math.max(groupW(c) - PAD_X * 2, ...[...cells.values()].map((cell) => cellX(cell) + CANVAS_NODE_W));
function placeCanvas(collected, layout, copy, viewportAspect = 16 / 9, edges = [], work) {
  const workList = [...work?.groups ?? []].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  const workMeta = new Map(workList.map((g) => [workGroupCanvasId(g.id), { id: workGroupCanvasId(g.id), kind: "work", title: g.name, color: g.color }]));
  const workRank = new Map(workList.map((g, i) => [workGroupCanvasId(g.id), i]));
  const saved = new Map(layout.groups.filter((g) => g.id !== CANVAS_GROUP_FAVORITES && (g.kind !== "work" || workMeta.has(g.id))).map((g) => [g.id, g]));
  const fixedAll = [...saved.values()].filter(isFixedGroup);
  const fixedIds = new Set(fixedAll.map((g) => g.id));
  const workOf = (n) => {
    const gid = n.kind === "session" && n.ref.sessionId ? work?.membership[n.ref.sessionId]?.groupId : null;
    return gid ? workMeta.get(workGroupCanvasId(gid)) : void 0;
  };
  const natural = (n) => {
    if (!n.hidden && (n.kind === "proposal" || isNeedsYou(n.status))) return { id: CANVAS_GROUP_ATTENTION, kind: "attention", title: copy.groupAttention };
    if (n.kind === "pipeline") return { id: CANVAS_GROUP_SCHEDULED, kind: "scheduled", title: copy.groupScheduled };
    if (n.kind === "team" && (n.subKind === "workflow" || n.subKind === "workflowHistory")) return { id: CANVAS_GROUP_WORKFLOWS, kind: "workflows", title: copy.groupWorkflows };
    if (n.kind === "team") return { id: CANVAS_GROUP_TEAMS, kind: "teams", title: copy.groupTeams };
    const p = collected.projects.get(n.id);
    if (p) return { id: `project:${p.key}`, kind: "project", title: p.title, projectKey: p.key };
    return { id: CANVAS_GROUP_OTHER, kind: "other", title: copy.groupOther };
  };
  const members = /* @__PURE__ */ new Map();
  const autoMeta = /* @__PURE__ */ new Map();
  const nodes = collected.nodes.map((n) => ({ ...n }));
  const naturals = nodes.map(natural);
  const bases = nodes.map((n, i) => naturals[i].id === CANVAS_GROUP_ATTENTION ? naturals[i] : workOf(n) ?? naturals[i]);
  const known = /* @__PURE__ */ new Set([...saved.keys(), ...workMeta.keys(), ...naturals.map((x) => x.id), CANVAS_GROUP_OTHER, CANVAS_GROUP_SCHEDULED, ...AREA_GROUPS]);
  const families = canvasFamilies(nodes, edges);
  const roots = new Set([...families.values()].map((f) => f.root));
  const famTarget = /* @__PURE__ */ new Map();
  nodes.forEach((n, i) => {
    const f = families.get(n.id);
    if (!f) return;
    if (naturals[i].id === CANVAS_GROUP_ATTENTION) famTarget.set(f.id, naturals[i]);
    else if (n.id === f.root && famTarget.get(f.id)?.id !== CANVAS_GROUP_ATTENTION) famTarget.set(f.id, bases[i]);
  });
  nodes.forEach((n, i) => {
    const stored = layout.nodes[n.id]?.groupId ?? (n.kind === "idea" || n.kind === "inbox" ? n.groupId : null);
    const raw = n.kind === "session" && workGroupIdFromCanvas(stored) ? null : stored;
    const want = raw === CANVAS_GROUP_ATTENTION || raw === CANVAS_GROUP_FAVORITES ? null : raw;
    const savedGroup = workOf(n) ?? (want ? workMeta.get(want) ?? saved.get(want) : void 0);
    const ownArea = AREA_GROUPS.has(naturals[i].id) && !isUserIntentGroup(savedGroup?.kind);
    const keep = isUserIntentGroup(savedGroup?.kind) || want === CANVAS_GROUP_OTHER;
    const target = families.has(n.id) && !keep && naturals[i].id !== CANVAS_GROUP_ATTENTION ? famTarget.get(families.get(n.id).id) : void 0;
    if (target?.id === CANVAS_GROUP_ATTENTION && n.density !== "chip") n.density = "compact";
    const meta = target ? target : ownArea ? naturals[i] : savedGroup ? { id: savedGroup.id, kind: savedGroup.kind, title: savedGroup.title, ...savedGroup.color ? { color: savedGroup.color } : {} } : want && known.has(want) ? naturals.find((x) => x.id === want) ?? fixedGroup(want, copy) : naturals[i];
    if (!fixedIds.has(meta.id)) autoMeta.set(meta.id, meta);
    n.groupId = meta.id;
    members.set(meta.id, [...members.get(meta.id) ?? [], n]);
  });
  const attentionEmpty = !members.has(CANVAS_GROUP_ATTENTION);
  if (!fixedIds.has(CANVAS_GROUP_ATTENTION)) autoMeta.set(CANVAS_GROUP_ATTENTION, { id: CANVAS_GROUP_ATTENTION, kind: "attention", title: copy.groupAttention });
  const workflowsEmpty = !members.has(CANVAS_GROUP_WORKFLOWS);
  if (!fixedIds.has(CANVAS_GROUP_WORKFLOWS)) autoMeta.set(CANVAS_GROUP_WORKFLOWS, { id: CANVAS_GROUP_WORKFLOWS, kind: "workflows", title: copy.groupWorkflows });
  for (const [id, meta] of workMeta) if (!fixedIds.has(id)) autoMeta.set(id, meta);
  const emptyStrip = (id) => id === CANVAS_GROUP_ATTENTION && attentionEmpty || id === CANVAS_GROUP_WORKFLOWS && workflowsEmpty || workMeta.has(id) && !fixedIds.has(id) && !members.has(id);
  for (const [gid, list] of members) {
    const count = /* @__PURE__ */ new Map();
    for (const n of list) {
      const f = families.get(n.id)?.id;
      if (f) count.set(f, (count.get(f) ?? 0) + 1);
    }
    for (const n of list) {
      const f = families.get(n.id)?.id;
      if (f && count.get(f) > 1) n.familyId = f;
    }
    list.sort(gid === CANVAS_GROUP_ATTENTION ? (a, b) => waitedSince$1(b) - waitedSince$1(a) || a.id.localeCompare(b.id) : compareGroupMembers);
    members.set(gid, clusterFamilies(list, roots));
  }
  const fixed = fixedAll.map((g) => {
    const w = g.kind === "work" ? workMeta.get(g.id) : void 0;
    return { ...g, title: systemGroupTitle(g.kind, copy) ?? w?.title ?? g.title, ...w?.color ? { color: w.color } : {}, ...emptyStrip(g.id) ? { h: COLLAPSED_H } : {} };
  });
  const groups = fixed.map((g) => ({ ...g }));
  const cols = /* @__PURE__ */ new Map();
  const running = (id) => (members.get(id) ?? []).filter((n) => !n.hidden && n.status === "running").length;
  const order = new Map([...autoMeta.entries()].map(([id, meta]) => [id, groupOrder(id, meta.kind, running(id))]));
  const fresh = [...autoMeta.entries()].sort(([a], [b]) => order.get(a) - order.get(b) || (workRank.get(a) ?? 0) - (workRank.get(b) ?? 0) || running(b) - running(a) || (members.get(b)?.length ?? 0) - (members.get(a)?.length ?? 0) || a.localeCompare(b));
  const auto = fresh.map(([id, meta]) => {
    const list = members.get(id) ?? [];
    const flow = list.filter((n) => !isPositioned(n, layout, fixedIds));
    const { cells, c } = planWithCols(flow, colsFor(list.length), edges);
    cols.set(id, c);
    const rows = [];
    for (const n of flow) {
      const r = cells.get(n.id).row;
      rows[r] = Math.max(rows[r] ?? 0, canvasNodeHeight(n));
    }
    for (let i = 0; i < rows.length; i++) rows[i] ??= CANVAS_NODE_H;
    const rowsH = flow.length ? rows.reduce((s, h2) => s + h2 + GAP$1, 0) : CANVAS_NODE_H + GAP$1;
    const h = emptyStrip(id) ? COLLAPSED_H : PAD_TOP + rowsH - GAP$1 + PAD_BOTTOM;
    const w = PAD_X * 2 + planW(cells, c);
    return { id, kind: meta.kind, title: meta.title, projectKey: meta.projectKey ?? null, ...meta.color ? { color: meta.color } : {}, x: 0, y: 0, w, h, userTouched: false, collapsed: saved.get(id)?.collapsed === true };
  });
  const packed = packGroups(auto.map((g) => ({ id: g.id, w: g.w, h: g.collapsed ? COLLAPSED_H : g.h })), viewportAspect, GROUP_GAP$1);
  const { x: ox, y: oy } = autoBlockOrigin(packed, fixed);
  for (const g of auto) groups.push({ ...g, x: ox + packed.pos[g.id].x, y: oy + packed.pos[g.id].y });
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const occupied = [];
  const flowing = /* @__PURE__ */ new Set();
  for (const [gid, list] of members) {
    const g = groupById.get(gid);
    for (const n of list) {
      if (!isPositioned(n, layout, fixedIds)) {
        flowing.add(n.id);
        continue;
      }
      const l = layout.nodes[n.id];
      if (l) {
        n.x = l.x;
        n.y = l.y;
      }
      const r = { x: n.x, y: n.y, w: CANVAS_NODE_W, h: canvasNodeHeight(n) };
      const free = n.kind === "idea" || n.kind === "inbox";
      const outside = !free && l?.groupId !== CANVAS_GROUP_OTHER && (r.x < g.x || r.x + r.w > g.x + g.w || r.y < g.y);
      if (!free && (outside || occupied.some((o) => overlaps$1(o, r)))) {
        flowing.add(n.id);
        continue;
      }
      if (!n.hidden && !g.collapsed) occupied.push(r);
    }
  }
  for (const [gid, list] of members) {
    const g = groupById.get(gid);
    const rowH = [];
    const rowTop = (row) => {
      let y = g.y + PAD_TOP;
      for (let i = 0; i < row; i++) y += (rowH[i] ?? CANVAS_NODE_H) + GAP$1;
      return y;
    };
    let bottom = 0;
    const flow = list.filter((n) => flowing.has(n.id));
    const { cells, c } = cols.has(gid) ? { cells: planFlow(flow, cols.get(gid), edges).cells, c: cols.get(gid) } : gid === CANVAS_GROUP_ATTENTION ? planWithCols(flow, colsFor(list.length), edges) : (() => {
      const w = Math.max(1, Math.floor((g.w - PAD_X * 2 + GAP$1) / (CANVAS_NODE_W + GAP$1)));
      return { cells: planFlow(flow, w, edges).cells, c: w };
    })();
    const at = (n) => cells.get(n.id).row * c + cells.get(n.id).col;
    for (const n of [...flow].sort((a, b) => at(a) - at(b))) {
      const cell = cells.get(n.id);
      const start = cell.row * c + cell.col;
      for (let slot = start; ; slot++) {
        const row = Math.floor(slot / c);
        const x = slot === start ? cellX(cell) : slot % c * (CANVAS_NODE_W + GAP$1);
        const r = { x: g.x + PAD_X + x, y: rowTop(row), w: CANVAS_NODE_W, h: canvasNodeHeight(n) };
        if (!occupied.some((o) => overlaps$1(o, r))) {
          rowH[row] = Math.max(rowH[row] ?? 0, r.h);
          n.x = r.x;
          n.y = r.y;
          occupied.push(r);
          bottom = Math.max(bottom, r.y + r.h);
          break;
        }
      }
    }
    if (bottom) g.h = Math.max(g.h, bottom - g.y + PAD_BOTTOM);
  }
  for (const g of groups) {
    if (isUserIntentGroup(g.kind) || !fixedIds.has(g.id)) continue;
    const cards = (members.get(g.id) ?? []).filter((n) => n.kind !== "idea" && n.kind !== "inbox");
    if (!cards.length) {
      g.w = groupW(1);
      g.h = g.id === CANVAS_GROUP_ATTENTION ? COLLAPSED_H : PAD_TOP + CANVAS_NODE_H + PAD_BOTTOM;
      continue;
    }
    g.w = Math.max(groupW(1), Math.max(...cards.map((n) => n.x + CANVAS_NODE_W)) - g.x + PAD_X);
    g.h = Math.max(...cards.map((n) => n.y + canvasNodeHeight(n))) - g.y + PAD_BOTTOM;
  }
  const autoGroups = groups.filter((g) => !fixedIds.has(g.id));
  if (autoGroups.length) {
    const boxH = (g) => g.collapsed ? COLLAPSED_H : g.h;
    const block = { w: Math.max(...autoGroups.map((g) => g.x + g.w)) - ox, h: Math.max(...autoGroups.map((g) => g.y + boxH(g))) - oy };
    const at = autoBlockOrigin(block, groups.filter((g) => fixedIds.has(g.id)));
    const dx = at.x - ox;
    const dy = at.y - oy;
    if (dx || dy) {
      const autoIds = new Set(autoGroups.map((g) => g.id));
      for (const g of autoGroups) {
        g.x += dx;
        g.y += dy;
      }
      for (const n of nodes) if (autoIds.has(n.groupId) && flowing.has(n.id)) {
        n.x += dx;
        n.y += dy;
      }
    }
  }
  return { nodes, groups };
}
function autoBlockOrigin(block, fixed) {
  const boxes = fixed.map((g) => ({ x: g.x - GROUP_GAP$1, y: g.y - GROUP_GAP$1, w: g.w + GROUP_GAP$1 * 2, h: (g.collapsed ? COLLAPSED_H : g.h) + GROUP_GAP$1 * 2 }));
  const free = (x, y) => !boxes.some((b) => overlaps$1(b, { x, y, w: block.w, h: block.h }));
  if (free(0, 0)) return { x: 0, y: 0 };
  const xs = [0, ...boxes.flatMap((b) => [b.x + b.w, b.x - block.w])];
  const ys = [0, ...boxes.flatMap((b) => [b.y + b.h, b.y - block.h])];
  let best = { x: Math.min(...boxes.map((b) => b.x)) - block.w, y: 0 };
  let bestD = Infinity;
  for (const x of xs) for (const y of ys) {
    const d = Math.hypot(x, y);
    if (d < bestD && free(x, y)) {
      best = { x, y };
      bestD = d;
    }
  }
  return best;
}
const AREA_GROUPS = /* @__PURE__ */ new Set([CANVAS_GROUP_ATTENTION, CANVAS_GROUP_TEAMS, CANVAS_GROUP_WORKFLOWS]);
function fixedGroup(id, copy) {
  if (id === CANVAS_GROUP_SCHEDULED) return { id, kind: "scheduled", title: copy.groupScheduled };
  if (id === CANVAS_GROUP_TEAMS) return { id, kind: "teams", title: copy.groupTeams };
  if (id === CANVAS_GROUP_WORKFLOWS) return { id, kind: "workflows", title: copy.groupWorkflows };
  return { id: CANVAS_GROUP_OTHER, kind: "other", title: copy.groupOther };
}
function systemGroupTitle(kind, copy) {
  switch (kind) {
    case "attention":
      return copy.groupAttention;
    case "scheduled":
      return copy.groupScheduled;
    case "teams":
      return copy.groupTeams;
    case "workflows":
      return copy.groupWorkflows;
    case "other":
      return copy.groupOther;
    default:
      return void 0;
  }
}
function isFixedGroup(g) {
  return g.kind === "user" || g.locked === true || g.userTouched !== false;
}
function isPositioned(n, layout, fixedIds) {
  if (n.kind === "idea" || n.kind === "inbox") return true;
  const l = layout.nodes[n.id];
  if (n.groupId === CANVAS_GROUP_ATTENTION) return false;
  return Boolean(l && !l.unplaced && (fixedIds.has(n.groupId) || l.groupId === CANVAS_GROUP_OTHER && n.groupId === CANVAS_GROUP_OTHER));
}
function groupOrder(id, kind, running) {
  if (id === CANVAS_GROUP_ATTENTION) return 0;
  if (kind === "work") return 0.5;
  if (id === CANVAS_GROUP_SCHEDULED) return 2;
  if (id === CANVAS_GROUP_TEAMS || id === CANVAS_GROUP_WORKFLOWS) return 3;
  if (id === CANVAS_GROUP_OTHER) return 5;
  return kind === "project" && running > 0 ? 1 : 4;
}
function summarizeGroups(nodes, groups, now) {
  const out = {};
  for (const g of groups) out[g.id] = { groupId: g.id, count: 0, needsYou: 0, running: 0, nextRunAt: null };
  for (const n of nodes) {
    const s = out[n.groupId];
    if (!s || n.hidden) continue;
    s.count++;
    if (isNeedsYou(n.status)) s.needsYou++;
    if (n.status === "running") s.running++;
    if (n.nextRunAt && ts$1(n.nextRunAt) >= now && (!s.nextRunAt || ts$1(n.nextRunAt) < ts$1(s.nextRunAt))) s.nextRunAt = n.nextRunAt;
  }
  return out;
}
function formatGroupSummary(summary, copy) {
  if (!summary) return "";
  const parts = [];
  if (summary.needsYou) parts.push(copy.summaryNeedsYou(summary.needsYou));
  if (summary.running) parts.push(copy.summaryRunning(summary.running));
  const next = hhmm$3(summary.nextRunAt);
  if (next) parts.push(copy.summaryNext(next));
  return parts.join(copy.summarySep);
}
function buildCanvasModel(input) {
  const collected = collectCanvasNodes(input);
  const edges = buildCanvasEdges(input, collected);
  fillInboxCounts(collected.nodes, edges, input.now);
  const { nodes, groups } = placeCanvas(collected, input.layout, input.copy, input.viewportAspect, edges, input.workGroups);
  return { nodes, edges, groups, summaries: summarizeGroups(nodes, groups, input.now) };
}
function fillInboxCounts(nodes, edges, now) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  for (const box of nodes) {
    if (box.kind !== "inbox") continue;
    let count = 0;
    for (const e of edges) {
      if (e.target !== box.id) continue;
      for (const r of byId.get(e.source)?.history ?? []) if (r.result !== "failed" && ts$1(r.at) >= day.getTime()) count++;
    }
    box.count = count;
    box.tail = box.tail.replace(/\d+/, String(count));
  }
}
const message = (err) => err instanceof Error ? err.message : String(err);
async function attempt(fn) {
  try {
    const res = await fn();
    if (res && typeof res === "object" && "success" in res && res.success === false) {
      const e = res.error;
      return { ok: false, error: typeof e === "string" ? e : e?.message || "failed" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}
function sessionApi() {
  const api2 = window.shineAI?.session;
  if (!api2) throw new Error("session API unavailable");
  return api2;
}
const abortSessionTurn = (sessionId) => attempt(() => {
  const abort = sessionApi().abortSession;
  if (!abort) throw new Error("abortSession unavailable");
  return abort(sessionId);
});
const endSession = async (sessionId) => {
  const res = await attempt(() => sessionApi().terminate(sessionId));
  if (res.ok) void useSessionStore.getState().fetchSessions();
  return res;
};
const stopSession = (sessionId) => {
  const status = useSessionStore.getState().sessions.find((s) => s.id === sessionId)?.status;
  return status === "running" || status === "starting" ? abortSessionTurn(sessionId) : endSession(sessionId);
};
const resumeSession = (sessionId) => attempt(() => useSessionStore.getState().resumeSession(sessionId));
const answerSessionQuestion = (sessionId, answers) => attempt(() => {
  const fn = sessionApi().answerQuestion;
  if (!fn) throw new Error("answerQuestion unavailable");
  return fn(sessionId, answers);
});
const replyToSession = (sessionId, text, options) => attempt(async () => {
  const dispatch = await useSessionStore.getState().sendMessage(sessionId, text, options);
  if (dispatch && dispatch.dispatched === false && dispatch.scheduled === false) throw new Error(dispatch.reason || "not dispatched");
});
const handOffSession = (sessionId, title, objective, projectPath) => attempt(
  () => useGoalStore.getState().create({
    title,
    objective,
    projectPath: projectPath || void 0,
    origin: "session_anchor",
    execution: { mode: "session", sessionId },
    drive: { mode: "in_session" },
    start: true
  })
);
function openFullConversation(sessionId) {
  void navigateToSessionForChat(sessionId);
}
function openSessionPage(sessionId) {
  navigateToSession(sessionId);
}
const ENGINE_GOAL_RUN_PREFIX = "goal-run-";
function pipelineTaskId(ref) {
  if (ref.scheduleId) return ref.scheduleId;
  return ref.goalId ? `${ENGINE_GOAL_RUN_PREFIX}${ref.goalId}` : null;
}
function userScheduleId(ref) {
  return ref.scheduleId && !ref.scheduleId.startsWith(ENGINE_GOAL_RUN_PREFIX) ? ref.scheduleId : null;
}
async function runPipelineNow(ref, waitMs = 800) {
  const taskId = pipelineTaskId(ref);
  if (!taskId) return { ok: false, error: "no schedule" };
  const started = useSchedulerStore.getState().triggerNow(taskId).then(() => ({ ok: true }), (err) => ({ ok: false, error: message(err) }));
  const timer = new Promise((r) => setTimeout(() => r({ ok: true }), waitMs));
  return Promise.race([started, timer]);
}
function setPipelinePaused(ref, paused) {
  if (ref.goalId) return attempt(() => useGoalStore.getState().runAction(paused ? "pause" : "resume", ref.goalId));
  const id = userScheduleId(ref);
  if (!id) return Promise.resolve({ ok: false, error: "no schedule" });
  return attempt(() => useSchedulerStore.getState().toggleTask(id, !paused));
}
async function stopPipeline(ref, liveSessionId) {
  const taskId = pipelineTaskId(ref);
  if (!taskId) return { ok: false, error: "no schedule" };
  if (ref.goalId && liveSessionId) {
    const aborted = await attempt(() => {
      const abort = sessionApi().abortSession;
      if (!abort) throw new Error("abortSession unavailable");
      return abort(liveSessionId);
    });
    if (!aborted.ok) return aborted;
    await attempt(() => window.shineAI.scheduler.cancelRun({ taskId }));
    return { ok: true };
  }
  let halted;
  const res = await attempt(async () => {
    const r = await window.shineAI.scheduler.cancelRun({ taskId });
    halted = r?.halted;
    return r;
  });
  return res.ok && halted === false ? { ok: true, halted } : res;
}
function updatePipelineSchedule(ref, config) {
  const id = userScheduleId(ref);
  if (id) return attempt(() => useSchedulerStore.getState().updateTask(id, { schedule: config }));
  if (ref.goalId && config.type === "cron" && config.cron) {
    return attempt(() => useGoalStore.getState().update({ goalId: ref.goalId, patch: { drive: { schedule: config.cron } } }));
  }
  return Promise.resolve({ ok: false, error: "no schedule" });
}
const MODEL_ACTION_TYPES = /* @__PURE__ */ new Set(["agent", "skill", "team", "spawn_agent"]);
function canSwitchPipelineModel(ref) {
  if (ref.goalId) return true;
  const id = userScheduleId(ref);
  const type = id ? useSchedulerStore.getState().tasks.find((t2) => t2.id === id)?.action.type : void 0;
  return Boolean(type && MODEL_ACTION_TYPES.has(type));
}
function setPipelineModel(ref, providerId, modelId) {
  if (ref.goalId) return attempt(() => useGoalStore.getState().update({ goalId: ref.goalId, patch: { drive: { providerId, modelId } } }));
  const id = userScheduleId(ref);
  const task = id ? useSchedulerStore.getState().tasks.find((t2) => t2.id === id) : void 0;
  if (!task) return Promise.resolve({ ok: false, error: "no schedule" });
  const a = task.action;
  const model = modelId || void 0;
  let action;
  if (a.type === "agent" && a.agentConfig) action = { ...a, agentConfig: { ...a.agentConfig, providerId, model } };
  else if (a.type === "skill" && a.skillConfig) action = { ...a, skillConfig: { ...a.skillConfig, providerId, model } };
  else if (a.type === "team" && a.teamConfig) action = { ...a, teamConfig: { ...a.teamConfig, providerOverride: { providerId, modelId: model } } };
  else if (a.type === "spawn_agent") action = { ...a, providerId };
  else return Promise.resolve({ ok: false, error: "unsupported action" });
  return attempt(() => useSchedulerStore.getState().updateTask(task.id, { action }));
}
const switchSessionModel = (sessionId, providerId, modelId) => attempt(() => useSessionStore.getState().switchProvider(sessionId, providerId, modelId ? { model: modelId } : void 0));
const SCHEDULE_PRESETS = [
  { key: "hourly", cron: "0 * * * *" },
  { key: "every3h", cron: "0 */3 * * *" },
  { key: "every4h", cron: "0 */4 * * *" },
  { key: "twiceDaily", cron: "30 8,20 * * *" },
  { key: "daily10", cron: "0 10 * * *" },
  { key: "daily1430", cron: "30 14 * * *" }
];
function runResultOf(status) {
  if (status === "running") return null;
  if (status === "success") return "ok";
  if (status === "partial") return "partial";
  return "failed";
}
const copyText = (text) => attempt(() => navigator.clipboard.writeText(text));
async function resolveProposal(proposalId, action, text) {
  const res = await useProposalStore.getState().resolve(proposalId, action, text);
  if (!res.ok) return { ok: false, error: res.error || "failed" };
  if (res.open) openProposalTarget(res.open);
  return { ok: true, open: res.open };
}
function openProposalTarget(target) {
  if (target.view === "session") navigateToSession(target.id);
  else if (target.view === "team") openWorkspaceSurface("teams", { instanceId: target.id });
  else if (target.view === "knowledge") openWorkspaceSurface("knowledge");
  else if (target.view === "goal") void useGoalStore.getState().openDetail(target.id);
}
const stopTeam = (teamId) => attempt(() => useTeamStore.getState().stopTeam(teamId));
const sendTeamMessage = (teamId, toRole, content) => attempt(() => {
  const api2 = window.shineAI?.team;
  if (!api2) throw new Error("team API unavailable");
  return toRole === "all" ? api2.broadcast({ instanceId: teamId, fromRole: "user", content }) : api2.sendToRole({ instanceId: teamId, fromRole: "user", toRole, content });
});
function openTeam(teamId) {
  openWorkspaceSurface("teams", { instanceId: teamId });
}
const stopWorkflow = (executionId) => attempt(async () => {
  if (!await useWorkflowStore.getState().cancelWorkflow(executionId)) throw new Error("cancelWorkflow failed");
});
function openWorkflowExecution(executionId) {
  const wf = useWorkflowStore.getState();
  const exe = [...wf.activeExecutions, ...wf.recentExecutions].find((e) => e.id === executionId);
  if (exe) wf.setV2View({ kind: "flow", workflowId: exe.workflowId, executionId: exe.id });
  openWorkspaceSurface("workflow");
}
const resumeAndReply = async (sessionId, text, options) => {
  const resumed = await resumeSession(sessionId);
  return resumed.ok ? replyToSession(sessionId, text, options) : resumed;
};
const LIVE = /* @__PURE__ */ new Set(["running", "awaiting", "queued"]);
function canStop(node) {
  if (node.kind === "pipeline") return node.status === "running" && Boolean(node.ref.scheduleId || node.ref.goalId);
  if (!LIVE.has(node.status)) return false;
  if (node.kind === "team") return Boolean(node.ref.teamId);
  return node.kind === "session" && Boolean(node.ref.sessionId);
}
function isResumable(node) {
  return node.kind === "session" && Boolean(node.ref.sessionId) && node.statusSource.from === "session" && node.statusSource.status === "interrupted";
}
function remoteActions(node, { canLocate, hasWatch }) {
  const session = node.kind === "session" && Boolean(node.ref.sessionId);
  const out = ["open"];
  if (session) out.push("openChat", "openFolder", "rename", "aiRename", "copyName", "share", "derive", "watchOther");
  if (session && hasWatch) out.push("unwatch");
  if (canLocate) out.push("locate");
  const pipeline = node.kind === "pipeline" && Boolean(node.ref.goalId || node.ref.scheduleId);
  if (pipeline && node.status !== "stopped" && node.status !== "running") out.push("runNow");
  if (canStop(node)) out.push("stop");
  if (isResumable(node)) out.push("resume");
  if (pipeline) out.push(node.status === "stopped" ? "enable" : "pause");
  if (pipeline ? canSwitchPipelineModel(node.ref) : session && node.status !== "stopped") out.push("switchModel");
  if (session) out.push(node.favorite ? "unfavorite" : "favorite");
  out.push("focus", node.pinned ? "unpin" : "pin");
  if (node.parked) out.push("unpark");
  else if (node.kind === "session" && node.status === "awaiting") out.push("park");
  return out;
}
const KIND_MENU = {
  session: { head: remoteActions },
  pipeline: { head: remoteActions },
  goal: { head: remoteActions },
  team: { head: remoteActions },
  proposal: { head: remoteActions },
  idea: { head: (_n, { canLocate }) => ["edit", "tag", "asSession", "asGoal", "copyText", ...canLocate ? ["locate"] : []], local: true },
  inbox: { head: (_n, { canLocate }) => ["open", ...canLocate ? ["locate"] : []], local: true }
};
function nodeMenuActions(node, canLocate = false, hasWatch = false) {
  const spec = KIND_MENU[node.kind];
  const out = spec.head(node, { canLocate, hasWatch });
  if (node.groupId !== CANVAS_GROUP_OTHER) out.push("ungroup");
  out.push(spec.local ? "delete" : "hide");
  if (node.kind === "session" && node.ref.sessionId) out.push("deleteSession");
  return out;
}
function useMenuDismiss(onClose) {
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    ref.current?.querySelector("button")?.focus();
    const down = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    const key = (e) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);
  return ref;
}
function useClampToViewport(ref, x, y) {
  reactExports.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clamp = () => {
      const m = 8;
      el.style.left = `${Math.max(m, Math.min(x, window.innerWidth - el.offsetWidth - m))}px`;
      el.style.top = `${Math.max(m, Math.min(y, window.innerHeight - el.offsetHeight - m))}px`;
    };
    clamp();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(clamp);
    ro?.observe(el);
    window.addEventListener("resize", clamp);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", clamp);
    };
  }, [ref, x, y]);
}
function ConnectChoiceMenu({ x, y, from, to, onPick, onClose }) {
  const { t: t2 } = useTranslation("workbench");
  const ref = useMenuDismiss(onClose);
  useClampToViewport(ref, x, y);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, role: "menu", "aria-label": t2("canvas.connect.label"), className: "wb-node-menu wb-connect-choice", style: { left: x, top: y }, children: ["watch", "link"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "menuitem", onClick: () => onPick(c), children: t2(`canvas.connect.${c}`, { from, to }) }, c)) });
}
function WorkGroupItems({ sessionId, onClose }) {
  const { t: t2 } = useTranslation("workGroups");
  const [open, setOpen] = reactExports.useState(null);
  const available = useWorkGroupStore((s) => s.available);
  const groups = useWorkGroupStore((s) => s.groups);
  const current = useWorkGroupStore((s) => s.membership[sessionId] ?? null);
  if (!available) return null;
  const run = (call) => {
    onClose();
    const api2 = window.shineAI?.workGroups;
    if (!api2) return;
    void call(api2).then((res) => {
      if (!res.ok) useUIStore.getState().showToast?.(t2("actionFailed", { message: res.error ?? "" }), "error");
    }).catch((err) => useUIStore.getState().showToast?.(t2("actionFailed", { message: err instanceof Error ? err.message : String(err) }), "error"));
  };
  const head = (sub, label) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitem", "aria-haspopup": "menu", "aria-expanded": open === sub, "data-wg-sub": sub, onClick: () => setOpen(open === sub ? null : sub), children: [
    label,
    " ",
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: open === sub ? "▾" : "▸" })
  ] }, sub);
  const item = (key, label, checked, onPick) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "menuitemradio", "aria-checked": checked, className: "wb-node-menu-sub", onClick: onPick, children: label }, key);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    head("priority", t2("priority.label")),
    open === "priority" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "menu", "aria-label": t2("priority.label"), children: [...WORK_PRIORITIES, null].map(
      (p) => item(p ?? "none", p ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { backgroundColor: PRIORITY_HEX[p] }, "aria-hidden": true }),
        t2(`priority.${p}`)
      ] }) : t2("priority.none"), (current?.priority ?? null) === p, () => run((api2) => api2.setPriority([sessionId], p)))
    ) }),
    head("group", t2("group.moveTo")),
    open === "group" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "menu", "aria-label": t2("group.moveTo"), children: [
      groups.map(
        (g) => item(g.id, /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupDot, { color: g.color }),
          g.name
        ] }), current?.groupId === g.id, () => run((api2) => api2.assign([sessionId], g.id)))
      ),
      item("none", t2("group.none"), !current?.groupId, () => run((api2) => api2.assign([sessionId], null)))
    ] })
  ] });
}
function CanvasNodeMenu({ node, x, y, onAction, onClose, canLocate, hasWatch }) {
  const { t: t2 } = useTranslation("workbench");
  const ref = useMenuDismiss(onClose);
  useClampToViewport(ref, x, y);
  const sessionId = node.kind === "session" ? node.ref.sessionId : void 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref,
      role: "menu",
      "aria-label": t2("canvas.menu.label", { title: node.title }),
      className: "wb-node-menu",
      style: { left: x, top: y },
      children: [
        nodeMenuActions(node, canLocate, hasWatch).map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: a === "stop" || a === "delete" || a === "deleteSession" ? "wb-node-menu-danger" : void 0,
            onClick: () => {
              onClose();
              onAction(a, node);
            },
            children: a === "stop" && node.kind === "team" ? t2("canvas.menu.stopTeam") : a === "tag" ? t2("canvas.menu.tag", { tag: t2(`canvasNodes:subKind.idea.${node.subKind}`) }) : t2(`canvas.menu.${a}`)
          },
          a
        )),
        sessionId && /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupItems, { sessionId, onClose })
      ]
    }
  );
}
const useCanvasDockStore = create((set, get) => ({
  spawnAt: null,
  focusNonce: 0,
  ideaRequest: null,
  prefill: null,
  busy: false,
  setBusy: (busy) => set({ busy }),
  armSpawnAt: (at) => set((s) => ({ spawnAt: { x: at.x, y: at.y }, focusNonce: s.focusNonce + 1 })),
  clearSpawnAt: () => set({ spawnAt: null }),
  focusComposer: () => set((s) => ({ focusNonce: s.focusNonce + 1 })),
  dispatchIdea: (idea, as) => {
    if (get().busy) return false;
    set({ ideaRequest: { id: `${idea.id}:${Date.now()}`, idea, as } });
    return true;
  },
  clearIdeaRequest: () => set({ ideaRequest: null }),
  prefillComposer: (text, run = "direct") => set((s) => ({ prefill: { id: `prefill-${Date.now()}`, text, run }, focusNonce: s.focusNonce + 1 })),
  clearPrefill: () => set({ prefill: null })
}));
const DOCK_RUN_MODES = ["direct", "untilDone", "schedule", "later"];
const DOCK_WHO_KINDS = ["session", "expert", "team", "workflow"];
const DEFAULT_DOCK_WHO = { kind: "session", expertId: "", teamId: "", workflowId: "" };
const UNLOCKED = { locked: false, requiredPlan: "anonymous" };
function dockExecModeOf(run, who) {
  switch (who.kind) {
    case "expert":
      return run === "direct" && who.expertId ? "session" : "supervisor";
    case "team":
      return executionModeOfWho("team", !who.teamId);
    case "workflow":
      return "workflow";
    default:
      return "session";
  }
}
function goalPresetOf(run, who = DEFAULT_DOCK_WHO) {
  if (run === "direct" || run === "later") return null;
  return {
    defaultDriveMode: run === "schedule" ? "schedule" : "in_session",
    defaultExecMode: dockExecModeOf(run, who),
    ...who.kind === "team" && who.teamId ? { defaultTeamId: who.teamId } : {},
    ...who.kind === "workflow" && who.workflowId ? { defaultWorkflowId: who.workflowId } : {}
  };
}
function runModeLock(plan, run) {
  if (run === "direct" || run === "later") return UNLOCKED;
  return getDriveModeLockState(plan, run === "schedule" ? "schedule" : "in_session");
}
function dockLock(plan, run, who) {
  if (run === "later") return UNLOCKED;
  const exec = getExecutionModeLockState(plan, dockExecModeOf(run, who));
  return exec.locked ? exec : runModeLock(plan, run);
}
function whoKindLock(plan, run, kind) {
  if (run === "later") return UNLOCKED;
  const base = { ...DEFAULT_DOCK_WHO, kind };
  const variants = kind === "expert" ? [base, { ...base, expertId: "*" }] : kind === "team" ? [base, { ...base, teamId: "*" }] : [base];
  const locks = variants.map((w) => getExecutionModeLockState(plan, dockExecModeOf(run, w)));
  return locks.some((l) => !l.locked) ? UNLOCKED : locks[0];
}
function directPlanOf(who) {
  switch (who.kind) {
    case "expert":
      return who.expertId ? { path: "session", expertId: who.expertId } : { path: "session", sessionMode: "supervisor" };
    case "team":
      return who.teamId ? { path: "team", teamId: who.teamId } : { path: "session", sessionMode: "mission" };
    case "workflow":
      return who.workflowId ? { path: "workflow", workflowId: who.workflowId } : { path: "invalid", reason: "needWorkflow" };
    default:
      return { path: "session" };
  }
}
function goalObjectiveOf(text, expertName) {
  const body = text.trim();
  return expertName ? `${body}

请让「${expertName}」专家来做这件事。` : body;
}
const TASK_VARIABLE_NAMES = /* @__PURE__ */ new Set(["task", "input", "goal", "prompt", "query", "topic", "request", "requirement", "objective", "任务", "需求", "主题", "输入", "目标", "问题", "内容"]);
function workflowVariablesFor(defaults, text) {
  const variables = { ...defaults ?? {} };
  const names = Object.keys(variables);
  const target = names.find((n) => TASK_VARIABLE_NAMES.has(n.trim().toLowerCase())) ?? (names.length === 1 ? names[0] : null);
  if (target) variables[target] = text.trim();
  return { variables, filled: target };
}
function knowledgeTokenOf(title) {
  return `@资料:${title.trim()}`;
}
const KNOWLEDGE_MAX_CHARS = 6e3;
function attachKnowledgeRefs(text, refs, opts = {}) {
  const withContent = opts.withContent ?? true;
  const used = refs.filter((r, i) => text.includes(r.token) && refs.findIndex((x) => x.token === r.token) === i);
  if (!used.length) return text;
  const blocks = used.map((r) => {
    const head = `[来自资料「${r.libraryName} / ${r.title}」]`;
    const where = `（资料库 id：${r.libraryId}，文件：${r.relPath}，可用 library_read 读取）`;
    if (!withContent || r.content == null) return `${head}${where}`;
    const body = r.content.length > KNOWLEDGE_MAX_CHARS ? `${r.content.slice(0, KNOWLEDGE_MAX_CHARS)}
…（后面还有，全文${where}）` : r.content;
    return `${head}
${body}`;
  });
  return `${text}

${blocks.join("\n\n")}`;
}
const SCHEDULE_PATTERNS = [
  // 每天 / 每晚 / 每周一 / 每月 / 每小时 / 每个工作日（「每天都报错」这类描述现象的不算；「每次」不在列）
  /每(?:天|日|晚|早|周[一二三四五六日天1-7]?|星期[一二三四五六日天]?|礼拜[一二三四五六日天]?|月|年|小时|个(?:小时|工作日|周末|月|星期|礼拜))(?!都)/,
  /每隔?\s*[\d一二三四五六七八九十两半]+\s*个?\s*(?:秒|分钟|小时|天|周|星期|月)/,
  /工作日|周一到周五|定时(?:执行|运行|跑|发送|推送)/,
  /\bevery\s+(?:day|morning|night|evening|hour|week|weekday|month|year|(?:mon|tues|wednes|thurs|fri|satur|sun)day|\d+\s*(?:sec(?:ond)?s?|min(?:ute)?s?|h(?:ou)?rs?|days?|weeks?))\b/i,
  /\b(?:daily|hourly|weekly|nightly|monthly)\b|\bon weekdays\b|\bonce an? (?:day|hour|week|month)\b/i
];
function detectScheduleIntent(text) {
  const s = text.trim();
  return Boolean(s) && SCHEDULE_PATTERNS.some((re) => re.test(s));
}
function ideaDispatchSpawnAt(idea) {
  return idea.groupId && idea.groupId !== CANVAS_GROUP_OTHER ? { x: idea.x, y: idea.y } : null;
}
function createCanvasIdea(text, at, opts) {
  const body = text.trim();
  if (!body) return null;
  return {
    id: opts.id,
    text: body,
    createdAt: opts.now.toISOString(),
    x: Math.round(at.x),
    y: Math.round(at.y)
  };
}
function canvasNodeIdOf(kind, rawId) {
  return `${kind}:${rawId}`;
}
const WHO_ICON = {
  session: MessageSquare,
  expert: Bot,
  team: Users,
  workflow: GitBranch
};
const DOCK_PILL_CLASS = "!min-h-0 !gap-1 !rounded-lg !px-2 !py-1 [&>span:first-child]:!text-caption [&>span:first-child]:!font-medium [&>span:first-child]:!text-text-secondary hover:[&>span:first-child]:!text-text-primary [&>span:first-child_svg]:!h-3 [&>span:first-child_svg]:!w-3 [&>svg]:!h-2.5 [&>svg]:!w-2.5 [&>svg]:opacity-70";
function useDockWhoOptions(kind) {
  const teams = useTeamStore((s) => s.teamDefinitions);
  const allWorkflows = useWorkflowStore((s) => s.workflows);
  const workflows = reactExports.useMemo(() => getVisibleWorkflowTemplates(allWorkflows), [allWorkflows]);
  const [experts, setExperts] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (kind === "team") void useTeamStore.getState().loadTeamDefinitions();
    if (kind === "workflow") void useWorkflowStore.getState().fetchWorkflows();
    if (kind !== "expert") return;
    let alive = true;
    listRolePresets().then((list) => alive && setExperts(list)).catch((err) => console.warn("[DockWhoPicker] 加载专家失败:", err));
    return () => {
      alive = false;
    };
  }, [kind]);
  return { experts, teams, workflows };
}
function DockWhoPicker({ who, onChange, run, plan, options }) {
  const { t: t2 } = useTranslation("canvasDock");
  const lockOf = (patch) => dockLock(plan, run, { ...who, ...patch });
  const option = (value, label, patch, hint) => {
    const lock = lockOf(patch);
    return {
      value,
      disabled: lock.locked,
      description: lock.locked ? lock.lockTitle : hint,
      label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
        lock.locked ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3 w-3 shrink-0", "aria-hidden": true }) : null,
        label
      ] })
    };
  };
  let detail = null;
  if (who.kind === "expert") {
    detail = /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        value: who.expertId,
        onChange: (v) => onChange({ ...who, expertId: v }),
        options: [
          option("", t2("who.expertAuto"), { expertId: "" }, t2("who.expertAutoHint")),
          ...options.experts.map((r) => option(r.id, pickExpertDisplayName(r), { expertId: r.id }, r.description || void 0))
        ],
        searchable: options.experts.length > 8,
        size: "sm",
        variant: "ghost",
        fullWidth: false,
        "aria-label": t2("who.pickExpert"),
        title: t2("who.pickExpert"),
        "data-dock-who-detail": "expert",
        className: DOCK_PILL_CLASS
      }
    );
  } else if (who.kind === "team") {
    detail = /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        value: who.teamId,
        onChange: (v) => onChange({ ...who, teamId: v }),
        options: [
          option("", t2("who.teamAuto"), { teamId: "" }, t2("who.teamAutoHint")),
          ...options.teams.map((d) => option(d.id, d.name, { teamId: d.id }, d.description || void 0))
        ],
        searchable: options.teams.length > 8,
        size: "sm",
        variant: "ghost",
        fullWidth: false,
        "aria-label": t2("who.pickTeam"),
        title: t2("who.pickTeam"),
        "data-dock-who-detail": "team",
        className: DOCK_PILL_CLASS
      }
    );
  } else if (who.kind === "workflow") {
    detail = /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        value: who.workflowId,
        onChange: (v) => onChange({ ...who, workflowId: v }),
        placeholder: options.workflows.length ? t2("who.pickWorkflow") : t2("who.noWorkflows"),
        options: options.workflows.map((w) => option(w.id, w.name, { workflowId: w.id }, w.description || void 0)),
        searchable: options.workflows.length > 8,
        size: "sm",
        variant: "ghost",
        fullWidth: false,
        "aria-label": t2("who.pickWorkflow"),
        title: t2("who.pickWorkflow"),
        "data-dock-who-detail": "workflow",
        className: DOCK_PILL_CLASS
      }
    );
  }
  return detail;
}
const RUN_ICON = {
  direct: Play,
  untilDone: Repeat,
  schedule: CalendarClock,
  later: ListTodo
};
function DockRunWhoPill({ run, onRunChange, who, onWhoChange, plan }) {
  const { t: t2 } = useTranslation("canvasDock");
  const btnRef = reactExports.useRef(null);
  const panelRef = reactExports.useRef(null);
  const [pos, setPos] = reactExports.useState(null);
  const later = run === "later";
  const RunIcon = RUN_ICON[run];
  reactExports.useEffect(() => {
    if (!pos) return;
    const onDown = (e) => {
      const target = e.target;
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setPos(null);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setPos(null);
      btnRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [pos]);
  const toggle = () => {
    if (pos || !btnRef.current) return setPos(null);
    const r = btnRef.current.getBoundingClientRect();
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - 448)), bottom: window.innerHeight - r.top + 6 });
  };
  const item = (key, Icon, label, hint, active, lock, onPick) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      role: "option",
      "aria-selected": active,
      disabled: lock.locked,
      title: lock.locked ? lock.lockTitle : hint,
      onClick: onPick,
      className: `flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${active ? "bg-accent-blue/10 text-accent-blue" : "text-text-primary hover:bg-bg-hover"}`,
      children: [
        lock.locked ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "mt-0.5 h-3.5 w-3.5 shrink-0", "aria-hidden": true }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "mt-0.5 h-3.5 w-3.5 shrink-0", "aria-hidden": true }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-medium", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `block text-tiny leading-4 ${active ? "text-accent-blue/80" : "text-text-muted"}`, children: lock.locked ? lock.lockTitle : hint })
        ] })
      ]
    },
    key
  );
  const runLabel = t2(`run.${run}`);
  const whoLabel = t2(`who.${who.kind}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        ref: btnRef,
        type: "button",
        onClick: toggle,
        "aria-haspopup": "listbox",
        "aria-expanded": !!pos,
        "aria-label": later ? t2("run.label") : `${t2("run.label")} · ${t2("who.label")}`,
        title: later ? `${t2("run.label")}：${t2(`run.${run}Hint`)}` : `${t2("run.label")}：${runLabel} · ${t2("who.label")}：${whoLabel}`,
        "data-dock-run": run,
        "data-dock-who": later ? void 0 : who.kind,
        className: `inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-caption font-medium transition-colors ${pos ? "bg-bg-hover text-text-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RunIcon, { className: "h-3 w-3 shrink-0", "aria-hidden": true }),
          runLabel,
          later ? null : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted", children: [
            "· ",
            whoLabel
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-2.5 w-2.5 shrink-0 opacity-70", "aria-hidden": true })
        ]
      }
    ),
    pos && reactDomExports.createPortal(
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: panelRef,
          "data-dock-run-who-panel": true,
          className: "fixed z-[10020] grid w-[440px] grid-cols-2 gap-1 rounded-xl border border-border bg-bg-secondary p-1.5 shadow-[0_14px_32px_rgba(0,0,0,0.2)]",
          style: { left: pos.left, bottom: pos.bottom },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "listbox", "aria-label": t2("run.label"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2.5 pb-1 pt-0.5 text-tiny font-semibold text-text-muted/80", children: t2("run.label") }),
              DOCK_RUN_MODES.map((mode) => item(mode, RUN_ICON[mode], t2(`run.${mode}`), t2(`run.${mode}Hint`), mode === run, runModeLock(plan, mode), () => onRunChange(mode)))
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "listbox", "aria-label": t2("who.label"), "aria-disabled": later, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2.5 pb-1 pt-0.5 text-tiny font-semibold text-text-muted/80", children: t2("who.label") }),
              later ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2.5 py-1.5 text-tiny leading-4 text-text-muted", children: t2("who.laterNote") }) : DOCK_WHO_KINDS.map((kind) => item(kind, WHO_ICON[kind], t2(`who.${kind}`), t2(`who.${kind}Hint`), kind === who.kind, whoKindLock(plan, run, kind), () => onWhoChange({ ...who, kind })))
            ] })
          ]
        }
      ),
      document.body
    )
  ] });
}
const LAST_GROUP_KEY = "shineai.canvas.dock.workGroup";
function stripWorktreeSuffix(dir) {
  return dir.replace(/[\\/]\.claude[\\/]worktrees[\\/].*$/i, "");
}
function resolveComposerGroupDefault(opts) {
  const live = (id) => id ? opts.groups.find((g) => g.id === id && !g.archivedAt) ?? null : null;
  if (live(opts.composerGroupId)) return { groupId: opts.composerGroupId, source: "composer" };
  if (live(opts.lastGroupId)) return { groupId: opts.lastGroupId, source: "last" };
  const dir = opts.workingDirectory ? stripWorktreeSuffix(opts.workingDirectory) : "";
  const hit = dir ? opts.groups.find((g) => !g.archivedAt && matchDirRule(dir, g.dirRules)) : void 0;
  return hit ? { groupId: hit.id, source: "dir" } : { groupId: null, source: "none" };
}
function workGroupConfigOf(opts) {
  if (!opts.available) return void 0;
  const explicit = opts.groupId && opts.source !== "dir" && opts.source !== "none" ? opts.groupId : null;
  const out = {};
  if (explicit) out.workGroupId = explicit;
  else if (opts.source === "picked" && !opts.groupId) out.workGroupId = null;
  if (opts.priority) out.priority = opts.priority;
  return Object.keys(out).length ? out : void 0;
}
const COLLAPSED_KEY = "shineai.canvas.dock.collapsed";
async function loadKnowledgeDocs() {
  const api2 = window.shineAI?.knowledge;
  if (!api2) return [];
  const libs = await api2.library.list();
  if (!libs.success) return [];
  const lists = await Promise.all(libs.libraries.map(async (lib) => {
    const res = await api2.doc.list(lib.id).catch(() => null);
    return (res?.success ? res.docs : []).map((d) => ({
      id: `${lib.id}::${d.relPath}`,
      title: d.title,
      hint: lib.name,
      libraryId: lib.id,
      libraryName: lib.name,
      relPath: d.relPath
    }));
  }));
  return lists.flat();
}
const GROUP_AUTO = "__auto__";
const GROUP_NEW = "__new__";
function readLastGroup() {
  try {
    return window.localStorage.getItem(LAST_GROUP_KEY) || null;
  } catch {
    return null;
  }
}
function writeLastGroup(id) {
  try {
    if (id) window.localStorage.setItem(LAST_GROUP_KEY, id);
    else window.localStorage.removeItem(LAST_GROUP_KEY);
  } catch {
  }
}
function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
function CanvasComposer({ onPlaceNode, onCreateIdea, onIdeaDispatched, getDefaultSpawnAt, replyTarget }) {
  const { t: t2 } = useTranslation("canvasDock");
  const { t: tg } = useTranslation("workGroups");
  const plan = useCurrentPlan();
  const spawnAt = useCanvasDockStore((s) => s.spawnAt);
  const focusNonce = useCanvasDockStore((s) => s.focusNonce);
  const ideaRequest = useCanvasDockStore((s) => s.ideaRequest);
  const prefill = useCanvasDockStore((s) => s.prefill);
  const draftText = useUIStore((s) => s.draftInputs?.[NOVICE_HERO_DRAFT_KEY] ?? "");
  const [collapsed, setCollapsed] = reactExports.useState(readCollapsed);
  const [runMode, setRunMode] = reactExports.useState("direct");
  const [who, setWho] = reactExports.useState(DEFAULT_DOCK_WHO);
  const whoOptions = useDockWhoOptions(who.kind);
  const knowledgeRefsRef = reactExports.useRef([]);
  const knowledgeDocsRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const [ctx, setCtx] = reactExports.useState({});
  const [fill, setFill] = reactExports.useState(null);
  const [submit, setSubmit] = reactExports.useState(null);
  const [goalDialog, setGoalDialog] = reactExports.useState(null);
  const rootRef = reactExports.useRef(null);
  const pendingRef = reactExports.useRef(null);
  const ideaSubmitRef = reactExports.useRef(null);
  const laterOnceRef = reactExports.useRef(false);
  const goalCreatedRef = reactExports.useRef(false);
  const wgAvailable = useWorkGroupStore((s) => s.available);
  const groups = useWorkGroupStore((s) => s.groups);
  const composerGroupId = useWorkGroupComposerStore((s) => s.composerGroupId);
  const [groupPick, setGroupPick] = reactExports.useState(void 0);
  const [priority, setPriority] = reactExports.useState(null);
  const [newGroupOpen, setNewGroupOpen] = reactExports.useState(false);
  const [newGroupName, setNewGroupName] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (composerGroupId) setGroupPick(void 0);
  }, [composerGroupId]);
  const groupDefault = reactExports.useMemo(
    () => resolveComposerGroupDefault({ composerGroupId, lastGroupId: readLastGroup(), groups, workingDirectory: ctx.workingDirectory }),
    [composerGroupId, groups, ctx.workingDirectory]
  );
  const groupSel = groupPick === null || groupPick && groups.some((g) => g.id === groupPick) ? { groupId: groupPick, source: "picked" } : groupDefault;
  const groupConfigRef = reactExports.useRef(void 0);
  groupConfigRef.current = workGroupConfigOf({ available: wgAvailable, groupId: groupSel.groupId, source: groupSel.source, priority });
  const withGroupConfig = reactExports.useCallback((r) => {
    const config = groupConfigRef.current;
    return config ? { ...r, config } : r;
  }, []);
  const toast = (msg, kind = "info") => useUIStore.getState().showToast?.(msg, kind);
  const locateNew = (nodeId2) => focusOnCanvasWhenReady({ nodeId: nodeId2 }, () => void 0, 3e3);
  reactExports.useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
    }
  }, [collapsed]);
  reactExports.useEffect(() => {
    if (!focusNonce) return;
    setCollapsed(false);
    requestAnimationFrame(() => rootRef.current?.querySelector("textarea")?.focus());
  }, [focusNonce]);
  reactExports.useEffect(() => {
    if (!prefill) return;
    useCanvasDockStore.getState().clearPrefill();
    setCollapsed(false);
    setFill({ id: prefill.id, text: prefill.text });
    setRunMode(prefill.run);
  }, [prefill]);
  reactExports.useEffect(() => {
    if (runModeLock(plan, runMode).locked) setRunMode("direct");
    else if (dockLock(plan, runMode, who).locked) setWho(DEFAULT_DOCK_WHO);
  }, [plan, runMode, who]);
  const takeSpawnAt = reactExports.useCallback((useDefault = false) => {
    const at = useCanvasDockStore.getState().spawnAt ?? (useDefault ? getDefaultSpawnAt?.() : null) ?? null;
    useCanvasDockStore.getState().clearSpawnAt();
    return at;
  }, [getDefaultSpawnAt]);
  const expertOf = reactExports.useCallback((id) => id ? whoOptions.experts.find((r) => r.id === id) ?? null : null, [whoOptions.experts]);
  const startTeamOrWorkflow = reactExports.useCallback(
    async (target, text, at) => {
      const task = attachKnowledgeRefs(text, knowledgeRefsRef.current);
      const restore = () => setFill({ id: `restore-${Date.now()}`, text });
      useCanvasDockStore.getState().setBusy(true);
      try {
        let nodeId2;
        if (target.path === "team") {
          const def = useTeamStore.getState().teamDefinitions.find((d) => d.id === target.teamId);
          if (!def) throw new Error(t2("who.teamMissing"));
          const instance2 = await useTeamStore.getState().startTeam({
            teamId: def.id,
            workingDirectory: ctx.workingDirectory ?? "",
            task,
            evaluationMode: def.evaluationMode,
            reviewerCount: def.reviewerCount,
            reviewerProvider: def.reviewerProvider ?? def.reviewerProviderId,
            reviewerModel: def.reviewerModel
          });
          nodeId2 = canvasNodeIdOf("team", instance2.id);
          toast(t2("who.teamStarted"), "success");
        } else {
          const wf = useWorkflowStore.getState().workflows.find((w) => w.id === target.workflowId);
          const { variables, filled } = workflowVariablesFor(wf?.variables, task);
          const executionId = await useWorkflowStore.getState().startWorkflow(target.workflowId, variables);
          if (!executionId) {
            toast(t2("who.workflowFailed"), "error");
            restore();
            return;
          }
          nodeId2 = canvasNodeIdOf("team", `workflow:${executionId}`);
          toast(filled ? t2("who.workflowStarted") : t2("who.workflowNoInput"), filled ? "success" : "info");
        }
        if (at) onPlaceNode?.(nodeId2, at);
        locateNew(nodeId2);
      } catch (err) {
        toast(t2("who.startFailed", { message: err instanceof Error ? err.message : String(err) }), "error");
        restore();
      } finally {
        useCanvasDockStore.getState().setBusy(false);
      }
    },
    [ctx.workingDirectory, onPlaceNode, t2]
  );
  const saveIdea = reactExports.useCallback((raw) => {
    const text = raw.trim();
    if (!text) return;
    const at = takeSpawnAt(true) ?? { x: 0, y: 0 };
    const idea = createCanvasIdea(text, at, { id: `idea-${Date.now().toString(36)}`, now: /* @__PURE__ */ new Date() });
    if (!idea) return;
    onCreateIdea?.(idea);
    toast(t2("toast.ideaSaved"), "success");
  }, [onCreateIdea, t2, takeSpawnAt]);
  const interceptSend = reactExports.useCallback(
    (text) => {
      const ideaSubmit = ideaSubmitRef.current;
      if (ideaSubmit) {
        ideaSubmitRef.current = null;
        pendingRef.current = { at: ideaSubmit.at, ideaId: ideaSubmit.ideaId };
        return withGroupConfig({ prompt: text });
      }
      if (runMode === "later" || laterOnceRef.current) {
        laterOnceRef.current = false;
        saveIdea(text);
        return "handled";
      }
      const lock = dockLock(plan, runMode, who);
      if (lock.locked) {
        toast(lock.lockTitle ?? t2("who.locked"), "info");
        return "blocked";
      }
      const refs = knowledgeRefsRef.current;
      if (runMode !== "direct") {
        goalCreatedRef.current = false;
        const expert2 = who.kind === "expert" ? expertOf(who.expertId) : null;
        const objective = attachKnowledgeRefs(goalObjectiveOf(text, expert2 ? pickExpertDisplayName(expert2) : null), refs, { withContent: false });
        setGoalDialog({ objective, restoreText: text, run: runMode, who, at: takeSpawnAt() });
        return "handled";
      }
      const direct = directPlanOf(who);
      if (direct.path === "invalid") {
        toast(t2("who.needWorkflow"), "info");
        return "blocked";
      }
      if (direct.path === "team" || direct.path === "workflow") {
        if (direct.path === "team" && !ctx.workingDirectory) {
          toast(t2("who.needProject"), "info");
          return "blocked";
        }
        void startTeamOrWorkflow(direct, text, takeSpawnAt());
        return "handled";
      }
      pendingRef.current = { at: takeSpawnAt() };
      const expert = direct.expertId ? expertOf(direct.expertId) : null;
      const prompt = attachKnowledgeRefs(expert ? injectMainSessionExpertInstruction(text, toExpertMentionSelection(expert)) : text, refs);
      return withGroupConfig(direct.sessionMode ? { prompt, sessionMode: direct.sessionMode } : { prompt });
    },
    [ctx.workingDirectory, expertOf, plan, runMode, saveIdea, startTeamOrWorkflow, t2, takeSpawnAt, who, withGroupConfig]
  );
  const knowledgeMention = reactExports.useMemo(() => ({
    load: async () => {
      const docs = await loadKnowledgeDocs();
      knowledgeDocsRef.current = new Map(docs.map((d) => [d.id, d]));
      return docs;
    },
    onPick: (item) => {
      const doc = knowledgeDocsRef.current.get(item.id);
      const token = knowledgeTokenOf(item.title);
      if (!doc) return token;
      const ref = { token, libraryId: doc.libraryId, relPath: doc.relPath, title: doc.title, libraryName: doc.libraryName };
      knowledgeRefsRef.current = [ref, ...knowledgeRefsRef.current.filter((r) => r.token !== token)];
      void window.shineAI?.knowledge?.doc.read({ libraryId: doc.libraryId, relPath: doc.relPath }).then((res) => {
        if (res?.success && typeof res.content === "string") ref.content = res.content;
      }).catch(() => void 0);
      return token;
    }
  }), []);
  const onSessionCreated = reactExports.useCallback(
    (sessionId) => {
      const pending = pendingRef.current;
      pendingRef.current = null;
      const nodeId2 = canvasNodeIdOf("session", sessionId);
      if (pending?.at) onPlaceNode?.(nodeId2, pending.at);
      if (pending?.ideaId) onIdeaDispatched?.(pending.ideaId, nodeId2);
      useWorkGroupComposerStore.getState().setComposerGroupId(null);
      setPriority(null);
      locateNew(nodeId2);
      toast(t2("toast.dispatched"), "success");
    },
    [onIdeaDispatched, onPlaceNode, t2]
  );
  const onSendFailed = reactExports.useCallback(() => {
    const ideaId = pendingRef.current?.ideaId;
    pendingRef.current = null;
    ideaSubmitRef.current = null;
    if (ideaId) toast(t2("toast.ideaFailed"), "error");
  }, [t2]);
  const onCreatingChange = reactExports.useCallback((creating) => useCanvasDockStore.getState().setBusy(creating), []);
  reactExports.useEffect(() => () => useCanvasDockStore.getState().setBusy(false), []);
  reactExports.useEffect(() => {
    if (!ideaRequest) return;
    useCanvasDockStore.getState().clearIdeaRequest();
    const { idea, as } = ideaRequest;
    if (as === "session" && useCanvasDockStore.getState().busy) {
      toast(t2("toast.ideaBusy"), "info");
      return;
    }
    const at = ideaDispatchSpawnAt(idea);
    if (as === "goal") {
      goalCreatedRef.current = false;
      setGoalDialog({ objective: idea.text, restoreText: "", run: "untilDone", who: DEFAULT_DOCK_WHO, at, ideaId: idea.id });
      return;
    }
    setCollapsed(false);
    ideaSubmitRef.current = { ideaId: idea.id, at };
    setSubmit({ id: ideaRequest.id, text: idea.text });
  }, [ideaRequest]);
  const placeholder = spawnAt ? t2("placeholder.atPoint") : replyTarget ? t2("placeholder.besideDrawer", { title: replyTarget }) : t2("placeholder.default");
  const showScheduleHint = runMode === "direct" && !runModeLock(plan, "schedule").locked && detectScheduleIntent(draftText);
  const goalPreset = goalDialog ? goalPresetOf(goalDialog.run, goalDialog.who) : null;
  const pickGroup = (v) => {
    if (v === GROUP_NEW) {
      setNewGroupName("");
      setNewGroupOpen(true);
      return;
    }
    if (v === GROUP_AUTO) {
      setGroupPick(void 0);
      writeLastGroup(null);
      return;
    }
    setGroupPick(v || null);
    writeLastGroup(v || null);
  };
  const createGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    const api2 = window.shineAI?.workGroups;
    const res = api2 ? await api2.create({ name }).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : String(err) })) : null;
    if (!res?.ok) {
      toast(tg("group.createFailed", { message: res?.error ?? "" }), "error");
      return;
    }
    setNewGroupOpen(false);
    setGroupPick(res.data.id);
    writeLastGroup(res.data.id);
    void useWorkGroupStore.getState().refresh();
  };
  const dirGroup = groupDefault.source === "dir" ? groups.find((g) => g.id === groupDefault.groupId) ?? null : null;
  const groupAuto = groupSel.source === "dir" || groupSel.source === "none";
  const groupValue = groupAuto ? GROUP_AUTO : groupSel.groupId ?? "";
  const groupPill = newGroupOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        autoFocus: true,
        value: newGroupName,
        onChange: (e) => setNewGroupName(e.target.value),
        onKeyDown: (e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            void createGroup();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            setNewGroupOpen(false);
          }
        },
        placeholder: tg("group.newPlaceholder"),
        "aria-label": tg("group.newPlaceholder"),
        "data-dock-new-group": true,
        className: "h-6 w-36 rounded-md bg-bg-secondary px-2 text-caption text-text-primary ring-1 ring-inset ring-border placeholder:text-text-muted focus:outline-none focus:ring-accent-blue"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setNewGroupOpen(false), "aria-label": tg("group.newCancel"), title: tg("group.newCancel"), className: "rounded p-0.5 text-text-muted hover:text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3", "aria-hidden": true }) })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
    Select,
    {
      value: groupValue,
      onChange: pickGroup,
      options: [
        dirGroup ? {
          value: GROUP_AUTO,
          description: tg("group.autoHint"),
          label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-text-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupDot, { color: dirGroup.color }),
            tg("group.auto", { name: dirGroup.name })
          ] })
        } : { value: GROUP_AUTO, description: tg("group.autoAiHint"), label: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: tg("group.autoAi") }) },
        { value: "", label: tg("group.none"), description: tg("group.noneHint") },
        ...groups.map((g) => ({
          value: g.id,
          label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupDot, { color: g.color }),
            g.name
          ] })
        })),
        {
          value: GROUP_NEW,
          label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3", "aria-hidden": true }),
            tg("group.new")
          ] })
        }
      ],
      size: "sm",
      variant: "ghost",
      fullWidth: false,
      "aria-label": tg("group.label"),
      title: groupSel.source === "dir" ? tg("group.autoHint") : groupAuto ? tg("group.autoAiHint") : tg("group.label"),
      "data-dock-group": groupValue || "none",
      "data-dock-group-source": groupSel.source,
      className: DOCK_PILL_CLASS
    }
  );
  const priorityPill = /* @__PURE__ */ jsxRuntimeExports.jsx(
    Select,
    {
      value: priority ?? "",
      onChange: (v) => setPriority(v || null),
      options: [
        { value: "", label: `${tg("priority.label")}：${tg("priority.none")}` },
        ...WORK_PRIORITIES.map((p) => ({
          value: p,
          label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { backgroundColor: PRIORITY_HEX[p] }, "aria-hidden": true }),
            tg(`priority.${p}`)
          ] })
        }))
      ],
      renderValue: (o) => priority ? o?.label : /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "h-3 w-3", "aria-hidden": true }),
      size: "sm",
      variant: "ghost",
      fullWidth: false,
      "aria-label": tg("priority.label"),
      title: priority ? tg("priority.label") : `${tg("priority.label")}：${tg("priority.none")}`,
      "data-dock-priority": priority ?? "none",
      className: DOCK_PILL_CLASS
    }
  );
  const showWorkGroup = wgAvailable && runMode !== "later";
  const trailingPills = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DockRunWhoPill, { run: runMode, onRunChange: setRunMode, who, onWhoChange: setWho, plan }),
    runMode !== "later" && /* @__PURE__ */ jsxRuntimeExports.jsx(DockWhoPicker, { who, onChange: setWho, run: runMode, plan, options: whoOptions })
  ] });
  if (collapsed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-auto flex justify-center", "data-canvas-dock": "collapsed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setCollapsed(false),
        "aria-expanded": false,
        className: "group inline-flex h-10 items-center gap-2 rounded-full bg-bg-secondary/95 pl-3 pr-4 text-sm text-text-secondary shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/[0.08] backdrop-blur transition-all hover:-translate-y-px hover:text-text-primary hover:ring-accent-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-4 w-4 text-accent-blue", "aria-hidden": true }),
          t2("collapsed")
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: rootRef,
      className: "pointer-events-auto relative mx-auto w-full max-w-[780px] rounded-[20px] bg-bg-primary/95 pb-3 pt-1 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-white/[0.08] backdrop-blur",
      "data-canvas-dock": "open",
      "data-canvas-dock-armed": spawnAt ? "true" : void 0,
      onDoubleClick: (e) => e.stopPropagation(),
      onPointerDown: (e) => e.stopPropagation(),
      onWheel: (e) => e.stopPropagation(),
      onKeyDownCapture: (e) => {
        if (e.key !== "Enter" || !e.altKey || e.nativeEvent.isComposing || !(e.target instanceof HTMLTextAreaElement)) return;
        e.preventDefault();
        e.stopPropagation();
        const send = rootRef.current?.querySelector("[data-composer-send]");
        if (!send || send.disabled) return;
        laterOnceRef.current = true;
        send.click();
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 px-4 pb-0.5 pt-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-1", children: [
            spawnAt ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mr-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-blue/10 px-2 py-0.5 text-[11px] text-accent-blue", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-accent-blue", "aria-hidden": true }),
              t2("armed"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => useCanvasDockStore.getState().clearSpawnAt(),
                  "aria-label": t2("armedCancel"),
                  className: "rounded-full p-0.5 hover:bg-accent-blue/15",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3", "aria-hidden": true })
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-1 shrink-0 text-[12px] font-medium text-text-secondary", children: t2("title") }),
            showWorkGroup ? groupPill : null,
            showWorkGroup ? priorityPill : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setCollapsed(true),
              "aria-expanded": true,
              "aria-label": t2("collapse"),
              title: t2("collapse"),
              className: "rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4", "aria-hidden": true })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          NoviceHeroScreen,
          {
            embedded: true,
            stayAfterCreate: true,
            placeholder,
            fillRequest: fill,
            submitRequest: submit,
            interceptSend,
            onContextChange: setCtx,
            onSessionCreated,
            onSendFailed,
            onCreatingChange,
            toolbarAddonTrailing: trailingPills,
            knowledgeMention,
            footer: showScheduleHint ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex px-4 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setRunMode("schedule"),
                "data-dock-suggest": "schedule",
                className: "inline-flex items-center gap-1.5 rounded-full bg-accent-blue/10 px-2.5 py-1 text-[11px] text-accent-blue transition-colors hover:bg-accent-blue/15",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "h-3.5 w-3.5", "aria-hidden": true }),
                  t2("suggest.schedule"),
                  " · ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: t2("suggest.switchToSchedule") })
                ]
              }
            ) }) : null
          }
        ),
        goalDialog ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          NewGoalDialog,
          {
            open: true,
            defaultObjective: goalDialog.objective,
            defaultProjectPath: ctx.workingDirectory ?? "",
            defaultDriveMode: goalPreset?.defaultDriveMode,
            defaultExecMode: goalPreset?.defaultExecMode,
            defaultTeamId: goalPreset?.defaultTeamId,
            defaultWorkflowId: goalPreset?.defaultWorkflowId,
            onClose: () => {
              if (goalDialog.restoreText && !goalCreatedRef.current) setFill({ id: `restore-${Date.now()}`, text: goalDialog.restoreText });
              setGoalDialog(null);
            },
            onCreated: (goalId) => {
              goalCreatedRef.current = true;
              const nodeId2 = canvasNodeIdOf("goal", goalId);
              if (goalDialog.at) onPlaceNode?.(nodeId2, goalDialog.at);
              if (goalDialog.ideaId) onIdeaDispatched?.(goalDialog.ideaId, nodeId2);
              locateNew(nodeId2);
              setGoalDialog(null);
              setRunMode("direct");
              toast(t2("toast.goalCreated"), "success");
            }
          }
        ) : null
      ]
    }
  );
}
const ONBOARDING_LIGHT_KEY = "shineai.canvas.onboarding.light.dismissed";
const LIGHT_MAX_NODES = 3;
const ONBOARDING_TIPS_KEY = "shineai.canvas.onboarding.tips.seen";
const BUSY_RUNNING = 3;
const EMPTY_SETTLE_MS = 2e3;
function pickCanvasTip(nodes, seen) {
  const first = (ok) => nodes.find(ok)?.id;
  const candidates = [
    ["intro", nodes.length > LIGHT_MAX_NODES],
    ["awaiting", !!first((n) => n.status === "awaiting" && n.kind !== "idea"), first((n) => n.status === "awaiting" && n.kind !== "idea")],
    ["failed", !!first((n) => n.status === "failed"), first((n) => n.status === "failed")],
    ["idea", !!first((n) => n.kind === "idea"), first((n) => n.kind === "idea")],
    ["busy", nodes.filter((n) => n.status === "running").length >= BUSY_RUNNING]
  ];
  const hit = candidates.find(([key, ok]) => ok && !seen.has(key));
  return hit ? { key: hit[0], nodeId: hit[2] } : null;
}
function readSeenTips() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ONBOARDING_TIPS_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []);
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function writeSeenTips(seen) {
  try {
    localStorage.setItem(ONBOARDING_TIPS_KEY, JSON.stringify([...seen]));
  } catch {
  }
}
const STARTERS = [
  { key: "code", run: "direct", Icon: SquareTerminal },
  { key: "ask", run: "direct", Icon: MessageCircleQuestion },
  { key: "goal", run: "untilDone", Icon: Repeat },
  { key: "schedule", run: "schedule", Icon: CalendarClock }
];
function readLightDismissed() {
  try {
    return localStorage.getItem(ONBOARDING_LIGHT_KEY) === "1";
  } catch {
    return false;
  }
}
function CanvasOnboarding({ nodes, onLocate, onShowGuide }) {
  const { t: t2 } = useTranslation("workbench");
  const plan = useCurrentPlan();
  const [lightDismissed, setLightDismissed] = reactExports.useState(readLightDismissed);
  const [seen, setSeen] = reactExports.useState(readSeenTips);
  const nodeCount = nodes.length;
  reactExports.useEffect(() => {
    if (nodeCount !== 0 || seen.has("intro")) return;
    const timer = setTimeout(() => {
      const next = new Set(seen).add("intro");
      writeSeenTips(next);
      setSeen(next);
    }, EMPTY_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [nodeCount, seen]);
  const dismissLight = () => {
    setLightDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_LIGHT_KEY, "1");
    } catch {
    }
  };
  const tip = nodeCount > 0 ? pickCanvasTip(nodes, seen) : null;
  if (tip) {
    const done = () => {
      const next = new Set(seen).add(tip.key);
      writeSeenTips(next);
      setSeen(next);
      if (tip.key === "awaiting") dismissLight();
    };
    const action = tip.key === "intro" && onShowGuide ? { label: t2("canvas.onboarding.event.showGuide"), run: onShowGuide } : tip.nodeId && onLocate && (tip.key === "awaiting" || tip.key === "failed") ? { label: t2("canvas.onboarding.event.locate"), run: () => onLocate(tip.nodeId) } : null;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-canvas-onboarding": "tip", "data-tip": tip.key, className: "pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", className: "pointer-events-auto flex max-w-2xl items-center gap-2 rounded-xl bg-bg-secondary/95 py-1.5 pl-3 pr-1.5 text-xs leading-relaxed text-text-secondary shadow-lg ring-1 ring-inset ring-accent-orange/40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-accent-orange", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "min-w-0 flex-1", children: t2(`canvas.onboarding.event.${tip.key}`) }),
      action && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
        action.run();
        done();
      }, className: "shrink-0 rounded-md px-2 py-0.5 text-accent-orange hover:bg-bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue", children: action.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: done, className: "shrink-0 rounded-md px-2 py-0.5 text-text-muted hover:bg-bg-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue", children: t2("canvas.onboarding.event.gotIt") })
    ] }) });
  }
  if (nodeCount > LIGHT_MAX_NODES) return null;
  if (nodeCount > 0) {
    if (lightDismissed) return null;
    const dismiss = dismissLight;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-canvas-onboarding": "light", className: "pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-auto flex max-w-xl items-center gap-2 rounded-full bg-bg-secondary/85 py-1 pl-3 pr-1 text-[11px] leading-relaxed text-text-muted ring-1 ring-inset ring-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-accent-orange", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "min-w-0 flex-1", children: t2("canvas.onboarding.light") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: dismiss, "aria-label": t2("canvas.onboarding.lightDismiss"), title: t2("canvas.onboarding.lightDismiss"), className: "shrink-0 rounded-full p-0.5 hover:bg-bg-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3", "aria-hidden": true }) })
    ] }) });
  }
  const starters = STARTERS.filter((s) => !runModeLock(plan, s.run).locked);
  return (
    // 底部留出输入框的高度，引导在剩余画布里居中
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-canvas-onboarding": "empty", className: "pointer-events-none absolute inset-0 flex items-center justify-center px-6 pb-44 pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full max-w-2xl flex-col items-center gap-5 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-text-primary", children: t2("canvas.onboarding.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-secondary", children: t2("canvas.onboarding.lead") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "aria-label": t2("canvas.onboarding.tryLabel"), className: "w-full space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-text-muted", children: t2("canvas.onboarding.tryLabel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid w-full grid-cols-1 gap-2 sm:grid-cols-2", children: starters.map(({ key, run, Icon }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            "data-onboarding-starter": key,
            onClick: () => useCanvasDockStore.getState().prefillComposer(t2(`canvas.onboarding.starters.${key}.prompt`), run),
            className: "pointer-events-auto group flex items-start gap-3 rounded-xl bg-bg-secondary/80 p-3 text-left ring-1 ring-inset ring-border transition-colors hover:bg-bg-hover hover:ring-accent-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue motion-reduce:transition-none",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-tertiary text-text-secondary group-hover:text-accent-orange", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4", "aria-hidden": true }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium text-text-primary", children: t2(`canvas.onboarding.starters.${key}.title`) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-text-muted", children: t2(`canvas.onboarding.starters.${key}.desc`) })
              ] })
            ]
          },
          key
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { "aria-label": t2("canvas.onboarding.tipsLabel"), className: "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-text-muted", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-[3px] ring-[1.5px] ring-inset ring-accent-orange", "aria-hidden": true }),
          t2("canvas.onboarding.tips.awaiting")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t2("canvas.onboarding.tips.note") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t2("canvas.onboarding.tips.open") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t2("canvas.onboarding.tips.fit") })
      ] })
    ] }) })
  );
}
const BACKGROUND_MODEL_HINT_KEY = "shineai.canvas.backgroundModelHint.dismissed";
const RECHECK_DELAY_MS = 300;
function readDismissed() {
  try {
    return localStorage.getItem(BACKGROUND_MODEL_HINT_KEY) === "1";
  } catch {
    return false;
  }
}
function BackgroundModelHint() {
  const { t: t2 } = useTranslation("workbench");
  const assignedId = useSettingsStore((s) => s.settings.remoteControlProviderId);
  const [dismissed, setDismissed] = reactExports.useState(readDismissed);
  const [ready, setReady] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (dismissed) return;
    let alive = true;
    const check = () => {
      const probe = window.shineAI?.workGroups?.backgroundModelReady;
      if (!probe) return;
      probe().then((ok) => {
        if (alive) setReady(typeof ok === "boolean" ? ok : null);
      }).catch(() => {
        if (alive) setReady(null);
      });
    };
    const timer = setTimeout(check, RECHECK_DELAY_MS);
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      clearTimeout(timer);
      window.removeEventListener("focus", check);
    };
  }, [dismissed, assignedId]);
  if (dismissed || ready !== false) return null;
  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(BACKGROUND_MODEL_HINT_KEY, "1");
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-canvas-background-model-hint": true, className: "pointer-events-auto flex w-full justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", className: "pointer-events-auto flex items-start gap-2 rounded-lg bg-bg-secondary/95 py-1.5 pl-2.5 pr-1 text-[11px] leading-relaxed text-text-muted shadow-lg ring-1 ring-inset ring-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "min-w-0 flex-1", children: t2("canvas.onboarding.backgroundModel.text") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => window.dispatchEvent(new CustomEvent("open-settings-tab", { detail: "model-routing" })),
        className: "shrink-0 rounded-md px-2 py-0.5 text-accent-orange hover:bg-bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue",
        children: t2("canvas.onboarding.backgroundModel.action")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: dismiss, "aria-label": t2("canvas.onboarding.backgroundModel.dismiss"), title: t2("canvas.onboarding.backgroundModel.dismiss"), className: "shrink-0 rounded-md p-0.5 hover:bg-bg-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3", "aria-hidden": true }) })
  ] }) });
}
const RUNNING_QUIET_MS = 10 * 60 * 1e3;
function quietRunningMs(node, now) {
  if (node.kind !== "session" || node.status !== "running" || !node.lastActivityAt) return null;
  const at = Date.parse(node.lastActivityAt);
  if (!Number.isFinite(at)) return null;
  const quiet = now - at;
  return quiet >= RUNNING_QUIET_MS ? quiet : null;
}
const CANVAS_FILTERS = ["all", "mine", "running", "favorites"];
const PRIORITY_FILTERS = [...WORK_PRIORITIES, "none"];
const DEFAULT_FILTER = { filter: "all", groupId: null };
function matchesFilter(node, filter) {
  switch (filter) {
    case "all":
      return true;
    case "mine":
      return node.status === "awaiting" || node.status === "failed" || node.kind === "proposal";
    case "running":
      return node.status === "running";
    case "favorites":
      return node.favorite === true;
  }
}
function matchesWorkGroupFilter(node, state, membership = {}) {
  const priorities = state.priorities?.length ? state.priorities : null;
  if (!priorities && !state.workGroupId) return true;
  const sessionId = node.kind === "session" ? node.ref.sessionId : void 0;
  if (!sessionId) return false;
  const m = membership[sessionId];
  if (priorities && !priorities.includes(m?.priority ?? "none")) return false;
  return !state.workGroupId || m?.groupId === state.workGroupId;
}
function isNodeLit(node, state, membership) {
  if (state.focus && !state.focus.has(node.id)) return false;
  if (node.pinned) return true;
  if (state.groupId && node.groupId !== state.groupId) return false;
  return matchesFilter(node, state.filter) && matchesWorkGroupFilter(node, state, membership);
}
const LINEAGE_EDGE_KINDS = ["runs", "spawned", "feeds", "user"];
function lineageNodeIds(nodeId2, edges) {
  const down = /* @__PURE__ */ new Map();
  const up = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (!LINEAGE_EDGE_KINDS.includes(e.kind)) continue;
    down.set(e.source, [...down.get(e.source) ?? [], e.target]);
    up.set(e.target, [...up.get(e.target) ?? [], e.source]);
  }
  const walk = (start, next, out) => {
    const stack = [start];
    while (stack.length) {
      for (const id of next.get(stack.pop()) ?? []) if (!out.has(id)) {
        out.add(id);
        stack.push(id);
      }
    }
  };
  const ids = /* @__PURE__ */ new Set([nodeId2]);
  walk(nodeId2, up, ids);
  walk(nodeId2, down, ids);
  for (const parent of up.get(nodeId2) ?? []) for (const sib of down.get(parent) ?? []) ids.add(sib);
  return ids;
}
function searchNodes(nodes, query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out = [];
  for (const n of nodes) {
    const hay = [n.title, n.tail, n.ask, n.from].filter(Boolean).join("\n").toLowerCase();
    if (hay.includes(q)) out.push(n);
    if (out.length >= limit) break;
  }
  return out;
}
const DEFAULT_LABELS$1 = { code: "[code]", image: "[image]" };
const TABLE_SEP = /\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)+\|?/g;
function flattenTables(src) {
  if (!src.match(TABLE_SEP)) return src;
  const out = [];
  let prevTable = false;
  for (const line of src.replace(TABLE_SEP, " | ").split("\n")) {
    const isTable = line.includes("|");
    const text = isTable ? line.split("|").map((c) => c.trim()).filter(Boolean).join(" · ") : line;
    if (isTable && !text) continue;
    if (isTable && prevTable) out[out.length - 1] += ` · ${text}`;
    else out.push(text);
    prevTable = isTable;
  }
  return out.join("\n");
}
function simplifyMarkdown$1(src, max = Infinity, labels = DEFAULT_LABELS$1) {
  const text = flattenTables(src).replace(/```[\s\S]*?(```|$)/g, ` ${labels.code} `).replace(/!\[[^\]]*\]\([^)]*\)/g, ` ${labels.image} `).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "").replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2").replace(/__([^_\n]+)__/g, "**$1**").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
function plainMarkdown(src, labels = DEFAULT_LABELS$1, max = Infinity) {
  if (!src) return "";
  const text = simplifyMarkdown$1(src, Infinity, labels).replace(/\*\*|~~|`/g, "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
const PEEK_MESSAGE_COUNT = 3;
const PEEK_TEXT_MAX = 220;
const DEFAULT_LABELS = { code: "[code]", image: "[image]" };
function simplifyMarkdown(src, max = PEEK_TEXT_MAX, labels = DEFAULT_LABELS) {
  return simplifyMarkdown$1(src, max, labels);
}
function isVisibleMessage(m) {
  if (m.role !== "user" && m.role !== "assistant") return false;
  if (m.isDiscardDraft || m.isThinking) return false;
  return typeof m.content === "string" && m.content.trim().length > 0;
}
function pickRecentMessages(list, count = PEEK_MESSAGE_COUNT, labels = DEFAULT_LABELS) {
  if (!list) return null;
  const out = [];
  for (let i = list.length - 1; i >= 0 && out.length < count; i--) {
    const m = list[i];
    if (!isVisibleMessage(m)) continue;
    const text = simplifyMarkdown(m.content, PEEK_TEXT_MAX, labels);
    if (text) out.push({ id: m.id, role: m.role, text, timestamp: m.timestamp });
  }
  return out.reverse();
}
function turnTokensOf(list) {
  if (!list?.length) return null;
  let sum = 0;
  let seen = false;
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (m.role === "user") break;
    if (m.usage) {
      seen = true;
      sum += (m.usage.inputTokens || 0) + (m.usage.outputTokens || 0);
    }
  }
  return seen ? sum : null;
}
function activeTool(status) {
  if (!status || status.status === "completed" || !status.toolName) return null;
  return { name: status.toolName, detail: status.detail || "", isError: !!status.isError };
}
function buildSessionPeek(input) {
  const { session, messages, toolStatus, liveTokens, changedFiles, now, labels } = input;
  const start = session?.startedAt ? Date.parse(session.startedAt) : NaN;
  const end = session?.endedAt ? Date.parse(session.endedAt) : now;
  const total = liveTokens?.total ?? session?.estimatedTokens;
  return {
    messages: pickRecentMessages(messages, PEEK_MESSAGE_COUNT, labels),
    tool: activeTool(toolStatus),
    changedFiles: Array.isArray(changedFiles) ? changedFiles.length : null,
    elapsedMs: Number.isFinite(start) ? Math.max(0, end - start) : null,
    turnTokens: turnTokensOf(messages),
    totalTokens: typeof total === "number" && total > 0 ? total : null
  };
}
function formatTokens(n) {
  if (n < 1e3) return String(n);
  if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)}k`;
  return `${(n / 1e6).toFixed(1)}M`;
}
function formatElapsed(ms2) {
  const s = Math.floor(ms2 / 1e3);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}m`;
}
const MIN = 6e4;
const HOUR = 60 * MIN;
function hhmm$2(ms2) {
  const d = new Date(ms2);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function parse(iso) {
  if (!iso) return null;
  const ms2 = Date.parse(iso);
  return Number.isFinite(ms2) ? ms2 : null;
}
function sameDay(a, b) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
function nextRunText(nextRunAt, now, t2) {
  const next = parse(nextRunAt);
  if (next === null) return null;
  const left = next - now;
  if (left > 0 && left < HOUR) return t2("meta.nextInMinutes", { count: Math.max(1, Math.ceil(left / MIN)) });
  return t2(sameDay(next, now) || next < now ? "meta.nextAt" : "meta.nextTomorrow", { time: hhmm$2(next) });
}
function agoText(iso, now, t2) {
  const at = parse(iso);
  if (at === null) return null;
  const min = Math.floor((now - at) / MIN);
  if (min < 1) return t2("meta.justNow");
  if (min < 60) return t2("meta.minutesAgo", { count: min });
  const h = Math.round(min / 60);
  if (h < 24) return t2("meta.hoursAgo", { count: h });
  return t2("meta.daysAgo", { count: Math.round(h / 24) });
}
function waitDuration(ms2, t2) {
  const min = Math.floor(ms2 / MIN);
  if (min < 60) return t2("meta.durMin", { count: Math.max(1, min) });
  if (min < 1440) return t2("meta.durHour", { count: Math.floor(min / 60) });
  return t2("meta.durDay", { count: Math.floor(min / 1440) });
}
function quietText(quietMs, t2) {
  const min = Math.floor(quietMs / MIN);
  return min < 60 ? t2("meta.quietMin", { count: min }) : t2("meta.quietHour", { count: Math.floor(min / 60) });
}
function nodeMetaText(node, now, t2) {
  if (node.kind === "inbox") return t2("meta.todayCount", { count: node.count ?? 0 });
  if (node.kind === "team" && node.subKind === "workflow" && node.members?.length) {
    const since = parse(node.since);
    const i = node.members.findIndex((m) => m.status === "running" || m.status === "awaiting");
    const parts = [since === null ? null : formatElapsed(Math.max(0, now - since)), i < 0 ? null : t2("meta.workflowStep", { index: i + 1, name: node.members[i].name })];
    return parts.filter(Boolean).join(" · ") || null;
  }
  if (node.subKind === "workflowHistory") return agoText(node.lastActivityAt ?? node.since, now, t2);
  if (node.kind === "team" && node.members?.length) {
    const running = node.members.filter((m) => m.status === "running").length;
    return t2("meta.membersRunning", { running, total: node.members.length });
  }
  if (node.status === "sleeping") return nextRunText(node.nextRunAt, now, t2) ?? agoText(node.lastActivityAt ?? node.since, now, t2);
  if (node.status === "running") {
    const quiet = quietRunningMs(node, now);
    if (quiet !== null) return quietText(quiet, t2);
    const since = parse(node.since);
    return since === null ? null : formatElapsed(Math.max(0, now - since));
  }
  if (node.kind === "goal" && node.progress && node.progress.total > 0) {
    return t2("meta.progress", { done: node.progress.done, total: node.progress.total });
  }
  return agoText(node.lastActivityAt ?? node.since, now, t2);
}
const ZOOM_MID_BELOW = 0.75;
const ZOOM_FAR_BELOW = 0.6;
function zoomTier(zoom) {
  return zoom < ZOOM_FAR_BELOW ? "far" : zoom < ZOOM_MID_BELOW ? "mid" : "near";
}
function enteredAwaiting(prev, next) {
  return prev !== void 0 && prev !== "awaiting" && next === "awaiting";
}
function nodeModelLabel(model, providers) {
  if (!model) return null;
  if (model.modelId) return model.modelId;
  const p = providers.find((x) => x.id === model.providerId);
  return p?.defaultModel || p?.name || model.providerId;
}
const FETCH_LIMIT = 20;
const CACHE_TTL = 3e4;
const CACHE_MAX = 50;
const fetched = /* @__PURE__ */ new Map();
function pruneExpired(now) {
  for (const [id, entry] of fetched) {
    if (now - entry.at >= CACHE_TTL) fetched.delete(id);
  }
}
function readPeekCache(sessionId, now = Date.now()) {
  pruneExpired(now);
  const hit = fetched.get(sessionId);
  if (!hit) return void 0;
  fetched.delete(sessionId);
  fetched.set(sessionId, hit);
  return hit.messages;
}
function writePeekCache(sessionId, messages, now = Date.now()) {
  pruneExpired(now);
  fetched.delete(sessionId);
  fetched.set(sessionId, { at: now, messages });
  while (fetched.size > CACHE_MAX) {
    const oldest = fetched.keys().next().value;
    if (oldest === void 0) break;
    fetched.delete(oldest);
  }
}
function useFetchedMessages(sessionId, inStore) {
  const [messages, setMessages] = reactExports.useState(() => readPeekCache(sessionId));
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (inStore) return;
    const hit = readPeekCache(sessionId);
    if (hit) {
      setMessages(hit);
      return;
    }
    const paged = window.shineAI?.session?.getConversationPaged;
    if (!paged) return;
    let alive = true;
    setLoading(true);
    paged(sessionId, { limit: FETCH_LIMIT }).then((res) => {
      const list = res?.messages;
      if (!Array.isArray(list)) return;
      writePeekCache(sessionId, list);
      if (alive) setMessages(list);
    }).catch(() => void 0).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [sessionId, inStore]);
  return { messages, loading };
}
function useSessionPeek(sessionId, now) {
  const { t: t2 } = useTranslation("canvasNodes");
  const session = useSessionStore((s) => getSessionById(s, sessionId));
  const storeMessages = useSessionStore((s) => s.conversations[sessionId]);
  const toolStatus = useSessionStore((s) => s.toolStatuses[sessionId]);
  const liveTokens = useSessionStore((s) => s.tokenUsageBySession[sessionId]);
  const changedFiles = useFileManagerStore((s) => s.sessionChangedFiles.get(sessionId));
  const { messages: fetchedMessages, loading } = useFetchedMessages(sessionId, !!storeMessages);
  reactExports.useEffect(() => {
    void useFileManagerStore.getState().fetchSessionFiles(sessionId);
  }, [sessionId]);
  const messages = storeMessages ?? fetchedMessages;
  const data = reactExports.useMemo(
    () => buildSessionPeek({
      session,
      messages,
      toolStatus,
      liveTokens,
      changedFiles,
      now,
      labels: { code: t2("peek.code"), image: t2("peek.image") }
    }),
    [session, messages, toolStatus, liveTokens, changedFiles, now, t2]
  );
  return { data, loading: loading && !messages };
}
const PEEK_W = 320;
const GAP = 12;
const mdLabels = (t2) => ({ code: t2("peek.code"), image: t2("peek.image") });
function renderInlineMarkdown(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => {
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) return /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: part.slice(1, -1) }, i);
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: part.slice(2, -2) }, i);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Fragment, { children: part.replace(/\*\*|`/g, "") }, i);
  });
}
function placement(anchor) {
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;
  const right = anchor.right + GAP;
  const left = right + PEEK_W <= vw - 8 ? right : Math.max(8, anchor.left - GAP - PEEK_W);
  const top = Math.min(Math.max(8, anchor.top), Math.max(8, vh - 440));
  return { left, top };
}
function Section$1({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-sec", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-label", children: label }),
    children
  ] });
}
function SessionBody({ node, now, t: t2 }) {
  const sessionId = node.ref.sessionId ?? "";
  const { data, loading } = useSessionPeek(sessionId, now);
  const unknown = t2("peek.unknown");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    node.status === "awaiting" && node.ask && /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.ask"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-ask", children: plainMarkdown(node.ask, mdLabels(t2)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.recent"), children: data.messages === null ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-muted", children: loading ? t2("peek.loading") : t2("peek.notLoaded") }) : data.messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-muted", children: t2("peek.noMessages") }) : data.messages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `cn-peek-msg${m.role === "user" ? " is-user" : ""}`, "data-testid": "peek-message", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-peek-who", children: m.role === "user" ? t2("peek.you") : t2("peek.ai") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-peek-text", children: renderInlineMarkdown(m.text) })
    ] }, m.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.tool"), children: data.tool ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `cn-peek-tool${data.tool.isError ? " is-error" : ""}`, title: data.tool.detail, children: [
      data.tool.name,
      data.tool.detail ? ` · ${data.tool.detail}` : ""
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-muted", children: t2("peek.noTool") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-stats", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-stat", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: data.changedFiles ?? unknown }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("peek.files") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-stat", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: data.elapsedMs === null ? unknown : formatElapsed(data.elapsedMs) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("peek.elapsed") })
      ] }),
      data.turnTokens !== null || data.totalTokens === null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-stat", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: data.turnTokens === null ? unknown : formatTokens(data.turnTokens) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("peek.turnTokens") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-stat", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: formatTokens(data.totalTokens) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("peek.totalTokens") })
      ] })
    ] })
  ] });
}
const RUNS_SHOWN = 4;
function GoalRuns({ node, now, t: t2 }) {
  const runs = (node.runSessions ?? []).slice(0, RUNS_SHOWN);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.runs"), children: runs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-muted", children: t2("peek.noRuns") }) : runs.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `cn-peek-row cn-peek-link st-${r.status}`, "data-testid": "peek-run", title: t2("peek.openSession"), onClick: () => openFullConversation(r.sessionId), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-grow", children: r.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "cn-mono", children: [
      t2(`status.${r.status}`),
      r.lastActivityAt ? ` · ${agoText(r.lastActivityAt, now, t2)}` : "",
      " ›"
    ] })
  ] }, r.sessionId)) });
}
function ScheduledBody({ node, now, t: t2, onOpen }) {
  const next = node.status === "sleeping" ? nextRunText(node.nextRunAt, now, t2) : null;
  const history = (node.history ?? []).slice(0, 3);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    node.status === "awaiting" && node.ask && /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.ask"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-ask", children: plainMarkdown(node.ask, mdLabels(t2)) }) }),
    (node.scheduleText || next) && /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.schedule"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: [node.scheduleText, next].filter(Boolean).join(" · ") }) }),
    history.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.history"), children: history.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `cn-peek-row cn-peek-link res-${r.result}`, title: t2("peek.openRun"), disabled: !onOpen, onClick: onOpen, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-mono", children: hhmm$2(Date.parse(r.at)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-grow", children: r.note ? plainMarkdown(r.note, mdLabels(t2)) : t2(`peek.result.${r.result}`) }),
      r.durationSec !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-mono", children: formatElapsed(r.durationSec * 1e3) })
    ] }, r.id)) }),
    node.stream && node.stream.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(StreamSection, { node, t: t2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GoalRuns, { node, now, t: t2 })
  ] });
}
function StreamSection({ node, t: t2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.stream"), children: (node.stream ?? []).slice(-3).map((line, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-row", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-grow", children: plainMarkdown(line, mdLabels(t2)) }) }, i)) });
}
const peekIsActionable = (node) => node.kind === "team" && node.subKind === "workflow" && node.status === "awaiting";
function NodePeekCardImpl({ node, anchor, now, onOpen, onHoverChange }) {
  const { t: t2 } = useTranslation("canvasNodes");
  const pos = placement(anchor);
  const actionable = !!onOpen && peekIsActionable(node);
  let body;
  if (node.kind === "session" && node.ref.sessionId) body = /* @__PURE__ */ jsxRuntimeExports.jsx(SessionBody, { node, now, t: t2 });
  else if (node.kind === "goal" || node.kind === "pipeline") body = /* @__PURE__ */ jsxRuntimeExports.jsx(ScheduledBody, { node, now, t: t2, onOpen });
  else if (node.kind === "team")
    body = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.members"), children: (node.members ?? []).map((m, i) => actionable && m.status === "awaiting" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "cn-peek-row cn-peek-act st-awaiting", title: t2("peek.openToReview"), onClick: onOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-grow", children: m.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "cn-mono", children: [
          t2("peek.review"),
          " ›"
        ] })
      ] }, `${m.name}-${i}`) : m.sessionId ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `cn-peek-row cn-peek-link st-${m.status}`, title: t2("peek.openSession"), onClick: () => openFullConversation(m.sessionId), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-grow", children: m.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "cn-mono", children: [
          t2(`status.${m.status}`),
          " ›"
        ] })
      ] }, `${m.name}-${i}`) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `cn-peek-row st-${m.status}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-grow", children: m.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-mono", children: t2(`status.${m.status}`) })
      ] }, `${m.name}-${i}`)) }),
      node.stream && node.stream.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(StreamSection, { node, t: t2 })
    ] });
  else
    body = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      node.from && /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { label: t2("peek.from"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-muted", children: node.from }) }),
      (node.text || node.ask) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-peek-sec cn-peek-text", children: plainMarkdown(node.text || node.ask, mdLabels(t2)) }),
      node.stream && node.stream.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(StreamSection, { node, t: t2 })
    ] });
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `cn-peek st-${node.status}`,
        role: "tooltip",
        onPointerEnter: () => onHoverChange?.(true),
        onPointerLeave: () => onHoverChange?.(false),
        "data-testid": "node-peek",
        style: { left: pos.left, top: pos.top },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "cn-chip", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
              t2(`status.${node.status}`)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-peek-title", children: node.title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-peek-muted", children: [
            t2(`kind.${node.kind}`),
            " · ",
            t2(`subKind.${node.kind}.${node.subKind}`, { defaultValue: "" })
          ] }),
          body
        ]
      }
    ),
    document.body
  );
}
const NodePeekCard = reactExports.memo(NodePeekCardImpl);
const IDEA_THUMBS_SHOWN = 3;
const PEEK_DELAY_MS = 400;
const PEEK_HIDE_MS = 250;
const STALE_WAIT_MS = 4 * 36e5;
const AWAITING_ALERT_MS = 600;
const MEMBERS_SHOWN = CANVAS_MEMBERS_SHOWN;
const NODE_ICONS = {
  session: MessageSquare,
  pipeline: CalendarClock,
  goal: Target,
  team: Users,
  proposal: Stamp,
  idea: ListTodo,
  inbox: Inbox
};
function AskChips({ node, onError }) {
  const { t: t2 } = useTranslation("canvasNodes");
  const questions = node.questions ?? [];
  const [picked, setPicked] = reactExports.useState({});
  const [sending, setSending] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setPicked({});
    setSending(false);
    onError(null);
  }, [node.askId, onError]);
  const pick = async (idx, label) => {
    if (sending || !node.ref.sessionId) return;
    const next = { ...picked, [String(idx)]: label };
    setPicked(next);
    if (Object.keys(next).length < questions.length) return;
    setSending(true);
    onError(null);
    const res = await answerSessionQuestion(node.ref.sessionId, next);
    if (res.ok) return;
    setSending(false);
    setPicked({});
    onError(t2("ask.failed", { message: res.error }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-asks nodrag nopan", "aria-label": t2("ask.aria"), onClick: (e) => e.stopPropagation(), children: questions.map((q, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-ask", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-ask-label", title: q.label, children: q.label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-ask-opts", children: q.options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: `cn-ask-opt${picked[String(i)] === o ? " is-picked" : ""}`,
        title: o,
        disabled: sending,
        onClick: () => void pick(i, o),
        children: o
      },
      o
    )) })
  ] }, i)) });
}
function CanvasNodeCardImpl({ node, projectLabel, selected, faded, now, onOpen, onPortPointerDown, peekDisabled, zoomTier: zoomTier2 = "near" }) {
  const { t: t2 } = useTranslation("canvasNodes");
  const { t: tg } = useTranslation("workGroups");
  const ref = reactExports.useRef(null);
  const timer = reactExports.useRef(null);
  const [peekRect, setPeekRect] = reactExports.useState(null);
  const [askError, setAskError] = reactExports.useState(null);
  const isWorkflow = node.kind === "team" && node.subKind === "workflow";
  const Icon = isWorkflow ? Workflow : NODE_ICONS[node.kind];
  const density = node.kind === "inbox" ? "full" : node.density ?? "full";
  const statusLabel = t2(`status.${node.status}`);
  const awaiting = node.status === "awaiting";
  const waitedAt = Date.parse(node.lastActivityAt ?? node.since ?? "");
  const waitedMs = awaiting && Number.isFinite(waitedAt) ? Math.max(0, now - waitedAt) : null;
  const chipLabel = node.subKind === "workflowHistory" ? t2("meta.workflowRuns", { count: node.count ?? 0 }) : waitedMs === null ? statusLabel : t2("meta.waited", { time: waitDuration(waitedMs, t2) });
  const stale = waitedMs !== null && waitedMs >= STALE_WAIT_MS;
  const meta = awaiting && node.kind !== "team" ? null : nodeMetaText(node, now, t2);
  const showPort = node.kind !== "proposal";
  const tail = plainMarkdown(node.tail, mdLabels(t2));
  const showTail = density === "full" && node.kind !== "inbox" && !!tail;
  const liveTail = node.kind === "session" && node.status === "running" && !askError;
  const showSub = !(node.kind === "session" && node.subKind === "chat");
  const lastRun = node.kind === "pipeline" ? node.history?.[0] : void 0;
  const modelLabel = nodeModelLabel(node.model, useProviders());
  const star = node.favorite ? /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "cn-fav", "aria-label": t2("favorite") }) : null;
  const sessionId = node.kind === "session" ? node.ref.sessionId ?? null : null;
  const wg = useSessionWorkGroup(sessionId);
  const priorityBadge = wg.priority ? /* @__PURE__ */ jsxRuntimeExports.jsx(PriorityBadge, { priority: wg.priority, className: "cn-priority" }) : null;
  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  reactExports.useEffect(() => clearTimer, []);
  const prevStatus = reactExports.useRef(void 0);
  const [alerting, setAlerting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const entered = enteredAwaiting(prevStatus.current, node.status);
    prevStatus.current = node.status;
    if (node.status !== "awaiting") {
      setAlerting(false);
      return;
    }
    if (!entered) return;
    setAlerting(true);
    const id = window.setTimeout(() => setAlerting(false), AWAITING_ALERT_MS);
    return () => window.clearTimeout(id);
  }, [node.status]);
  reactExports.useEffect(() => {
    if (peekDisabled) setPeekRect(null);
  }, [peekDisabled]);
  const onEnter = () => {
    if (peekDisabled || node.kind === "inbox") return;
    clearTimer();
    timer.current = window.setTimeout(() => {
      if (ref.current) setPeekRect(ref.current.getBoundingClientRect());
    }, PEEK_DELAY_MS);
  };
  const onLeave = () => {
    clearTimer();
    if (peekRect) timer.current = window.setTimeout(() => setPeekRect(null), PEEK_HIDE_MS);
  };
  const onPeekHover = reactExports.useCallback((inside) => {
    clearTimer();
    if (!inside) setPeekRect(null);
  }, []);
  const open = reactExports.useCallback(() => {
    clearTimer();
    setPeekRect(null);
    onOpen?.(node);
  }, [node, onOpen]);
  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };
  const openOnDoubleClick = node.kind === "idea";
  const members = node.kind === "team" ? node.members ?? [] : [];
  const subTasks = node.subTasks ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref,
        role: "button",
        tabIndex: 0,
        "data-node-id": node.id,
        "data-kind": node.kind,
        "data-status": node.status,
        "aria-label": t2("aria", { kind: t2(`kind.${node.kind}`), title: node.title, status: statusLabel }),
        className: `cn-node kind-${node.kind} st-${node.status} dn-${density}${selected ? " is-selected" : ""}${faded ? " is-faded" : ""}${stale ? " is-stale" : ""}${isWorkflow ? " is-workflow" : ""}${node.size ? " is-sized" : ""}${alerting ? " is-alerting" : ""}${node.kind === "inbox" ? "" : ` zt-${zoomTier2}`}`,
        style: node.kind === "inbox" ? void 0 : { "--cn-h": `${canvasNodeHeight(node)}px` },
        onClick: openOnDoubleClick ? void 0 : open,
        onDoubleClick: openOnDoubleClick ? open : void 0,
        onKeyDown,
        onPointerEnter: onEnter,
        onPointerLeave: onLeave,
        onFocus: onEnter,
        onBlur: onLeave,
        children: [
          awaiting && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-seal", "aria-hidden": "true", children: t2("seal") }),
          wg.group && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "cn-group-bar",
              "data-work-group": wg.group.id,
              style: { backgroundColor: WORK_GROUP_HEX[wg.group.color] },
              role: "img",
              "aria-label": tg("group.aria", { name: wg.group.name }),
              title: tg("group.aria", { name: wg.group.name })
            }
          ),
          density === "full" && node.kind !== "inbox" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-tags", children: [
            star,
            priorityBadge,
            wg.auto && /* @__PURE__ */ jsxRuntimeExports.jsx(AutoGroupBadge, { className: "cn-auto-group" }),
            projectLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-project", title: projectLabel, children: projectLabel }),
            showSub && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-sub", children: t2(`subKind.${node.kind}.${node.subKind}`, { defaultValue: t2(`kind.${node.kind}`) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-ico", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { strokeWidth: 2 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-title", title: node.title, children: node.title }),
            density !== "full" && star,
            density !== "full" && priorityBadge,
            density === "chip" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-ago", children: agoText(node.lastActivityAt ?? node.since, now, t2) })
          ] }),
          density !== "chip" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-meta", children: node.kind === "inbox" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-count", children: node.count ?? 0 }),
            tail && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-meta-text", children: tail })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "cn-chip", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
              chipLabel
            ] }),
            meta && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: quietRunningMs(node, now) !== null ? "cn-meta-text cn-meta-quiet" : "cn-meta-text", children: meta }),
            modelLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-model", title: t2("meta.model", { model: modelLabel }), children: modelLabel }),
            density === "compact" && lastRun && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `cn-last res-${lastRun.result}`, title: t2(`status.${lastRun.result === "ok" ? "succeeded" : lastRun.result}`) })
          ] }) }),
          density === "full" && members.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-members", children: [
            members.slice(0, MEMBERS_SHOWN).map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `cn-member st-${m.status}`, title: `${m.name} · ${t2(`status.${m.status}`)}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: m.name })
            ] }, `${m.name}-${i}`)),
            members.length > MEMBERS_SHOWN && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-member", children: t2("meta.moreMembers", { count: members.length - MEMBERS_SHOWN }) })
          ] }),
          subTasks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-subtasks", "aria-label": t2("meta.subTasks", { count: subTasks.length }), children: [
            subTasks.slice(0, CANVAS_SUBTASKS_SHOWN).map((s) => {
              const title = s.title.replace(/^Agent:\s*/i, "");
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `cn-subtask st-${s.status}`, title: `${title} · ${t2(`status.${s.status}`)}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-dot" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: title })
              ] }, s.sessionId);
            }),
            subTasks.length > CANVAS_SUBTASKS_SHOWN && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-subtask", children: t2("meta.moreMembers", { count: subTasks.length - CANVAS_SUBTASKS_SHOWN }) })
          ] }),
          showTail && (isWorkflow ? (
            // 工作流：按步分格的进度条（完成填色、当前步闪），文字「N/M 步完成」照留
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-tail cn-steps", title: tail, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-steps-bar", "aria-hidden": "true", children: members.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `cn-step st-${m.status}` }, i)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tail })
            ] })
          ) : liveTail ? (
            // 在跑的会话：每换一步，新的一行从下面滚上来（换 key 重播入场动画）
            // ponytail: 卡高固定只放得下一行；要多行得在 canvasNodeHeight 给在跑会话加高，会牵动布局，先不做
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cn-tail", title: tail, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cn-live", children: tail }, tail) })
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `cn-tail${askError ? " is-error" : ""}`, title: askError ?? tail, children: askError ?? tail })),
          density === "full" && node.kind === "idea" && node.images?.length ? (
            // 待办附图：缩略图一行（卡高由 canvasNodeHeight 的 IDEA_IMAGES_H 预留）
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cn-thumbs", children: [
              node.images.slice(0, IDEA_THUMBS_SHOWN).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(ChatImage, { src: p, alt: "", title: p }, p)),
              node.images.length > IDEA_THUMBS_SHOWN && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "cn-thumbs-more", children: [
                "+",
                node.images.length - IDEA_THUMBS_SHOWN
              ] })
            ] })
          ) : null,
          density === "full" && node.status === "awaiting" && node.questions?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(AskChips, { node, onError: setAskError }) : null,
          showPort && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "cn-port nodrag nopan",
              "aria-label": t2("port"),
              title: t2("port"),
              onClick: (e) => e.stopPropagation(),
              onPointerDown: (e) => {
                e.stopPropagation();
                onPortPointerDown?.(node, e);
              }
            }
          )
        ]
      }
    ),
    peekRect && /* @__PURE__ */ jsxRuntimeExports.jsx(NodePeekCard, { node, anchor: peekRect, now, onOpen: onOpen ? open : void 0, onHoverChange: onPeekHover })
  ] });
}
const CanvasNodeCard = reactExports.memo(CanvasNodeCardImpl);
const ms = (iso) => {
  const v = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(v) ? v : null;
};
const waitedSince = (n) => ms(n.lastActivityAt ?? n.since);
const asc = (a, b) => (a ?? Infinity) - (b ?? Infinity);
const desc = (a, b) => (b ?? -Infinity) - (a ?? -Infinity);
function pendingSections(nodes, now = Date.now()) {
  const mine = nodes.filter((n) => matchesFilter(n, "mine")).sort((a, b) => desc(waitedSince(a), waitedSince(b)));
  const quiet = new Map(nodes.map((n) => [n.id, quietRunningMs(n, now)]));
  const running = nodes.filter((n) => n.status === "running").sort((a, b) => {
    const qa = quiet.get(a.id) ?? null;
    const qb = quiet.get(b.id) ?? null;
    if (qa !== null || qb !== null) return qa === null ? 1 : qb === null ? -1 : qb - qa;
    return asc(ms(a.since), ms(b.since));
  });
  const quietCount = running.filter((n) => quiet.get(n.id) !== null).length;
  const later = nodes.filter((n) => n.status === "sleeping" && ms(n.nextRunAt) !== null).sort((a, b) => asc(ms(a.nextRunAt), ms(b.nextRunAt)));
  const breakdown = { awaiting: 0, proposal: 0, failed: 0, hidden: 0 };
  for (const n of mine) {
    breakdown[n.kind === "proposal" ? "proposal" : n.status === "failed" ? "failed" : "awaiting"]++;
    if (n.hidden) breakdown.hidden++;
  }
  return { mine, running, quietCount, later, breakdown };
}
function breakdownText(b, t2) {
  return ["awaiting", "proposal", "failed", "hidden"].filter((k) => b[k] > 0).map((k) => t2(`canvas.pending.part.${k}`, { count: b[k] })).join(" · ");
}
function pendingHint(b, t2) {
  const total = b.awaiting + b.proposal + b.failed;
  return total > 0 ? t2("canvas.pending.hint", { count: total, detail: breakdownText(b, t2) }) : t2("canvas.pending.hintEmpty");
}
const OPEN_KEY = "shineai.workbench.pendingPanel.open";
const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
};
const usePendingPanel = create((set) => ({
  open: readOpen(),
  setOpen: (open) => {
    try {
      localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
    }
    set({ open });
  },
  laterOpen: false,
  setLaterOpen: (laterOpen) => set({ laterOpen })
}));
const iconBtn = "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted outline-none hover:bg-bg-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-blue";
function Row({ node, meta, tone, quiet, onOpen, onLocate }) {
  const { t: t2 } = useTranslation("workbench");
  const Icon = NODE_ICONS[node.kind];
  const [askError, setAskError] = reactExports.useState(null);
  const ask = node.status === "awaiting" && node.ask ? plainMarkdown(node.ask) : null;
  const canAnswer = node.status === "awaiting" && !!node.questions?.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-pending-row": node.id, className: "group rounded-lg pr-1 hover:bg-bg-hover/60", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: onOpen, title: node.title, className: "flex min-w-0 flex-1 items-start gap-2 rounded-lg px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-blue", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn("mt-0.5 h-3.5 w-3.5 shrink-0", tone === "failed" ? "text-accent-red" : tone === "needs" ? "text-accent-orange" : "text-text-muted"), "aria-hidden": true }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-[13px] text-text-primary", children: node.title }),
            meta && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("shrink-0 font-mono text-[11px] tabular-nums", tone === "failed" ? "text-accent-red" : tone === "needs" || quiet ? "text-accent-orange" : "text-text-muted"), children: meta })
          ] }),
          (node.project || node.kind === "proposal" || tone === "failed") && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px]", children: [
            tone === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded bg-accent-red/15 px-1 text-accent-red", children: t2("canvas.pending.failed") }),
            node.kind === "proposal" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded bg-accent-orange/15 px-1 text-accent-orange", children: t2("canvas.pending.proposal") }),
            node.project && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate text-text-muted", children: node.project.title })
          ] }),
          ask ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-pending-ask": true, title: ask, className: "mt-0.5 line-clamp-2 text-[11px] text-text-secondary", children: ask }) : node.tail && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block truncate text-[11px] text-text-secondary", children: node.tail }),
          askError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block text-[11px] text-accent-red", children: askError })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(iconBtn, "mt-1"), onClick: onLocate, title: t2("canvas.pending.locate"), "aria-label": t2("canvas.pending.locateNamed", { title: node.title }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crosshair, { className: "h-3.5 w-3.5", "aria-hidden": true }) })
    ] }),
    canAnswer && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pb-1.5 pl-[30px] pr-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AskChips, { node, onError: setAskError }) })
  ] });
}
function SectionHead({ id, label, count, note, collapsed, onToggle }) {
  const text = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono tabular-nums text-text-muted", children: count }),
    note && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-normal text-accent-orange", children: [
      "· ",
      note
    ] })
  ] });
  const cls = "flex w-full items-center gap-1.5 px-2 pb-1 pt-3 text-[11px] font-medium text-text-secondary";
  if (!onToggle) return /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id, className: cls, children: text });
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(cls, "rounded outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-blue"), "aria-expanded": !collapsed, onClick: onToggle, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Chevron, { className: "h-3 w-3", "aria-hidden": true }),
    text
  ] }) });
}
function PendingPanel({ nodes, now, onOpenNode, onLocate }) {
  const { t: t2 } = useTranslation("workbench");
  const { t: tn } = useTranslation("canvasNodes");
  const open = usePendingPanel((s) => s.open);
  const setOpen = usePendingPanel((s) => s.setOpen);
  const laterOpen = usePendingPanel((s) => s.laterOpen);
  const setLaterOpen = usePendingPanel((s) => s.setLaterOpen);
  const rootRef = reactExports.useRef(null);
  const sections = reactExports.useMemo(() => pendingSections(nodes, now), [nodes, now]);
  reactExports.useEffect(() => {
    if (open) rootRef.current?.focus();
  }, [open]);
  if (!open) return null;
  const { mine, running, quietCount, later, breakdown } = sections;
  const openNode = (n) => {
    onOpenNode(n);
    setOpen(false);
  };
  const row = (n, meta, tone) => /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { node: n, meta, tone, quiet: n.status === "running" && quietRunningMs(n, now) !== null, onOpen: () => openNode(n), onLocate: () => onLocate(n.id) }, n.id);
  const mineMeta = (n) => {
    if (n.status === "failed") return agoText(n.lastActivityAt ?? n.since, now, tn);
    const at = waitedSince(n);
    return at === null ? null : tn("meta.waited", { time: waitDuration(Math.max(0, now - at), tn) });
  };
  const runMeta = (n) => {
    const quiet = quietRunningMs(n, now);
    if (quiet !== null) return quietText(quiet, tn);
    const at = ms(n.since);
    return at === null ? null : t2("canvas.pending.ranFor", { time: formatElapsed(Math.max(0, now - at)) });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      ref: rootRef,
      tabIndex: -1,
      role: "dialog",
      "aria-labelledby": "pending-panel-title",
      "data-pending-panel": true,
      onKeyDown: (e) => {
        if (e.key === "Escape" && !e.defaultPrevented) {
          e.preventDefault();
          setOpen(false);
        }
      },
      className: "absolute bottom-2 right-2 top-2 z-40 flex w-[400px] max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-xl bg-bg-secondary shadow-2xl outline-none ring-1 ring-inset ring-border",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex shrink-0 items-center gap-2 border-b border-border/60 py-2 pl-4 pr-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "pending-panel-title", className: "text-sm font-semibold text-text-primary", children: t2("canvas.pending.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-[11px] text-text-muted", title: pendingHint(breakdown, t2), children: breakdownText(breakdown, t2) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: iconBtn, onClick: () => setOpen(false), title: t2("canvas.pending.close"), "aria-label": t2("canvas.pending.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4", "aria-hidden": true }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto px-2 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "aria-labelledby": "pending-mine", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHead, { id: "pending-mine", label: t2("canvas.pending.section.mine"), count: mine.length }),
            mine.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { "data-pending-empty": true, className: "px-2 py-6 text-center text-xs text-text-muted", children: t2("canvas.pending.empty") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { children: mine.map((n) => row(n, mineMeta(n), n.status === "failed" ? "failed" : "needs")) })
          ] }),
          running.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "aria-labelledby": "pending-running", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHead, { id: "pending-running", label: t2("canvas.pending.section.running"), count: running.length, note: quietCount > 0 ? t2("canvas.pending.quietNote", { count: quietCount }) : void 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { children: running.map((n) => row(n, runMeta(n))) })
          ] }),
          later.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "aria-labelledby": "pending-later", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHead, { id: "pending-later", label: t2("canvas.pending.section.later"), count: later.length, collapsed: !laterOpen, onToggle: () => setLaterOpen(!laterOpen) }),
            laterOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { children: later.map((n) => row(n, nextRunText(n.nextRunAt, now, tn))) })
          ] })
        ] })
      ]
    }
  );
}
const CANVAS_MIN_ZOOM = 0.15;
const CANVAS_MAX_ZOOM = 2;
const FIT_PADDING = 0.15;
const FIT_PAD_PX = 32;
const FIT_MIN_ZOOM = 0.75;
function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
function StageInner({ ariaLabel, onPaneDoubleClick, overlay, onFit, selectMode, ...flowProps }) {
  const flow = useReactFlow();
  const onKeyDown = reactExports.useCallback(
    (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (onFit) onFit();
        else void flow.fitView({ padding: FIT_PADDING, duration: 200 });
      }
    },
    [flow, onFit]
  );
  const onDoubleClick = reactExports.useCallback(
    (e) => {
      if (!onPaneDoubleClick || !e.target.classList.contains("react-flow__pane")) return;
      onPaneDoubleClick(flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [flow, onPaneDoubleClick]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-appearance-surface": "shell", className: "workbench-canvas relative h-full w-full outline-none", tabIndex: 0, onKeyDown, onDoubleClick, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      index,
      {
        "aria-label": ariaLabel,
        panOnDrag: selectMode ? [1, 2] : true,
        selectionOnDrag: selectMode,
        selectionKeyCode: "Shift",
        multiSelectionKeyCode: ["Meta", "Control"],
        selectionMode: SelectionMode.Partial,
        zoomOnDoubleClick: false,
        deleteKeyCode: ["Delete", "Backspace"],
        nodesConnectable: false,
        minZoom: CANVAS_MIN_ZOOM,
        maxZoom: CANVAS_MAX_ZOOM,
        onlyRenderVisibleElements: true,
        elevateNodesOnSelect: false,
        proOptions: { hideAttribution: true },
        ...flowProps,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Background, { variant: BackgroundVariant.Dots, gap: 22, size: 1.2, color: "color-mix(in srgb, var(--color-text-muted) 28%, transparent)" })
      }
    ),
    overlay
  ] });
}
const CanvasStage = reactExports.memo(StageInner);
function dayBounds(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const start = d.getTime();
  d.setDate(d.getDate() + 1);
  return { start, end: d.getTime() };
}
function buildTimelineTicks(nodes, range) {
  const out = [];
  const inDay = (at) => {
    const t2 = ts$1(at);
    return t2 >= range.start && t2 < range.end;
  };
  for (const n of nodes) {
    for (const r of n.history ?? []) {
      if (inDay(r.at)) out.push({ nodeId: n.id, at: r.at, result: r.result, durationSec: r.durationSec, note: r.note });
    }
    if (n.status === "running" && (n.kind === "pipeline" || n.kind === "goal") && n.since && inDay(n.since)) {
      out.push({ nodeId: n.id, at: n.since, result: "ok", durationSec: null, note: null, running: true });
    }
  }
  return out.sort((a, b) => ts$1(a.at) - ts$1(b.at));
}
function replayAt(ticks, atMs) {
  const lit = {};
  const latest = /* @__PURE__ */ new Map();
  for (const t2 of ticks) {
    if (ts$1(t2.at) > atMs) continue;
    const prev = latest.get(t2.nodeId);
    if (!prev || ts$1(t2.at) >= ts$1(prev.at)) latest.set(t2.nodeId, t2);
  }
  for (const [id, t2] of latest) {
    const end = t2.durationSec !== null ? ts$1(t2.at) + t2.durationSec * 1e3 : null;
    lit[id] = t2.running || end !== null && end > atMs ? "running" : runResultStatus(t2.result);
  }
  return { at: new Date(atMs).toISOString(), lit };
}
const DAY_MS = 864e5;
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const KEY_STEP_MS = 15 * 6e4;
const HIT_PX = 6;
function ratioToTime(ratio, dayStart, now) {
  return Math.min(now, Math.max(dayStart, dayStart + Math.round(Math.min(1, Math.max(0, ratio)) * DAY_MS)));
}
function ticksNear(ticks, atMs, tolMs) {
  const best = /* @__PURE__ */ new Map();
  for (const tk of ticks) {
    const d = Math.abs(tk.ms - atMs);
    if (d > tolMs) continue;
    const prev = best.get(tk.nodeId);
    if (!prev || d < Math.abs(prev.ms - atMs)) best.set(tk.nodeId, tk);
  }
  return [...best.values()].sort((a, b) => Math.abs(a.ms - atMs) - Math.abs(b.ms - atMs));
}
const hhmm$1 = (ms2) => new Date(ms2).toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit", hour12: false });
const nextLabel = (ms2, dayStart) => ms2 < dayStart + DAY_MS ? hhmm$1(ms2) : new Date(ms2).toLocaleString(void 0, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
function CanvasTimelineImpl({ ticks, now, nextRunMs = null, replayMs, onReplay, titleOf, onTickMenu, onTickOpen }) {
  const { t: t2 } = useTranslation("workbench");
  const trackRef = reactExports.useRef(null);
  const dayStart = dayBounds(now).start;
  const pct = (ms2) => `${(ms2 - dayStart) / DAY_MS * 100}%`;
  const cursor = replayMs ?? now;
  const todayTicks = reactExports.useMemo(
    () => ticks.map((tk) => ({ ...tk, ms: Date.parse(tk.at) })).filter((tk) => tk.ms >= dayStart && tk.ms <= now),
    [ticks, dayStart, now]
  );
  const seek = reactExports.useCallback(
    (clientX) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      onReplay(ratioToTime((clientX - rect.left) / rect.width, dayStart, now));
    },
    [dayStart, now, onReplay]
  );
  const [pick, setPick] = reactExports.useState(null);
  const pickRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!pick) return;
    pickRef.current?.querySelector("button")?.focus();
    const down = (e) => {
      if (!pickRef.current?.contains(e.target)) setPick(null);
    };
    const key = (e) => e.key === "Escape" && setPick(null);
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("keydown", key);
    };
  }, [pick]);
  const hitAt = (clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return [];
    const at = clientX === null ? cursor : dayStart + (clientX - rect.left) / rect.width * DAY_MS;
    return ticksNear(todayTicks, at, HIT_PX / rect.width * DAY_MS);
  };
  const onContextMenu = (e) => {
    e.preventDefault();
    if (!onTickMenu) return;
    const keyboard = e.clientX === 0 && e.clientY === 0;
    const hits2 = hitAt(keyboard ? null : e.clientX);
    if (hits2.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = keyboard ? rect.left + (cursor - dayStart) / DAY_MS * rect.width : e.clientX;
    const y = keyboard ? rect.bottom : e.clientY;
    if (hits2.length === 1) onTickMenu(hits2[0].nodeId, x, y);
    else setPick({ x, y, items: hits2 });
  };
  const onDoubleClick = (e) => {
    const hit = hitAt(e.clientX)[0];
    if (!hit || !onTickOpen) return;
    onReplay(null);
    onTickOpen(hit.nodeId);
  };
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    seek(e.clientX);
  };
  const onPointerMove = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) seek(e.clientX);
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = cursor + (e.key === "ArrowLeft" ? -KEY_STEP_MS : KEY_STEP_MS);
      onReplay(next >= now ? null : Math.max(dayStart, next));
    } else if (e.key === "Escape" || e.key === "End") {
      onReplay(null);
    }
  };
  if (todayTicks.length === 0 && replayMs === null) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-5 items-center gap-3 text-xs text-text-muted", title: t2("canvas.timeline.hint"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: t2("canvas.timeline.today") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: nextRunMs !== null ? t2("canvas.timeline.emptyNext", { time: nextLabel(nextRunMs, dayStart) }) : t2("canvas.timeline.empty") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wb-timeline", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "wb-timeline-label", title: t2("canvas.timeline.hint"), children: t2("canvas.timeline.today") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wb-timeline-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: trackRef,
          role: "slider",
          tabIndex: 0,
          "aria-label": t2("canvas.timeline.sliderLabel"),
          "aria-valuemin": dayStart,
          "aria-valuemax": now,
          "aria-valuenow": cursor,
          "aria-valuetext": hhmm$1(cursor),
          className: "wb-timeline-track",
          onPointerDown,
          onPointerMove,
          onKeyDown,
          onContextMenu,
          onDoubleClick,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wb-timeline-future", style: { left: pct(now) } }),
            todayTicks.map((tk) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `wb-tick ${tk.running ? "is-running" : `res-${tk.result}`}`,
                style: { left: pct(tk.ms) },
                title: `${hhmm$1(tk.ms)} · ${titleOf(tk.nodeId)}${tk.note ? ` · ${tk.note}` : ""}`
              },
              `${tk.nodeId}-${tk.at}-${tk.running ? "run" : tk.result}`
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `wb-timeline-cursor${replayMs !== null ? " is-replay" : ""}`, style: { left: pct(cursor) }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "wb-timeline-time", children: hhmm$1(cursor) }) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wb-timeline-axis", "aria-hidden": true, children: HOURS.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { left: `${h / 24 * 100}%` }, children: String(h).padStart(2, "0") }, h)) })
    ] }),
    replayMs !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "wb-timeline-now", onClick: () => onReplay(null), children: t2("canvas.timeline.backToNow") }),
    pick && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: pickRef,
        role: "menu",
        "aria-label": t2("canvas.timeline.pickRun"),
        className: "wb-node-menu",
        style: { left: Math.min(pick.x, window.innerWidth - 240), top: Math.min(pick.y, window.innerHeight - 40 - pick.items.length * 28) },
        children: pick.items.map((tk) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            role: "menuitem",
            onClick: () => {
              setPick(null);
              onTickMenu?.(tk.nodeId, pick.x, pick.y);
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `wb-tick-dot ${tk.running ? "is-running" : `res-${tk.result}`}`, "aria-hidden": true }),
              hhmm$1(tk.ms),
              " · ",
              titleOf(tk.nodeId)
            ]
          },
          tk.nodeId
        ))
      }
    )
  ] });
}
const CanvasTimeline = reactExports.memo(CanvasTimelineImpl);
const STALE_DAYS = 7;
const GROUP_BY_KEY = "shineai.canvas.groupByDirection";
const EMPTY$2 = { directions: [], sessionDirection: {} };
const useDirectionView = create((set, get) => ({
  byDirection: (() => {
    try {
      return localStorage.getItem(GROUP_BY_KEY) === "1";
    } catch {
      return false;
    }
  })(),
  data: EMPTY$2,
  setByDirection: (on2) => {
    try {
      localStorage.setItem(GROUP_BY_KEY, on2 ? "1" : "0");
    } catch {
    }
    set({ byDirection: on2 });
  },
  // 失败（IPC 出错 / 主进程返回 null）保留上次的结果，免得一次抖动把整张画布切回按项目；没变化不 set，免得画布白重算
  refresh: async () => {
    let data;
    try {
      data = await window.shineAI?.directions?.map?.();
    } catch {
      return;
    }
    if (!data || !Array.isArray(data.directions)) return;
    if (JSON.stringify(data) === JSON.stringify(get().data)) return;
    set({ data });
  }
}));
const DIRECTION_GROUP = "project:direction:";
const isDirectionGroup = (id) => !!id && id.startsWith(DIRECTION_GROUP);
const isProjectGroup = (id) => !!id && id.startsWith("project:") && !isDirectionGroup(id);
function layoutForGrouping(layout, byDirection) {
  const foreign = byDirection ? isProjectGroup : isDirectionGroup;
  const groups = layout.groups.filter((g) => !foreign(g.id));
  let touched = groups.length !== layout.groups.length;
  const nodes = {};
  for (const [id, n] of Object.entries(layout.nodes)) {
    if (foreign(n.groupId)) {
      nodes[id] = { ...n, groupId: void 0, unplaced: true };
      touched = true;
    } else nodes[id] = n;
  }
  return touched ? { ...layout, groups, nodes } : layout;
}
function directionGroupingActive(s) {
  return s.byDirection && s.data.directions.length > 0;
}
function staleDays(lastActiveAt, now) {
  if (!lastActiveAt) return null;
  const t2 = new Date(lastActiveAt).getTime();
  if (Number.isNaN(t2)) return null;
  const days = Math.floor((now - t2) / 864e5);
  return days >= STALE_DAYS ? days : null;
}
function directionRefs(data, now, staleLabel) {
  const refOf = new Map(data.directions.map((d) => {
    const stale = staleDays(d.lastActiveAt, now);
    return [d.id, { key: `direction:${d.id}`, title: stale == null ? d.name : `${d.name} · ${staleLabel(stale)}` }];
  }));
  const out = /* @__PURE__ */ new Map();
  for (const [sid, did] of Object.entries(data.sessionDirection)) {
    const ref = refOf.get(did);
    if (ref) out.set(sid, ref);
  }
  return out;
}
const btn$2 = "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:opacity-40";
const on = "bg-text-primary text-bg-primary hover:bg-text-primary hover:text-bg-primary";
const field = "h-7 rounded-md bg-bg-primary px-2 text-xs text-text-primary ring-1 ring-inset ring-border placeholder:text-text-muted focus:outline-none focus:ring-accent-blue";
function ZoomReadout() {
  const zoom = useStore((s) => Math.round(s.transform[2] * 100));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-text-muted", children: [
    zoom,
    "%"
  ] });
}
const DENSITIES = ["full", "compact", "tight"];
function nextDensity(cur, contentWidth, available, need) {
  if (available <= 0) return cur;
  const i = DENSITIES.indexOf(cur);
  if (contentWidth > available) return DENSITIES[Math.min(i + 1, DENSITIES.length - 1)];
  const up = DENSITIES[i - 1];
  return up && (need[up] ?? 0) <= available ? up : cur;
}
function useToolbarDensity(ref) {
  const [density, setDensity] = reactExports.useState("full");
  const [available, setAvailable] = reactExports.useState(0);
  const need = reactExports.useRef({});
  reactExports.useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  reactExports.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    need.current[density] = el.scrollWidth;
    const next = nextDensity(density, el.scrollWidth, available, need.current);
    if (next !== density) setDensity(next);
  });
  return density;
}
function useFitOnDockChange(onFit) {
  const panel = useWorkbenchDockStore((s) => s.panel);
  const fitRef = reactExports.useRef(onFit);
  fitRef.current = onFit;
  const first = reactExports.useRef(true);
  reactExports.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = window.setTimeout(() => fitRef.current(), 160);
    return () => window.clearTimeout(id);
  }, [panel]);
}
function InboxForm({ onSubmit, onCancel }) {
  const { t: t2 } = useTranslation("workbench");
  const [title, setTitle] = reactExports.useState("");
  const [target, setTarget] = reactExports.useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), target.trim() || null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "absolute left-0 top-9 z-40 flex w-72 flex-col gap-2 rounded-xl bg-bg-secondary p-3 shadow-xl ring-1 ring-inset ring-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1 text-[11px] text-text-muted", children: [
      t2("canvas.inbox.name"),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { autoFocus: true, className: field, value: title, onChange: (e) => setTitle(e.target.value), placeholder: t2("canvas.inbox.namePlaceholder") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1 text-[11px] text-text-muted", children: [
      t2("canvas.inbox.target"),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: field, value: target, onChange: (e) => setTarget(e.target.value), placeholder: t2("canvas.inbox.targetPlaceholder") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$2, onClick: onCancel, children: t2("canvas.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: cn(btn$2, on), disabled: !title.trim(), children: t2("canvas.inbox.create") })
    ] })
  ] });
}
function MoreMenu({ items }) {
  const { t: t2 } = useTranslation("workbench");
  const [open, setOpen] = reactExports.useState(false);
  const rootRef = reactExports.useRef(null);
  const triggerRef = reactExports.useRef(null);
  const menuRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role^="menuitem"]')?.focus();
    const down = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, [open]);
  const onMenuKey = (e) => {
    const els = Array.from(menuRef.current?.querySelectorAll('[role^="menuitem"]') ?? []);
    const i = els.indexOf(document.activeElement);
    const go = (j) => {
      e.preventDefault();
      els[(j + els.length) % els.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(els.length - 1);
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { ref: rootRef, className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        ref: triggerRef,
        type: "button",
        className: cn(btn$2, open && on),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-label": t2("canvas.more"),
        title: t2("canvas.more"),
        onClick: () => setOpen((v) => !v),
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-3.5 w-3.5", "aria-hidden": true })
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: menuRef, role: "menu", "aria-label": t2("canvas.more"), onKeyDown: onMenuKey, className: "absolute left-0 top-9 z-40 flex min-w-[11rem] flex-col rounded-xl bg-bg-secondary p-1 shadow-xl ring-1 ring-inset ring-border", children: items.map(({ key, icon: Icon, label, title, checked, run }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        role: checked === void 0 ? "menuitem" : "menuitemcheckbox",
        "aria-checked": checked,
        title,
        "data-more-item": key,
        className: cn(btn$2, "justify-start rounded-lg"),
        onClick: () => {
          setOpen(false);
          run();
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-left", children: label }),
          checked && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5", "aria-hidden": true })
        ]
      },
      key
    )) })
  ] });
}
function WorkGroupFilters({ filter, onFilter, compact: compact2 }) {
  const { t: t2 } = useTranslation("workGroups");
  const available = useWorkGroupStore((s) => s.available);
  const groups = useWorkGroupStore((s) => s.groups);
  const [open, setOpen] = reactExports.useState(false);
  const rootRef = reactExports.useRef(null);
  const triggerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!open) return;
    const down = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, [open]);
  if (!available) return null;
  const picked = filter.priorities ?? [];
  const toggle = (p) => onFilter({ ...filter, priorities: picked.includes(p) ? picked.filter((x) => x !== p) : [...picked, p] });
  const labelOf = (p) => p === "none" ? t2("priority.unset") : t2(`priority.${p}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { ref: rootRef, className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          ref: triggerRef,
          type: "button",
          className: cn(btn$2, "bg-bg-secondary/90 ring-1 ring-inset ring-border", picked.length > 0 && on),
          "aria-haspopup": "menu",
          "aria-expanded": open,
          "aria-label": t2("filter.priorityAria"),
          title: picked.length ? picked.map(labelOf).join(" / ") : t2("filter.priorityAria"),
          "data-filter-priority": picked.join(",") || "all",
          onClick: () => setOpen((v) => !v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "h-3.5 w-3.5", "aria-hidden": true }),
            !compact2 && t2("filter.priority"),
            picked.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono tabular-nums", "aria-hidden": true, children: picked.length })
          ]
        }
      ),
      open && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          role: "menu",
          "aria-label": t2("filter.priorityAria"),
          onKeyDown: (e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
          },
          className: "absolute left-0 top-9 z-40 flex min-w-[10rem] flex-col rounded-xl bg-bg-secondary p-1 shadow-xl ring-1 ring-inset ring-border",
          children: PRIORITY_FILTERS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "menuitemcheckbox", "aria-checked": picked.includes(p), className: cn(btn$2, "justify-start rounded-lg"), onClick: () => toggle(p), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { backgroundColor: p === "none" ? "transparent" : PRIORITY_HEX[p], boxShadow: p === "none" ? "inset 0 0 0 1px currentColor" : void 0 }, "aria-hidden": true }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-left", children: labelOf(p) }),
            picked.includes(p) && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5", "aria-hidden": true })
          ] }, p))
        }
      )
    ] }),
    groups.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        "aria-label": t2("filter.group"),
        size: "sm",
        variant: "ghost",
        fullWidth: false,
        className: cn("shrink-0", compact2 ? "max-w-[7rem]" : "max-w-[10rem]"),
        value: filter.workGroupId ?? "",
        onChange: (v) => onFilter({ ...filter, workGroupId: v || null }),
        options: [
          { value: "", label: t2("group.all") },
          ...groups.map((g) => ({
            value: g.id,
            label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupDot, { color: g.color }),
              g.name
            ] })
          }))
        ]
      }
    )
  ] });
}
function CanvasToolbarImpl(props) {
  const { t: t2 } = useTranslation("workbench");
  const { filter, onFilter, projectGroups, nodes } = props;
  const [query, setQuery] = reactExports.useState("");
  const [inboxOpen, setInboxOpen] = reactExports.useState(false);
  const results = reactExports.useMemo(() => searchNodes(nodes, query), [nodes, query]);
  const goalsOpen = useWorkbenchGoalsView((s) => s.open);
  const toggleGoals = () => goalsOpen ? useWorkbenchGoalsView.getState().setOpen(false) : openGoalsView();
  const hasDirections = useDirectionView((s) => s.data.directions.length > 0);
  const byDirection = useDirectionView((s) => s.byDirection) && hasDirections;
  const toggleDirection = () => {
    useDirectionView.getState().setByDirection(!byDirection);
    onFilter({ ...filter, groupId: null });
  };
  const rootRef = reactExports.useRef(null);
  const density = useToolbarDensity(rootRef);
  const iconOnly = density !== "full";
  const tight = density === "tight";
  useFitOnDockChange(props.onFit);
  const counts = reactExports.useMemo(
    () => ({ mine: nodes.filter((n) => matchesFilter(n, "mine")).length, running: nodes.filter((n) => matchesFilter(n, "running")).length }),
    [nodes]
  );
  const pendingTitle = reactExports.useMemo(() => pendingHint(pendingSections(nodes).breakdown, t2), [nodes, t2]);
  const pendingOpen = usePendingPanel((s) => s.open);
  return (
    // 非最紧一档按内容自然宽度排（w-max，子项不被挤压），量出的宽度才是真实所需；最紧一档才允许挤窄
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: rootRef, "data-toolbar-density": density, className: cn("flex flex-nowrap items-center gap-2", tight ? "min-w-0" : "w-max shrink-0"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "toolbar", "aria-label": t2("canvas.toolbarLabel"), className: "relative flex items-center gap-0.5 rounded-full bg-bg-secondary/90 p-1 shadow-sm ring-1 ring-inset ring-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: btn$2, onClick: props.onFit, title: t2("canvas.fitViewHint"), "aria-label": iconOnly ? t2("canvas.fitView") : void 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          !iconOnly && t2("canvas.fitView")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$2, props.selectMode && on), "aria-pressed": props.selectMode, onClick: props.onToggleSelectMode, title: t2("canvas.selectModeHint"), "aria-label": iconOnly ? t2("canvas.selectMode") : void 0, "data-canvas-select-mode": true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SquareDashedMousePointer, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          !iconOnly && t2("canvas.selectMode")
        ] }),
        !tight && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: btn$2, onClick: props.onTidy, title: t2("canvas.tidyHint"), "aria-label": iconOnly ? t2("canvas.tidy") : void 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          !iconOnly && t2("canvas.tidy")
        ] }),
        !tight && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: btn$2, onClick: props.onNewGroup, title: t2("canvas.newGroupHint"), "aria-label": iconOnly ? t2("canvas.newGroup") : void 0, "data-canvas-new-group": true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderPlus, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          !iconOnly && t2("canvas.newGroup")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MoreMenu,
            {
              items: [
                ...tight ? [
                  { key: "tidy", icon: LayoutGrid, label: t2("canvas.tidy"), title: t2("canvas.tidyHint"), run: props.onTidy },
                  { key: "goals", icon: ListChecks, label: t2("goalsView.open"), checked: goalsOpen, run: toggleGoals },
                  ...hasDirections ? [{ key: "direction", icon: Compass, label: t2("canvas.direction.toggle"), title: t2("canvas.direction.toggleHint"), checked: byDirection, run: toggleDirection }] : []
                ] : [],
                ...props.hiddenCount > 0 ? [{ key: "showHidden", icon: Eye, label: t2("canvas.showHidden", { count: props.hiddenCount }), run: props.onShowHidden }] : [],
                { key: "autoTidy", icon: WandSparkles, label: t2("canvas.autoTidy"), title: t2("canvas.autoTidyHint"), checked: props.autoTidy, run: props.onToggleAutoTidy },
                ...tight ? [{ key: "newGroup", icon: FolderPlus, label: t2("canvas.newGroup"), title: t2("canvas.newGroupHint"), run: props.onNewGroup }] : [],
                { key: "inbox", icon: Inbox, label: t2("canvas.inbox.new"), run: () => setInboxOpen(true) },
                { key: "timeline", icon: Clock3, label: t2("canvas.timeline.toggle"), checked: props.timelineOpen, run: props.onToggleTimeline },
                { key: "hint", icon: CircleHelp, label: t2("canvas.hintShow"), run: props.onShowHint }
              ]
            }
          ),
          inboxOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
            InboxForm,
            {
              onCancel: () => setInboxOpen(false),
              onSubmit: (title, target) => {
                setInboxOpen(false);
                props.onNewInbox(title, target);
              }
            }
          )
        ] }),
        !tight && /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomReadout, {})
      ] }),
      tight ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Select,
        {
          "aria-label": t2("canvas.filter.label"),
          size: "sm",
          variant: "ghost",
          fullWidth: false,
          className: "max-w-[7rem] shrink-0",
          value: filter.filter,
          onChange: (v) => onFilter({ ...filter, filter: v }),
          options: CANVAS_FILTERS.map((f) => {
            const label = t2(`canvas.filter.${f}`);
            return { value: f, label: (f === "mine" || f === "running") && counts[f] > 0 ? `${label} ${counts[f]}` : label };
          })
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "radiogroup", "aria-label": t2("canvas.filter.label"), className: "flex items-center gap-0.5 rounded-full bg-bg-secondary/90 p-1 ring-1 ring-inset ring-border", children: [
        CANVAS_FILTERS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": filter.filter === f,
            title: f === "mine" ? pendingTitle : void 0,
            className: cn(btn$2, filter.filter === f ? on : f === "running" && counts.running > 0 && "bg-accent-green/15 text-accent-green hover:bg-accent-green/25 hover:text-accent-green"),
            onClick: () => onFilter({ ...filter, filter: f }),
            children: [
              f === "running" && counts.running > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none", "aria-hidden": true }),
              t2(`canvas.filter.${f}`),
              (f === "mine" || f === "running") && counts[f] > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("font-mono tabular-nums", f === "mine" && filter.filter !== f && "font-semibold text-accent-orange"), "aria-hidden": true, children: counts[f] })
            ]
          },
          f
        )),
        projectGroups.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Select,
          {
            "aria-label": t2("canvas.filter.project"),
            size: "sm",
            variant: "ghost",
            fullWidth: false,
            className: cn("ml-1", iconOnly ? "max-w-[7rem]" : "max-w-[10rem]"),
            value: filter.groupId ?? "",
            onChange: (v) => onFilter({ ...filter, groupId: v || null }),
            options: [
              { value: "", label: byDirection ? t2("canvas.direction.all") : t2("canvas.filter.allProjects") },
              ...projectGroups.map((g) => ({ value: g.id, label: g.title }))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupFilters, { filter, onFilter, compact: iconOnly }),
      !tight && hasDirections && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$2, "bg-bg-secondary/90 ring-1 ring-inset ring-border", byDirection && on), "aria-pressed": byDirection, onClick: toggleDirection, title: t2("canvas.direction.toggleHint"), "aria-label": iconOnly ? t2("canvas.direction.toggle") : void 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { className: "h-3.5 w-3.5", "aria-hidden": true }),
        !iconOnly && t2("canvas.direction.toggle")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$2, "bg-bg-secondary/90 ring-1 ring-inset ring-border", pendingOpen && on), "aria-pressed": pendingOpen, onClick: () => usePendingPanel.getState().setOpen(!pendingOpen), title: pendingTitle, "aria-label": `${t2("canvas.pending.toggle")} · ${pendingTitle}`, "data-pending-open": true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BellDot, { className: "h-3.5 w-3.5", "aria-hidden": true }),
        counts.mine > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-[1rem] rounded-full bg-accent-orange px-1 text-center font-mono text-[10px] font-semibold leading-4 tabular-nums text-white", "aria-hidden": true, children: counts.mine })
      ] }),
      !tight && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$2, "bg-bg-secondary/90 ring-1 ring-inset ring-border", goalsOpen && on), "aria-pressed": goalsOpen, onClick: toggleGoals, title: t2("goalsView.openHint"), "aria-label": iconOnly ? t2("goalsView.open") : void 0, "data-workbench-goals-open": true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ListChecks, { className: "h-3.5 w-3.5", "aria-hidden": true }),
        !iconOnly && t2("goalsView.open")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("relative", tight ? "min-w-0 shrink" : "shrink-0"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted", "aria-hidden": true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            className: cn(field, "min-w-[5rem] rounded-full pl-7", density === "full" ? "w-40" : "w-36"),
            value: query,
            onChange: (e) => setQuery(e.target.value),
            onKeyDown: (e) => e.key === "Escape" && setQuery(""),
            placeholder: t2("canvas.search.placeholder"),
            "aria-label": t2("canvas.search.placeholder")
          }
        ),
        query.trim() && /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "absolute left-0 top-9 z-40 w-80 overflow-hidden rounded-xl bg-bg-secondary py-1 shadow-xl ring-1 ring-inset ring-border", children: [
          results.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "px-3 py-2 text-xs text-text-muted", children: t2("canvas.search.empty") }),
          results.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-1 px-2 py-1 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate px-1 text-text-primary", title: n.title, children: n.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$2, onClick: () => {
              setQuery("");
              props.onLocate(n.id);
            }, title: t2("canvas.search.locate"), "aria-label": t2("canvas.search.locate"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crosshair, { className: "h-3.5 w-3.5", "aria-hidden": true }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: btn$2, disabled: n.pinned, onClick: () => {
              setQuery("");
              props.onPin(n);
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "h-3.5 w-3.5", "aria-hidden": true }),
              t2(n.pinned ? "canvas.search.pinned" : "canvas.search.pin")
            ] })
          ] }, n.id)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "border-t border-border/60 px-1 pt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: btn$2, onClick: () => setQuery(""), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5", "aria-hidden": true }),
            t2("canvas.search.clear")
          ] }) })
        ] })
      ] })
    ] })
  );
}
const CanvasToolbar = reactExports.memo(CanvasToolbarImpl);
const noop = () => {
};
const CanvasActionsContext = reactExports.createContext({
  openNode: noop,
  startConnect: noop,
  updateGroup: noop,
  removeGroup: noop,
  dispatchIdea: noop,
  deleteIdea: noop,
  editIdea: noop,
  tagIdea: noop,
  resizeIdea: noop,
  openGroupHistory: noop,
  newSessionInGroup: noop
});
const CanvasNowContext = reactExports.createContext(0);
const GROUP_HEADER_H = 34;
const GROUP_PAD = 16;
const NODE_GAP = 14;
const DEFAULT_NODE_SIZE = { w: CANVAS_NODE_W, h: CANVAS_NODE_H };
function groupHistoryKey(group) {
  if (group.kind === "project") return group.projectKey ?? null;
  return group.kind === "work" ? group.id : null;
}
function groupAt(point, groups) {
  let best = null;
  for (const g of groups) {
    if (g.collapsed) continue;
    if (point.x < g.x || point.x > g.x + g.w || point.y < g.y || point.y > g.y + g.h) continue;
    if (!best || g.w * g.h < best.w * best.h) best = g;
  }
  return best;
}
function tidyLayout(layout, groups, nodes, sizes) {
  let next = layout;
  for (const g of groups) {
    if (g.collapsed) continue;
    const members = nodes.filter((n) => n.groupId === g.id && !n.hidden && !isLooseNote$1(n.id, g.id)).sort(isUserIntentGroup(g.kind) ? (a, b) => a.y - b.y || a.x - b.x : compareGroupMembers);
    if (members.length === 0) continue;
    const sizeOf = (n) => sizes[n.id] ?? DEFAULT_NODE_SIZE;
    const colW = Math.max(...members.map((n) => sizeOf(n).w));
    const cols = Math.max(1, Math.floor((g.w - GROUP_PAD * 2 + NODE_GAP) / (colW + NODE_GAP)));
    let y = g.y + GROUP_HEADER_H;
    for (let i = 0; i < members.length; i += cols) {
      const row = members.slice(i, i + cols);
      row.forEach((n, j) => {
        next = moveNode(next, n.id, g.x + GROUP_PAD + j * (colW + NODE_GAP), y, g.id);
      });
      y += Math.max(...row.map((n) => sizeOf(n).h)) + NODE_GAP;
    }
    const used = Math.min(cols, members.length);
    const w = isUserIntentGroup(g.kind) ? Math.max(g.w, GROUP_PAD * 2 + colW) : GROUP_PAD * 2 + used * (colW + NODE_GAP) - NODE_GAP;
    next = upsertGroup(next, { ...g, w, h: y - g.y - NODE_GAP + GROUP_PAD });
  }
  const ids = new Set(groups.map((g) => g.id));
  return separateGroups(next, next.groups.filter((g) => ids.has(g.id)).sort(readingOrder));
}
const isLooseNote$1 = (id, groupId) => groupId === CANVAS_GROUP_OTHER && /^(idea|inbox):/.test(id);
const readingOrder = (a, b) => a.y - b.y || a.x - b.x;
function expandGroup(layout, group, groups) {
  const next = setGroupCollapsed(layout, group, false);
  if (!isFixedGroup(group)) return next;
  const others = groups.filter((g) => g.id !== group.id && isFixedGroup(g)).sort(readingOrder);
  return separateGroups(next, [{ ...group, collapsed: false }, ...others]);
}
function separateFixedGroups(layout, groups) {
  return separateGroups(layout, groups.filter(isFixedGroup).sort(readingOrder));
}
function fixedGroupsOverlap(groups) {
  const boxes = groups.filter(isFixedGroup).map((g) => ({ ...g, h: g.collapsed ? GROUP_HEADER_H : g.h }));
  return boxes.some((a, i) => boxes.some((b, j) => j > i && overlaps(a, b)));
}
const GROUP_GAP = 40;
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function separateGroups(layout, order) {
  let next = layout;
  const placed = [];
  for (const g of [...order.filter((o) => o.locked), ...order.filter((o) => !o.locked)]) {
    const box = { ...g, h: g.collapsed ? GROUP_HEADER_H : g.h };
    for (let hit = placed.find((p) => overlaps(p, box)); hit; hit = placed.find((p) => overlaps(p, box))) {
      const right = hit.x + hit.w + GROUP_GAP - box.x;
      const down = hit.y + hit.h + GROUP_GAP - box.y;
      if (box.y >= hit.y && down < right) box.y += down;
      else box.x += right;
    }
    placed.push(box);
    const dx = box.x - g.x;
    const dy = box.y - g.y;
    const saved = next.groups.find((s) => s.id === g.id);
    if (!dx && !dy || !saved) continue;
    next = upsertGroup(next, { ...saved, x: box.x, y: box.y });
    for (const [id, n] of Object.entries(next.nodes)) if (n.groupId === g.id && !isLooseNote$1(id, g.id)) next = moveNode(next, id, n.x + dx, n.y + dy);
  }
  return next;
}
const hits = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function settleDroppedGroup(box, others) {
  if (!others.some((o) => hits(o, box))) return { x: box.x, y: box.y };
  const cands = [];
  for (const o of others) {
    cands.push(
      { x: box.x, y: o.y + o.h + GROUP_GAP },
      { x: box.x, y: o.y - box.h - GROUP_GAP },
      { x: o.x + o.w + GROUP_GAP, y: box.y },
      { x: o.x - box.w - GROUP_GAP, y: box.y }
    );
  }
  let best = null;
  let bestD = Infinity;
  for (const c of cands) {
    const d = Math.hypot(c.x - box.x, c.y - box.y);
    if (d < bestD && !others.some((o) => hits(o, { ...box, ...c }))) {
      best = c;
      bestD = d;
    }
  }
  return best ?? { x: box.x, y: Math.max(...others.map((o) => o.y + o.h)) + GROUP_GAP };
}
const CANVAS_GROUP_NODE_TYPE = "canvasGroup";
const CANVAS_EDGE_TYPE = "canvasEdge";
const CANVAS_IDEA_W = 200;
const CANVAS_IDEA_MIN = { w: 160, h: 80 };
const isGroupFlowNode = (n) => n.type === CANVAS_GROUP_NODE_TYPE;
const jsonCache = /* @__PURE__ */ new WeakMap();
function sig(v) {
  let s = jsonCache.get(v);
  if (s === void 0) {
    s = JSON.stringify(v);
    jsonCache.set(v, s);
  }
  return s;
}
const same = (a, b) => a === b || sig(a) === sig(b);
const BAND_PAD = 6;
function familyBands(model) {
  const boxes = /* @__PURE__ */ new Map();
  for (const n of model.nodes) {
    if (!n.familyId || n.hidden) continue;
    const key = `${n.groupId}|${n.familyId}`;
    const b = boxes.get(key) ?? { groupId: n.groupId, x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, n: 0 };
    b.x0 = Math.min(b.x0, n.x);
    b.y0 = Math.min(b.y0, n.y);
    b.x1 = Math.max(b.x1, n.x + CANVAS_NODE_W);
    b.y1 = Math.max(b.y1, n.y + canvasNodeHeight(n));
    b.n++;
    boxes.set(key, b);
  }
  const groups = new Map(model.groups.map((g) => [g.id, g]));
  const out = /* @__PURE__ */ new Map();
  for (const [key, b] of boxes) {
    const g = groups.get(b.groupId);
    if (!g || b.n < 2) continue;
    out.set(g.id, [...out.get(g.id) ?? [], { id: key, x: b.x0 - g.x - BAND_PAD, y: b.y0 - g.y - BAND_PAD, w: b.x1 - b.x0 + BAND_PAD * 2, h: b.y1 - b.y0 + BAND_PAD * 2 }]);
  }
  return out;
}
function groupNode(group, summary, families, prev) {
  const h = group.collapsed ? GROUP_HEADER_H : group.h;
  if (prev && isGroupFlowNode(prev) && prev.position.x === group.x && prev.position.y === group.y && prev.width === group.w && prev.height === h && same(prev.data.group, group) && (prev.data.summary === summary || !!prev.data.summary && !!summary && same(prev.data.summary, summary)) && JSON.stringify(prev.data.families) === JSON.stringify(families)) return prev;
  return {
    id: group.id,
    type: CANVAS_GROUP_NODE_TYPE,
    position: { x: group.x, y: group.y },
    width: group.w,
    height: h,
    zIndex: -1,
    dragHandle: ".wb-group-head",
    selected: prev?.selected,
    data: { group, summary, families }
  };
}
function canvasNode(node, data, hidden, prev) {
  if (prev && !isGroupFlowNode(prev) && prev.position.x === node.x && prev.position.y === node.y && !!prev.hidden === hidden && prev.data.faded === data.faded && prev.data.projectLabel === data.projectLabel && prev.data.replaying === data.replaying && same(prev.data.node, node)) return prev;
  return {
    id: node.id,
    type: node.kind,
    position: { x: node.x, y: node.y },
    // 便签可拖拽改大小：外框尺寸由数据给，卡片铺满外框（canvasNodes.css）
    ...node.kind === "idea" ? { width: node.size?.w ?? CANVAS_IDEA_W, height: canvasNodeHeight(node) } : {},
    hidden,
    selected: prev?.selected,
    measured: prev?.measured,
    data: { node, ...data }
  };
}
function buildFlowNodes(model, view, prev = /* @__PURE__ */ new Map()) {
  const groupsById = new Map(model.groups.map((g) => [g.id, g]));
  const bands = familyBands(model);
  const visibleGroups = model.nodes.length ? model.groups : model.groups.filter(g => g.kind === "user" || g.kind === "work");
  const out = visibleGroups.map((g) => groupNode(g, model.summaries[g.id] ?? null, bands.get(g.id) ?? [], prev.get(g.id)));
  for (const n of model.nodes) {
    const group = groupsById.get(n.groupId);
    const lit = view.replay ? view.replay.lit[n.id] : void 0;
    const shown = lit ? { ...n, status: lit } : n;
    out.push(canvasNode(
      shown,
      {
        faded: view.replay ? !lit : !isNodeLit(n, view.filter, view.membership),
        // 节点就在自己的项目框里时框标题已说明，不重复；在「待处理」等别的框里才标项目
        projectLabel: n.project && !(group?.kind === "project" && group.projectKey === n.project.key) ? n.project.title : null,
        replaying: !!view.replay
      },
      n.hidden === true || group?.collapsed === true && !isLooseNote(n),
      prev.get(n.id)
    ));
  }
  return out;
}
const isLooseNote = (n) => (n.kind === "idea" || n.kind === "inbox") && n.groupId === CANVAS_GROUP_OTHER;
function buildFlowEdges(model, pulses, focus) {
  const ids = new Set(model.nodes.map((n) => n.id));
  return model.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((edge) => ({
    id: edge.id,
    type: CANVAS_EDGE_TYPE,
    source: edge.source,
    target: edge.target,
    // 用户线、监控线可选中删除（监控线删除 = 解除监控，见 CanvasBoard.onDelete）
    selectable: edge.kind === "user" || edge.kind === "watches",
    deletable: edge.kind === "user" || edge.kind === "watches",
    data: { edge, pulse: pulses[edge.id] ?? 0, faded: !!focus && !(focus.has(edge.source) && focus.has(edge.target)) }
  }));
}
function finishedRuns(prev, nodes) {
  const done = /* @__PURE__ */ new Set(["succeeded", "partial", "failed"]);
  return nodes.filter((n) => prev.get(n.id) === "running" && done.has(n.status)).map((n) => n.id);
}
const selectZoomTier$1 = (s) => zoomTier(s.transform[2]);
function CanvasGroupFrameImpl({ data, selected }) {
  const { t: t2, i18n } = useTranslation("workbench");
  const actions = reactExports.useContext(CanvasActionsContext);
  const { group, summary, families } = data;
  const [draft, setDraft] = reactExports.useState(null);
  const tier = useStore(selectZoomTier$1);
  const copy = canvasCopyFor(i18n.language);
  const empty = (group.kind === "attention" || group.kind === "workflows") && summary?.count === 0;
  const work = group.kind === "work";
  const workStrip = work && !summary?.count && group.h <= GROUP_HEADER_H + 60;
  const summaryText = empty ? group.kind === "workflows" ? copy.workflowsEmpty : copy.attentionEmpty : workStrip ? t2("canvas.group.workEmpty") : formatGroupSummary(summary ?? void 0, copy);
  const needsYou = (summary?.needsYou ?? 0) > 0;
  const renamable = isUserIntentGroup(group.kind) || group.kind === "project";
  const userEmpty = isUserIntentGroup(group.kind) && !group.collapsed && !summary?.count && !workStrip;
  const style = work && group.color ? { "--wg-color": WORK_GROUP_HEX[group.color] } : void 0;
  const commit = () => {
    const title = draft?.trim();
    setDraft(null);
    if (title && title !== group.title) actions.updateGroup({ ...group, title });
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setDraft(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `wb-group kind-${group.kind}${group.collapsed ? " is-collapsed" : ""}${selected ? " is-selected" : ""}${empty ? " is-empty" : ""} zt-${tier}`, style, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      NodeResizer,
      {
        isVisible: selected && !group.collapsed && isUserIntentGroup(group.kind),
        minWidth: 260,
        minHeight: GROUP_HEADER_H + 60,
        lineClassName: "wb-group-resize-line",
        handleClassName: "wb-group-resize-handle",
        onResizeEnd: (_, p) => actions.updateGroup({ ...group, x: p.x, y: p.y, w: p.width, h: p.height })
      }
    ),
    !group.collapsed && families?.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wb-family-band", "aria-hidden": true, style: { left: b.x, top: b.y, width: b.w, height: b.h } }, b.id)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wb-group-head", style: { height: GROUP_HEADER_H }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "wb-group-btn nodrag",
          "aria-label": t2(group.collapsed ? "canvas.group.expand" : "canvas.group.collapse"),
          title: t2(group.collapsed ? "canvas.group.expand" : "canvas.group.collapse"),
          onClick: () => actions.updateGroup({ ...group, collapsed: !group.collapsed }),
          children: group.collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5" })
        }
      ),
      draft !== null ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          autoFocus: true,
          className: "wb-group-input nodrag",
          value: draft,
          "aria-label": t2("canvas.group.rename"),
          onChange: (e) => setDraft(e.target.value),
          onBlur: commit,
          onKeyDown
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "wb-group-title", title: renamable ? t2("canvas.group.renameHint") : void 0, onDoubleClick: renamable ? () => setDraft(group.title) : void 0, children: group.title }),
      group.locked && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "wb-group-lock", role: "img", title: t2("canvas.group.locked"), "aria-label": t2("canvas.group.locked"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3 w-3", "aria-hidden": true }) }),
      summaryText && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `wb-group-summary${needsYou ? " is-needs" : ""}`, children: summaryText }),
      groupHistoryKey(group) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "wb-group-btn wb-group-history nodrag",
          "aria-label": t2("canvas.group.history"),
          title: t2("canvas.group.history"),
          onClick: () => actions.openGroupHistory(group),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-3.5 w-3.5" })
        }
      ),
      work && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "wb-group-btn wb-group-add nodrag",
          "aria-label": t2("canvas.group.newSession"),
          title: t2("canvas.group.newSession"),
          onClick: () => actions.newSessionInGroup(group),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" })
        }
      ),
      group.kind === "user" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "wb-group-btn wb-group-remove nodrag",
          "aria-label": t2("canvas.group.remove"),
          title: t2("canvas.group.remove"),
          onClick: () => actions.removeGroup(group.id),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" })
        }
      )
    ] }),
    userEmpty && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "wb-group-empty-hint", children: t2(work ? "canvas.group.workEmptyHint" : "canvas.group.emptyHint") })
  ] });
}
const CanvasGroupFrame = reactExports.memo(CanvasGroupFrameImpl);
const EDGE_PULSE_MS = 1200;
function CanvasFlowEdgeViewImpl({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const kind = data?.edge.kind ?? "user";
  const pulse = data?.pulse ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BaseEdge,
      {
        id,
        path,
        className: `wb-edge kind-${kind}${data?.edge.active ? " is-active" : ""}${selected ? " is-selected" : ""}${data?.faded ? " is-faded" : ""}`,
        interactionWidth: kind === "user" || kind === "watches" ? 16 : 0
      }
    ),
    pulse > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { r: 3.5, className: "wb-edge-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("animateMotion", { dur: `${EDGE_PULSE_MS}ms`, repeatCount: "1", fill: "freeze", path }) }, pulse)
  ] });
}
const CanvasFlowEdgeView = reactExports.memo(CanvasFlowEdgeViewImpl);
const CONFIRM_MS = 3e3;
function nextIdeaTag(current) {
  const i = CANVAS_IDEA_TAGS.indexOf(current);
  return i < 0 ? CANVAS_IDEA_TAGS[0] : CANVAS_IDEA_TAGS[i + 1] ?? null;
}
const useIdeaEditStore = create(() => ({ editingId: null }));
function IdeaEditor({ node, onDone }) {
  const { t: t2 } = useTranslation("workbench");
  const actions = reactExports.useContext(CanvasActionsContext);
  const [text, setText] = reactExports.useState(node.text ?? node.title);
  const save = () => {
    if (text.trim()) actions.editIdea(node, text);
    onDone();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wb-idea-editor nodrag nopan nowheel", role: "dialog", "aria-label": t2("canvas.idea.edit"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        autoFocus: true,
        rows: 7,
        value: text,
        onChange: (e) => setText(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onDone();
          }
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            save();
          }
        },
        placeholder: t2("canvas.idea.editPlaceholder")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wb-idea-editor-bar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("canvas.idea.editHint") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onDone, children: t2("canvas.idea.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "is-primary", disabled: !text.trim(), onClick: save, children: t2("canvas.idea.save") })
    ] })
  ] });
}
function IdeaActionsImpl({ node }) {
  const { t: t2 } = useTranslation("workbench");
  const actions = reactExports.useContext(CanvasActionsContext);
  const busy = useCanvasDockStore((s) => s.busy);
  const editing = useIdeaEditStore((s) => s.editingId === node.id);
  const [confirming, setConfirming] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => window.clearTimeout(id);
  }, [confirming]);
  if (editing) return /* @__PURE__ */ jsxRuntimeExports.jsx(IdeaEditor, { node, onDone: () => useIdeaEditStore.setState({ editingId: null }) });
  const busyTitle = busy ? t2("canvasDock:toast.ideaBusy") : void 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wb-idea-actions nodrag nopan", role: "group", "aria-label": t2("canvas.idea.actions"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => useIdeaEditStore.setState({ editingId: node.id }), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { "aria-hidden": true }),
      t2("canvas.idea.edit")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", title: t2("canvas.idea.tagHint"), onClick: () => actions.tagIdea(node, nextIdeaTag(node.subKind)), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { "aria-hidden": true }),
      node.subKind === "note" ? t2("canvas.idea.tag") : t2(`canvasNodes:subKind.idea.${node.subKind}`)
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: busy, title: busyTitle, onClick: () => actions.dispatchIdea(node, "session"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { "aria-hidden": true }),
      t2("canvas.idea.asSession")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: busy, title: busyTitle, onClick: () => actions.dispatchIdea(node, "goal"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { "aria-hidden": true }),
      t2("canvas.idea.asGoal")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: `wb-idea-delete${confirming ? " is-confirming" : ""}`,
        "aria-label": t2(confirming ? "canvas.idea.confirmDelete" : "canvas.idea.delete"),
        title: t2(confirming ? "canvas.idea.confirmDelete" : "canvas.idea.delete"),
        onClick: () => confirming ? actions.deleteIdea(node) : setConfirming(true),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { "aria-hidden": true }),
          confirming && t2("canvas.idea.confirmDelete")
        ]
      }
    )
  ] });
}
const IdeaActions = reactExports.memo(IdeaActionsImpl);
const selectZoomTier = (s) => zoomTier(s.transform[2]);
const CanvasFlowNodeView = reactExports.memo(function CanvasFlowNodeView2({ data, selected }) {
  const actions = reactExports.useContext(CanvasActionsContext);
  const now = reactExports.useContext(CanvasNowContext);
  const tier = useStore(selectZoomTier);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "target", position: Position.Left, isConnectable: false, className: "wb-anchor" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CanvasNodeCard,
      {
        node: data.node,
        projectLabel: data.projectLabel,
        selected,
        faded: data.faded,
        now,
        peekDisabled: data.replaying,
        zoomTier: tier,
        onOpen: actions.openNode,
        onPortPointerDown: actions.startConnect
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "source", position: Position.Right, isConnectable: false, className: "wb-anchor" }),
    data.node.kind === "idea" && !data.replaying && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        NodeResizer,
        {
          isVisible: selected,
          minWidth: CANVAS_IDEA_MIN.w,
          minHeight: CANVAS_IDEA_MIN.h,
          lineClassName: "wb-group-resize-line",
          handleClassName: "wb-group-resize-handle",
          onResizeEnd: (_, p) => actions.resizeIdea(data.node, p)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(IdeaActions, { node: data.node })
    ] })
  ] });
});
const CANVAS_NODE_TYPES = {
  ...Object.fromEntries(CANVAS_NODE_KINDS.map((k) => [k, CanvasFlowNodeView])),
  [CANVAS_GROUP_NODE_TYPE]: CanvasGroupFrame
};
const CANVAS_EDGE_TYPES = { [CANVAS_EDGE_TYPE]: CanvasFlowEdgeView };
const btn$1 = "inline-flex h-8 short:h-7 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary = cn(btn$1, "border-transparent bg-text-primary text-bg-primary hover:bg-text-primary/90");
const btnStop = cn(btn$1, "border-accent-red/40 text-accent-red hover:bg-accent-red/10");
const STATUS_TONE = {
  running: "bg-accent-green/15 text-accent-green",
  sleeping: "bg-bg-hover text-text-muted",
  queued: "bg-bg-hover text-text-secondary",
  succeeded: "bg-accent-green/15 text-accent-green",
  partial: "bg-accent-yellow/15 text-accent-yellow",
  failed: "bg-accent-red/15 text-accent-red",
  stopped: "bg-bg-hover text-text-muted",
  awaiting: "bg-accent-yellow/20 text-accent-yellow"
};
function StatusChip({ status }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-drawer-status": status, className: `rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[status]}`, children: t2(`status.${status}`) });
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-2 text-xs font-semibold tracking-wide text-text-muted", children: title }),
    children
  ] });
}
function Notice({ text, kind = "error" }) {
  if (!text) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: kind === "error" ? "alert" : "status", className: `mt-2 text-xs ${kind === "error" ? "text-accent-red" : "text-accent-green"}`, children: text });
}
const DRAWER_WIDTH_KEY = "shineai.canvas.drawerWidth";
const DRAWER_MIN_W = 360;
const DRAWER_DEFAULT_W = 420;
const DRAWER_KEY_STEP = 16;
function clampDrawerWidth(width, containerWidth = 0) {
  const max = containerWidth > 0 ? Math.max(DRAWER_MIN_W, containerWidth * 0.7) : Infinity;
  return Math.round(Math.min(max, Math.max(DRAWER_MIN_W, Number.isFinite(width) ? width : DRAWER_DEFAULT_W)));
}
function readDrawerWidth() {
  try {
    const raw = localStorage.getItem(DRAWER_WIDTH_KEY);
    return raw === null ? DRAWER_DEFAULT_W : clampDrawerWidth(Number(raw));
  } catch {
    return DRAWER_DEFAULT_W;
  }
}
const useDrawerWidthStore = create((set) => ({
  width: readDrawerWidth(),
  setWidth: (width) => {
    set({ width });
    try {
      localStorage.setItem(DRAWER_WIDTH_KEY, String(width));
    } catch {
    }
  }
}));
function DrawerFrame({ node, onClose, onBack, backLabel, actions, moreActions, statusMeta, statusOverride, fill = false, tabs, activeTab, onTabChange, kicker, subtitle, children }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  reactExports.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !(e.target instanceof Element && e.target.closest(".xterm")) && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const [moreOpen, setMoreOpen] = reactExports.useState(false);
  const hasMore = !!(actions || moreActions);
  const moreRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e) => !moreRef.current?.contains(e.target) && setMoreOpen(false);
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [moreOpen]);
  const width = useDrawerWidthStore((s) => s.width);
  const commitWidth = useDrawerWidthStore((s) => s.setWidth);
  const [dragWidth, setDragWidth] = reactExports.useState(null);
  const asideRef = reactExports.useRef(null);
  const stopDragRef = reactExports.useRef(null);
  reactExports.useEffect(() => () => stopDragRef.current?.(), []);
  const containerWidth = () => asideRef.current?.offsetParent?.getBoundingClientRect().width ?? 0;
  const onResizePointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const total = containerWidth();
    let last = startWidth;
    setDragWidth(startWidth);
    const move = (ev) => {
      last = clampDrawerWidth(startWidth - (ev.clientX - startX), total);
      setDragWidth(last);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
      stopDragRef.current = null;
      setDragWidth(null);
      commitWidth(last);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    stopDragRef.current = stop;
  };
  const onResizeKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    commitWidth(clampDrawerWidth(width + (e.key === "ArrowLeft" ? DRAWER_KEY_STEP : -DRAWER_KEY_STEP), containerWidth()));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "aside",
    {
      ref: asideRef,
      role: "complementary",
      "aria-label": t2("aria", { title: node.title }),
      "data-canvas-drawer": node.kind,
      className: "absolute bottom-0 right-0 top-0 z-30 flex max-w-full flex-col border-l border-border bg-bg-secondary shadow-2xl",
      style: { width: dragWidth ?? width },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            role: "separator",
            "aria-orientation": "vertical",
            "aria-label": t2("resize"),
            title: t2("resize"),
            tabIndex: 0,
            "data-drawer-resize": true,
            onPointerDown: onResizePointerDown,
            onKeyDown: onResizeKeyDown,
            className: cn(
              "absolute bottom-0 left-0 top-0 z-10 w-1.5 -translate-x-1/2 cursor-col-resize transition-colors hover:bg-accent-blue/60 focus-visible:bg-accent-blue focus-visible:outline-none",
              dragWidth !== null && "bg-accent-blue"
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "relative border-b border-border px-5 pb-3 pt-3 short:pb-2 short:pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, "aria-label": t2("close"), className: "absolute right-3 top-3 short:top-1 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) }),
          hasMore ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              ref: moreRef,
              className: cn("absolute right-11 top-3 short:top-1", moreActions ? "block" : "hidden short:block"),
              onKeyDown: (e) => {
                if (e.key !== "Escape" || !moreOpen) return;
                e.stopPropagation();
                setMoreOpen(false);
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": t2("moreActions"), title: t2("moreActions"), "aria-expanded": moreOpen, onClick: () => setMoreOpen((v) => !v), "data-drawer-more": true, className: "flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-4 w-4" }) }),
                moreOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-9 z-40 flex min-w-40 flex-col gap-1.5 rounded-xl border border-border bg-bg-secondary p-2 shadow-xl", "data-drawer-more-menu": true, children: [
                  actions ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex-col gap-1.5", moreActions ? "hidden short:flex" : "flex"), children: actions }) : null,
                  moreActions
                ] }) : null
              ]
            }
          ) : null,
          onBack ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: onBack, "data-drawer-back": true, className: "mb-1 inline-flex items-center gap-0.5 text-xs text-text-muted hover:text-text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-3.5 w-3.5" }),
            backLabel
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("short:flex short:items-center short:gap-2", hasMore ? "short:pr-[4.75rem]" : "short:pr-8"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 text-xs text-text-muted short:shrink-0", children: kicker ?? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2(node.subKind === "workflow" ? "kind.workflow" : `kind.${node.kind}`) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: statusOverride ?? node.status }),
              statusMeta ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums", "data-drawer-status-meta": true, children: statusMeta }) : null
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: cn("mt-1 text-lg font-semibold leading-snug text-text-primary short:mt-0 short:min-w-0 short:truncate short:pr-0 short:text-base", moreActions ? "pr-[4.75rem]" : "pr-8"), title: node.title, children: node.title })
          ] }),
          subtitle ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate pr-8 short:hidden font-mono text-[11px] text-text-muted", title: subtitle, "data-drawer-subtitle": true, children: subtitle }) : null,
          actions ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2.5 flex flex-wrap gap-1.5 short:hidden", children: actions }) : null,
          tabs?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "tablist", className: "-mb-3 mt-2.5 flex gap-4 short:-mb-2 short:mt-1.5", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": tab.id === activeTab,
              "data-drawer-tab": tab.id,
              onClick: () => onTabChange?.(tab.id),
              className: cn(
                "border-b-2 pb-2 text-xs font-medium outline-none transition-colors focus-visible:text-text-primary",
                tab.id === activeTab ? "border-text-primary text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"
              ),
              children: [
                tab.label,
                tab.dot ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { role: "img", "aria-label": t2("session.tabDot"), className: "ml-1 inline-block h-1.5 w-1.5 rounded-full bg-accent-yellow align-middle", "data-drawer-tab-dot": true }) : null
              ]
            },
            tab.id
          )) }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: fill ? "flex min-h-0 flex-1 flex-col px-5 pb-3 pt-3" : "flex-1 overflow-y-auto px-5 pb-6 pt-4", children })
      ]
    }
  );
}
function useOptimisticStop(stop) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const [stopped, setStopped] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const run = reactExports.useCallback(async () => {
    setStopped(true);
    setError(null);
    const res = await stop();
    if (!res.ok) {
      setStopped(false);
      setError(t2("stopFailed", { message: res.error }));
    }
  }, [stop, t2]);
  return { stopped, error, stop: run };
}
function pendingInteractionOf({ activities, lastActivity, l3Guard, sessionBusy, now }) {
  if (shouldShowPendingPermission(lastActivity)) return { type: "permission", detail: lastActivity?.detail || "" };
  const active = getActiveInteractiveActivity(activities);
  if (!active || !l3ShouldYieldToUser(l3Guard, active, now)) return null;
  const meta = active.metadata ?? {};
  if (active.type === "waiting_ask_question" || active.type === "waiting_plan_approval") {
    if (isInteractiveActivityExpired(active, now)) return null;
    if (active.type === "waiting_ask_question") {
      const questions = meta.questions;
      return questions?.length ? { type: "ask", questions } : null;
    }
    return meta.toolInput ? { type: "plan", toolInput: meta.toolInput } : null;
  }
  if (active.type === "user_question" && !sessionBusy && typeof meta.question === "string") {
    return { type: "question", question: meta.question, options: Array.isArray(meta.options) ? meta.options : [] };
  }
  return null;
}
const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;
const FILE_HEADER_RE = /^(diff --git |index |--- |\+\+\+ |new file mode |deleted file mode |old mode |new mode |similarity index |dissimilarity index |rename from |rename to |copy from |copy to )/;
function parseUnifiedDiff(text) {
  const out = { hunks: [], added: 0, removed: 0, binary: false, notes: [] };
  if (!text) return out;
  const rows = text.split(/\r?\n/);
  if (rows[rows.length - 1] === "") rows.pop();
  let hunk = null;
  let remOld = 0;
  let remNew = 0;
  let counted = false;
  let oldNo = 0;
  let newNo = 0;
  let last = null;
  for (const row of rows) {
    if (row.startsWith("@@")) {
      const m = HUNK_RE.exec(row);
      counted = !!m;
      oldNo = m ? Number(m[1]) : 0;
      newNo = m ? Number(m[3]) : 0;
      remOld = m ? m[2] === void 0 ? 1 : Number(m[2]) : 0;
      remNew = m ? m[4] === void 0 ? 1 : Number(m[4]) : 0;
      hunk = { oldStart: m ? oldNo : null, newStart: m ? newNo : null, header: row, lines: [] };
      out.hunks.push(hunk);
      continue;
    }
    if (row.startsWith("\\")) {
      if (last) last.noNewline = true;
      continue;
    }
    const inHunk = hunk && (counted ? remOld > 0 || remNew > 0 : !row.startsWith("diff --git "));
    const prefix = row[0];
    if (hunk && inHunk && (prefix === "+" || prefix === "-" || prefix === " " || row === "")) {
      const type = prefix === "+" ? "add" : prefix === "-" ? "del" : "ctx";
      const line = {
        type,
        oldNo: counted && type !== "add" ? oldNo++ : null,
        newNo: counted && type !== "del" ? newNo++ : null,
        text: row.slice(1)
      };
      if (type !== "add") remOld--;
      if (type !== "del") remNew--;
      if (type === "add") out.added++;
      if (type === "del") out.removed++;
      hunk.lines.push(line);
      last = line;
      continue;
    }
    hunk = null;
    if (/^Binary files .* differ$/.test(row) || row === "GIT binary patch") {
      out.binary = true;
      continue;
    }
    if (FILE_HEADER_RE.test(row)) continue;
    if (row.trim()) out.notes.push(row.replace(/^#\s*/, ""));
  }
  return out;
}
function segmentHunk(lines, threshold = 8, keep = 3) {
  const out = [];
  const push = (kind, start, end) => {
    if (end <= start) return;
    const prev = out[out.length - 1];
    if (kind === "lines" && prev?.kind === "lines") prev.lines.push(...lines.slice(start, end));
    else out.push({ kind, start, lines: lines.slice(start, end) });
  };
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type !== "ctx") {
      const s2 = i;
      while (i < lines.length && lines[i].type !== "ctx") i++;
      push("lines", s2, i);
      continue;
    }
    const s = i;
    while (i < lines.length && lines[i].type === "ctx") i++;
    const len = i - s;
    if (len <= threshold) {
      push("lines", s, i);
      continue;
    }
    const head = s === 0 ? 0 : keep;
    const tail = i === lines.length ? 0 : keep;
    push("lines", s, s + head);
    push("fold", s + head, i - tail);
    push("lines", i - tail, i);
  }
  return out;
}
const REVIEW_CODE_MAX = 120;
function truncate$1(text, max) {
  const chars = Array.from(text);
  return chars.length > max ? `${chars.slice(0, max).join("")}…` : text;
}
function buildReviewMessage(annotations) {
  const items = annotations.filter((a) => a.comment.trim());
  const lines = [`验收批注（共 ${items.length} 条），请逐条修改后再交回：`];
  items.forEach((a, i) => {
    const where = a.line == null ? "（无行号）" : ` 第 ${a.line} 行（${a.side === "old" ? "旧" : "新"}）`;
    const group = a.group ? `[${a.group}] ` : "";
    const [first, ...rest] = a.comment.trim().split(/\r?\n/);
    lines.push(`${i + 1}. ${group}${a.filePath}${where}：${first}`);
    for (const r of rest) lines.push(`   ${r}`);
    const code = a.code.trim();
    if (code) lines.push(`   > ${truncate$1(code, REVIEW_CODE_MAX)}`);
  });
  return lines.join("\n");
}
const t = (key) => instance.t(`sessionDiff:${key}`);
async function isReadable(path) {
  const readFile = window.shineAI?.fileManager?.readFile;
  if (!readFile) return true;
  try {
    const res = await readFile(path);
    return !!res && (!!res.kind && res.kind !== "error" || !!res.status && res.status !== "error");
  } catch {
    return false;
  }
}
async function openChangeSource(item, line = 1) {
  const ui = useUIStore.getState();
  const candidates = buildSourcePathCandidatesFromLocator(item, item.diffLocator);
  if (candidates.length === 0) return ui.showToast(t(item.changeType === "delete" ? "source.deleted" : "source.noPath"), "error");
  let target = null;
  for (const c of candidates) {
    if (await isReadable(c)) {
      target = c;
      break;
    }
  }
  if (!target) return ui.showToast(t(item.changeType === "delete" ? "source.deleted" : "source.unreadable"), "error");
  try {
    ui.setActiveWorkspace?.("project");
    ui.setProjectSidebarTab("explorer");
    ui.setExplorerView?.("tree");
    ui.setActivePanelLeft("explorer");
    ui.setProjectLeftPaneCollapsed(false);
    ui.setProjectRightPaneCollapsed(false);
    ui.openViewBesideMain("files");
    await useFileTabStore.getState().openFileAtLine(target, Math.max(1, line), 1);
  } catch (err) {
    ui.showToast(err instanceof Error ? err.message : t("source.failed"), "error");
  }
}
const DEFAULT_EXPANDED = 5;
const MAX_CONCURRENT = 4;
const CHANGE_TONE = {
  create: "text-accent-green bg-accent-green/10",
  modify: "text-accent-blue bg-accent-blue/10",
  delete: "text-accent-red bg-accent-red/10",
  rename: "text-accent-purple bg-accent-purple/10",
  copy: "text-accent-cyan bg-accent-cyan/10"
};
function lineKey(fileKey, h, idx, line) {
  if (line.type === "del" && line.oldNo != null) return `${fileKey}|old|${line.oldNo}`;
  if (line.type !== "del" && line.newNo != null) return `${fileKey}|new|${line.newNo}`;
  return `${fileKey}|h${h}|${idx}`;
}
const errorText = (err) => err instanceof Error ? err.message : String(err);
function SessionDiffPanel({ sessionId, active, resumable }) {
  const { t: t2 } = useTranslation("sessionDiff");
  const [changeSet, setChangeSet] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [loadError, setLoadError] = reactExports.useState(null);
  const [unavailable, setUnavailable] = reactExports.useState(false);
  const [diffs, setDiffs] = reactExports.useState({});
  const [expanded, setExpanded] = reactExports.useState(null);
  const [openFolds, setOpenFolds] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [annotations, setAnnotations] = reactExports.useState({});
  const [editing, setEditing] = reactExports.useState(null);
  const [sending, setSending] = reactExports.useState(false);
  const [sendError, setSendError] = reactExports.useState(null);
  const generation = reactExports.useRef(0);
  const inflight = reactExports.useRef(/* @__PURE__ */ new Set());
  const load = reactExports.useCallback(async () => {
    const gen = ++generation.current;
    inflight.current = /* @__PURE__ */ new Set();
    const api2 = window.shineAI?.session;
    if (!api2?.getChangeSet) {
      setUnavailable(true);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const cs = await api2.getChangeSet(sessionId);
      if (gen !== generation.current) return;
      setChangeSet(cs ?? null);
      setDiffs({});
    } catch (err) {
      if (gen !== generation.current) return;
      setLoadError(errorText(err));
    } finally {
      if (gen === generation.current) setLoading(false);
    }
  }, [sessionId]);
  reactExports.useEffect(() => {
    if (active) void load();
  }, [active, load]);
  const files = reactExports.useMemo(() => {
    if (!changeSet) return [];
    const aggregate = changeSet.mode === "aggregate";
    return changeSet.groups.flatMap((g) => g.items.map((item) => ({ item, group: aggregate ? g.name : void 0, gid: g.sessionId }))).map(({ item, group, gid }, index2) => ({ key: `${gid}:${item.id}`, index: index2, item, group }));
  }, [changeSet]);
  reactExports.useEffect(() => {
    if (expanded === null && files.length > 0) setExpanded(new Set(files.slice(0, DEFAULT_EXPANDED).map((f) => f.key)));
  }, [files, expanded]);
  reactExports.useEffect(() => {
    const getDiff = window.shineAI?.session?.getChangeDiff;
    if (!expanded) return;
    const pending = inflight.current;
    const gen = generation.current;
    for (const f of files) {
      if (pending.size >= MAX_CONCURRENT) break;
      if (!expanded.has(f.key) || diffs[f.key] || pending.has(f.key)) continue;
      if (!getDiff) {
        setDiffs((d) => ({ ...d, [f.key]: { status: "error", error: t2("diffUnavailable") } }));
        continue;
      }
      pending.add(f.key);
      setDiffs((d) => ({ ...d, [f.key]: { status: "loading" } }));
      getDiff(f.item.diffLocator).then((text) => ({ status: "ok", parsed: parseUnifiedDiff(text) })).catch((err) => ({ status: "error", error: errorText(err) })).then((state) => {
        pending.delete(f.key);
        if (gen === generation.current) setDiffs((d) => ({ ...d, [f.key]: state }));
      });
    }
  }, [files, expanded, diffs, t2]);
  const totals = reactExports.useMemo(() => {
    let added = 0;
    let removed = 0;
    let counted = 0;
    for (const f of files) {
      const d = diffs[f.key];
      if (d?.status !== "ok") continue;
      added += d.parsed.added;
      removed += d.parsed.removed;
      counted++;
    }
    return { added, removed, counted };
  }, [files, diffs]);
  const toggle = (key) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const startEdit = (key) => {
    setEditing({ key, draft: annotations[key]?.comment ?? "" });
    setSendError(null);
  };
  const commitEdit = (file, h, idx, line) => {
    if (!editing) return;
    const comment = editing.draft.trim();
    const key = editing.key;
    setAnnotations((prev) => {
      const next = { ...prev };
      if (!comment) delete next[key];
      else next[key] = {
        key,
        fileIndex: file.index,
        order: h * 1e6 + idx,
        filePath: file.item.relativePath || file.item.displayPath || file.item.filePath,
        group: file.group,
        side: line.type === "del" ? "old" : "new",
        line: line.type === "del" ? line.oldNo : line.newNo,
        code: line.text,
        comment
      };
      return next;
    });
    setEditing(null);
  };
  const remove = (key) => setAnnotations((prev) => {
    const next = { ...prev };
    delete next[key];
    return next;
  });
  const annotationList = reactExports.useMemo(
    () => Object.values(annotations).sort((a, b) => a.fileIndex - b.fileIndex || a.order - b.order),
    [annotations]
  );
  const send = async () => {
    if (sending || annotationList.length === 0) return;
    setSending(true);
    setSendError(null);
    const res = await (resumable ? resumeAndReply : replyToSession)(sessionId, buildReviewMessage(annotationList));
    setSending(false);
    if (!res.ok) return setSendError(t2("sendFailed", { message: res.error }));
    setAnnotations({});
    setEditing(null);
    useUIStore.getState().showToast(t2("sent"), "success");
  };
  const renderLine = (file, h, idx, line) => {
    const key = lineKey(file.key, h, idx, line);
    const note = annotations[key];
    const isEditing = editing?.key === key;
    const onKeyDown = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        commitEdit(file, h, idx, line);
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        setEditing(null);
      }
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: cn(
            "group/line relative flex font-mono text-[11px] leading-5",
            line.type === "add" && "bg-accent-green/10",
            line.type === "del" && "bg-accent-red/10"
          ),
          "data-diff-line": line.type,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded bg-accent-blue text-white opacity-0 focus-visible:opacity-100 group-hover/line:opacity-100",
                "aria-label": t2("addComment"),
                title: t2("addComment"),
                onClick: () => startEdit(key),
                "data-diff-annotate": true,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-10 shrink-0 select-none pr-1 text-right text-text-muted", children: line.oldNo ?? "" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-10 shrink-0 select-none pr-1 text-right text-text-muted", children: line.newNo ?? "" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("w-4 shrink-0 select-none text-center", line.type === "add" ? "text-accent-green" : line.type === "del" ? "text-accent-red" : "text-text-muted"), children: line.type === "add" ? "+" : line.type === "del" ? "-" : " " }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1 whitespace-pre-wrap break-all pr-2 text-text-primary", children: [
              line.text,
              line.noNewline && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 select-none text-text-muted", title: t2("noNewline"), children: "⊘" })
            ] })
          ]
        }
      ),
      isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-y border-border bg-bg-secondary px-3 py-2", "data-diff-editor": true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            autoFocus: true,
            rows: 2,
            className: "w-full resize-y rounded-md border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent-blue",
            placeholder: t2("placeholder"),
            value: editing.draft,
            onChange: (e) => setEditing({ key, draft: e.target.value }),
            onKeyDown
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => setEditing(null), children: t2("cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: !editing.draft.trim() && !note, onClick: () => commitEdit(file, h, idx, line), children: note ? t2("save") : t2("add") })
        ] })
      ] }) : note ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 border-y border-accent-blue/30 bg-accent-blue/5 px-3 py-1.5 text-xs", "data-diff-note": true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "min-w-0 flex-1 whitespace-pre-wrap break-words text-text-primary", children: note.comment }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-text-muted hover:text-text-primary", "aria-label": t2("edit"), title: t2("edit"), onClick: () => startEdit(key), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-text-muted hover:text-accent-red", "aria-label": t2("delete"), title: t2("delete"), onClick: () => remove(key), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] }) : null
    ] }, key);
  };
  const renderBody = (file) => {
    const d = diffs[file.key];
    if (!d || d.status === "loading") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
        t2("diffLoading")
      ] });
    }
    if (d.status === "error") return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-2 text-xs text-accent-red", children: t2("diffFailed", { message: d.error }) });
    const { parsed } = d;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      parsed.notes.map((n, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-1 text-xs text-text-muted", children: n }, i)),
      parsed.binary && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-2 text-xs text-text-muted", children: t2("binary") }),
      !parsed.binary && parsed.hunks.length === 0 && parsed.notes.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-2 text-xs text-text-muted", children: t2("noDiff") }),
      parsed.hunks.map((hunk, h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "select-none truncate bg-bg-hover px-3 font-mono text-[11px] leading-5 text-text-muted", children: hunk.header }),
        segmentHunk(hunk.lines).map((seg) => {
          const foldKey = `${file.key}|${h}|${seg.start}`;
          if (seg.kind === "fold" && !openFolds.has(foldKey)) {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "block w-full bg-bg-hover/60 px-3 text-left font-mono text-[11px] leading-5 text-accent-blue hover:bg-bg-hover",
                onClick: () => setOpenFolds((prev) => new Set(prev).add(foldKey)),
                "data-diff-fold": true,
                children: t2("folded", { count: seg.lines.length })
              },
              foldKey
            );
          }
          return seg.lines.map((line, i) => renderLine(file, h, seg.start + i, line));
        })
      ] }, h))
    ] });
  };
  if (unavailable) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-5 py-6 text-center text-xs text-text-muted", children: t2("unavailable") });
  if (!changeSet) {
    return loadError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-5 py-6 text-center text-xs text-accent-red", children: t2("loadFailed", { message: loadError }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center justify-center gap-1.5 px-5 py-6 text-xs text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
      t2("loading")
    ] });
  }
  let lastGroup;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-0 flex-col", "data-session-diff": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-2 border-b border-border px-5 py-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-text-primary", children: t2("summary", { count: files.length }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-accent-green", children: [
        "+",
        totals.added
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-accent-red", children: [
        "−",
        totals.removed
      ] }),
      totals.counted < files.length && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", title: t2("partialHint"), children: t2("partial", { counted: totals.counted, total: files.length }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ml-auto text-text-muted hover:text-text-primary disabled:opacity-40", disabled: loading, "aria-label": t2("refresh"), title: t2("refresh"), onClick: () => void load(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: cn("h-3.5 w-3.5", loading && "animate-spin") }) })
    ] }),
    loadError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "shrink-0 px-5 py-1 text-xs text-accent-red", children: t2("loadFailed", { message: loadError }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto", children: [
      files.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-5 py-6 text-center text-xs text-text-muted", children: t2("empty") }),
      files.map((file) => {
        const open = !!expanded?.has(file.key);
        const d = diffs[file.key];
        const showGroup = file.group !== void 0 && file.group !== lastGroup;
        lastGroup = file.group;
        const path = file.item.displayPath || file.item.relativePath || file.item.filePath;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
          showGroup && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bg-secondary px-5 py-1 text-[11px] font-semibold text-text-muted", children: file.group }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "border-b border-border", "data-diff-file": path, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-[1] flex items-center gap-2 bg-bg-primary px-3 py-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "flex min-w-0 flex-1 items-center gap-1.5 text-left", "aria-expanded": open, onClick: () => toggle(file.key), children: [
                open ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5 shrink-0 text-text-muted" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5 shrink-0 text-text-muted" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("shrink-0 rounded px-1.5 text-[10px] leading-4", CHANGE_TONE[file.item.changeType] ?? "bg-bg-hover text-text-muted"), children: t2(`changeType.${file.item.changeType}`, { defaultValue: t2("changeType.unknown") }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-mono text-xs text-text-primary", title: path, children: path })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 font-mono text-[11px]", children: d?.status === "ok" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-accent-green", children: [
                  "+",
                  d.parsed.added
                ] }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-accent-red", children: [
                  "−",
                  d.parsed.removed
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "shrink-0 text-text-muted hover:text-text-primary",
                  "aria-label": t2("openSource"),
                  title: t2("openSource"),
                  onClick: () => {
                    const first = d?.status === "ok" ? d.parsed.hunks[0]?.newStart : null;
                    void openChangeSource(file.item, first || 1);
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3.5 w-3.5" })
                }
              )
            ] }),
            open && renderBody(file)
          ] })
        ] }, file.key);
      })
    ] }),
    (annotationList.length > 0 || sendError) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 border-t border-border bg-bg-primary px-5 py-2", "data-diff-sendbar": true, children: [
      sendError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "mb-1.5 text-xs text-accent-red", children: sendError }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-secondary", children: t2("annotationCount", { count: annotationList.length }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btnPrimary, "ml-auto"), disabled: sending || annotationList.length === 0, onClick: () => void send(), "data-diff-send": true, children: sending ? t2("sending") : t2("send") })
      ] })
    ] })
  ] });
}
const normalizeDir = (p) => p.trim().replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
function findDirTerminal(tabs, cwd) {
  const dir = normalizeDir(cwd);
  return tabs.filter((tab) => tab.exitCode === void 0 && normalizeDir(tab.cwd) === dir).pop();
}
function SessionTerminal({ cwd }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const tab = useShellTerminalStore((s) => cwd ? findDirTerminal(s.tabs, cwd) : void 0);
  const [starting, setStarting] = reactExports.useState(false);
  const [attempt2, setAttempt] = reactExports.useState(0);
  reactExports.useEffect(() => {
    if (!cwd || findDirTerminal(useShellTerminalStore.getState().tabs, cwd)) return;
    let cancelled = false;
    setStarting(true);
    void useShellTerminalStore.getState().createTab(void 0, cwd).finally(() => !cancelled && setStarting(false));
    return () => {
      cancelled = true;
    };
  }, [cwd, attempt2]);
  if (!cwd) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("sessionTabs.terminalNoDir") });
  if (!tab) {
    return starting ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("sessionTabs.terminalStarting") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", role: "status", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("sessionTabs.terminalNotOpen") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => setAttempt((n) => n + 1), children: t2("sessionTabs.terminalOpen") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col gap-1.5", "data-drawer-terminal": tab.id, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "shrink-0 truncate text-[11px] text-text-muted", title: tab.cwd, children: t2("sessionTabs.terminalHint", { cwd: tab.cwd }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-hidden rounded-xl bg-bg-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShellTerminalView, { ptyId: tab.id }) })
  ] });
}
const RECENT = 6;
const MAX_TOOLS = 3;
function ReviewTimeline({ rounds, onJump, autoOpenLatest = true }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const [showAll, setShowAll] = reactExports.useState(false);
  const [toggled, setToggled] = reactExports.useState({});
  if (rounds.length === 0) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("review.timeline.empty") });
  const latestDone = !autoOpenLatest || rounds.some((r) => r.inProgress) ? void 0 : [...rounds].reverse().find((r) => r.reply)?.startMessageId;
  const hidden = showAll ? 0 : Math.max(0, rounds.length - RECENT);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-review-timeline": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "relative before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-border", children: rounds.slice(hidden).reverse().map((r) => {
      const canOpen = !r.live?.length && !!r.reply;
      const open = canOpen && (toggled[r.startMessageId] ?? r.startMessageId === latestDone);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onJump(r.startMessageId),
            className: "relative flex w-full flex-col gap-0.5 rounded-lg py-1.5 pl-7 pr-2 text-left outline-none transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-accent-blue",
            "data-review-round": r.index,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  "aria-hidden": true,
                  className: cn("absolute left-2 top-[13px] h-2 w-2 rounded-full ring-2 ring-bg-secondary", r.inProgress ? "animate-pulse bg-accent-green" : "bg-text-muted/60")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-baseline gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[11px] tabular-nums text-text-muted", children: t2("review.timeline.round", { n: r.index }) }),
                r.autoTag && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded bg-bg-hover px-1 text-[11px] text-text-muted", children: r.autoTag }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("min-w-0 truncate text-sm", r.autoTag ? "text-text-muted" : "text-text-primary"), title: r.ask, children: r.ask || t2("review.timeline.noAsk") }),
                r.inProgress && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[11px] text-accent-green", children: t2("review.timeline.inProgress") })
              ] }),
              (r.tools.length > 0 || r.filesTouched.length > 0 || r.errorCount > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-wrap gap-x-2 text-[11px] text-text-secondary", children: [
                r.filesTouched.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title: r.filesTouched.join("\n"), children: t2("review.timeline.files", { count: r.filesTouched.length }) }),
                r.errorCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-accent-red", children: t2("review.timeline.errors", { count: r.errorCount }) }),
                r.tools.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-text-muted", children: r.tools.slice(0, MAX_TOOLS).map((tool) => `${tool.name}×${tool.count}`).join(" ") })
              ] }),
              r.live?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(LiveScreen, { lines: r.live }) : r.outcome && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs text-text-muted", title: r.outcome, children: r.outcome })
            ]
          }
        ),
        canOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setToggled((s) => ({ ...s, [r.startMessageId]: !open })),
            className: "ml-7 rounded text-[11px] text-accent-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent-blue",
            "aria-expanded": open,
            "data-review-reply-toggle": true,
            children: t2(open ? "review.timeline.hideReply" : "review.timeline.showReply")
          }
        ),
        open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 ml-7 mt-1 rounded-md border border-border bg-bg-primary/60 px-3 py-2", "data-review-reply": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownRenderer, { content: r.reply, variant: "compact", collapsible: true, collapsedHeight: 320 }) })
      ] }, r.startMessageId);
    }) }),
    hidden > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowAll(true), className: "mt-1 rounded text-xs text-text-muted outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-blue", "data-review-expand": true, children: t2("review.timeline.expand", { count: hidden }) })
  ] });
}
function LiveScreen({ lines }) {
  const seen = /* @__PURE__ */ new Map();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: "mt-1 flex max-h-[7.5rem] flex-col justify-end overflow-hidden rounded-md bg-bg-primary/60 px-2 py-1 font-mono text-[11px] leading-[15px] text-text-secondary [mask-image:linear-gradient(to_bottom,transparent,black_30%)]",
      "data-review-live": true,
      children: lines.map((line, i) => {
        const n = (seen.get(line) ?? 0) + 1;
        seen.set(line, n);
        const last = i === lines.length - 1;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: cn("block truncate", !last && "duration-300 animate-in fade-in slide-in-from-bottom-1", line.startsWith("▸") && "text-text-muted", line.startsWith("✗") && "text-accent-red"),
            children: line
          },
          last ? "last" : `${line}#${n}`
        );
      })
    }
  );
}
function Body({ path, name, sessionId }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const kind = inferProductKind({ path });
  const media = kind === "video" || kind === "audio";
  const [res, setRes] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (media) return;
    let cancelled = false;
    window.shineAI.fileManager.readFile(path, sessionId ? { sessionId } : void 0).then((r) => {
      if (!cancelled) setRes(r);
    }, () => {
      if (!cancelled) setRes("failed");
    });
    return () => {
      cancelled = true;
    };
  }, [path, sessionId, media]);
  if (kind === "video") return /* @__PURE__ */ jsxRuntimeExports.jsx("video", { controls: true, autoPlay: true, src: toPdfPreviewSrc(path), className: "block max-h-[75vh] w-full bg-black" });
  if (kind === "audio") return /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { controls: true, autoPlay: true, src: toPdfPreviewSrc(path), className: "m-6 block w-[calc(100%-3rem)]" });
  if (res === null) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "animate-pulse p-6 text-sm text-text-muted", children: t2("review.artifact.loading") });
  if (res !== "failed" && res.kind === "office") return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-[75vh] flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(OfficePreviewPane, { path, name, office: res.office, size: res.size }) });
  if (res !== "failed" && res.kind === "pdf") return /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { title: name, src: toPdfPreviewSrc(path), className: "block h-[75vh] w-full border-0" });
  if (res !== "failed" && res.kind === "image") return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: toPdfPreviewSrc(path), alt: name, className: "mx-auto block max-h-[75vh] object-contain" });
  if (res !== "failed" && res.kind === "text" && res.status === "success") {
    const ext = /\.([A-Za-z0-9]+)$/.exec(path)?.[1]?.toLowerCase() ?? "";
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownRenderer, { content: `\`\`\`${ext}
${res.content}
\`\`\`` }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-6 text-sm text-text-muted", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t2("review.artifact.cannotPreview") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => void openProduct({ path, action: "system_default" }), children: t2("review.artifact.openSystem") })
  ] });
}
function ArtifactViewerModal({ path, sessionId, onClose }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const name = path.replace(/\\/g, "/").split("/").pop() || path;
  reactExports.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm", onClick: onClose, "data-artifact-viewer": true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "dialog", "aria-label": name, className: "flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-2xl", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "min-w-0 flex-1 truncate text-sm font-semibold text-text-primary", title: path, children: name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => void openProduct({ path, action: "system_default" }), children: t2("review.artifact.openSystem") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => void openProduct({ path, action: "reveal" }), children: t2("workflow.reveal") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": t2("review.artifact.close"), className: "rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { path, name, sessionId }) })
    ] }) }),
    document.body
  );
}
const TEXT_PREVIEW_LINES = 40;
const TEXT_RE = /\.(mdx?|markdown|txt|log|json|jsonc|csv|tsv|ya?ml|rst|[cm]?[jt]sx?|py|go|rs|java|kt|cs|cpp|c|h|sh|ps1|sql|css|scss|vue|svelte|toml|ini)$/i;
const MARKDOWN_RE = /\.(mdx?|markdown)$/i;
const URL_RE = /^https?:\/\//i;
const fileSrc = toPdfPreviewSrc;
function useFileCheck(path, sessionId, enabled) {
  const [state, setState] = reactExports.useState({ text: null, missing: false });
  reactExports.useEffect(() => {
    setState({ text: null, missing: false });
    if (!enabled) return;
    let cancelled = false;
    window.shineAI?.fileManager?.readFile?.(path, sessionId ? { sessionId } : void 0).then((r) => {
      if (cancelled) return;
      if (r?.kind === "error") setState({ text: null, missing: true });
      else if (r?.kind === "text" && r.status === "success") setState({ text: r.content, missing: false });
    }).catch(() => {
      if (!cancelled) setState({ text: null, missing: true });
    });
    return () => {
      cancelled = true;
    };
  }, [path, sessionId, enabled]);
  return state;
}
function LinkCard({ url }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "min-w-0 flex-1 truncate text-left text-xs text-accent-blue hover:underline", title: url, onClick: () => openExternalLink(url), children: url }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => openExternalLink(url), children: t2("review.artifact.openLink") })
  ] });
}
function TextBody({ path, text }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const [expanded, setExpanded] = reactExports.useState(false);
  const lines = text.split(/\r?\n/);
  const clipped = !expanded && lines.length > TEXT_PREVIEW_LINES;
  const shown = clipped ? lines.slice(0, TEXT_PREVIEW_LINES).join("\n") : text;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-96 overflow-auto border-b border-border bg-bg-secondary px-2.5 py-2", children: [
    MARKDOWN_RE.test(path) ? /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownRenderer, { content: shown, variant: "compact" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "whitespace-pre-wrap break-all text-xs text-text-secondary", children: shown }),
    lines.length > TEXT_PREVIEW_LINES ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "mt-1 text-xs text-accent-blue hover:underline", onClick: () => setExpanded((v) => !v), children: expanded ? t2("review.artifact.collapse") : t2("review.artifact.expand", { count: lines.length }) }) : null
  ] });
}
const HOST_PREVIEW_RE = /\.(mdx?|markdown|html?)$/i;
function usesHostPreview(path) {
  return HOST_PREVIEW_RE.test(path) || inferProductKind({ path }) === "image";
}
function ArtifactPreview({ path, sessionId, gallery, foldText }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const [broken, setBroken] = reactExports.useState(false);
  const [viewing, setViewing] = reactExports.useState(false);
  const [peek, setPeek] = reactExports.useState(!foldText);
  const isUrl2 = URL_RE.test(path);
  const isText = !isUrl2 && TEXT_RE.test(path);
  const isPdf = !isUrl2 && isPdfPath(path);
  const { text, missing } = useFileCheck(path, sessionId, isText || isPdf);
  if (isUrl2) return /* @__PURE__ */ jsxRuntimeExports.jsx(LinkCard, { url: path });
  const kind = inferProductKind({ path });
  const name = path.replace(/\\/g, "/").split("/").pop() || path;
  const open = () => kind === "image" ? previewImage(path, gallery) : usesHostPreview(path) ? void openProduct({ path, action: "preview" }) : setViewing(true);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-lg border border-border", children: [
    !broken && kind === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { controls: true, preload: "metadata", src: fileSrc(path), onError: () => setBroken(true), className: "block max-h-64 w-full bg-black" }) : !broken && kind === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: fileSrc(path), alt: name, title: t2("workflow.openFile"), onClick: open, onError: () => setBroken(true), className: "block max-h-64 w-full cursor-zoom-in bg-black object-contain" }) : !broken && kind === "audio" ? /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { controls: true, preload: "metadata", src: fileSrc(path), onError: () => setBroken(true), className: "block w-full px-2.5 pt-2" }) : !peek ? null : isPdf && !missing ? /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { title: name, src: toPdfPreviewSrc(path), className: "block h-80 w-full border-0 border-b border-border bg-bg-secondary" }) : text !== null ? /* @__PURE__ */ jsxRuntimeExports.jsx(TextBody, { path, text }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1.5", children: [
      missing ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-xs text-accent-red", title: path, children: t2("review.artifact.notFound", { path }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-xs text-text-secondary", title: path, children: broken ? t2("workflow.previewFailed", { name }) : name }),
      foldText && (isPdf || text !== null) && !missing && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, "aria-expanded": peek, onClick: () => setPeek((v) => !v), children: t2(peek ? "review.artifact.unpeek" : "review.artifact.peek") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: open, children: t2("workflow.openFile") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => void openProduct({ path, action: "reveal" }), children: t2("workflow.reveal") })
    ] }),
    viewing && /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactViewerModal, { path, sessionId, onClose: () => setViewing(false) })
  ] });
}
const HANDOFF_FORMAT = {
  zh: { title: "交接", summary: "结论", outputs: "产出", verified: "怎么验证的", needsYou: "需要你看", decision: "要你决定", risks: "风险" },
  en: { title: "Handoff", summary: "Summary", outputs: "Outputs", verified: "Verified", needsYou: "Check", decision: "Decide", risks: "Risks" }
};
const ALIASES = { 做了什么: "summary", done: "summary" };
const KEYS = ["summary", "outputs", "verified", "needsYou", "decision", "risks"];
const TEXT_KEYS = ["summary", "verified", "needsYou", "risks"];
const titles = `${HANDOFF_FORMAT.zh.title}|${HANDOFF_FORMAT.en.title}`;
const TITLE_RE = new RegExp(`^\\s*(?:#{2,4}\\s*(?:${titles})|\\*\\*\\s*(?:${titles})\\s*\\*\\*)\\s*[:：]?\\s*$`, "i");
const LABELS = new Map(Object.entries(ALIASES));
for (const lang of [HANDOFF_FORMAT.zh, HANDOFF_FORMAT.en]) {
  for (const key of KEYS) LABELS.set(lang[key].toLowerCase(), key);
}
const ITEM_RE = new RegExp(`^(?:[-*+]\\s+)?(?:\\*\\*)?(${[...LABELS.keys()].join("|")})(?:\\*\\*)?\\s*[:：]\\s*(?:\\*\\*)?(.*)$`, "i");
const SECTION_END_RE = /^\s*(?:#{1,6}\s|-{3,}\s*$|\*{3,}\s*$)/;
const BULLET_RE = /^\s*(?:[-*+]|\d+[.)])\s+/;
const NONE_RE = /^(?:无|没有|暂无|(?:没有|未|暂未)发现(?:风险)?|(?:无|没有|暂无)风险|none|n\/a|-)[。.！!]?$/i;
function locate(lines) {
  let start = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (TITLE_RE.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !SECTION_END_RE.test(lines[end]) && !TITLE_RE.test(lines[end])) end++;
  return [start, end];
}
function cleanItem(line) {
  return line.replace(BULLET_RE, "").replace(/\[[^\]]*\]\(([^)]+)\)/g, "$1").replace(/`/g, "").trim();
}
const LOCAL_PATH_RE = /^((?:[A-Za-z]:[\\/]|\/|~[\\/]|\\\\)[^\n]*?\.[A-Za-z0-9]{1,8})(?=$|[\s（(：:，,；;—–])/;
const LINK_RE = /^https?:\/\/\S+/i;
function parseOutputs(lines) {
  return lines.flatMap((l) => cleanItem(l).split(/[；;]\s*/)).map((s) => {
    const v = s.trim();
    return LINK_RE.exec(v)?.[0] ?? LOCAL_PATH_RE.exec(v)?.[1] ?? v;
  }).filter((s) => s && !NONE_RE.test(s));
}
const QUESTION_END_RE = /[？?]\s*$/;
const OPTIONS_HEADER_RE = /^[^？?]{0,20}[:：]$/;
function parseDecision(lines) {
  const question = [];
  const options = [];
  let bulletQuestions = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    const item = cleanItem(line);
    const inline = /^(?:选项|options?)\s*[:：]\s*(.+)$/i.exec(item);
    const nested = BULLET_RE.test(line) || /^\s{2,}/.test(line);
    if (inline) options.push(...inline[1].split(/\s*[/｜|]\s*/));
    else if (nested && OPTIONS_HEADER_RE.test(item)) continue;
    else if (nested && QUESTION_END_RE.test(item)) {
      question.push(item);
      bulletQuestions++;
    } else if (nested) options.push(item);
    else question.push(line.trim());
  }
  if (bulletQuestions && question.length > 1) question.forEach((q2, i) => {
    question[i] = `${i + 1}. ${q2}`;
  });
  const q = question.join("\n").trim();
  const opts = options.map((o) => o.trim()).filter(Boolean);
  return q || opts.length ? { question: q, options: opts } : null;
}
function parseHandoff(text) {
  const lines = text.split(/\r?\n/);
  const range = locate(lines);
  if (!range) return null;
  const buf = Object.fromEntries(KEYS.map((k) => [k, []]));
  let current = null;
  for (let i = range[0] + 1; i < range[1]; i++) {
    const m = ITEM_RE.exec(lines[i]);
    if (m) {
      current = LABELS.get(m[1].toLowerCase()) ?? null;
      if (current && m[2].trim()) buf[current].push(m[2]);
    } else if (current) {
      buf[current].push(lines[i]);
    }
  }
  const result = {
    summary: "",
    outputs: parseOutputs(buf.outputs),
    verified: "",
    needsYou: "",
    decision: parseDecision(buf.decision),
    risks: ""
  };
  for (const key of TEXT_KEYS) result[key] = buf[key].join("\n").trim();
  if (NONE_RE.test(result.risks)) result.risks = "";
  return TEXT_KEYS.some((k) => result[k]) || result.outputs.length || result.decision ? result : null;
}
function stripHandoff(text) {
  const lines = text.split(/\r?\n/);
  const range = locate(lines);
  if (!range) return text;
  return [...lines.slice(0, range[0]), ...lines.slice(range[1])].join("\n").trim();
}
function latestReplyBody(rounds) {
  if (rounds.some((r) => r.inProgress)) return "";
  const last = [...rounds].reverse().find((r) => r.reply);
  return last ? stripHandoff(last.reply) : "";
}
const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const CIRCLED_RE = new RegExp(`[${CIRCLED}]`, "g");
function resolveOptionRefs(options, body) {
  const marks = [...new Set(options.join(" ").match(CIRCLED_RE) ?? [])].sort((a, b) => CIRCLED.indexOf(a) - CIRCLED.indexOf(b));
  if (!marks.length) return [];
  const lines = body.split(/\r?\n/).map((l) => l.replace(/^[\s>#*+-]*/, "").replace(/\*\*/g, "").trim());
  return marks.flatMap((m) => {
    const line = lines.find((l) => l.startsWith(m));
    const text = line?.slice(m.length).replace(/^[\s.、:：)）]+/, "").trim();
    return text ? [[m, text]] : [];
  });
}
function pendingText(pending, t2) {
  if (pending.type === "question") return pending.question;
  if (pending.type === "ask") return pending.questions.map((q) => q.question).join("\n");
  if (pending.type === "permission") return pending.detail || t2("session.permissionNeeded");
  return t2("review.decide.plan");
}
function ReviewPanel(props) {
  const { pending, quick, suggestions, childAgentsBusy, canReply, busy, onReply, onAnswer, onGoChat, onGoFiles, rounds, onJump, handoff, onRegenerate, artifacts, sessionId } = props;
  const { t: t2 } = useTranslation("canvasDrawer");
  const images = artifacts.primary.filter((p) => inferProductKind({ path: p }) === "image");
  const [draft, setDraft] = reactExports.useState("");
  const [payload, setPayload] = reactExports.useState(EMPTY_ATTACHMENT_TEXTAREA_PAYLOAD);
  const [inputKey, setInputKey] = reactExports.useState(0);
  const h = handoff.handoff;
  const panelOptions = pending?.type === "question" ? pending.options : [];
  const [answered, setAnswered] = reactExports.useState(null);
  const decision = canReply && !childAgentsBusy && h?.decision !== answered ? h?.decision : null;
  const ask = pending?.type === "ask" ? pending.questions : null;
  const question = ask ? "" : pending ? pendingText(pending, t2) : decision?.question ?? "";
  const suggest = !pending && !childAgentsBusy && !decision?.options.length && canReply && suggestions?.length ? suggestions : null;
  const options = panelOptions.length ? panelOptions : pending ? [] : decision?.options.length ? decision.options : h || suggest ? [] : quick ?? [];
  const needsChat = !!pending && pending.type !== "question" && !ask;
  const send = () => {
    const text = payload.composedValue.trim();
    if (!text || busy) return;
    onReply(text);
    setDraft("");
    setInputKey((k) => k + 1);
  };
  const running = rounds.some((r) => r.inProgress);
  const report = latestReplyBody(rounds);
  const refs = decision && options === decision.options ? resolveOptionRefs(options, [report, h?.summary, h?.needsYou].join("\n")) : [];
  const refTitle = (l) => refs.filter(([m]) => l.includes(m)).map(([m, text]) => `${m} ${text}`).join("\n") || void 0;
  const timeline = /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("review.timelineTitle", { count: rounds.length }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewTimeline, { rounds, onJump, autoOpenLatest: !report }) });
  const handoffRows = [
    ["needsYou", t2("review.handoff.needsYou"), true],
    ["verified", t2("review.handoff.verified"), false],
    ["risks", t2("review.handoff.risks"), true]
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col", "data-drawer-panel": "review", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto pr-1", children: [
      childAgentsBusy && !pending && h?.decision && /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("review.decide.title"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", "data-review-wait-agents": true, children: t2("review.decide.waitAgents") }) }),
      (question || options.length > 0 || ask || needsChat) && /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("review.decide.title"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-xl border border-accent-yellow/40 bg-accent-yellow/5 p-3", "data-review-decide": true, children: [
        question && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-sm font-medium text-text-primary", children: question }),
        refs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-0.5 text-xs text-text-secondary", "data-review-decide-refs": true, children: refs.map(([m, text]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-text-primary", children: m }),
          " ",
          text
        ] }, m)) }),
        ask && /* @__PURE__ */ jsxRuntimeExports.jsx(AskUserQuestionPanel, { questions: ask, onSubmit: onAnswer, disabled: busy }),
        (options.length > 0 || needsChat) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          options.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: refTitle(l), className: cn(btn$1, "h-auto short:h-auto min-h-7 whitespace-normal py-1 text-left"), disabled: busy, onClick: () => {
            if (decision) setAnswered(decision);
            onReply(l);
          }, children: l }, l)),
          needsChat && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, onClick: onGoChat, children: t2("review.decide.goChat") })
        ] })
      ] }) }),
      suggest && /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("review.suggest.title"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", "data-review-suggest": true, children: suggest.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btn$1, "h-auto short:h-auto min-h-7 whitespace-normal py-1 text-left"), disabled: busy, onClick: () => onReply(l), children: l }, l)) }) }),
      running && timeline,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: running && h ? `${t2("review.handoff.title")} · ${t2("review.handoff.previous")}` : t2("review.handoff.title"), children: h ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 text-sm", "data-review-handoff": true, "data-review-handoff-source": handoff.source ?? void 0, children: [
        h.summary && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap rounded-lg bg-bg-hover/60 px-3 py-2 text-text-primary", "data-review-summary": true, children: h.summary }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "space-y-2", children: handoffRows.filter(([k]) => h[k]).map(([k, label, warn]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: cn("text-xs font-medium", warn ? "text-accent-yellow" : "text-text-muted"), children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "whitespace-pre-wrap text-text-primary", children: h[k] })
        ] }, k)) }),
        handoff.source === "ai" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-[11px] text-text-muted", children: [
          t2("review.handoff.aiNote"),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "underline hover:text-text-primary", disabled: handoff.loading, onClick: onRegenerate, children: t2("review.handoff.regenerate") })
        ] })
      ] }) : handoff.loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "animate-pulse text-xs text-text-muted", role: "status", children: t2("review.handoff.generating") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-xs text-text-muted", children: [
        handoff.error ? t2("review.handoff.failed", { error: handoff.error }) : t2("review.handoff.none"),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "underline hover:text-text-primary", onClick: onRegenerate, children: t2("review.handoff.generate") })
      ] }) }),
      report && /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("review.report.title"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-border bg-bg-primary/60 px-3 py-2", "data-review-report": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownRenderer, { content: report, variant: "compact", collapsible: true, collapsedHeight: 480 }) }) }),
      !running && timeline,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: t2("review.output.title", { count: artifacts.primary.length }), children: [
        artifacts.primary.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", "data-review-artifacts": true, children: artifacts.primary.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactPreview, { path: p, sessionId, gallery: images, foldText: true }, p)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("review.output.none") }),
        artifacts.changedFiles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "mt-2 text-xs", "data-review-files": true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-text-muted hover:text-text-primary", children: t2("review.output.changed", { count: artifacts.changedFiles.length }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 space-y-0.5", children: [
            artifacts.changedFiles.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-mono text-text-secondary", title: f, children: f }, f)),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btn$1, "mt-1"), onClick: onGoFiles, children: t2("review.output.viewDiff") })
          ] })
        ] })
      ] })
    ] }),
    canReply && !needsChat && !ask && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-end gap-1.5 border-t border-border pt-2", "data-review-reply": true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AttachmentTextarea,
        {
          value: draft,
          onChange: setDraft,
          onPayloadChange: setPayload,
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          },
          placeholder: t2("review.decide.replyPlaceholder"),
          ariaLabel: t2("review.decide.replyPlaceholder"),
          rows: 1,
          maxRows: 6,
          showUploadButton: true,
          containerClassName: "min-w-0 flex-1 !p-1 bg-bg-primary"
        },
        inputKey
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btn$1, "mb-1"), disabled: busy || !payload.hasContent, onClick: send, children: t2("review.decide.send") })
    ] })
  ] });
}
const ASK_MAX = 60;
const OUTCOME_MAX = 80;
const WRITE_TOOLS = /* @__PURE__ */ new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
function firstLine(text) {
  const line = text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return line.replace(/^(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+)+/, "").replace(/\*\*|__|`/g, "").trim();
}
function firstSentence(text) {
  const line = firstLine(text);
  return line.match(/^.*?(?:[。！？]|[.!?](?=\s|$))/)?.[0] ?? line;
}
function outcomeOf(text) {
  const conclusion = text.match(/^[\s>*+-]*(?:\*\*)?结论(?:\*\*)?[:：]\s*(.+)$/m)?.[1];
  return conclusion ? firstLine(conclusion) : firstSentence(text);
}
const AUTO_TAG = /^\[([^\]\n]{1,12})\]\s*/;
function shortToolName(name) {
  return name.replace(/^mcp__.+?__/, "") || name;
}
function filesOf(m) {
  const files = [];
  if (m.fileChange?.filePath) files.push(m.fileChange.filePath);
  if (m.role !== "tool_use" || !m.toolInput) return files;
  const input = m.toolInput;
  if (m.toolName && WRITE_TOOLS.has(m.toolName)) {
    const p = input.file_path ?? input.notebook_path;
    if (typeof p === "string" && p) files.push(p);
  } else if (m.toolName === "fileChange" && Array.isArray(input.files)) {
    files.push(...input.files.filter((f) => typeof f === "string" && !!f));
  }
  return files;
}
function buildReviewRounds(messages) {
  const rounds = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    cur.round.tools = [...cur.tools].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    cur.round.filesTouched = [...cur.files];
    rounds.push(cur.round);
  };
  for (const m of messages) {
    if (m.isDelta || m.isDiscardDraft || m.isThinking) continue;
    if (m.role === "user" && m.content?.trim()) {
      flush();
      const line = firstLine(parseMessageContentWithImages(m.content).textContent);
      const tag = line.match(AUTO_TAG);
      cur = {
        round: {
          index: rounds.length + 1,
          startMessageId: m.id,
          startedAt: m.timestamp,
          ask: truncate(tag ? line.slice(tag[0].length) : line, ASK_MAX),
          ...tag ? { autoTag: tag[1] } : {},
          tools: [],
          filesTouched: [],
          errorCount: 0,
          outcome: "",
          reply: "",
          inProgress: false
        },
        tools: /* @__PURE__ */ new Map(),
        files: /* @__PURE__ */ new Set()
      };
      continue;
    }
    if (!cur) continue;
    if (m.role === "tool_use" && m.toolName) {
      const name = shortToolName(m.toolName);
      cur.tools.set(name, (cur.tools.get(name) ?? 0) + 1);
    }
    if (m.role === "tool_result" && m.isError) cur.round.errorCount++;
    if (m.role === "assistant" && m.content?.trim()) {
      cur.round.outcome = truncate(outcomeOf(m.content), OUTCOME_MAX);
      cur.round.reply = m.content.trim();
    }
    for (const f of filesOf(m)) cur.files.add(f);
  }
  flush();
  return rounds;
}
const LIVE_LINE_MAX = 120;
const TOOL_ARG_KEYS = ["command", "file_path", "path", "pattern", "query", "url", "tool_name", "skill", "description"];
function toolLine(m) {
  const input = m.toolInput ?? {};
  const arg = TOOL_ARG_KEYS.map((k) => input[k]).find((v) => typeof v === "string" && !!v.trim());
  return `▸ ${shortToolName(m.toolName ?? "")}${arg ? ` ${arg.replace(/\s+/g, " ").trim()}` : ""}`;
}
function liveRoundLines(messages, max = 8) {
  let start = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].content?.trim()) {
      start = i + 1;
      break;
    }
  }
  const lines = [];
  for (const m of messages.slice(start)) {
    if (m.isDiscardDraft || m.isThinking) continue;
    if (m.role === "assistant" && m.content?.trim()) {
      for (const raw of m.content.split("\n")) {
        const l = raw.trim();
        if (l && !l.startsWith("```")) lines.push(l);
      }
    } else if (m.role === "tool_use" && m.toolName) {
      lines.push(toolLine(m));
    } else if (m.role === "tool_result" && m.isError) {
      lines.push(`✗ ${firstLine(m.toolResult || m.content || "") || m.toolName || "error"}`);
    }
  }
  return lines.slice(-max).map((l) => truncate(l, LIVE_LINE_MAX));
}
const MAX_PRIMARY = 8;
const DOC_ARTIFACT_RE = /\.(pdf|mdx?|markdown|html?|docx?|xlsx?|pptx?|odt|ods|odp|wps|et|dps|epub|ofd)$/i;
function toNativePath(p) {
  return p.trim().replace(/^\/([a-z])\//i, (_, d) => `${d.toUpperCase()}:/`);
}
function pathKey(p) {
  return toNativePath(p).replace(/\\/g, "/").replace(/^([a-z]):/i, (_, d) => `${d.toUpperCase()}:`);
}
function isArtifactPath(p) {
  const kind = inferProductKind$1(p);
  return kind === "video" || kind === "audio" || kind === "image" || DOC_ARTIFACT_RE.test(p);
}
function collectArtifacts(input) {
  const seen = /* @__PURE__ */ new Set();
  const primary = [];
  const add = (p) => {
    const key = pathKey(p);
    if (!key || seen.has(key) || primary.length >= MAX_PRIMARY) return;
    seen.add(key);
    primary.push(toNativePath(p));
  };
  input.handoffOutputs.forEach(add);
  input.lastRoundTexts.flatMap((text) => extractLocalFilePaths(text)).filter(isArtifactPath).forEach(add);
  const changedFiles = [];
  for (const p of input.filesTouched) {
    const key = pathKey(p);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    changedFiles.push(p);
  }
  return { primary, changedFiles };
}
function lastRoundTexts(messages) {
  let start = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].content?.trim()) {
      start = i + 1;
      break;
    }
  }
  return messages.slice(start).flatMap((m) => {
    if (m.role === "assistant" && m.content?.trim()) return [m.content];
    if (m.role === "tool_use" && m.toolInput) return Object.values(m.toolInput).filter((v) => typeof v === "string");
    return [];
  });
}
function buildReviewData(messages, opts) {
  const rounds = buildReviewRounds(messages);
  const last = rounds[rounds.length - 1];
  if (last && opts.busy) rounds[rounds.length - 1] = { ...last, inProgress: true, live: liveRoundLines(messages) };
  const lastReply = [...messages].reverse().find((m) => m.role === "assistant" && m.content?.trim());
  const agentHandoff = lastReply ? parseHandoff(lastReply.content) : null;
  const artifacts = collectArtifacts({
    handoffOutputs: (agentHandoff ?? opts.aiHandoff)?.outputs ?? [],
    lastRoundTexts: lastRoundTexts(messages),
    filesTouched: [...new Set(rounds.flatMap((r) => r.filesTouched))]
  });
  return { rounds, agentHandoff, artifacts };
}
const EMPTY$1 = { rounds: [], agentHandoff: null, artifacts: { primary: [], changedFiles: [] } };
function useReviewData(sessionId, messages, active, sessionBusy) {
  const lastId = messages[messages.length - 1]?.id ?? "";
  const [ai, setAi] = reactExports.useState({ key: "", handoff: null, loading: false, error: null });
  const key = `${sessionId}:${lastId}`;
  const aiHandoff = ai.key === key ? ai.handoff : null;
  const { rounds, agentHandoff, artifacts } = reactExports.useMemo(
    () => active ? buildReviewData(messages, { busy: sessionBusy, aiHandoff }) : EMPTY$1,
    [active, messages, sessionBusy, aiHandoff]
  );
  const generate = reactExports.useCallback((force) => {
    setAi({ key, handoff: null, loading: true, error: null });
    void window.shineAI.review.generateHandoff(sessionId, { force }).then(
      (res) => setAi((cur) => cur.key !== key ? cur : {
        key,
        handoff: res.data?.handoff ?? null,
        loading: false,
        error: res.data?.handoff ? null : res.data?.error ?? res.error ?? "unknown"
      }),
      (err) => setAi((cur) => cur.key !== key ? cur : { key, handoff: null, loading: false, error: err?.message || "unknown" })
    );
  }, [sessionId, key]);
  const needAi = active && !agentHandoff && !sessionBusy && !!lastId;
  reactExports.useEffect(() => {
    if (needAi && ai.key !== key) generate(false);
  }, [needAi, ai.key, key, generate]);
  const handoff = agentHandoff ? { handoff: agentHandoff, source: "agent", loading: false, error: null } : ai.key === key ? { handoff: ai.handoff, source: ai.handoff ? "ai" : null, loading: ai.loading, error: ai.error } : { handoff: null, source: null, loading: needAi, error: null };
  return { rounds, handoff, regenerate: () => generate(true), artifacts };
}
function mergeCardKind(check, running) {
  if (running) return "running";
  if (!check.canMerge) return "conflict";
  if (check.dirty) return "dirty";
  return "ready";
}
const PROBE_TTL_MS = 5 * 6e4;
const probeCache = /* @__PURE__ */ new Map();
function readProbe(key) {
  const hit = probeCache.get(key);
  return hit && Date.now() - hit.at < PROBE_TTL_MS ? hit.hasWork : null;
}
function useSessionMerge(sessionId, running) {
  const { t: t2 } = useTranslation("sessionMerge");
  const eligible = useSessionStore((s) => {
    const cfg = s.sessions.find((x) => x.id === sessionId)?.config;
    return !!cfg?.worktreePath && cfg.worktreeMerged !== true;
  });
  const [phase, setPhase] = reactExports.useState({ step: "idle" });
  const [error, setError] = reactExports.useState(null);
  const [notice, setNotice] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setPhase({ step: "idle" });
    setError(null);
    setNotice(null);
  }, [sessionId]);
  const lastActivityId = useSessionStore((s) => s.lastActivities[sessionId]?.id ?? "");
  const probeKey = `${sessionId}|${lastActivityId}`;
  const [hasWork, setHasWork] = reactExports.useState(() => readProbe(probeKey));
  reactExports.useEffect(() => {
    const cached = readProbe(probeKey);
    setHasWork(cached);
    if (!eligible || running || cached !== null) return;
    let alive = true;
    const done = (v) => {
      probeCache.set(probeKey, { hasWork: v, at: Date.now() });
      if (alive) setHasWork(v);
    };
    window.shineAI.session.checkWorktreeMerge(sessionId).then(
      (res) => done(res.ok ? res.files > 0 || res.dirty : res.code !== "no-worktree" && res.code !== "already-merged"),
      () => done(true)
    );
    return () => {
      alive = false;
    };
  }, [probeKey, sessionId, eligible, running]);
  const api2 = () => window.shineAI.session;
  const busy = phase.step === "checking" || phase.step === "merging";
  const open = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setPhase({ step: "checking" });
    try {
      const res = await api2().checkWorktreeMerge(sessionId);
      if (res.ok) return setPhase({ step: "checked", check: res });
      setError(t2("checkFailed", { message: res.message }));
    } catch (err) {
      setError(t2("checkFailed", { message: err instanceof Error ? err.message : String(err) }));
    }
    setPhase({ step: "idle" });
  };
  const confirm = async () => {
    if (phase.step !== "checked") return;
    const { check } = phase;
    setError(null);
    setPhase({ step: "merging", check });
    try {
      const res = await api2().mergeWorktree(sessionId);
      if (res.ok) {
        setPhase({ step: "merged", baseBranch: res.mainBranch, added: res.linesAdded, removed: res.linesRemoved, kept: !!res.cleanupSkippedDueToDirty });
        void useSessionStore.getState().fetchSessions();
        return;
      }
      setError(t2("failed", { message: res.message }));
    } catch (err) {
      setError(t2("failed", { message: err instanceof Error ? err.message : String(err) }));
    }
    setPhase({ step: "checked", check });
  };
  const ask = async (text) => {
    setError(null);
    const res = await replyToSession(sessionId, text);
    if (!res.ok) return setError(t2("failed", { message: res.error }));
    setPhase({ step: "idle" });
    setNotice(t2("sent"));
  };
  return {
    showButton: eligible && !running && hasWork === true && phase.step !== "merged",
    busy,
    phase,
    error,
    notice,
    running,
    open: () => void open(),
    cancel: () => setPhase({ step: "idle" }),
    confirm: () => void confirm(),
    ask: (text) => void ask(text)
  };
}
function MergeButton({ merge }) {
  const { t: t2 } = useTranslation("sessionMerge");
  if (!merge.showButton) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: merge.busy || merge.phase.step === "checked", title: t2("buttonHint"), onClick: merge.open, "data-drawer-merge": true, children: t2("button") });
}
function MergeCard({ merge }) {
  const { t: t2 } = useTranslation("sessionMerge");
  const { phase } = merge;
  if (phase.step === "idle") {
    return merge.error || merge.notice ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3", "data-drawer-merge-card": "idle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: merge.error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: merge.notice, kind: "ok" })
    ] }) : null;
  }
  if (phase.step === "checking") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 shrink-0 text-xs text-text-muted", role: "status", "data-drawer-merge-card": "checking", children: t2("checking") });
  }
  if (phase.step === "merged") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 shrink-0 rounded-xl border border-accent-green/40 bg-accent-green/10 px-3 py-2 text-xs", role: "status", "data-drawer-merge-card": "merged", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-accent-green", children: t2("merged", { baseBranch: phase.baseBranch, added: phase.added, removed: phase.removed }) }),
      phase.kept && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-text-muted", children: t2("mergedKept") })
    ] });
  }
  const { check } = phase;
  const merging = phase.step === "merging";
  const kind = mergeCardKind(check, merge.running);
  const stat = { branch: check.branch, baseBranch: check.baseBranch, added: check.linesAdded, removed: check.linesRemoved, files: check.files };
  const cancel = /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: merging, onClick: merge.cancel, children: t2("cancel") });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 shrink-0 rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs", "data-drawer-merge-card": kind, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1 font-semibold text-text-muted", children: t2("title") }),
    kind === "running" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary", children: t2("running") }),
    kind === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary", children: t2("ready", stat) }),
    kind === "dirty" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-accent-yellow", children: t2("dirty", stat) }),
    kind === "conflict" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-accent-red", children: t2("conflict", { baseBranch: check.baseBranch }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 list-disc pl-4 font-mono text-text-secondary", "data-drawer-merge-conflicts": true, children: check.conflictingFiles.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "break-all", children: f }, f)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-1.5", children: [
      kind === "running" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: true, children: t2("confirm") }),
      kind === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: merging, onClick: merge.confirm, "data-drawer-merge-confirm": true, children: merging ? t2("merging") : t2("confirm") }),
      kind === "dirty" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: merging, onClick: () => merge.ask(t2("commitRequest")), children: t2("askCommit") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: merging, onClick: merge.confirm, "data-drawer-merge-confirm": true, children: merging ? t2("merging") : t2("mergeAnyway") })
      ] }),
      kind === "conflict" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, onClick: () => merge.ask(t2("resolveRequest", { baseBranch: check.baseBranch, files: check.conflictingFiles.join("、") })), children: t2("askResolve") }),
      cancel
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: merge.error })
  ] });
}
const EMPTY = [];
const STICK_PX = 80;
function useSeenOnce(cond) {
  const [seen, setSeen] = reactExports.useState(cond);
  if (cond && !seen) setSeen(true);
  return seen || cond;
}
function recentChatMessages(messages, limit = 20) {
  return messages.filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim()).slice(-limit);
}
function quickRepliesOf(pending, waitingInput, generic) {
  if (pending && !(pending.type === "question" && pending.options.length === 0)) return null;
  return waitingInput ? generic : null;
}
function SessionMessages({ sessionId, limit = 20, listClassName = "max-h-[420px]" }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const { messages, isStreaming, isLoading, reloadConversation, loadOlderMessages } = useConversation(sessionId);
  const hasMore = useSessionStore((s) => s.conversationHasMore[sessionId]);
  reactExports.useEffect(() => {
    void reloadConversation();
  }, [sessionId, reloadConversation]);
  const [shown, setShown] = reactExports.useState(limit);
  const chat = reactExports.useMemo(() => recentChatMessages(messages, Infinity), [messages]);
  const recent = reactExports.useMemo(() => chat.slice(-shown), [chat, shown]);
  const turnMeta = reactExports.useMemo(() => buildTurnDurationMetaMap(messages), [messages]);
  const listRef = reactExports.useRef(null);
  const stickRef = reactExports.useRef(true);
  const anchorRef = reactExports.useRef(null);
  const loadingOlderRef = reactExports.useRef(false);
  const chatLenRef = reactExports.useRef(chat.length);
  chatLenRef.current = chat.length;
  const shownRef = reactExports.useRef(shown);
  shownRef.current = shown;
  reactExports.useEffect(() => {
    stickRef.current = true;
    anchorRef.current = null;
    setShown(limit);
  }, [sessionId, limit]);
  const lastContent = recent[recent.length - 1]?.content;
  reactExports.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const anchor = anchorRef.current;
    if (anchor) {
      anchorRef.current = null;
      el.scrollTop = el.scrollHeight - anchor.height + anchor.top;
    } else if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [recent.length, lastContent]);
  const expand = (el) => {
    anchorRef.current = { height: el.scrollHeight, top: el.scrollTop };
    setShown((n) => n + limit);
  };
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
    if (el.scrollTop > STICK_PX || anchorRef.current || loadingOlderRef.current) return;
    if (chat.length > shown) return expand(el);
    if (hasMore === false) return;
    loadingOlderRef.current = true;
    void loadOlderMessages(sessionId).finally(() => {
      loadingOlderRef.current = false;
      const cur = listRef.current;
      if (cur && chatLenRef.current > shownRef.current) expand(cur);
    });
  };
  if (recent.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: isLoading ? t2("session.loading") : t2("session.empty") });
  }
  return (
    // scrollbar-gutter 预留滚动条位置，正文 / 用户气泡不再贴着滚动条
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: listRef, onScroll, className: cn(listClassName, "space-y-2 overflow-y-auto rounded-xl bg-bg-primary/60 p-2 pr-3 [scrollbar-gutter:stable]"), "data-drawer-messages": true, children: recent.map(
      (m, i) => (
        // 会话页的用户气泡是透明背景右对齐，在抽屉里短回复（如选项『A』）会像一个孤立字母，这里补上『你』标签和底色
        m.role === "user" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group ml-auto flex w-fit max-w-[85%] flex-col items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-drawer-user-message": true, className: "flex items-baseline gap-2 rounded-lg bg-accent-blue/10 px-3 py-1.5 text-sm text-text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[11px] text-text-muted", children: t2("session.you") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 whitespace-pre-wrap break-words", children: parseMessageContentWithImages(m.content).textContent })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageImages, { message: m }),
          m.timestamp && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "mt-1 select-none text-[11px] leading-none tabular-nums text-text-tertiary/70 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
              title: formatExactTime(m.timestamp),
              children: formatMessageTime(m.timestamp)
            }
          )
        ] }, m.id) : (
          // 传入回合 meta：每轮最终回复才按正文色显示，并带耗时、时间戳、复制 / 翻译，和会话页一致
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageBubble, { message: m, isStreaming: isStreaming && i === recent.length - 1, turnDurationMeta: turnMeta.get(m.id) }, m.id)
        )
      )
    ) })
  );
}
function SessionDrawer({ node, onClose, onBack, backLabel, onNodeAction }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const { t: tw } = useTranslation("workbench");
  const { t: tn } = useTranslation("canvasNodes");
  const sessionId = node.ref.sessionId;
  const otherRuns = (node.runSessions ?? []).filter((s) => s.sessionId !== sessionId).slice(0, 8);
  const activities = useSessionStore((s) => s.activities[sessionId] ?? EMPTY);
  const lastActivity = useSessionStore((s) => s.lastActivities[sessionId]);
  const childAgentsBusy = useSessionStore((s) => !!s.agents[sessionId]?.some((a) => a.status === "pending" || a.status === "running"));
  const [busy, setBusy] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const stopper = useOptimisticStop(() => endSession(sessionId));
  const [confirmEnd, setConfirmEnd] = reactExports.useState(false);
  reactExports.useEffect(() => setConfirmEnd(false), [sessionId]);
  const [confirmDelete, setConfirmDelete] = reactExports.useState(false);
  const initialTab = node.status === "awaiting" ? "review" : "chat";
  const [tab, setTab] = reactExports.useState(initialTab);
  reactExports.useEffect(() => setTab(initialTab), [sessionId]);
  const [jumpRequest, setJumpRequest] = reactExports.useState();
  const terminalSeen = useSeenOnce(tab === "terminal");
  const filesSeen = useSeenOnce(tab === "files");
  reactExports.useEffect(() => {
    void useSessionStore.getState().fetchSessionActivities(sessionId);
    setError(null);
  }, [sessionId]);
  const butlerRunning = useButlerStore((s) => selectL3Guard(s, sessionId).butlerRunning);
  const l3Enabled = useButlerStore((s) => selectL3Guard(s, sessionId).l3Enabled);
  const l3Fallback = useButlerStore((s) => selectL3Guard(s, sessionId).l3Fallback);
  const l3Guard = { butlerRunning, l3Enabled, l3Fallback };
  const { isStreaming, messages } = useConversation(sessionId);
  const sessionStatus = useSessionStore((s) => s.sessions.find((x) => x.id === sessionId)?.status);
  const statusRunning = sessionStatus === "running" || sessionStatus === "starting";
  const workingDirectory = useSessionStore((s) => s.sessions.find((x) => x.id === sessionId)?.config?.workingDirectory);
  const merge = useSessionMerge(sessionId, statusRunning);
  const goalsAvailable = useGoalStore((s) => s.available && s.listLoaded);
  const boundGoal = useSessionGoalTitle(sessionId);
  const [handOff, setHandOff] = reactExports.useState("idle");
  reactExports.useEffect(() => setHandOff("idle"), [sessionId]);
  const [now, setNow] = reactExports.useState(Date.now());
  const activeInteractive = reactExports.useMemo(() => getActiveInteractiveActivity(activities), [activities]);
  const ticking = !!activeInteractive;
  reactExports.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ticking ? 1e3 : 6e4);
    return () => clearInterval(timer);
  }, [ticking]);
  const pending = pendingInteractionOf({ activities, lastActivity, l3Guard, sessionBusy: isStreaming || statusRunning, now });
  const review = useReviewData(sessionId, messages, tab === "review", isStreaming || statusRunning);
  const canStop2 = !stopper.stopped && (node.status === "running" || node.status === "awaiting" || node.status === "queued");
  const replySuggestions = reactExports.useMemo(() => getActiveReplySuggestions(activities), [activities]);
  const quick = childAgentsBusy ? null : quickRepliesOf(pending, sessionStatus === "waiting_input", [t2("session.quickContinue"), t2("session.quickYourCall")]);
  const canHandOff = goalsAvailable && node.kind === "session" && !boundGoal && handOff !== "done" && (node.status === "running" || node.status === "awaiting");
  const parkAction = !onNodeAction ? null : node.parked ? "unpark" : node.kind === "session" && node.status === "awaiting" ? "park" : null;
  const waitedAt = Date.parse(node.lastActivityAt ?? node.since ?? "");
  const statusMeta = stopper.stopped ? null : node.status === "awaiting" ? Number.isFinite(waitedAt) ? tn("meta.waited", { time: waitDuration(Math.max(0, now - waitedAt), tn) }) : null : nodeMetaText(node, now, tn);
  const reviewDot = tab !== "review" && (node.status === "awaiting" || !!pending || !!review.handoff.handoff?.decision);
  const act = async (fn, onOk) => {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (res.ok) onOk?.();
    else setError(t2("actionFailed", { message: res.error }));
  };
  const sendQuick = (label) => {
    if (busy || !quick) return;
    void act(() => replyToSession(sessionId, label));
  };
  const doHandOff = () => {
    if (handOff === "idle") return setHandOff("confirm");
    const first = messages.find((m) => m.role === "user" && m.content?.trim())?.content ?? "";
    void act(() => handOffSession(sessionId, deriveGoalTitle(first) || node.title, first.trim() || node.title, workingDirectory), () => setHandOff("done"));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DrawerFrame,
    {
      node,
      onClose,
      onBack,
      backLabel,
      statusOverride: stopper.stopped ? "stopped" : null,
      subtitle: workingDirectory,
      fill: true,
      tabs: [
        { id: "review", label: t2("sessionTabs.review"), dot: reviewDot },
        { id: "chat", label: t2("sessionTabs.chat") },
        { id: "files", label: t2("sessionTabs.files") },
        // 终端不常用：入口收进「⋯」，打开过才出现页签（方便切回）
        ...terminalSeen ? [{ id: "terminal", label: t2("sessionTabs.terminal") }] : []
      ],
      activeTab: tab,
      onTabChange: (id) => setTab(id),
      statusMeta,
      actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MergeButton, { merge }),
        isResumable(node) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: merge.showButton ? btn$1 : btnPrimary, disabled: busy, onClick: () => void act(() => resumeSession(sessionId)), children: tw("canvas.menu.resume") }),
        parkAction && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, title: parkAction === "park" ? t2("session.parkHint") : void 0, onClick: () => onNodeAction?.(parkAction, node), "data-drawer-park": parkAction, children: t2(`session.${parkAction}`) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnStop, disabled: !canStop2, title: t2("session.endHint"), onClick: () => confirmEnd ? void stopper.stop() : setConfirmEnd(true), onBlur: () => setConfirmEnd(false), "data-drawer-end": true, children: stopper.stopped ? t2("session.ended") : confirmEnd ? t2("session.endConfirm") : t2("session.end") })
      ] }),
      moreActions: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => {
          openFullConversation(sessionId);
          onClose();
        }, children: t2("session.openFull") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => setTab("terminal"), "data-drawer-open-terminal": true, children: t2("session.openTerminal") }),
        canHandOff && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: busy, title: t2("session.handOffHint"), onClick: doHandOff, onBlur: () => handOff === "confirm" && setHandOff("idle"), "data-drawer-handoff": true, children: handOff === "confirm" ? t2("session.handOffConfirm") : t2("session.handOff") }),
        node.kind === "session" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnStop, disabled: busy, onClick: () => setConfirmDelete(true), "data-drawer-delete": true, children: t2("session.delete") })
      ] }),
      children: [
        confirmDelete && /* @__PURE__ */ jsxRuntimeExports.jsx(
          DeleteConfirmDialog,
          {
            sessionId,
            sessionName: node.title,
            onCancel: () => setConfirmDelete(false),
            onConfirm: async (id) => {
              try {
                await useSessionStore.getState().deleteSession(id);
              } catch (err) {
                setError(t2("actionFailed", { message: err instanceof Error ? err.message : String(err) }));
                throw err;
              }
              onClose();
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MergeCard, { merge }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("-mb-3 flex min-h-0 flex-1 flex-col", tab !== "chat" && "hidden"), "data-drawer-panel": "chat", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[35%] shrink-0 overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: stopper.error }),
            handOff === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", role: "status", children: t2("session.handedOff") }),
            node.subTasks?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("session.subTasks", { count: node.subTasks.length }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", "data-drawer-subtasks": true, children: node.subTasks.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$1, "h-auto short:h-auto w-full justify-start gap-2 py-1.5 font-normal"), onClick: () => openFullConversation(s.sessionId), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: s.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate", children: s.title })
            ] }, s.sessionId)) }) }) : null,
            otherRuns.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("session.otherRuns", { count: otherRuns.length }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", "data-drawer-other-runs": true, children: otherRuns.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$1, "h-auto short:h-auto w-full justify-start gap-2 py-1.5 font-normal"), onClick: () => openFullConversation(s.sessionId), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: s.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate", children: s.title })
            ] }, s.sessionId)) }) }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative -mx-5 flex min-h-0 flex-1 flex-col overflow-hidden", "data-conversation-scope": true, "data-drawer-conversation": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ConversationView,
            {
              sessionId,
              hideTopBars: true,
              jumpRequest,
              aboveInput: quick && !replySuggestions ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5 px-4 pb-1.5", role: "group", "aria-label": t2("session.quickReplies"), "data-drawer-quick": true, children: quick.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: busy, onClick: () => sendQuick(l), children: l }, l)) }) : void 0
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: error })
        ] }),
        tab === "review" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ReviewPanel,
          {
            pending,
            quick,
            suggestions: replySuggestions,
            childAgentsBusy,
            canReply: sessionStatus === "waiting_input" || node.status === "awaiting",
            busy,
            onReply: (text) => void act(() => replyToSession(sessionId, text)),
            onAnswer: (answers) => void act(() => answerSessionQuestion(sessionId, answers)),
            onGoChat: () => setTab("chat"),
            onGoFiles: () => setTab("files"),
            rounds: review.rounds,
            onJump: (id) => {
              setTab("chat");
              setJumpRequest({ id, nonce: Date.now() });
            },
            handoff: review.handoff,
            onRegenerate: review.regenerate,
            artifacts: review.artifacts,
            sessionId
          }
        ),
        terminalSeen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex min-h-0 flex-1 flex-col", tab !== "terminal" && "hidden"), "data-drawer-panel": "terminal", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SessionTerminal, { cwd: workingDirectory }) }),
        filesSeen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("-mx-5 -mb-3 min-h-0 flex-1", tab !== "files" && "hidden"), "data-drawer-panel": "files", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SessionDiffPanel, { sessionId, active: tab === "files", resumable: isResumable(node) }, sessionId) })
      ]
    }
  );
}
const EMPTY_RUNS = [];
const RESULT_TONE = { ok: "text-accent-green", partial: "text-accent-yellow", failed: "text-accent-red", cancelled: "text-text-muted" };
function hhmm(iso) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "--:--" : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtDur(ms2) {
  if (ms2 == null) return "";
  const s = Math.round(ms2 / 1e3);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;
}
function runLogText(run) {
  return [run.error, run.output].filter(Boolean).join("\n\n");
}
function PipelineDrawer({ node, onClose }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const taskId = pipelineTaskId(node.ref);
  const tasks = useSchedulerStore((s) => s.tasks);
  const runs = useSchedulerStore((s) => (taskId ? s.runHistory[taskId] : void 0) ?? EMPTY_RUNS);
  const [busy, setBusy] = reactExports.useState(false);
  const [notice, setNotice] = reactExports.useState(null);
  const stopper = useOptimisticStop(async () => {
    const res = await stopPipeline(node.ref, liveSessionId);
    if (res.ok && res.halted === false) setNotice({ kind: "ok", text: t2("pipeline.markedStopped") });
    return res;
  });
  reactExports.useEffect(() => {
    setNotice(null);
    void useSchedulerStore.getState().loadTasks();
    if (taskId) void useSchedulerStore.getState().loadHistory(taskId);
  }, [taskId]);
  const row = reactExports.useMemo(() => tasks.find((x) => x.id === node.ref.scheduleId) ?? null, [tasks, node.ref.scheduleId]);
  const paused = row ? !row.enabled : node.statusSource.from === "goal" && node.statusSource.status === "paused";
  const liveRun = runs.find((r) => r.status === "running") ?? null;
  const running = !stopper.stopped && (Boolean(liveRun) || node.status === "running");
  const liveSessionId = liveRun?.sessionId ?? node.runSessions?.find((s) => s.status === "running")?.sessionId ?? null;
  const currentCron = row?.schedule.type === "cron" ? row.schedule.cron : void 0;
  const act = async (fn, okText) => {
    setBusy(true);
    setNotice(null);
    const res = await fn();
    setBusy(false);
    setNotice(res.ok ? { kind: "ok", text: okText } : { kind: "error", text: t2("actionFailed", { message: res.error }) });
    if (res.ok && taskId) void useSchedulerStore.getState().loadHistory(taskId);
  };
  const runNow = () => act(() => runPipelineNow(node.ref), t2("pipeline.started"));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DrawerFrame,
    {
      node,
      onClose,
      statusOverride: stopper.stopped ? "stopped" : null,
      actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: busy || running || paused, title: paused ? t2("pipeline.resumeFirst") : void 0, onClick: () => void runNow(), children: t2("pipeline.runNow") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: busy, onClick: () => void act(() => setPipelinePaused(node.ref, !paused), paused ? t2("pipeline.resumed") : t2("pipeline.paused")), children: paused ? t2("pipeline.resume") : t2("pipeline.pause") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnStop, disabled: !running, onClick: () => void stopper.stop(), children: stopper.stopped ? t2("stopped") : t2("stop") })
      ] }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: stopper.error }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: notice?.text ?? null, kind: notice?.kind }),
        liveSessionId ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: t2("pipeline.liveRun"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SessionMessages, { sessionId: liveSessionId, limit: 6 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `${btn$1} mt-2`, onClick: () => openFullConversation(liveSessionId), children: t2("session.openFull") })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("pipeline.plan"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              "aria-label": t2("pipeline.plan"),
              size: "sm",
              value: currentCron && SCHEDULE_PRESETS.some((p) => p.cron === currentCron) ? currentCron : "",
              disabled: busy,
              onChange: (v) => v && void act(() => updatePipelineSchedule(node.ref, { type: "cron", cron: v }), t2("pipeline.planSaved")),
              className: "min-w-0 flex-1",
              options: [
                { value: "", label: node.scheduleText || t2("pipeline.planCurrent") },
                ...SCHEDULE_PRESETS.map((p) => ({ value: p.cron, label: t2(`pipeline.preset.${p.key}`) }))
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-xs text-text-muted", children: paused ? t2("pipeline.isPaused") : t2("pipeline.next", { time: hhmm(row?.nextRunAt ?? node.nextRunAt) }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: t2("pipeline.recentRuns"), children: [
          runs.filter((r) => r.status !== "running").length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("pipeline.noRuns") }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: runs.filter((r) => r.status !== "running").slice(0, 7).map((r) => {
            const result = r.status === "cancelled" ? "cancelled" : runResultOf(r.status) ?? "failed";
            const log = runLogText(r);
            const sid = r.sessionId ?? (r.status === "cancelled" ? liveSessionId : null);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: result === "failed", "data-drawer-run": r.id, className: `rounded-xl border ${result === "failed" || result === "partial" ? "border-accent-red/30" : "border-border"} bg-bg-primary`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-11 shrink-0 font-mono text-xs font-semibold text-text-primary", children: hhmm(r.startedAt) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `shrink-0 text-xs font-semibold ${RESULT_TONE[result]}`, children: t2(`result.${result}`) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-xs text-text-secondary", children: (r.error || r.output || "").split("\n")[0] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 font-mono text-[11px] text-text-muted", children: fmtDur(r.durationMs) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border px-2.5 pb-2.5 pt-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-text-secondary", children: log || t2("pipeline.noLog") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-1.5 empty:hidden", children: [
                  sid ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => openFullConversation(sid), children: t2("pipeline.openRunSession") }) : null,
                  result !== "ok" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: busy || running || paused, onClick: () => void runNow(), children: t2("pipeline.rerun") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: !log, onClick: () => void act(() => copyText(log), t2("pipeline.copied")), children: t2("pipeline.copyError") })
                  ] }) : null
                ] })
              ] })
            ] }, r.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", "data-advanced-scheduler": true, onClick: openAdvancedScheduler, className: cn(btn$1, "text-text-muted"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-3.5 w-3.5" }),
          t2("pipeline.advanced")
        ] })
      ]
    }
  );
}
const REJECT_NEEDS_TEXT = /* @__PURE__ */ new Set(["goal_approval"]);
const APPROVE_TAKES_NOTE = /* @__PURE__ */ new Set(["goal_approval"]);
function editActionOf(kind, actions) {
  if (actions.includes("reply")) return "reply";
  if (kind && APPROVE_TAKES_NOTE.has(kind) && actions.includes("approve")) return "approve";
  return null;
}
const btnNeeds = cn(btn$1, "border-transparent bg-accent-yellow text-bg-primary hover:bg-accent-yellow/90");
function ProposalDrawer({ node, onClose }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const proposalId = node.ref.proposalId;
  const proposal = useProposalStore((s) => s.items.find((p) => p.id === proposalId));
  const pending = useProposalStore((s) => s.pendingIds.includes(proposalId));
  const [draft, setDraft] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setDraft(null);
    setError(null);
    if (!useProposalStore.getState().items.some((p) => p.id === proposalId)) void useProposalStore.getState().refresh();
  }, [proposalId]);
  const actions = proposal?.actions ?? ["approve", "reject"];
  const editAction = editActionOf(proposal?.kind, actions);
  const run = async (action, text) => {
    setError(null);
    const res = await resolveProposal(proposalId, action, text);
    if (!res.ok) return setError(t2("actionFailed", { message: res.error }));
    if (action !== "open") onClose();
  };
  const startReject = () => {
    if (proposal && !REJECT_NEEDS_TEXT.has(proposal.kind)) return void run("reject");
    setDraft({ mode: "reject", text: "" });
  };
  const source = node.from || (proposal ? `${proposal.source.type} · ${proposal.source.id}` : null);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DrawerFrame, { node, onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-accent-yellow/30 bg-accent-yellow/5 p-4", "data-drawer-proposal": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("proposal.what"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-text-primary", children: proposal?.title ?? node.title }) }),
    proposal ? /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("proposal.effectTitle"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-primary", children: t2(`proposal.effect.${proposal.kind}`) }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("proposal.impact"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-sm text-text-secondary", children: proposal?.detail || node.text || t2("proposal.noImpact") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: true, className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-xs font-semibold text-text-muted", children: t2("proposal.why") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-2 text-sm text-text-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: source || t2("proposal.noSource") }),
        actions.includes("open") ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: pending, onClick: () => void run("open"), children: t2("proposal.openSource") }) : null
      ] })
    ] }),
    draft ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          autoFocus: true,
          value: draft.text,
          onChange: (e) => setDraft({ ...draft, text: e.target.value }),
          "aria-label": draft.mode === "edit" ? t2("proposal.editPlaceholder") : t2("proposal.rejectPlaceholder"),
          placeholder: draft.mode === "edit" ? t2("proposal.editPlaceholder") : t2("proposal.rejectPlaceholder"),
          className: "min-h-[72px] w-full rounded-lg border border-border bg-bg-primary p-2 text-sm text-text-primary outline-none focus:border-accent-blue"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: btnNeeds,
            disabled: pending || !draft.text.trim(),
            onClick: () => void run(draft.mode === "edit" ? editAction : "reject", draft.text.trim()),
            children: t2("proposal.submit")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => setDraft(null), children: t2("proposal.cancel") })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
      actions.includes("approve") ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnNeeds, disabled: pending, onClick: () => void run("approve"), children: t2("proposal.approve") }) : null,
      editAction ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: pending, onClick: () => setDraft({ mode: "edit", text: "" }), children: t2("proposal.edit") }) : null,
      actions.includes("reject") ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: pending, onClick: startReject, children: t2("proposal.reject") }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[11px] text-text-muted", children: t2("proposal.hint") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: error })
  ] }) });
}
function AskItem({ entry, teamId }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const [answer, setAnswer] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const roleName = entry.roleName?.trim() || "leader";
  const options = entry.options ?? [];
  const submit = async (text) => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      await useTeamStore.getState().injectMessage(teamId, roleName, value);
      useNeedsHumanStore.getState().dismiss(teamId, entry.id);
    } catch (e) {
      setError(t2("team.answerFailed", { message: e instanceof Error ? e.message : String(e) }));
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-team-ask": entry.id, className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-medium text-accent-yellow", children: t2("team.askFrom", { role: roleName }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap break-words text-sm text-text-primary", children: entry.question }),
    options.length > 0 || entry.defaultAnswer ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
      options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: sending, onClick: () => void submit(opt), children: opt }, opt)),
      entry.defaultAnswer && !options.includes(entry.defaultAnswer) ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: sending, onClick: () => void submit(entry.defaultAnswer), children: t2("team.adoptDefault", { answer: entry.defaultAnswer }) }) : null
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: answer,
          disabled: sending,
          onChange: (e) => setAnswer(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) void submit(answer);
          },
          placeholder: t2("team.answerPlaceholder"),
          "aria-label": t2("team.answerPlaceholder"),
          className: "h-8 min-w-0 flex-1 rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-accent-blue"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: sending || !answer.trim(), onClick: () => void submit(answer), children: t2("team.answerSend") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: error })
  ] });
}
function TeamAsksCard({ teamId, entries, fallback }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  if (entries.length === 0 && !fallback) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-3 shrink-0", "data-team-asks": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-1.5 text-xs font-semibold tracking-wide text-text-muted", children: t2("team.asksTitle") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-y-auto rounded-xl border border-accent-yellow/40 bg-accent-yellow/5 p-3", children: entries.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3 divide-y divide-accent-yellow/20 [&>li+li]:pt-3", children: entries.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx(AskItem, { entry: e, teamId }, e.id)) }) : fallback })
  ] });
}
const TEAM_DRAWER_MESSAGE_LIMIT = 100;
const teamApi = () => window.shineAI?.team;
function mergeTeamMessages(prev, incoming, limit = TEAM_DRAWER_MESSAGE_LIMIT) {
  const list = (Array.isArray(incoming) ? incoming : [incoming]).filter(Boolean);
  if (list.length === 0) return prev;
  const seen = new Set(prev.map((m) => m.id));
  const fresh = list.filter((m) => !m.id || !seen.has(m.id));
  return fresh.length ? [...prev, ...fresh].slice(-limit) : prev;
}
function useTeamDrawerData(teamId) {
  const [messages, setMessages] = reactExports.useState([]);
  const [tasks, setTasks] = reactExports.useState([]);
  const reloadMessages = reactExports.useCallback(async () => {
    const list = await teamApi()?.getMessages?.(teamId, TEAM_DRAWER_MESSAGE_LIMIT).catch(() => null);
    if (list) setMessages(list.slice(-TEAM_DRAWER_MESSAGE_LIMIT));
  }, [teamId]);
  const reloadTasks = reactExports.useCallback(async () => {
    const list = await teamApi()?.getTasks?.(teamId).catch(() => null);
    if (list) setTasks(list);
  }, [teamId]);
  reactExports.useEffect(() => {
    void reloadMessages();
    void reloadTasks();
    const off = teamApi()?.onEvent?.((event) => {
      if (event?.instanceId !== teamId) return;
      if (event.type === "team:message" && event.data) setMessages((prev) => mergeTeamMessages(prev, event.data));
      else if (event.type === "team:task-updated") void reloadTasks();
    });
    return () => {
      if (typeof off === "function") off();
    };
  }, [teamId, reloadMessages, reloadTasks]);
  return { messages, tasks, reloadMessages };
}
const TASK_NODE_STATUS = { pending: "queued", in_progress: "running", completed: "succeeded" };
function TaskStatusChip({ status }) {
  const mapped = TASK_NODE_STATUS[status];
  if (mapped) return /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: mapped });
  const meta = getTeamTaskStatusMeta(status);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-task-status": status, className: cn("rounded-full px-2 py-0.5 text-[11px] font-medium", meta.badgeClass), children: meta.label });
}
const isDone = (task) => getTeamTaskStatusMeta(task.status).overviewColumn === "completed";
function currentTaskOf(tasks, names) {
  const open = tasks.filter((x) => x.assignedTo && names.includes(x.assignedTo) && !isDone(x));
  return open.find((x) => getTeamTaskStatusMeta(x.status).overviewColumn === "in_progress") ?? open[0] ?? null;
}
function TaskList({ tasks, sessionOf: sessionOf2 }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const { regularTasks, goalTasks } = splitTeamTasks(tasks);
  const done = regularTasks.filter(isDone).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto", children: [
    goalTasks.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 break-words text-xs text-text-secondary", children: t2("team.goal", { title: g.title }) }, g.id)),
    regularTasks.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("team.noTasks") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-[11px] text-text-muted", children: t2("team.taskProgress", { done, total: regularTasks.length }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: regularTasks.map((task) => {
        const detail = task.summary || task.description;
        const sid = task.assignedTo ? sessionOf2(task.assignedTo) : null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-team-task": task.id, className: "rounded-lg border border-border px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 break-words text-sm text-text-primary", children: task.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TaskStatusChip, { status: task.status }) })
          ] }),
          task.assignedTo ? sid ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "mt-0.5 block max-w-full truncate text-left text-[11px] text-text-muted underline-offset-2 hover:text-text-primary hover:underline", title: t2("team.openAssignee"), onClick: () => openFullConversation(sid), children: [
            t2("team.assignee", { role: task.assignedTo }),
            " ›"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-[11px] text-text-muted", children: t2("team.assignee", { role: task.assignedTo }) }) : null,
          detail ? /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer select-none text-[11px] text-text-muted", children: t2(task.summary ? "team.taskSummary" : "team.taskDetail") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 whitespace-pre-wrap break-words text-xs text-text-secondary", children: detail })
          ] }) : null
        ] }, task.id);
      }) })
    ] })
  ] });
}
function TeamDrawer({ node, onClose }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const teamId = node.ref.teamId;
  const stopper = useOptimisticStop(() => stopTeam(teamId));
  const members = node.members ?? [];
  const canStop2 = !stopper.stopped && (node.status === "running" || node.status === "awaiting" || node.status === "queued");
  const instance2 = useTeamStore((s) => s.teamInstances.find((i) => i.id === teamId));
  const { messages, tasks, reloadMessages } = useTeamDrawerData(teamId);
  const [tab, setTab] = reactExports.useState("messages");
  const [sendError, setSendError] = reactExports.useState(null);
  const askEntries = useNeedsHumanStore((s) => s.entriesByInstanceId[teamId]);
  const blockingAsks = reactExports.useMemo(() => (askEntries ?? []).filter((e) => e.blocking), [askEntries]);
  const totalTokens = useSessionStore((s) => {
    let sum = 0;
    for (const m of members) {
      if (!m.sessionId) continue;
      const u = mergeSessionTokens(s.sessions.find((x) => x.id === m.sessionId), s.tokenUsageBySession[m.sessionId]);
      sum += u.lifetimeTokens ?? u.estimatedTokens;
    }
    return sum;
  });
  reactExports.useEffect(() => {
    const store = useTeamStore.getState();
    store.acquireTeamListener();
    return () => store.releaseTeamListener();
  }, []);
  const send = async (toRole, content) => {
    setSendError(null);
    const res = await sendTeamMessage(teamId, toRole, content);
    if (!res.ok) setSendError(t2("team.sendFailed", { message: res.error }));
    else void reloadMessages();
  };
  const regularTasks = splitTeamTasks(tasks).regularTasks;
  const rows = members.map((m) => {
    const raw = instance2?.members.find((x) => m.sessionId && x.childSessionId === m.sessionId || x.displayName === m.name || x.roleName === m.name);
    const roleName = raw?.roleName ?? m.name;
    return {
      m,
      task: currentTaskOf(regularTasks, [roleName, raw?.displayName ?? m.name]),
      waiting: blockingAsks.some((e) => (e.roleName?.trim() || "leader") === roleName)
    };
  });
  const leaderSessionId = instance2?.members.find((x) => isLeaderRoleName(x.roleName))?.childSessionId ?? null;
  const awaitingWithoutAsk = node.status === "awaiting" && !stopper.stopped && blockingAsks.length === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DrawerFrame,
    {
      node,
      onClose,
      fill: true,
      statusOverride: stopper.stopped ? "stopped" : null,
      tabs: [
        { id: "messages", label: t2("team.messages", { count: messages.length }) },
        { id: "tasks", label: t2("team.tasks", { count: regularTasks.length }) }
      ],
      activeTab: tab,
      onTabChange: (id) => setTab(id),
      actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnStop, disabled: !canStop2, onClick: () => void stopper.stop(), children: stopper.stopped ? t2("stopped") : t2("team.stopAll") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => openTeam(teamId), children: t2("team.open") })
      ] }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: stopper.error }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TeamAsksCard,
          {
            teamId,
            entries: blockingAsks,
            fallback: awaitingWithoutAsk ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-team-ask-fallback": true, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-secondary", children: t2("team.awaitingNoAsk") }),
              leaderSessionId ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btn$1, "mt-2"), onClick: () => openFullConversation(leaderSessionId), children: t2("team.openLeader") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btn$1, "mt-2"), onClick: () => openTeam(teamId), children: t2("team.open") })
            ] }) : null
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-3 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1.5 flex items-baseline justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-semibold tracking-wide text-text-muted", children: t2("team.members") }),
            totalTokens > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-team-tokens": true, className: "font-mono text-[11px] text-text-muted", children: t2("team.tokens", { value: formatTokens(totalTokens) }) }) : null
          ] }),
          members.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("team.noMembers") }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "-mx-2 max-h-40 overflow-y-auto", children: rows.map(({ m, task, waiting }) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "data-team-member": m.name,
              disabled: !m.sessionId,
              onClick: () => m.sessionId && openSessionPage(m.sessionId),
              className: "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-accent-blue disabled:cursor-default disabled:hover:bg-transparent",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: stopper.stopped && m.status === "running" ? "stopped" : m.status }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[40%] shrink-0 truncate text-xs font-medium text-text-primary", children: m.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-xs text-text-muted", title: task?.title, children: task?.title ?? "" }),
                waiting ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: "awaiting" }) }) : null
              ]
            }
          ) }, `${m.name}:${m.sessionId ?? ""}`)) })
        ] }),
        node.tail ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 shrink-0 truncate text-xs text-text-muted", title: node.tail, children: node.tail }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: sendError }),
        tab === "messages" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-team-messages": true, className: "-mx-5 -mb-3 min-h-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TeamMessageFlow,
          {
            messages,
            members: instance2?.members ?? [],
            tasks,
            onSendToRole: (role, content) => void send(role, content),
            onBroadcast: (content) => void send("all", content),
            instanceStatus: instance2?.status
          }
        ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          TaskList,
          {
            tasks,
            sessionOf: (who) => instance2?.members.find((m) => m.roleName === who || m.displayName === who || m.id === who)?.childSessionId ?? null
          }
        )
      ]
    }
  );
}
const ts = (v) => typeof v === "string" || v instanceof Date ? new Date(v).getTime() : NaN;
function stepDurationMs(step, execution, now = Date.now()) {
  const status = execution.stepStatuses[step.id];
  const end = status === "running" ? now : ts(execution.stepOutputs?.[step.id]?.completedAt);
  if (!Number.isFinite(end)) return null;
  const depEnds = (step.dependsOn ?? []).map((d) => ts(execution.stepOutputs?.[d]?.completedAt)).filter(Number.isFinite);
  const start = depEnds.length ? Math.max(...depEnds) : ts(execution.startedAt);
  return Number.isFinite(start) && end >= start ? end - start : null;
}
function buildStepProgress(execution, steps, now = Date.now()) {
  return steps.filter((step) => step.id in execution.stepStatuses).map((step) => {
    const raw = execution.stepStatuses[step.id];
    return {
      step,
      status: mapWorkflowStepStatus(raw),
      runtime: buildNodeRuntimeData(raw, execution.stepOutputs?.[step.id], execution.error),
      durationMs: stepDurationMs(step, execution, now)
    };
  });
}
function formatDuration(ms2, t2) {
  const s = Math.max(1, Math.round(ms2 / 1e3));
  if (s < 60) return t2("workflow.durSec", { s });
  const m = Math.floor(s / 60);
  if (m < 60) return t2("workflow.durMin", { m, s: s % 60 });
  return t2("workflow.durHour", { h: Math.floor(m / 60), m: m % 60 });
}
function useWorkflowRun(executionId) {
  const execution = useWorkflowStore((s) => s.activeExecutions.find((e) => e.id === executionId) ?? s.recentExecutions.find((e) => e.id === executionId));
  const def = useWorkflowStore((s) => execution ? s.workflows.find((w) => w.id === execution.workflowId) : void 0);
  return { execution, steps: execution?.workflowSnapshot?.steps ?? def?.steps ?? [] };
}
function fillVars(text, vars) {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (all, key) => vars?.[key] || all);
}
function ReviewItem({ execution, step, steps }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const approveStep = useWorkflowStore((s) => s.approveStep);
  const [busy, setBusy] = reactExports.useState(false);
  const [rejecting, setRejecting] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(null);
  const content = getReviewContent(step, execution.stepOutputs);
  const message2 = step.reviewConfig?.message ? fillVars(step.reviewConfig.message, execution.variables) : "";
  const files = extractLocalFilePaths(`${content?.text ?? ""}
${message2}`);
  const fromName = content ? steps.find((s) => s.id === content.stepId)?.name ?? content.stepId : null;
  const decide = async (approved, reason, reworkFromStepId) => {
    if (busy) return;
    setBusy(true);
    try {
      if (await approveStep(execution.id, step.id, approved, reason, reworkFromStepId)) setDone(approved ? "approved" : "rejected");
    } finally {
      setBusy(false);
    }
  };
  if (done) return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "status", className: "mb-3 text-xs text-accent-green", children: t2(done === "approved" ? "workflow.approved" : "workflow.rejected", { step: step.name }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { "data-review-step": step.id, className: "mb-3 rounded-lg border border-accent-yellow/50 bg-accent-yellow/5 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "text-sm font-semibold text-text-primary", children: step.name }),
    message2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 whitespace-pre-wrap break-words text-xs text-text-secondary", children: message2 }) : null,
    files.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2.5 space-y-2", children: files.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactPreview, { path: p }, p)) }) : null,
    content ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1 mt-2.5 text-[11px] text-text-muted", children: t2("workflow.reviewFrom", { step: fromName }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-y-auto rounded-lg border border-border bg-bg-primary px-3 py-2 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownRenderer, { content: content.text, variant: "compact" }) })
    ] }) : files.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-text-muted", children: t2("workflow.reviewEmpty") }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: rejecting ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      RejectReasonForm,
      {
        busy,
        reworkTargets: getReworkTargets(step.id, steps),
        onCancel: () => setRejecting(false),
        onSubmit: (reason, from) => void decide(false, reason, from)
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnPrimary, disabled: busy, onClick: () => void decide(true), children: busy ? t2("workflow.processing") : t2("workflow.approve") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, disabled: busy, onClick: () => setRejecting(true), children: t2("workflow.reject") })
    ] }) })
  ] });
}
function WorkflowReview({ executionId }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const execution = useWorkflowStore((s) => s.activeExecutions.find((e) => e.id === executionId));
  const def = useWorkflowStore((s) => execution ? s.workflows.find((w) => w.id === execution.workflowId) : void 0);
  if (!execution) return null;
  const steps = execution.workflowSnapshot?.steps ?? def?.steps ?? [];
  const reviewing = steps.filter((s) => execution.stepStatuses[s.id] === "waiting_review");
  if (reviewing.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-2 text-xs font-semibold tracking-wide text-accent-yellow", children: t2("workflow.review") }),
    reviewing.map((step) => /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewItem, { execution, step, steps }, step.id))
  ] });
}
function StepRow({ index: index2, item, open, stopped, onToggle }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const { step, runtime } = item;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-workflow-step": step.id, className: "rounded-lg border border-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", "aria-expanded": open, onClick: onToggle, className: "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-hover", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-5 shrink-0 text-right text-[11px] tabular-nums text-text-muted", children: index2 + 1 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-sm text-text-primary", children: step.name }),
      item.durationMs != null ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[11px] tabular-nums text-text-muted", children: formatDuration(item.durationMs, t2) }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: stopped && item.status === "running" ? "stopped" : item.status })
    ] }),
    open ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border px-3 py-2.5", children: [
      runtime.errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 whitespace-pre-wrap break-words text-xs text-accent-red", children: runtime.errorMessage }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        NodeResultView,
        {
          variant: "canvas",
          output: runtime.output,
          creativeResult: runtime.creativeResult,
          inputs: [],
          status: runtime.status,
          emptyMessage: runtime.status === "success" ? t2("workflow.noOutput") : void 0
        }
      ),
      runtime.sessionId ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btn$1, "mt-2"), onClick: () => openSessionPage(runtime.sessionId), children: t2("workflow.openStepSession") }) : null
    ] }) : null
  ] });
}
function WorkflowDrawer({ node, onClose, onBack }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const executionId = node.ref.workflowExecutionId;
  const stopper = useOptimisticStop(() => stopWorkflow(executionId));
  const [dismissError, setDismissError] = reactExports.useState(null);
  const dismiss = async () => {
    const res = await stopWorkflow(executionId);
    if (res.ok) onClose();
    else setDismissError(t2("stopFailed", { message: res.error }));
  };
  const canStop2 = !stopper.stopped && (node.status === "running" || node.status === "awaiting" || node.status === "queued");
  const { execution, steps } = useWorkflowRun(executionId);
  const progress = execution ? buildStepProgress(execution, steps) : [];
  const [picked, setOpenStepId] = reactExports.useState(void 0);
  const openStepId = picked === void 0 ? progress.find((p) => p.status === "failed")?.step.id ?? null : picked;
  const done = progress.filter((p) => p.status === "succeeded").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DrawerFrame,
    {
      node,
      onClose,
      onBack,
      backLabel: t2("workflow.back"),
      statusOverride: stopper.stopped ? "stopped" : null,
      actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        node.status === "failed" ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, title: t2("workflow.dismissTitle"), onClick: () => void dismiss(), children: t2("workflow.dismiss") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btnStop, disabled: !canStop2, onClick: () => void stopper.stop(), children: stopper.stopped ? t2("stopped") : t2("stop") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => openWorkflowExecution(executionId), children: t2("workflow.open") })
      ] }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: stopper.error ?? dismissError }),
        node.tail ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-text-muted", children: node.tail }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(WorkflowReview, { executionId }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("workflow.steps"), children: progress.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-[11px] text-text-muted", children: t2("workflow.progress", { done, total: progress.length }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-1.5", children: progress.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            StepRow,
            {
              index: i,
              item,
              open: openStepId === item.step.id,
              stopped: stopper.stopped,
              onToggle: () => setOpenStepId(openStepId === item.step.id ? null : item.step.id)
            },
            item.step.id
          )) })
        ] }) : (
          // 执行记录还没拉到（或已被清掉）：退回画布节点上的步骤摘要
          /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            (node.members ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("workflow.noSteps") }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-1.5", children: (node.members ?? []).map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2.5 rounded-lg border border-border px-3 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-5 shrink-0 text-right text-[11px] tabular-nums text-text-muted", children: i + 1 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-sm text-text-primary", children: s.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: stopper.stopped && s.status === "running" ? "stopped" : s.status })
            ] }, `${i}:${s.name}`)) })
          ] })
        ) })
      ]
    }
  );
}
const endAt$1 = (e) => e.completedAt ?? e.startedAt;
function whenText$1(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(void 0, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function WorkflowHistoryDrawer({ node, onClose }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const recent = useWorkflowStore((s) => s.recentExecutions);
  const defs = useWorkflowStore((s) => s.workflows);
  const [picked, setPicked] = reactExports.useState(null);
  reactExports.useEffect(() => {
    void useWorkflowStore.getState().fetchRecentExecutions(20);
  }, []);
  const runs = recent.filter((e) => WORKFLOW_ENDED_STATUS.has(e.status)).sort((a, b) => Date.parse(endAt$1(b)) - Date.parse(endAt$1(a)));
  const nameOf = (e) => defs.find((w) => w.id === e.workflowId)?.name ?? e.workflowName ?? e.workflowSnapshot?.name ?? node.title;
  const sel = picked ? runs.find((e) => e.id === picked) : void 0;
  if (sel) {
    const drill = {
      ...node,
      id: `team:workflow:${sel.id}`,
      subKind: "workflow",
      title: nameOf(sel),
      status: mapWorkflowRunStatus(sel.status),
      tail: "",
      members: [],
      ref: { workflowExecutionId: sel.id }
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkflowDrawer, { node: drill, onClose, onBack: () => setPicked(null) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DrawerFrame, { node, onClose, children: [
    runs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("workflow.historyEmpty") }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: runs.map((e) => {
      const ms2 = e.completedAt ? Date.parse(e.completedAt) - Date.parse(e.startedAt) : NaN;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", "data-workflow-run": e.id, onClick: () => setPicked(e.id), className: cn(btn$1, "h-auto short:h-auto w-full justify-start gap-2.5 py-2 font-normal"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: mapWorkflowRunStatus(e.status) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-left text-sm", children: nameOf(e) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-[11px] tabular-nums text-text-muted", children: [
          [whenText$1(endAt$1(e)), Number.isFinite(ms2) && ms2 >= 0 ? formatDuration(ms2, t2) : ""].filter(Boolean).join(" · "),
          " ›"
        ] })
      ] }) }, e.id);
    }) })
  ] });
}
function drawerKindOf(node) {
  if (!node) return null;
  const { ref } = node;
  if (node.kind === "pipeline" && (ref.scheduleId || ref.goalId)) return "pipeline";
  if (node.kind === "proposal" && ref.proposalId) return "proposal";
  if (node.kind === "team" && ref.teamId) return "team";
  if (node.kind === "team" && node.subKind === "workflowHistory") return "workflowHistory";
  if (ref.workflowExecutionId) return "workflow";
  if (ref.sessionId) return "session";
  return null;
}
function CanvasDrawer({ node, onClose, onNodeAction }) {
  const kind = drawerKindOf(node);
  if (!node || !kind) return null;
  if (kind === "pipeline") return /* @__PURE__ */ jsxRuntimeExports.jsx(PipelineDrawer, { node, onClose }, node.id);
  if (kind === "proposal") return /* @__PURE__ */ jsxRuntimeExports.jsx(ProposalDrawer, { node, onClose }, node.id);
  if (kind === "team") return /* @__PURE__ */ jsxRuntimeExports.jsx(TeamDrawer, { node, onClose }, node.id);
  if (kind === "workflow") return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkflowDrawer, { node, onClose }, node.id);
  if (kind === "workflowHistory") return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkflowHistoryDrawer, { node, onClose }, node.id);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SessionDrawer, { node, onClose, onNodeAction }, node.id);
}
const PAGE = 50;
const endAt = (s) => s.endedAt || s.startedAt;
function groupHistorySessions(sessions, groupKey, keyOf, query = "") {
  const q = query.trim().toLowerCase();
  return sessions.filter((s) => !CANVAS_OPEN_SESSION_STATUSES.has(s.status) && isTopLevelListSession(s) && !s.config?.teamInstanceId && keyOf(s.id) === groupKey && (!q || s.name.toLowerCase().includes(q))).sort((a, b) => Date.parse(endAt(b)) - Date.parse(endAt(a)));
}
function whenText(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(void 0, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function GroupHistoryDrawer({ group, groupKeyOf, onClose }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  const sessions = useSessionStore((s) => s.sessions);
  const [query, setQuery] = reactExports.useState("");
  const [shown, setShown] = reactExports.useState(PAGE);
  const [picked, setPicked] = reactExports.useState(null);
  const groupKey = groupHistoryKey(group) ?? "";
  const list = reactExports.useMemo(() => groupHistorySessions(sessions, groupKey, groupKeyOf, query), [sessions, groupKey, groupKeyOf, query]);
  const frame = {
    id: `history:${group.id}`,
    kind: "session",
    subKind: "chat",
    title: group.title,
    status: "stopped",
    statusSource: { from: "local" },
    tail: "",
    groupId: group.id,
    x: 0,
    y: 0,
    pinned: false,
    ref: {}
  };
  const sel = picked ? sessions.find((s) => s.id === picked) : void 0;
  if (sel) {
    const drill = {
      ...frame,
      id: `session:${sel.id}`,
      title: sel.name,
      status: mapSessionStatus(sel.status),
      statusSource: { from: "session", status: sel.status },
      since: sel.startedAt,
      lastActivityAt: endAt(sel),
      ref: { sessionId: sel.id }
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SessionDrawer, { node: drill, onClose, onBack: () => setPicked(null), backLabel: t2("groupHistory.back") }, sel.id);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DrawerFrame, { node: frame, onClose, kicker: t2("groupHistory.kicker", { count: list.length }), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-3 flex h-8 items-center gap-2 rounded-lg border border-border px-2.5 focus-within:ring-2 focus-within:ring-accent-blue", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-3.5 w-3.5 shrink-0 text-text-muted", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          autoFocus: true,
          value: query,
          onChange: (e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          },
          placeholder: t2("groupHistory.search"),
          "aria-label": t2("groupHistory.search"),
          className: "min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
        }
      )
    ] }),
    list.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2(query.trim() ? "groupHistory.noMatch" : "groupHistory.empty") }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: list.slice(0, shown).map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", "data-history-session": s.id, onClick: () => setPicked(s.id), className: cn(btn$1, "h-auto short:h-auto w-full justify-start gap-2.5 py-2 font-normal"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: mapSessionStatus(s.status) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-left text-sm", children: s.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-[11px] tabular-nums text-text-muted", children: [
        whenText(endAt(s)),
        " ›"
      ] })
    ] }) }, s.id)) }),
    list.length > shown ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(btn$1, "mt-2 w-full justify-center"), onClick: () => setShown((n) => n + PAGE), children: t2("groupHistory.more", { count: Math.min(PAGE, list.length - shown) }) }) : null
  ] });
}
function ItemSection({ title, hint, items }) {
  if (!items.length) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold text-text-primary", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-[11px] text-text-muted", children: hint }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1.5 space-y-1 text-xs text-text-secondary", children: items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "leading-relaxed", children: [
      "· ",
      it.text,
      it.sessionTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-text-muted", children: [
        "— ",
        it.sessionTitle
      ] })
    ] }, i)) })
  ] });
}
function WorkGroupSummaryDrawer({ group, range, onRange, onClose }) {
  const { t: t2 } = useTranslation("workbench");
  const [state, setState] = reactExports.useState({ status: "loading" });
  const [elapsed, setElapsed] = reactExports.useState(0);
  const [refresh, setRefresh] = reactExports.useState(0);
  const groupId = workGroupIdFromCanvas(group.id);
  reactExports.useEffect(() => {
    const api2 = window.shineAI?.workGroups;
    if (!groupId || !api2?.summarize) {
      setState({ status: "error", text: t2("canvas.workGroup.summaryUnavailable") });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    const startedAt = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1e3)), 1e3);
    api2.summarize(groupId, range, refresh > 0).then(
      (res) => {
        if (cancelled) return;
        if (res.ok) setState({ status: "ok", ...res.data });
        else setState({ status: "error", text: res.error.includes("not_implemented") ? t2("canvas.workGroup.summaryUnavailable") : t2("canvas.workGroup.summaryFailed", { error: res.error }) });
      },
      (e) => !cancelled && setState({ status: "error", text: t2("canvas.workGroup.summaryFailed", { error: String(e) }) })
    ).finally(() => clearInterval(timer));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [groupId, range, refresh, t2]);
  const frame = {
    id: `summary:${group.id}`,
    kind: "session",
    subKind: "chat",
    title: group.title,
    status: "stopped",
    statusSource: { from: "local" },
    tail: "",
    groupId: group.id,
    x: 0,
    y: 0,
    pinned: false,
    ref: {}
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DrawerFrame,
    {
      node: frame,
      onClose,
      kicker: t2("canvas.workGroup.summaryKicker"),
      tabs: [{ id: "today", label: t2("canvas.workGroup.rangeToday") }, { id: "week", label: t2("canvas.workGroup.rangeWeek") }],
      activeTab: range,
      onTabChange: (id) => {
        setRefresh(0);
        onRange(id);
      },
      children: [
        state.status === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted", children: [
          t2("canvas.workGroup.summaryLoading"),
          elapsed > 0 && ` ${t2("canvas.workGroup.summaryElapsed", { sec: elapsed })}`
        ] }),
        state.status !== "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 flex items-center gap-2 text-xs text-text-muted", children: [
          state.status === "ok" && state.createdAt && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("canvas.workGroup.summaryAt", { time: new Date(state.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded px-1 text-accent-blue hover:bg-bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue", onClick: () => setRefresh((n) => n + 1), children: t2("canvas.workGroup.summaryRefresh") })
        ] }),
        state.status === "ok" && (state.text.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownRenderer, { content: state.text, variant: "compact" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("canvas.workGroup.summaryEmpty") })),
        state.status === "ok" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ItemSection, { title: t2("canvas.workGroup.summaryDecisions"), hint: t2("canvas.workGroup.summaryDecisionsHint"), items: state.decisions ?? [] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ItemSection, { title: t2("canvas.workGroup.summaryNextSteps"), hint: t2("canvas.workGroup.summaryNextStepsHint"), items: state.nextSteps ?? [] })
        ] }),
        state.status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx(Notice, { text: state.text })
      ]
    }
  );
}
function CanvasModelPicker({ node, x, y, onPick, onClose }) {
  const { t: t2 } = useTranslation("workbench");
  const ref = useMenuDismiss(onClose);
  const providers = useProviders().filter((p) => p.enabled !== false);
  const cur = node.model;
  const item = (providerId, modelId, label, sub) => {
    const checked = cur?.providerId === providerId && (cur.modelId ?? "") === modelId;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        role: "menuitemradio",
        "aria-checked": checked,
        className: `wb-model-item${sub ? " is-sub" : ""}`,
        onClick: () => {
          onClose();
          if (!checked) onPick(node, providerId, modelId);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
          checked && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5", "aria-hidden": true })
        ]
      },
      `${providerId}|${modelId}`
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref,
      role: "menu",
      "aria-label": t2("canvas.menu.switchModelTitle", { title: node.title }),
      className: "wb-node-menu wb-model-picker",
      style: { left: Math.min(x, window.innerWidth - 260), top: Math.min(y, window.innerHeight - 380) },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wb-model-head", children: t2("canvas.menu.switchModelHint") }),
        providers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wb-model-head", children: t2("canvas.menu.noProviders") }),
        providers.map((p) => [
          item(p.id, "", p.defaultModel ? t2("canvas.menu.providerDefault", { name: p.name, model: p.defaultModel }) : p.name),
          ...(p.availableModels ?? []).filter((m) => m && m !== p.defaultModel).map((m) => item(p.id, m, m, true))
        ])
      ]
    }
  );
}
function groupMenuActions(group, ctx) {
  const out = [];
  if (group.kind === "work") out.push("newSession", "rename", "dirRules", "summarizeToday", "summarizeWeek");
  if (group.kind === "project" && ctx.hasProject) {
    out.push("switchProject");
    if (ctx.hasPath) out.push("openFolder", "copyPath");
  }
  if (groupHistoryKey(group)) out.push("history");
  if (group.kind === "project") out.push(ctx.filtered ? "unfilter" : "filter");
  out.push(group.collapsed ? "expand" : "collapse");
  out.push(group.locked ? "unlock" : "lock");
  if (group.kind === "user") out.push("remove");
  if (group.kind === "work") out.push("archive");
  return out;
}
function CanvasGroupMenu({ group, ctx, x, y, onAction, onColor, onClose }) {
  const { t: t2 } = useTranslation("workbench");
  const ref = useMenuDismiss(onClose);
  const actions = groupMenuActions(group, ctx);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref,
      role: "menu",
      "aria-label": t2("canvas.menu.label", { title: group.title }),
      className: "wb-node-menu",
      style: { left: Math.min(x, window.innerWidth - 190), top: Math.min(y, window.innerHeight - 34 * (actions.length + (group.kind === "work" ? 1 : 0)) - 16) },
      children: [
        group.kind === "work" && onColor && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "group", "aria-label": t2("canvas.groupMenu.color"), className: "wb-color-row", children: WORK_GROUP_COLORS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            role: "menuitemradio",
            "aria-checked": group.color === c,
            "aria-label": t2(`canvas.groupColor.${c}`),
            title: t2(`canvas.groupColor.${c}`),
            className: "wb-color-swatch",
            style: { background: WORK_GROUP_HEX[c] },
            onClick: () => {
              onClose();
              onColor(c, group);
            }
          },
          c
        )) }),
        actions.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: a === "remove" || a === "archive" ? "wb-node-menu-danger" : void 0,
            onClick: () => {
              onClose();
              onAction(a, group);
            },
            children: t2(`canvas.groupMenu.${a}`)
          },
          a
        ))
      ]
    }
  );
}
function CanvasPaneMenu({ x, y, selectMode, hiddenCount, onAction, onClose }) {
  const { t: t2 } = useTranslation("workbench");
  const ref = useMenuDismiss(onClose);
  const actions = ["newSession", "newGroup", "tidy", "fitView", "selectMode", ...hiddenCount > 0 ? ["showHidden"] : []];
  const label = (a) => a === "selectMode" ? t2(selectMode ? "canvas.paneMenu.selectOff" : "canvas.paneMenu.selectOn") : a === "showHidden" ? t2("canvas.showHidden", { count: hiddenCount }) : a === "newSession" || a === "newGroup" ? t2(`canvas.paneMenu.${a}`) : t2(`canvas.${a}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, role: "menu", "aria-label": t2("canvas.paneMenu.label"), className: "wb-node-menu", style: { left: Math.min(x, window.innerWidth - 190), top: Math.min(y, window.innerHeight - 34 * actions.length - 16) }, children: actions.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      role: "menuitem",
      onClick: () => {
        onClose();
        onAction(a);
      },
      children: label(a)
    },
    a
  )) });
}
function parseDirRules(text) {
  return [...new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
}
const inputCls$1 = "w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20";
function WorkGroupEditDialog({ mode, title, dirRules, onSubmit, onCancel }) {
  const { t: t2 } = useTranslation("workbench");
  const [draft, setDraft] = reactExports.useState(mode === "dirRules" ? dirRules.join("\n") : title);
  const fieldRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (mode === "archive") return;
    const id = window.setTimeout(() => fieldRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [mode]);
  const submit = () => {
    if (mode === "archive") return onSubmit({});
    if (mode === "dirRules") return onSubmit({ dirRules: parseDirRules(draft) });
    const name = draft.trim();
    if (name && name !== title) onSubmit({ name });
    else onCancel();
  };
  const keepEnter = (e) => e.key === "Enter" && e.stopPropagation();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    ConfirmDialog,
    {
      open: true,
      title: t2(`canvas.workGroup.${mode}Title`, { title }),
      message: t2(`canvas.workGroup.${mode}Message`, { title }),
      danger: mode === "archive",
      confirmText: t2(mode === "archive" ? "canvas.groupMenu.archive" : "canvas.workGroup.save"),
      maxWidthClassName: mode === "dirRules" ? "max-w-lg" : "max-w-sm",
      onConfirm: submit,
      onCancel,
      children: [
        mode === "rename" && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fieldRef, "aria-label": t2("canvas.group.rename"), value: draft, onChange: (e) => setDraft(e.target.value), className: inputCls$1 }),
        mode === "dirRules" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            ref: fieldRef,
            "aria-label": t2("canvas.workGroup.dirRulesTitle", { title }),
            rows: 6,
            value: draft,
            spellCheck: false,
            placeholder: t2("canvas.workGroup.dirRulesPlaceholder"),
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: keepEnter,
            className: `${inputCls$1} font-mono text-xs`
          }
        )
      ]
    }
  );
}
const inputCls = "w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20";
function SessionRenameDialog({ name, onSubmit, onCancel }) {
  const { t: t2 } = useTranslation("workbench");
  const [draft, setDraft] = reactExports.useState(name);
  const fieldRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const id = window.setTimeout(() => fieldRef.current?.select(), 0);
    return () => window.clearTimeout(id);
  }, []);
  const submit = () => {
    const next = draft.trim();
    if (next && next !== name) onSubmit(next);
    else onCancel();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ConfirmDialog, { open: true, title: t2("canvas.menu.renameTitle"), message: name, confirmText: t2("canvas.workGroup.save"), maxWidthClassName: "max-w-sm", onConfirm: submit, onCancel, children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fieldRef, "aria-label": t2("canvas.menu.renameTitle"), value: draft, onChange: (e) => setDraft(e.target.value), className: inputCls }) });
}
function workGroupAssignments(drops, membership) {
  const out = /* @__PURE__ */ new Map();
  for (const { node, home } of drops) {
    const sid = node.kind === "session" ? node.ref.sessionId : void 0;
    if (!sid || home?.id === node.groupId || home?.kind === "attention") continue;
    const target = home?.kind === "work" ? workGroupIdFromCanvas(home.id) : null;
    if (target === (membership[sid]?.groupId ?? null)) continue;
    out.set(target, [...out.get(target) ?? [], sid]);
  }
  return out;
}
const api = () => window.shineAI?.workGroups;
const toastFail = (error) => useUIStore.getState().showToast(instance.t("workbench:canvas.workGroup.failed", { error }), "error");
function assignSessions(sessionIds, groupId) {
  const wg = api();
  if (!wg?.assign || !sessionIds.length) return;
  const store = useWorkGroupStore.getState();
  const membership = { ...store.membership };
  for (const id of sessionIds) membership[id] = { groupId, priority: membership[id]?.priority ?? null };
  useWorkGroupStore.setState({ membership });
  wg.assign(sessionIds, groupId).then(
    (r) => {
      if (!r.ok) {
        void store.refresh();
        toastFail(r.error);
      }
    },
    (e) => {
      void store.refresh();
      toastFail(String(e));
    }
  );
}
function updateWorkGroup(canvasId, patch) {
  const id = workGroupIdFromCanvas(canvasId);
  const wg = api();
  if (!id || !wg?.update) return;
  wg.update(id, patch).then((r) => {
    if (!r.ok) toastFail(r.error);
  }, (e) => toastFail(String(e)));
}
function archiveWorkGroup(canvasId) {
  const id = workGroupIdFromCanvas(canvasId);
  const wg = api();
  if (!id || !wg?.archive) return Promise.resolve(false);
  return wg.archive(id).then((r) => {
    if (!r.ok) toastFail(r.error);
    return r.ok;
  }, (e) => {
    toastFail(String(e));
    return false;
  });
}
const workGroupsAvailable = () => Boolean(api()?.create) && useWorkGroupStore.getState().available;
async function createWorkGroup(name) {
  const wg = api();
  if (!wg?.create) return null;
  try {
    const r = await wg.create({ name });
    if (r.ok) return r.data;
    toastFail(r.error);
  } catch (e) {
    toastFail(String(e));
  }
  return null;
}
const TIMELINE_KEY = "shineai.canvas.timeline.open";
const HINT_KEY = "shineai.canvas.hint.dismissed";
const PULSE_EDGE_KINDS = /* @__PURE__ */ new Set(["feeds", "user"]);
const isUrl = (s) => /^[a-z][a-z0-9+.-]*:\/\//i.test(s);
const localId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).slice(0, 12);
function openInboxTarget(target) {
  const shell = window.shineAI?.shell;
  if (isUrl(target)) void shell?.openExternal?.(target);
  else void shell?.openPath?.(target);
}
function readHintOpen() {
  return false; // Detailed help opens on demand, never over the startup screen.
}
function writeHintDismissed(dismissed) {
  try {
    if (dismissed) localStorage.setItem(HINT_KEY, "1");
    else localStorage.removeItem(HINT_KEY);
  } catch {
  }
}
const AUTO_TIDY_KEY = "shineai.canvas.autoTidy";
function readAutoTidy() {
  try {
    return localStorage.getItem(AUTO_TIDY_KEY) !== "0";
  } catch {
    return true;
  }
}
function writeAutoTidy(on2) {
  try {
    localStorage.setItem(AUTO_TIDY_KEY, on2 ? "1" : "0");
  } catch {
  }
}
const SELECT_MODE_KEY = "shineai.canvas.selectMode";
function readSelectMode() {
  try {
    return localStorage.getItem(SELECT_MODE_KEY) === "1";
  } catch {
    return false;
  }
}
function readTimelineOpen() {
  try {
    return localStorage.getItem(TIMELINE_KEY) === "1";
  } catch {
    return false;
  }
}
function ConnectOverlay({ from, onDone }) {
  const [to, setTo] = reactExports.useState(from);
  reactExports.useEffect(() => {
    const move = (e) => setTo({ x: e.clientX, y: e.clientY });
    const up = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      onDone(el?.closest("[data-node-id]")?.dataset.nodeId ?? null, { x: e.clientX, y: e.clientY });
    };
    const cancel = (e) => e.key === "Escape" && onDone(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("keydown", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", cancel);
    };
  }, [onDone]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "wb-connect-line pointer-events-none fixed inset-0 z-50 h-full w-full", "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: `M${from.x},${from.y} C${from.x + 60},${from.y} ${to.x - 60},${to.y} ${to.x},${to.y}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: to.x, cy: to.y, r: 4 })
  ] });
}
const sessionOf = (n) => n?.kind === "session" ? n.ref.sessionId ?? null : null;
function watchBetween(src, dst) {
  void useSessionStore.getState().watchSession(sessionOf(src), sessionOf(dst)).then((r) => useUIStore.getState().showToast(
    r.ok ? instance.t("workbench:canvas.watch.added", { from: src.title, to: dst.title }) : instance.t("workbench:canvas.menu.actionFailed", { error: r.error }),
    r.ok ? "success" : "error"
  ));
}
async function unwatchAndToast(watcher, target) {
  const r = await useSessionStore.getState().unwatchSession(watcher, target);
  useUIStore.getState().showToast(r.ok ? instance.t("workbench:canvas.watch.removed") : instance.t("workbench:canvas.menu.actionFailed", { error: r.error }), r.ok ? "success" : "error");
}
async function deriveFromCard(sessionId, title) {
  const store = useSessionStore.getState();
  const source = store.sessions.find((s) => s.id === sessionId);
  try {
    await createDerivedSession({
      sourceSessionId: sessionId,
      source,
      providers: await ensureProviders(),
      autoWorktreeDefault: useSettingsStore.getState().settings.autoWorktree,
      name: instance.t("conversationConversationAgentStatusBar:derivedSession.derivedName", { name: source?.name || title }),
      createSession: store.createSession
    });
    useUIStore.getState().showToast(instance.t("workbench:canvas.derive.done", { title }), "success");
  } catch (err) {
    useUIStore.getState().showToast(instance.t("workbench:canvas.menu.actionFailed", { error: err instanceof Error ? err.message : String(err) }), "error");
  }
}
function CanvasBoard({ model, layout, ticks, replayAt: replayAt2, layoutLoaded, now, updateLayout, undoLayout, onViewportAspect, projectContextOf, groupKeyOfSession }) {
  const { t: t2 } = useTranslation("workbench");
  const flow = useReactFlow();
  const store = useStoreApi();
  const [filter, setFilter] = reactExports.useState(DEFAULT_FILTER);
  const [focusId, setFocusId] = reactExports.useState(null);
  const focusIds = reactExports.useMemo(() => focusId ? lineageNodeIds(focusId, model.edges) : null, [focusId, model.edges]);
  const focusNode = focusId ? model.nodes.find((n) => n.id === focusId) : void 0;
  const viewFilter = reactExports.useMemo(() => focusIds ? { ...filter, focus: focusIds } : filter, [filter, focusIds]);
  reactExports.useEffect(() => {
    if (focusId && !focusNode) setFocusId(null);
  }, [focusId, focusNode]);
  reactExports.useEffect(() => {
    if (!focusId) return;
    const esc = (e) => e.key === "Escape" && !isTypingTarget(e.target) && setFocusId(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [focusId]);
  const [replayMs, setReplayMs] = reactExports.useState(null);
  const [timelineOpen, setTimelineOpen] = reactExports.useState(readTimelineOpen);
  const [hintOpen, setHintOpen] = reactExports.useState(readHintOpen);
  const showHint = reactExports.useCallback(() => {
    writeHintDismissed(false);
    setHintOpen(true);
  }, []);
  const dismissHint = reactExports.useCallback(() => {
    writeHintDismissed(true);
    setHintOpen(false);
  }, []);
  const [openNodeId, setOpenNodeId] = reactExports.useState(null);
  const openNodeIdRef = reactExports.useRef(openNodeId);
  openNodeIdRef.current = openNodeId;
  const [historyGroupId, setHistoryGroupId] = reactExports.useState(null);
  const [summary, setSummary] = reactExports.useState(null);
  const [groupEdit, setGroupEdit] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (openNodeId) {
      setHistoryGroupId(null);
      setSummary(null);
    }
  }, [openNodeId]);
  const [pulses, setPulses] = reactExports.useState({});
  const [connecting, setConnecting] = reactExports.useState(null);
  const connectingRef = reactExports.useRef(connecting);
  connectingRef.current = connecting;
  const [connectChoice, setConnectChoice] = reactExports.useState(null);
  const [nodes, setNodes] = reactExports.useState([]);
  const [menu, setMenu] = reactExports.useState(null);
  const [groupMenu, setGroupMenu] = reactExports.useState(null);
  const [paneMenu, setPaneMenu] = reactExports.useState(null);
  const rightDown = reactExports.useRef(null);
  const [shareSessionId, setShareSessionId] = reactExports.useState(null);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [renameTarget, setRenameTarget] = reactExports.useState(null);
  const [modelPicker, setModelPicker] = reactExports.useState(null);
  const latest = reactExports.useRef({ model, layout });
  latest.current = { model, layout };
  const projectContextRef = reactExports.useRef(projectContextOf);
  projectContextRef.current = projectContextOf;
  const filterRef = reactExports.useRef(filter);
  filterRef.current = filter;
  const nodesRef = reactExports.useRef(nodes);
  nodesRef.current = nodes;
  const dragging = reactExports.useRef(false);
  const groupDrag = reactExports.useRef(null);
  const replay = reactExports.useMemo(() => replayMs === null ? null : replayAt2(replayMs), [replayMs, replayAt2]);
  const membership = useWorkGroupStore((s) => s.membership);
  reactExports.useEffect(() => {
    if (dragging.current) return;
    setNodes((prev) => buildFlowNodes(model, { filter: viewFilter, replay, membership }, new Map(prev.map((n) => [n.id, n]))));
  }, [model, viewFilter, replay, membership]);
  const [selectedEdgeIds, setSelectedEdgeIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const edges = reactExports.useMemo(
    () => buildFlowEdges(model, pulses, focusIds).map((e) => selectedEdgeIds.has(e.id) ? { ...e, selected: true } : e),
    [model, pulses, focusIds, selectedEdgeIds]
  );
  const onEdgesChange = reactExports.useCallback((changes) => {
    setSelectedEdgeIds((prev) => {
      const next = new Set(prev);
      for (const c of changes) {
        if (c.type === "select") c.selected ? next.add(c.id) : next.delete(c.id);
        else if (c.type === "remove") next.delete(c.id);
      }
      return next;
    });
  }, []);
  const prevStatus = reactExports.useRef(/* @__PURE__ */ new Map());
  reactExports.useEffect(() => {
    const done = new Set(finishedRuns(prevStatus.current, model.nodes));
    prevStatus.current = new Map(model.nodes.map((n) => [n.id, n.status]));
    if (done.size === 0) return;
    const ids = model.edges.filter((e) => done.has(e.source) && PULSE_EDGE_KINDS.has(e.kind)).map((e) => e.id);
    if (ids.length === 0) return;
    const stamp = Date.now();
    setPulses((p) => ({ ...p, ...Object.fromEntries(ids.map((id) => [id, stamp])) }));
    window.setTimeout(() => {
      setPulses((p) => Object.fromEntries(Object.entries(p).filter(([id, v]) => !(ids.includes(id) && v === stamp))));
    }, EDGE_PULSE_MS + 300);
  }, [model]);
  const stageRef = reactExports.useRef(null);
  const composerRef = reactExports.useRef(null);
  const composerInset = reactExports.useCallback(() => {
    const stage = stageRef.current?.getBoundingClientRect();
    const box = composerRef.current?.getBoundingClientRect();
    return stage && box && box.height > 0 ? Math.max(0, stage.bottom - box.top) : 0;
  }, []);
  const [aspectKnown, setAspectKnown] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return setAspectKnown(true);
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      const height = entry.contentRect.height - composerInset();
      if (width > 0 && height > 0) onViewportAspect?.(Math.round(width / height * 10) / 10);
      setAspectKnown(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onViewportAspect, composerInset]);
  const fitAll = reactExports.useCallback((duration) => {
    const { width, height } = store.getState();
    const shown = flow.getNodes().filter((n) => !n.hidden);
    if (!width || !height || shown.length === 0) return;
    const b = flow.getNodesBounds(shown);
    const awaitingGroups = new Set(shown.flatMap((n) => !isGroupFlowNode(n) && n.data.node.status === "awaiting" ? [n.data.node.groupId] : []));
    const focusNode2 = shown.find((n) => isGroupFlowNode(n) && awaitingGroups.has(n.id));
    const fb = focusNode2 ? flow.getNodesBounds([focusNode2]) : null;
    const vp = fitViewport({ x: b.x, y: b.y, w: b.width, h: b.height }, { width, height }, {
      padding: FIT_PAD_PX,
      minZoom: FIT_MIN_ZOOM,
      maxZoom: 1,
      bottomInset: composerInset(),
      focus: fb && { x: fb.x, y: fb.y, w: fb.width, h: fb.height }
    });
    void flow.setViewport(vp, duration ? { duration } : void 0);
  }, [flow, store, composerInset]);
  const viewportRestored = reactExports.useRef(false);
  const hasNodes = nodes.length > 0;
  reactExports.useEffect(() => {
    if (!layoutLoaded || viewportRestored.current) return;
    const vp = latest.current.layout.viewport;
    const saved = vp.x !== 0 || vp.y !== 0 || vp.zoom !== 1;
    if (!saved && (!hasNodes || !aspectKnown)) return;
    const id = window.setTimeout(() => {
      viewportRestored.current = true;
      if (saved) void flow.setViewport(vp);
      else fitAll();
    }, 50);
    return () => window.clearTimeout(id);
  }, [layoutLoaded, hasNodes, aspectKnown, flow, fitAll]);
  const onMoveEnd = reactExports.useCallback(
    (_, vp) => {
      if (!viewportRestored.current) return;
      updateLayout((prev) => setViewport(prev, { x: vp.x, y: vp.y, zoom: vp.zoom }));
    },
    [updateLayout]
  );
  const viewportCenter = reactExports.useCallback(() => {
    const { width, height, transform } = store.getState();
    const [tx, ty, zoom] = transform;
    return { x: (width / 2 - tx) / zoom, y: (height / 2 - ty) / zoom };
  }, [store]);
  const changeFilter = reactExports.useCallback(
    (next) => {
      setFilter(next);
      if (next.filter !== "mine" && next.filter !== "running") return;
      const ids = latest.current.model.nodes.filter((n) => matchesFilter(n, next.filter) && (!next.groupId || n.groupId === next.groupId)).map((n) => ({ id: n.id }));
      if (ids.length > 0) requestAnimationFrame(() => void flow.fitView({ nodes: ids, padding: 0.2, maxZoom: 1, duration: 300 }));
    },
    [flow]
  );
  const locate2 = reactExports.useCallback(
    (id) => {
      const target = latest.current.model.nodes.find((n) => n.id === id);
      if (!target) return;
      setReplayMs(null);
      const group = latest.current.model.groups.find((g) => g.id === target.groupId);
      if (group?.collapsed) updateLayout((prev) => expandGroup(prev, group, latest.current.model.groups));
      setNodes((ns) => ns.map((n) => !!n.selected === (n.id === id) ? n : { ...n, selected: n.id === id }));
      requestAnimationFrame(() => void flow.fitView({ nodes: [{ id }], padding: 0.8, maxZoom: 1.1, duration: 300 }));
    },
    [flow, updateLayout]
  );
  reactExports.useEffect(
    () => registerCanvasFocus((req) => {
      const hit = findFocusNode(latest.current.model.nodes, req);
      if (!hit) return false;
      locate2(hit.id);
      return true;
    }),
    [locate2]
  );
  const actions = reactExports.useMemo(
    () => ({
      openNode: (node) => {
        if (node.kind === "idea") {
          useIdeaEditStore.setState({ editingId: node.id });
          return;
        }
        if (node.kind === "inbox") {
          const target = latest.current.layout.inboxes.find((i) => i.id === node.ref.localId)?.openTarget;
          if (target) openInboxTarget(target);
          return;
        }
        if (drawerKindOf(node)) {
          setOpenNodeId(node.id);
          return;
        }
        if (node.ref.goalId) navigateToProposalTarget({ view: "goal", id: node.ref.goalId });
      },
      startConnect: (node, e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setConnecting({ sourceId: node.id, from: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
      },
      updateGroup: (group) => {
        const cur = latest.current.model.groups.find((g) => g.id === group.id);
        if (group.kind === "work" && cur && group.title !== cur.title) {
          updateWorkGroup(group.id, { name: group.title });
          return;
        }
        const onlyCollapse = cur && !cur.collapsed !== !group.collapsed && cur.x === group.x && cur.y === group.y && cur.w === group.w && cur.h === group.h && cur.title === group.title;
        const groups = latest.current.model.groups;
        updateLayout((prev) => !onlyCollapse ? upsertGroup(prev, group) : group.collapsed ? setGroupCollapsed(prev, group, true) : expandGroup(prev, group, groups));
      },
      removeGroup: (id) => updateLayout((prev) => removeGroup(prev, id)),
      dispatchIdea: (node, as) => {
        const idea = latest.current.layout.ideas.find((i) => i.id === node.ref.localId);
        if (!idea) return;
        const accepted = useCanvasDockStore.getState().dispatchIdea({ ...idea, x: node.x, y: node.y, groupId: node.groupId }, as);
        if (!accepted) useUIStore.getState().showToast(instance.t("canvasDock:toast.ideaBusy"), "info");
      },
      deleteIdea: (node) => {
        const id = node.ref.localId;
        if (id) updateLayout((prev) => removeIdea(prev, id));
      },
      editIdea: (node, text) => {
        const id = node.ref.localId;
        if (id) updateLayout((prev) => updateIdeaText(prev, id, text));
      },
      tagIdea: (node, tag) => {
        const id = node.ref.localId;
        if (id) updateLayout((prev) => setIdeaTag(prev, id, tag));
      },
      resizeIdea: (node, box) => {
        const id = node.ref.localId;
        if (id) updateLayout((prev) => setIdeaSize(moveNode(prev, node.id, box.x, box.y), id, box.width, box.height));
      },
      openGroupHistory: (group) => {
        setOpenNodeId(null);
        setSummary(null);
        setHistoryGroupId(group.id);
      },
      newSessionInGroup: (group) => {
        const gid = workGroupIdFromCanvas(group.id);
        if (!gid) return;
        useWorkGroupComposerStore.getState().setComposerGroupId(gid);
        useCanvasDockStore.getState().focusComposer();
      }
    }),
    [updateLayout]
  );
  const onConnectDone = reactExports.useCallback(
    (targetId, at) => {
      const c = connectingRef.current;
      setConnecting(null);
      if (!c || !targetId || targetId === c.sourceId) return;
      const nodesById = new Map(latest.current.model.nodes.map((n) => [n.id, n]));
      const src = nodesById.get(c.sourceId);
      const dst = nodesById.get(targetId);
      const watchable = Boolean(sessionOf(src) && sessionOf(dst));
      if (c.watch) {
        if (watchable) watchBetween(src, dst);
        else useUIStore.getState().showToast(t2("canvas.watch.needSessions"), "info");
        return;
      }
      if (watchable && at) {
        setConnectChoice({ sourceId: c.sourceId, targetId, x: at.x, y: at.y });
        return;
      }
      updateLayout((prev) => addUserEdge(prev, c.sourceId, targetId));
    },
    [t2, updateLayout]
  );
  const onConnectChoice = reactExports.useCallback(
    (choice) => {
      const c = connectChoice;
      setConnectChoice(null);
      if (!c) return;
      if (choice === "link") {
        updateLayout((prev) => addUserEdge(prev, c.sourceId, c.targetId));
        return;
      }
      const nodesById = new Map(latest.current.model.nodes.map((n) => [n.id, n]));
      const src = nodesById.get(c.sourceId);
      const dst = nodesById.get(c.targetId);
      if (src && dst) watchBetween(src, dst);
    },
    [connectChoice, updateLayout]
  );
  const onNodesChange = reactExports.useCallback((changes) => {
    setNodes((ns) => applyNodeChanges(changes, ns));
  }, []);
  const onNodeDragStart = reactExports.useCallback((_, _node, dragged) => {
    dragging.current = true;
    const starts = new Map(dragged.filter(isGroupFlowNode).map((n) => [n.id, { ...n.position }]));
    if (starts.size === 0) return;
    const draggedIds = new Set(dragged.map((n) => n.id));
    const members = /* @__PURE__ */ new Map();
    for (const n of nodesRef.current) {
      if (!isGroupFlowNode(n) && starts.has(n.data.node.groupId) && !draggedIds.has(n.id)) members.set(n.id, { ...n.position, groupId: n.data.node.groupId });
    }
    groupDrag.current = { starts, members };
  }, []);
  const onNodeDrag = reactExports.useCallback((_, _node, dragged) => {
    const g = groupDrag.current;
    if (!g || g.members.size === 0) return;
    const delta = /* @__PURE__ */ new Map();
    for (const d of dragged) {
      const s = g.starts.get(d.id);
      if (s) delta.set(d.id, { dx: d.position.x - s.x, dy: d.position.y - s.y });
    }
    setNodes((ns) => ns.map((n) => {
      const m = g.members.get(n.id);
      const d = m && delta.get(m.groupId);
      return m && d ? { ...n, position: { x: m.x + d.dx, y: m.y + d.dy } } : n;
    }));
  }, []);
  const onNodeDragStop = reactExports.useCallback(
    (_, _node, dragged) => {
      dragging.current = false;
      const g = groupDrag.current;
      groupDrag.current = null;
      const current = new Map(nodesRef.current.map((n) => [n.id, n]));
      const frames = nodesRef.current.filter(isGroupFlowNode).map((n) => ({
        ...n.data.group,
        x: n.position.x,
        y: n.position.y,
        w: n.width ?? n.data.group.w,
        h: n.height ?? n.data.group.h
      }));
      const draggedGroups = new Set(dragged.filter(isGroupFlowNode).map((d) => d.id));
      const shift = /* @__PURE__ */ new Map();
      const boxOf = (f) => ({ x: f.x, y: f.y, w: f.w, h: f.collapsed ? GROUP_HEADER_H : f.h });
      const settled = frames.filter((f) => !draggedGroups.has(f.id)).map(boxOf);
      for (const f of frames) {
        if (!draggedGroups.has(f.id)) continue;
        const box = boxOf(f);
        const at = settleDroppedGroup(box, settled);
        settled.push({ ...box, ...at });
        if (at.x !== f.x || at.y !== f.y) shift.set(f.id, { dx: at.x - f.x, dy: at.y - f.y });
      }
      const shifted = (x, y, groupId) => {
        const s = groupId ? shift.get(groupId) : void 0;
        return s ? { x: x + s.dx, y: y + s.dy } : { x, y };
      };
      const drops = [];
      updateLayout((prev) => {
        let next = prev;
        drops.length = 0;
        for (const d of dragged) {
          if (isGroupFlowNode(d)) {
            const p2 = shifted(d.position.x, d.position.y, d.id);
            next = upsertGroup(next, { ...d.data.group, x: p2.x, y: p2.y });
            continue;
          }
          const w = d.measured?.width ?? DEFAULT_NODE_SIZE.w;
          const h = d.measured?.height ?? DEFAULT_NODE_SIZE.h;
          const home = groupAt({ x: d.position.x + w / 2, y: d.position.y + h / 2 }, frames);
          drops.push({ node: d.data.node, home });
          const p = shifted(d.position.x, d.position.y, home?.id);
          next = moveNode(next, d.id, p.x, p.y, home?.id ?? CANVAS_GROUP_OTHER);
          if (home && !isFixedGroup(home)) next = upsertGroup(next, home);
        }
        if (g) {
          for (const [id, m] of g.members) {
            const n = current.get(id);
            if (!n) continue;
            const p = shifted(n.position.x, n.position.y, m.groupId);
            next = moveNode(next, id, p.x, p.y, m.groupId);
          }
        }
        return next;
      });
      for (const [groupId, ids] of workGroupAssignments(drops, useWorkGroupStore.getState().membership)) assignSessions(ids, groupId);
    },
    [updateLayout]
  );
  const onBeforeDelete = reactExports.useCallback(async ({ nodes: ns, edges: es }) => ({
    nodes: ns.filter((n) => isGroupFlowNode(n) ? n.data.group.kind === "user" : n.data.node.kind === "inbox" || n.data.node.kind === "idea"),
    edges: es.filter((e) => e.data?.edge.kind === "user" || e.data?.edge.kind === "watches")
  }), []);
  const onDelete = reactExports.useCallback(
    ({ nodes: ns, edges: es }) => {
      const nodesById = new Map(latest.current.model.nodes.map((n) => [n.id, n]));
      for (const e of es) {
        if (e.data?.edge.kind !== "watches") continue;
        const watcher = sessionOf(nodesById.get(e.source));
        const target = sessionOf(nodesById.get(e.target));
        if (watcher && target) void unwatchAndToast(watcher, target);
      }
      updateLayout((prev) => {
        let next = prev;
        for (const e of es) if (e.data?.edge.kind !== "watches") next = removeUserEdge(next, e.source, e.target);
        for (const n of ns) {
          if (isGroupFlowNode(n)) next = removeGroup(next, n.id);
          else if (n.data.node.ref.localId) next = n.data.node.kind === "idea" ? removeIdea(next, n.data.node.ref.localId) : removeInbox(next, n.data.node.ref.localId);
        }
        return next;
      });
    },
    [updateLayout]
  );
  const onFit = reactExports.useCallback(() => fitAll(200), [fitAll]);
  const runTidy = reactExports.useCallback((manual, restoreHidden = false) => {
    const sizes = {};
    for (const n of nodesRef.current) if (n.measured?.width && n.measured.height) sizes[n.id] = { w: n.measured.width, h: n.measured.height };
    const { model: m } = latest.current;
    const hidden = restoreHidden ? m.nodes.filter((n) => n.hidden) : [];
    const nodesForTidy = hidden.length ? m.nodes.map((n) => n.hidden ? { ...n, hidden: false } : n) : m.nodes;
    updateLayout((prev) => {
      const shown = hidden.reduce((l, n) => hideNode(l, n.id, false, { x: n.x, y: n.y }), prev);
      return tidyLayout(resetAutoGroups(shown, false), m.groups.filter(isFixedGroup), nodesForTidy, sizes);
    });
    if (manual) window.setTimeout(() => fitAll(200), 120);
  }, [updateLayout, fitAll]);
  const onTidy = reactExports.useCallback(() => runTidy(true), [runTidy]);
  const onShowHidden = reactExports.useCallback(() => runTidy(true, true), [runTidy]);
  const hiddenCount = reactExports.useMemo(() => model.nodes.filter((n) => n.hidden).length, [model.nodes]);
  const [selectMode, setSelectMode] = reactExports.useState(readSelectMode);
  const toggleSelectMode = reactExports.useCallback(() => setSelectMode((v) => {
    try {
      localStorage.setItem(SELECT_MODE_KEY, v ? "0" : "1");
    } catch {
    }
    return !v;
  }), []);
  const [autoTidy, setAutoTidy] = reactExports.useState(readAutoTidy);
  const toggleAutoTidy = reactExports.useCallback(() => setAutoTidy((v) => {
    writeAutoTidy(!v);
    return !v;
  }), []);
  const tidySig = reactExports.useMemo(
    () => model.nodes.filter((n) => !n.hidden).map((n) => `${n.id}|${n.groupId}|${n.density ?? ""}|${n.status === "running" ? 1 : 0}`).sort().join("\n"),
    [model.nodes]
  );
  const lastTidySig = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!layoutLoaded || lastTidySig.current === null) {
      lastTidySig.current = layoutLoaded ? tidySig : null;
      return;
    }
    if (!autoTidy || replayMs !== null || tidySig === lastTidySig.current) return;
    const id = window.setTimeout(() => {
      if (dragging.current) return;
      lastTidySig.current = tidySig;
      runTidy(false);
    }, 300);
    return () => window.clearTimeout(id);
  }, [tidySig, autoTidy, replayMs, layoutLoaded, runTidy]);
  reactExports.useEffect(() => {
    if (!layoutLoaded || replayMs !== null || !fixedGroupsOverlap(model.groups)) return;
    const id = window.setTimeout(() => {
      if (dragging.current) return;
      updateLayout((prev) => separateFixedGroups(prev, latest.current.model.groups));
    }, 300);
    return () => window.clearTimeout(id);
  }, [model.groups, layoutLoaded, replayMs, updateLayout]);
  const newGroupAt = reactExports.useCallback((at) => {
    const title = t2("canvas.group.newTitle");
    if (!workGroupsAvailable()) {
      updateLayout((prev) => upsertGroup(prev, { id: `user:${localId()}`, kind: "user", title, x: at.x, y: at.y, w: 480, h: 280, userTouched: true }));
      return;
    }
    void createWorkGroup(title).then((g) => {
      if (g) updateLayout((prev) => upsertGroup(prev, { id: workGroupCanvasId(g.id), kind: "work", title: g.name, x: at.x, y: at.y, w: 480, h: 280, userTouched: true }));
    });
  }, [t2, updateLayout]);
  const onNewGroup = reactExports.useCallback(() => {
    const c = viewportCenter();
    newGroupAt({ x: c.x - 240, y: c.y - 140 });
  }, [newGroupAt, viewportCenter]);
  const onNewInbox = reactExports.useCallback(
    (title, openTarget) => {
      const c = viewportCenter();
      const id = localId();
      updateLayout((prev) => {
        const next = upsertInbox(prev, { id, title, subKind: openTarget && !isUrl(openTarget) ? "folder" : "list", openTarget, x: c.x, y: c.y });
        return moveNode(next, `inbox:${id}`, c.x - DEFAULT_NODE_SIZE.w / 2, c.y - DEFAULT_NODE_SIZE.h / 2, groupAt(c, latest.current.model.groups)?.id ?? CANVAS_GROUP_OTHER);
      });
    },
    [updateLayout, viewportCenter]
  );
  const onPin = reactExports.useCallback(
    (node) => {
      updateLayout((prev) => {
        const at = { x: node.x, y: node.y };
        const pinned = pinNode(prev, node.id, true, at);
        return node.hidden ? hideNode(pinned, node.id, false, at) : pinned;
      });
      locate2(node.id);
    },
    [locate2, updateLayout]
  );
  const switchToProject = reactExports.useCallback(
    (group) => {
      const ctx = group.projectKey ? projectContextRef.current?.(group.projectKey) : null;
      if (!ctx) return;
      const ui = useUIStore.getState();
      if (ctx.workspaceId) ui.setNewSessionDialogInitialWorkspaceId(ctx.workspaceId);
      else ui.setNewSessionDialogInitialDir(ctx.workingDirectory);
      useCanvasDockStore.getState().focusComposer();
      ui.showToast(t2("canvas.groupMenu.switched", { title: group.title }), "success");
    },
    [t2]
  );
  const onNodeContextMenu = reactExports.useCallback((e, n) => {
    e.preventDefault();
    if (isGroupFlowNode(n)) setGroupMenu({ groupId: n.id, x: e.clientX, y: e.clientY });
    else setMenu({ nodeId: n.id, x: e.clientX, y: e.clientY });
  }, []);
  const onNodeDoubleClick = reactExports.useCallback((e, n) => {
    if (isGroupFlowNode(n)) {
      if (n.data.group.kind !== "project" || e.target.closest(".wb-group-title, input, button")) return;
      switchToProject(n.data.group);
      return;
    }
    const { kind, ref } = n.data.node;
    if (kind === "session" && ref.sessionId) openFullConversation(ref.sessionId);
  }, [switchToProject]);
  const closeMenu = reactExports.useCallback(() => setMenu(null), []);
  const closeConnectChoice = reactExports.useCallback(() => setConnectChoice(null), []);
  const closeModelPicker = reactExports.useCallback(() => setModelPicker(null), []);
  const closeGroupMenu = reactExports.useCallback(() => setGroupMenu(null), []);
  const onPaneContextMenu = reactExports.useCallback((e) => {
    e.preventDefault();
    const d = rightDown.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) return;
    setPaneMenu({ x: e.clientX, y: e.clientY, at: flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }) });
  }, [flow]);
  const closePaneMenu = reactExports.useCallback(() => setPaneMenu(null), []);
  const onGroupMenuAction = reactExports.useCallback(
    (action, group) => {
      const path = group.projectKey ? projectContextRef.current?.(group.projectKey)?.workingDirectory : void 0;
      if (action === "switchProject") switchToProject(group);
      else if (action === "history") actions.openGroupHistory(group);
      else if (action === "openFolder") {
        if (path) openInboxTarget(path);
      } else if (action === "copyPath") {
        if (path) void navigator.clipboard?.writeText(path).then(() => useUIStore.getState().showToast(t2("canvas.groupMenu.copied"), "success"));
      } else if (action === "filter" || action === "unfilter") changeFilter({ ...filterRef.current, groupId: action === "filter" ? group.id : null });
      else if (action === "collapse" || action === "expand") actions.updateGroup({ ...group, collapsed: action === "collapse" });
      else if (action === "lock" || action === "unlock") actions.updateGroup({ ...group, locked: action === "lock" });
      else if (action === "newSession") actions.newSessionInGroup(group);
      else if (action === "rename" || action === "dirRules" || action === "archive") setGroupEdit({ groupId: group.id, mode: action });
      else if (action === "summarizeToday" || action === "summarizeWeek") {
        setOpenNodeId(null);
        setHistoryGroupId(null);
        setSummary({ groupId: group.id, range: action === "summarizeToday" ? "today" : "week" });
      } else actions.removeGroup(group.id);
    },
    [actions, changeFilter, switchToProject, t2]
  );
  const onTickMenu = reactExports.useCallback((nodeId2, x, y) => setMenu({ nodeId: nodeId2, x, y, fromTimeline: true }), []);
  const onTickOpen = reactExports.useCallback(
    (nodeId2) => {
      const node = latest.current.model.nodes.find((n) => n.id === nodeId2);
      if (!node) return;
      if (node.kind === "session" && node.ref.sessionId) openFullConversation(node.ref.sessionId);
      else actions.openNode(node);
    },
    [actions]
  );
  const toastResult = reactExports.useCallback(
    (run, okText) => void run.then((r) => useUIStore.getState().showToast(r.ok ? okText : t2("canvas.menu.actionFailed", { error: r.error }), r.ok ? "success" : "error")),
    [t2]
  );
  const onMenuAction = reactExports.useCallback(
    (action, node) => {
      const at = { x: node.x, y: node.y };
      const { sessionId, teamId } = node.ref;
      if (action === "open") actions.openNode(node);
      else if (action === "locate") locate2(node.id);
      else if (action === "openChat") {
        if (sessionId) openFullConversation(sessionId);
      } else if (action === "openFolder") {
        const dir = useSessionStore.getState().sessions.find((s) => s.id === sessionId)?.config?.workingDirectory;
        if (dir) openInboxTarget(dir);
        else useUIStore.getState().showToast(t2("canvas.menu.noFolder"), "info");
      } else if (action === "rename") {
        const s = useSessionStore.getState().sessions.find((x) => x.id === sessionId);
        if (sessionId) setRenameTarget({ sessionId, name: s?.name || s?.config?.name || node.title });
      } else if (action === "aiRename") {
        if (sessionId) {
          useUIStore.getState().showToast(t2("canvas.menu.aiRenaming", { title: node.title }), "info");
          void useSessionStore.getState().aiRenameSession(sessionId).then(
            (r) => useUIStore.getState().showToast(r.success ? t2("canvas.menu.renamed", { title: r.name }) : t2("canvas.menu.actionFailed", { error: r.error ?? "" }), r.success ? "success" : "error")
          );
        }
      } else if (action === "copyName") {
        const s = useSessionStore.getState().sessions.find((x) => x.id === sessionId);
        const name = s?.name || s?.config?.name || node.title;
        void navigator.clipboard?.writeText(name).then(() => useUIStore.getState().showToast(t2("canvas.menu.nameCopied"), "success"));
      } else if (action === "share") {
        if (sessionId) setShareSessionId(sessionId);
      } else if (action === "derive") {
        if (sessionId) void deriveFromCard(sessionId, node.title);
      } else if (action === "watchOther") {
        const el = document.querySelector(`[data-node-id="${CSS.escape(node.id)}"]`);
        const r = el?.getBoundingClientRect();
        setConnecting({ sourceId: node.id, from: r ? { x: r.right, y: r.top + r.height / 2 } : { x: menu?.x ?? 0, y: menu?.y ?? 0 }, watch: true });
        useUIStore.getState().showToast(t2("canvas.watch.pickTarget", { title: node.title }), "info");
      } else if (action === "unwatch") {
        if (sessionId) {
          const related = useSessionStore.getState().watchGraph.filter((w) => w.watcherSessionId === sessionId || w.targetSessionId === sessionId);
          for (const w of related) void unwatchAndToast(w.watcherSessionId, w.targetSessionId);
        }
      } else if (action === "favorite" || action === "unfavorite") {
        if (sessionId) useSessionStore.getState().toggleSessionFavorite(sessionId);
      } else if (action === "stop") {
        const run = node.kind === "team" && teamId ? stopTeam(teamId) : node.kind === "pipeline" ? stopPipeline(node.ref, node.runSessions?.find((s) => s.status === "running")?.sessionId) : sessionId ? stopSession(sessionId) : null;
        void run?.then(
          (r) => useUIStore.getState().showToast(r.ok ? t2("canvas.menu.stopped", { title: node.title }) : t2("canvas.menu.stopFailed", { error: r.error }), r.ok ? "success" : "error")
        );
      } else if (action === "resume") {
        if (sessionId) void resumeSession(sessionId).then(
          (r) => useUIStore.getState().showToast(r.ok ? t2("canvas.menu.resumed", { title: node.title }) : t2("canvas.menu.resumeFailed", { error: r.error }), r.ok ? "success" : "error")
        );
      } else if (action === "runNow") toastResult(runPipelineNow(node.ref), t2("canvas.menu.started", { title: node.title }));
      else if (action === "pause" || action === "enable") {
        toastResult(setPipelinePaused(node.ref, action === "pause"), t2(action === "pause" ? "canvas.menu.paused" : "canvas.menu.enabled", { title: node.title }));
      } else if (action === "switchModel") setModelPicker({ nodeId: node.id, x: menu?.x ?? node.x, y: menu?.y ?? node.y });
      else if (action === "focus") setFocusId(node.id);
      else if (action === "pin" || action === "unpin") updateLayout((prev) => pinNode(prev, node.id, action === "pin", at));
      else if (action === "park" || action === "unpark") updateLayout((prev) => parkNode(prev, node.id, action === "park" ? (/* @__PURE__ */ new Date()).toISOString() : null, at));
      else if (action === "ungroup") {
        const g = latest.current.model.groups.find((x) => x.id === node.groupId);
        updateLayout((prev) => moveNode(prev, node.id, g ? g.x + g.w + 40 : node.x + 40, node.y, CANVAS_GROUP_OTHER));
        for (const [groupId, ids] of workGroupAssignments([{ node, home: null }], useWorkGroupStore.getState().membership)) assignSessions(ids, groupId);
      } else if (action === "edit") useIdeaEditStore.setState({ editingId: node.id });
      else if (action === "tag") actions.tagIdea(node, nextIdeaTag(node.subKind));
      else if (action === "asSession" || action === "asGoal") actions.dispatchIdea(node, action === "asSession" ? "session" : "goal");
      else if (action === "copyText") {
        void navigator.clipboard?.writeText(node.text ?? node.title).then(() => useUIStore.getState().showToast(t2("canvas.menu.textCopied"), "success"));
      } else if (action === "delete") {
        const id = node.ref.localId;
        if (!id) return;
        updateLayout((prev) => node.kind === "idea" ? removeIdea(prev, id) : removeInbox(prev, id));
        useUIStore.getState().showToast(t2("canvas.menu.deleted", { title: node.title }), "info");
      } else if (action === "deleteSession") {
        if (sessionId) setDeleteTarget({ sessionId, nodeId: node.id, title: node.title });
      } else {
        updateLayout((prev) => hideNode(prev, node.id, true, at));
        if (openNodeIdRef.current === node.id) setOpenNodeId(null);
        useUIStore.getState().showToast(t2("canvas.menu.hidden", { title: node.title }), "info");
      }
    },
    [actions, locate2, menu, t2, toastResult, updateLayout]
  );
  const onPickModel = reactExports.useCallback(
    (node, providerId, modelId) => {
      const run = node.kind === "pipeline" ? setPipelineModel(node.ref, providerId, modelId) : node.ref.sessionId ? switchSessionModel(node.ref.sessionId, providerId, modelId) : null;
      if (run) toastResult(run, t2(node.kind === "pipeline" ? "canvas.menu.modelSetNextRun" : "canvas.menu.modelSwitched", { model: nodeModelLabel({ providerId, modelId }, peekProviders()) }));
    },
    [t2, toastResult]
  );
  reactExports.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      e.preventDefault();
      useCanvasDockStore.getState().focusComposer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  reactExports.useEffect(() => {
    if (!undoLayout) return;
    const onKey = (e) => {
      if (e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.altKey || dragging.current || isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      const redo = key === "y" || key === "z" && e.shiftKey;
      if (key !== "z" && key !== "y") return;
      e.preventDefault();
      undoLayout(redo);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undoLayout]);
  const toggleTimeline = reactExports.useCallback(() => {
    setTimelineOpen((v) => {
      try {
        localStorage.setItem(TIMELINE_KEY, v ? "0" : "1");
      } catch {
      }
      if (v) setReplayMs(null);
      return !v;
    });
  }, []);
  const armSpawnAt = useCanvasDockStore((s) => s.armSpawnAt);
  const onPlaceNode = reactExports.useCallback(
    (nodeId2, want) => updateLayout((prev) => {
      const { nodes: nodes2, groups } = latest.current.model;
      const onCanvas = new Set(nodes2.map((n) => n.id));
      const taken = [
        ...nodes2.filter((n) => n.id !== nodeId2 && !n.hidden).map((n) => ({ x: n.x, y: n.y, w: CANVAS_NODE_W, h: canvasNodeHeight(n) })),
        ...Object.entries(prev.nodes).filter(([id, l]) => id !== nodeId2 && !onCanvas.has(id) && !l.hidden && !l.unplaced).map(([, l]) => ({ x: l.x, y: l.y, ...DEFAULT_NODE_SIZE }))
      ];
      const at = freeSpotNear(want, taken);
      return moveNode(prev, nodeId2, at.x, at.y, groupAt(at, groups)?.id ?? CANVAS_GROUP_OTHER);
    }),
    [updateLayout]
  );
  const onCreateIdea = reactExports.useCallback(
    (idea) => updateLayout((prev) => moveNode(upsertIdea(prev, idea), `idea:${idea.id}`, idea.x, idea.y, idea.groupId ?? groupAt(idea, latest.current.model.groups)?.id ?? CANVAS_GROUP_OTHER)),
    [updateLayout]
  );
  const onIdeaDispatched = reactExports.useCallback((ideaId, nodeId2) => updateLayout((prev) => handoffIdea(prev, ideaId, nodeId2)), [updateLayout]);
  const projectGroups = reactExports.useMemo(() => model.groups.filter((g) => g.kind === "project"), [model.groups]);
  reactExports.useEffect(() => {
    if (filter.groupId && !model.groups.some((g) => g.id === filter.groupId)) setFilter((f) => ({ ...f, groupId: null }));
  }, [filter.groupId, model.groups]);
  const workGroups = useWorkGroupStore((s) => s.groups);
  reactExports.useEffect(() => {
    if (filter.workGroupId && !workGroups.some((g) => g.id === filter.workGroupId)) setFilter((f) => ({ ...f, workGroupId: null }));
  }, [filter.workGroupId, workGroups]);
  const visibleForSearch = model.nodes;
  const titleOf = reactExports.useCallback((id) => latest.current.model.nodes.find((n) => n.id === id)?.title ?? id, []);
  const nextRunMs = reactExports.useMemo(() => {
    let best = null;
    for (const n of model.nodes) {
      const ms2 = n.nextRunAt ? Date.parse(n.nextRunAt) : Number.NaN;
      if (ms2 > now && (best === null || ms2 < best)) best = ms2;
    }
    return best;
  }, [model.nodes, now]);
  const menuNode = menu ? model.nodes.find((n) => n.id === menu.nodeId) ?? null : null;
  const modelPickerNode = modelPicker ? model.nodes.find((n) => n.id === modelPicker.nodeId) ?? null : null;
  const menuGroup = groupMenu ? model.groups.find((g) => g.id === groupMenu.groupId) ?? null : null;
  const menuGroupCtx = menuGroup?.projectKey ? projectContextOf?.(menuGroup.projectKey) ?? null : null;
  const openNode = openNodeId ? model.nodes.find((n) => n.id === openNodeId) ?? null : null;
  const historyGroup = historyGroupId ? model.groups.find((g) => g.id === historyGroupId && groupHistoryKey(g)) ?? null : null;
  const historyKeyOf = reactExports.useMemo(
    () => historyGroup?.kind === "work" ? (id) => {
      const gid = membership[id]?.groupId;
      return gid ? workGroupCanvasId(gid) : null;
    } : groupKeyOfSession,
    [historyGroup?.kind, membership, groupKeyOfSession]
  );
  const summaryGroup = summary ? model.groups.find((g) => g.id === summary.groupId && g.kind === "work") ?? null : null;
  const editGroup = groupEdit ? model.groups.find((g) => g.id === groupEdit.groupId && g.kind === "work") ?? null : null;
  const editDirRules = useWorkGroupStore((s) => groupEdit ? s.groups.find((g) => workGroupCanvasId(g.id) === groupEdit.groupId)?.dirRules : void 0);
  const closeDrawer = reactExports.useCallback(() => {
    setOpenNodeId(null);
    setHistoryGroupId(null);
    setSummary(null);
  }, []);
  const onPaneClick = reactExports.useCallback(() => {
    setFocusId(null);
    closeDrawer();
  }, [closeDrawer]);
  const onGroupColor = reactExports.useCallback((color, group) => updateWorkGroup(group.id, { color }), []);
  const onGroupEditSubmit = (value) => {
    const edit = groupEdit;
    setGroupEdit(null);
    if (!edit) return;
    if (edit.mode === "archive") {
      void archiveWorkGroup(edit.groupId).then((ok) => ok && updateLayout((prev) => removeGroup(prev, edit.groupId)));
      if (summary?.groupId === edit.groupId) setSummary(null);
    } else if (value.name) updateWorkGroup(edit.groupId, { name: value.name });
    else if (value.dirRules) updateWorkGroup(edit.groupId, { dirRules: value.dirRules });
  };
  const onPaneMenuAction = (a) => {
    if (!paneMenu) return;
    if (a === "newSession") armSpawnAt(paneMenu.at);
    else if (a === "newGroup") newGroupAt(paneMenu.at);
    else if (a === "tidy") onTidy();
    else if (a === "fitView") onFit();
    else if (a === "selectMode") toggleSelectMode();
    else onShowHidden();
  };
  const drawerOpen = drawerKindOf(openNode) !== null || historyGroup !== null || summaryGroup !== null;
  const drawerWidth = useDrawerWidthStore((s) => s.width);
  reactExports.useEffect(() => bindWorkbenchLayout(stageRef.current, composerRef.current), []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasActionsContext.Provider, { value: actions, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CanvasNowContext.Provider, { value: now, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-appearance-surface": "canvas", className: "flex h-full min-h-0 flex-col bg-bg-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-5 pb-2 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold tracking-wide text-text-primary", children: t2("title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(HeaderClock, { now }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CanvasToolbar,
          {
            filter,
            onFilter: changeFilter,
            projectGroups,
            nodes: visibleForSearch,
            timelineOpen,
            onToggleTimeline: toggleTimeline,
            onShowHint: showHint,
            onFit,
            onTidy,
            selectMode,
            onToggleSelectMode: toggleSelectMode,
            hiddenCount,
            onShowHidden,
            autoTidy,
            onToggleAutoTidy: toggleAutoTidy,
            onNewGroup,
            onNewInbox,
            onLocate: locate2,
            onPin
          }
        )
      ] }),
      timelineOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 px-5 pb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasTimeline, { ticks, now, nextRunMs, replayMs, onReplay: setReplayMs, titleOf, onTickMenu, onTickOpen }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: stageRef, className: "relative min-h-0 flex-1", onPointerDownCapture: (e) => {
        if (e.button === 2) rightDown.current = { x: e.clientX, y: e.clientY };
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        CanvasStage,
        {
          ariaLabel: t2("canvas.ariaLabel"),
          nodes,
          edges,
          nodeTypes: CANVAS_NODE_TYPES,
          edgeTypes: CANVAS_EDGE_TYPES,
          onNodesChange,
          onEdgesChange,
          onNodeDragStart,
          onNodeDrag,
          onNodeDragStop,
          onBeforeDelete,
          onDelete,
          onMoveEnd,
          onFit,
          selectMode,
          onPaneDoubleClick: armSpawnAt,
          onPaneClick,
          paneClickDistance: 4,
          onNodeContextMenu,
          onPaneContextMenu,
          onNodeDoubleClick,
          overlay: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            !replay && (model.nodes.length > 0 || !model.groups.some(g => g.kind === "user" || g.kind === "work")) && /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasOnboarding, { nodes: model.nodes, onLocate: locate2, onShowGuide: showHint }),
            replay && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wb-replay-tag", role: "status", children: t2("canvas.timeline.replaying") }),
            focusNode && !replay && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wb-replay-tag wb-focus-tag", role: "status", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("canvas.focus.tag", { title: focusNode.title }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setFocusId(null), "aria-label": t2("canvas.focus.exit"), title: t2("canvas.focus.exit"), children: "×" })
            ] }),
            hintOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-canvas-hint": true, className: "absolute bottom-3 left-5 z-10 flex max-w-[30%] items-start gap-1 rounded-lg bg-bg-secondary py-1.5 pl-2.5 pr-1 text-[11px] leading-relaxed text-text-muted shadow-lg ring-1 ring-inset ring-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-text-secondary", children: t2("canvas.guide.watchLabel") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc space-y-0.5 pl-3.5", children: ["pending", "waited", "failed", "timeline"].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t2(`canvas.guide.watch.${k}`) }, k)) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-text-secondary", children: t2("canvas.guide.opsLabel") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t2("canvas.hint") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: dismissHint, "aria-label": t2("canvas.hintDismiss"), title: t2("canvas.hintDismiss"), className: "shrink-0 rounded p-0.5 hover:bg-bg-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3", "aria-hidden": true }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4", style: drawerOpen ? { paddingRight: drawerWidth + 16 } : void 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: composerRef, className: "pointer-events-auto w-full max-w-2xl", "data-canvas-composer": true, children: jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [!replay && jsxRuntimeExports.jsx(BackgroundModelHint, {}), jsxRuntimeExports.jsx(CanvasComposer, { onPlaceNode, onCreateIdea, onIdeaDispatched, getDefaultSpawnAt: viewportCenter, replyTarget: drawerKindOf(openNode) === "session" ? openNode?.title : null })] }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasDrawer, { node: openNode, onClose: closeDrawer, onNodeAction: onMenuAction }),
            historyGroup && historyKeyOf && /* @__PURE__ */ jsxRuntimeExports.jsx(GroupHistoryDrawer, { group: historyGroup, groupKeyOf: historyKeyOf, onClose: closeDrawer }, historyGroup.id),
            summaryGroup && summary && /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupSummaryDrawer, { group: summaryGroup, range: summary.range, onRange: (range) => setSummary({ groupId: summaryGroup.id, range }), onClose: closeDrawer }, summaryGroup.id),
            editGroup && groupEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(WorkGroupEditDialog, { mode: groupEdit.mode, title: editGroup.title, dirRules: editDirRules ?? [], onSubmit: onGroupEditSubmit, onCancel: () => setGroupEdit(null) }, `${editGroup.id}:${groupEdit.mode}`),
            connecting && /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectOverlay, { from: connecting.from, onDone: onConnectDone }),
            menu && menuNode && /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasNodeMenu, { node: menuNode, x: menu.x, y: menu.y, onAction: onMenuAction, onClose: closeMenu, canLocate: menu.fromTimeline && nodes.some((n) => n.id === menu.nodeId), hasWatch: model.edges.some((e) => e.kind === "watches" && (e.source === menuNode.id || e.target === menuNode.id)) }),
            connectChoice && /* @__PURE__ */ jsxRuntimeExports.jsx(
              ConnectChoiceMenu,
              {
                x: connectChoice.x,
                y: connectChoice.y,
                from: model.nodes.find((n) => n.id === connectChoice.sourceId)?.title ?? "",
                to: model.nodes.find((n) => n.id === connectChoice.targetId)?.title ?? "",
                onPick: onConnectChoice,
                onClose: closeConnectChoice
              }
            ),
            modelPickerNode && /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasModelPicker, { node: modelPickerNode, x: modelPicker.x, y: modelPicker.y, onPick: onPickModel, onClose: closeModelPicker }),
            shareSessionId && /* @__PURE__ */ jsxRuntimeExports.jsx(SessionShareDialog, { open: true, sessionId: shareSessionId, onClose: () => setShareSessionId(null) }),
            renameTarget && /* @__PURE__ */ jsxRuntimeExports.jsx(
              SessionRenameDialog,
              {
                name: renameTarget.name,
                onCancel: () => setRenameTarget(null),
                onSubmit: (name) => {
                  const { sessionId } = renameTarget;
                  setRenameTarget(null);
                  void useSessionStore.getState().renameSession(sessionId, name).then(
                    (ok) => useUIStore.getState().showToast(ok ? t2("canvas.menu.renamed", { title: name }) : t2("canvas.menu.actionFailed", { error: "" }), ok ? "success" : "error")
                  );
                }
              }
            ),
            deleteTarget && /* @__PURE__ */ jsxRuntimeExports.jsx(
              DeleteConfirmDialog,
              {
                sessionId: deleteTarget.sessionId,
                sessionName: deleteTarget.title,
                onCancel: () => setDeleteTarget(null),
                onConfirm: async (id) => {
                  try {
                    await useSessionStore.getState().deleteSession(id);
                  } catch (err) {
                    useUIStore.getState().showToast(t2("canvas.menu.actionFailed", { error: err instanceof Error ? err.message : String(err) }), "error");
                    throw err;
                  }
                  if (openNodeIdRef.current === deleteTarget.nodeId) setOpenNodeId(null);
                  useUIStore.getState().showToast(t2("canvas.menu.sessionDeleted", { title: deleteTarget.title }), "success");
                }
              }
            ),
            paneMenu && /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasPaneMenu, { x: paneMenu.x, y: paneMenu.y, selectMode, hiddenCount, onAction: onPaneMenuAction, onClose: closePaneMenu }),
            groupMenu && menuGroup && /* @__PURE__ */ jsxRuntimeExports.jsx(
              CanvasGroupMenu,
              {
                group: menuGroup,
                ctx: { hasProject: Boolean(menuGroupCtx), hasPath: Boolean(menuGroupCtx?.workingDirectory), filtered: filter.groupId === menuGroup.id },
                x: groupMenu.x,
                y: groupMenu.y,
                onAction: onGroupMenuAction,
                onColor: onGroupColor,
                onClose: closeGroupMenu
              }
            )
          ] })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PendingPanel, { nodes: model.nodes, now, onOpenNode: actions.openNode, onLocate: locate2 })
  ] }) });
}
function HeaderClock({ now }) {
  const d = new Date(now);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted", children: d.toLocaleDateString(void 0, { month: "long", day: "numeric", weekday: "short" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("time", { className: "rounded-md bg-bg-secondary px-2 py-0.5 font-mono text-xs tabular-nums text-text-primary ring-1 ring-inset ring-border", children: d.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit", hour12: false }) })
  ] });
}
const TerminalDockPanel = reactExports.lazy(() => __vitePreload(() => import("./TerminalDockPanel-2hrQHTSz.js"), true ? __vite__mapDeps([0,1,2]) : void 0, import.meta.url));
const KnowledgeDockPanel = reactExports.lazy(() => __vitePreload(() => import("./KnowledgeDockPanel-DsA1k2lc.js"), true ? __vite__mapDeps([3,1,2]) : void 0, import.meta.url));
const LAZY_PANELS = { terminal: TerminalDockPanel, knowledge: KnowledgeDockPanel };
const KEY_STEP = 16;
const ICON_BTN = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary";
const TAB_BTN = "h-6 shrink-0 rounded-md px-2 text-xs transition-colors";
function WorkbenchDock({ panel, containerRef }) {
  const { t: t2 } = useTranslation("workbench");
  const width = useWorkbenchDockStore((s) => s.widths[panel]);
  const side = useWorkbenchDockStore((s) => s.side);
  const setWidth = useWorkbenchDockStore((s) => s.setWidth);
  const setPanel = useWorkbenchDockStore((s) => s.setPanel);
  const toggleSide = useWorkbenchDockStore((s) => s.toggleSide);
  const [dragWidth, setDragWidth] = reactExports.useState(null);
  const stopDragRef = reactExports.useRef(null);
  reactExports.useEffect(() => () => stopDragRef.current?.(), []);
  const containerWidth = () => containerRef.current?.getBoundingClientRect().width ?? 0;
  const close = () => setPanel(null);
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const total = containerWidth();
    let last = startWidth;
    const release = panel === "browser" ? acquireEmbeddedBrowserSuppression() : () => {
    };
    const move = (ev) => {
      last = dragDockWidth(startWidth, ev.clientX - startX, side, total);
      setDragWidth(last);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
      stopDragRef.current = null;
      setDragWidth(null);
      setWidth(last);
      release();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    stopDragRef.current = stop;
  };
  const onKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setWidth(dragDockWidth(width, e.key === "ArrowRight" ? KEY_STEP : -KEY_STEP, side, containerWidth()));
  };
  const moveLabel = t2(side === "right" ? "dock.moveLeft" : "dock.moveRight");
  const Lazy = panel === "browser" ? null : LAZY_PANELS[panel];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "aside",
    {
      "data-workbench-dock": side,
      "data-workbench-dock-panel": panel,
      "aria-label": t2(`dock.panels.${panel}`),
      className: cn("flex h-full min-h-0 shrink-0", side === "left" && "flex-row-reverse"),
      style: { width: dragWidth ?? width, maxWidth: `calc(100% - ${CANVAS_MIN_W}px)` },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            role: "separator",
            "aria-orientation": "vertical",
            "aria-label": t2("dock.resize"),
            title: t2("dock.resize"),
            tabIndex: 0,
            onPointerDown,
            onKeyDown,
            className: cn(
              "w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-accent-blue/60 focus-visible:bg-accent-blue focus-visible:outline-none",
              dragWidth !== null && "bg-accent-blue"
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-appearance-surface": "canvas", className: "flex min-w-0 flex-1 flex-col bg-bg-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-9 shrink-0 items-center gap-1 border-b border-border px-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "sr-only", children: t2(`dock.panels.${panel}`) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "tablist", "aria-label": t2("dock.switchTo"), className: "flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto", children: DOCK_PANELS.filter(canDockPanelHere).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": p === panel,
                onClick: () => setPanel(p),
                className: cn(TAB_BTN, p === panel ? "bg-bg-hover text-text-primary" : "text-text-muted hover:bg-bg-hover hover:text-text-primary"),
                children: t2(`dock.tabs.${p}`)
              },
              p
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: ICON_BTN, onClick: toggleSide, title: moveLabel, "aria-label": moveLabel, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeftRight, { className: "h-3.5 w-3.5", "aria-hidden": true }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: ICON_BTN, onClick: () => openDockPanelFullscreen(panel), title: t2("dock.fullscreenHint"), "aria-label": t2("dock.fullscreen"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { className: "h-3.5 w-3.5", "aria-hidden": true }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: ICON_BTN, onClick: close, title: t2("dock.close"), "aria-label": t2("dock.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4", "aria-hidden": true }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1", children: Lazy ? /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lazy, {}) }) : (
            // 标签条里的「关闭窗口」= 收起面板
            /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserPaneHost, { onClose: close })
          ) })
        ] })
      ]
    }
  );
}
const GoalsPage = reactExports.lazy(() => __vitePreload(() => import("./index-0LVJEr5c.js").then((n) => n.eI), true ? __vite__mapDeps([1,2]) : void 0, import.meta.url));
const btn = "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs text-text-secondary outline-none hover:bg-bg-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-blue";
function WorkbenchGoalsPanel({ nodes }) {
  const { t: t2 } = useTranslation("workbench");
  const open = useWorkbenchGoalsView((s) => s.open);
  const setOpen = useWorkbenchGoalsView((s) => s.setOpen);
  const selectedGoalId = useGoalStore((s) => s.selectedGoalId);
  const rootRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (open) rootRef.current?.focus();
  }, [open]);
  if (!open) return null;
  const onCanvas = Boolean(selectedGoalId) && nodes.some((n) => !n.hidden && n.ref.goalId === selectedGoalId);
  const locate2 = () => {
    if (selectedGoalId && focusOnCanvas({ target: { view: "goal", id: selectedGoalId } })) setOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      ref: rootRef,
      tabIndex: -1,
      role: "dialog",
      "aria-label": t2("goalsView.open"),
      "data-workbench-goals": true,
      onKeyDown: (e) => {
        if (e.key === "Escape" && !e.defaultPrevented) setOpen(false);
      },
      className: "absolute inset-y-0 right-0 z-50 flex w-[min(1100px,94%)] flex-col bg-bg-primary shadow-2xl outline-none ring-1 ring-inset ring-border",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        GoalsPage,
        {
          headerEnd: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn, onClick: () => setOpen(false), "aria-label": t2("goalsView.close"), title: t2("goalsView.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4", "aria-hidden": true }) }),
          detailTop: onCanvas ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 border-b border-white/[0.05] px-3 py-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: btn, onClick: locate2, title: t2("goalsView.locateHint"), "data-goal-locate": true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Crosshair, { className: "h-3.5 w-3.5", "aria-hidden": true }),
            t2("goalsView.locate")
          ] }) }) : null
        }
      ) })
    }
  );
}
const ACTIVITY_TEXT_TYPES = /* @__PURE__ */ new Set(["assistant_message", "waiting_ask_question", "waiting_confirmation", "user_question"]);
function lastMeaningfulActivity(list) {
  if (!list?.length) return void 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (ACTIVITY_TEXT_TYPES.has(list[i].type) && list[i].detail) return list[i];
  }
  return void 0;
}
function toSessionLite(session, activities, userMessages, goalId) {
  const last = lastMeaningfulActivity(activities);
  const userInputs = activities?.filter((a) => a.type === "user_input").length ?? 0;
  let lastEvent;
  for (let i = (activities?.length ?? 0) - 1; i >= 0 && !lastEvent; i--) if (activities[i].type !== "session_start") lastEvent = activities[i];
  const config = session.config ?? {};
  return {
    id: session.id,
    name: session.name || session.id,
    status: session.status,
    startedAt: session.startedAt,
    lastActivityAt: lastEvent?.timestamp ?? session.startedAt,
    lastActivityText: last?.detail ? last.detail.slice(0, 160) : null,
    userTurns: Math.max(userMessages, userInputs),
    parentSessionId: config.parentSessionId ?? null,
    // 手动「派生」出来的会话也算由源会话拉起（画布上连派生线、同一家族）
    spawnedBySessionId: config.spawnedBySessionId ?? config.derivedFromSessionId ?? null,
    goalId
  };
}
function toScheduleLite(task) {
  return {
    id: task.id,
    name: task.name,
    enabled: task.enabled,
    consecutiveFailures: task.consecutiveFailures ?? 0,
    lastRunAt: task.lastRunAt ?? null,
    lastRunStatus: task.lastRunStatus ?? null,
    nextRunAt: task.nextRunAt ?? null,
    goalId: task.action?.goalId ?? null
  };
}
function scheduleActionModel(action) {
  if (!action) return { providerId: null, modelId: null };
  if (action.type === "agent") return { providerId: action.agentConfig?.providerId ?? null, modelId: action.agentConfig?.model ?? null };
  if (action.type === "skill") return { providerId: action.skillConfig?.providerId ?? null, modelId: action.skillConfig?.model ?? null };
  if (action.type === "team") return { providerId: action.teamConfig?.providerOverride?.providerId ?? null, modelId: action.teamConfig?.providerOverride?.modelId ?? null };
  if (action.type === "spawn_agent") return { providerId: action.providerId ?? null, modelId: null };
  return { providerId: null, modelId: null };
}
function sessionModel(session) {
  const c = session.config;
  return { providerId: c?.providerId ?? null, modelId: c?.builtinModelId || c?.model || null };
}
function fallbackProposals(goals, sessions) {
  const out = [];
  for (const g of goals) {
    if (g.drive?.status !== "waiting_approval" || g.archivedAt) continue;
    out.push({
      id: `goal_approval:${g.id}`,
      kind: "goal_approval",
      title: g.title,
      detail: g.drive.pendingApproval?.question,
      source: { type: "goal", id: g.id },
      goalId: g.id,
      blocking: true,
      actions: g.drive.pendingApproval?.source === "session_waiting" ? ["open"] : ["approve", "reject", "open"],
      createdAt: g.drive.pendingApproval?.createdAt ?? g.updatedAt
    });
  }
  for (const s of sessions) {
    const config = s.config ?? {};
    if (s.status !== "waiting_input" || config.parentSessionId) continue;
    out.push({
      id: `session_waiting:${s.id}`,
      kind: "session_waiting",
      title: s.name || s.id,
      source: { type: "session", id: s.id },
      sessionId: s.id,
      blocking: true,
      actions: ["open"],
      createdAt: s.startedAt
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function useWorkbenchProposals(goals, sessions) {
  const status = useProposalStore((s) => s.status);
  const items = useProposalStore((s) => s.items);
  const total = useProposalStore((s) => s.total);
  const error = useProposalStore((s) => s.error);
  const reload = reactExports.useCallback(() => void useProposalStore.getState().refresh(), []);
  reactExports.useEffect(() => {
    reload();
  }, [reload, total]);
  const fallback = reactExports.useMemo(() => status === "ready" ? [] : fallbackProposals(goals, sessions), [status, goals, sessions]);
  if (status === "ready") return { mode: "hub", items, total, error: null, reload };
  if (status === "idle" || status === "loading") return { mode: "loading", items: [], total: 0, error: null, reload };
  return { mode: status === "error" ? "error" : "fallback", items: fallback, total: fallback.length, error, reload };
}
function useNow(intervalMs = 6e4) {
  const [now, setNow] = reactExports.useState(() => Date.now());
  reactExports.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
async function migrateLegacyUserGroups(getLayout, api2, update) {
  let done = 0;
  for (const g of legacyUserGroups(getLayout())) {
    try {
      const created = await api2.create({ name: g.title });
      if (!created.ok) continue;
      const sessionIds = legacyGroupSessionIds(getLayout(), g.id);
      if (sessionIds.length) {
        const assigned = await api2.assign(sessionIds, created.data.id).catch(() => ({ ok: false, error: "ipc" }));
        if (!assigned.ok) {
          void api2.archive(created.data.id).catch(() => void 0);
          continue;
        }
      }
      update((prev) => rekeyLegacyGroup(prev, g.id, workGroupCanvasId(created.data.id)));
      done++;
    } catch {
    }
  }
  return done;
}
const STREAM_TYPES = /* @__PURE__ */ new Set(["assistant_message", "waiting_ask_question", "waiting_confirmation", "user_question"]);
const STREAM_MAX = 8;
const BLOCKABLE = /* @__PURE__ */ new Set(["running", "starting", "waiting_input"]);
const RUN_HISTORY_LIMIT = 30;
const SAVE_DEBOUNCE_MS = 400;
const UNDO_LIMIT = 50;
const MAX_ACTIVITY_PREFETCH = 10;
const ACTIVITY_THROTTLE_MS = 300;
const settingsBridge = () => window.shineAI?.settings;
function createCanvasLayoutStore(opts) {
  let latest = emptyLayout();
  let loaded = false;
  let writable = false;
  let disposed = false;
  let pending = [];
  let timer;
  const undoStack = [];
  const redoStack = [];
  const flush = () => {
    clearTimeout(timer);
    timer = void 0;
    if (writable) opts.write?.(serializeLayout(latest));
  };
  const schedule = () => {
    if (!writable) return;
    clearTimeout(timer);
    timer = setTimeout(flush, opts.debounceMs ?? SAVE_DEBOUNCE_MS);
  };
  const finish = (base, canWrite) => {
    if (disposed) return;
    const queued = pending ?? [];
    pending = null;
    loaded = true;
    writable = canWrite && Boolean(opts.write);
    latest = queued.reduce((acc, fn) => fn(acc), base);
    opts.onChange(latest, true);
    if (queued.length) schedule();
  };
  const step = (from, to) => {
    const snap = from.pop();
    if (!snap) return false;
    to.push(latest);
    latest = { ...snap, viewport: latest.viewport };
    opts.onChange(latest, loaded);
    schedule();
    return true;
  };
  if (!opts.read) finish(emptyLayout(), false);
  else opts.read().then((raw) => finish(parseLayout(raw), true), () => finish(emptyLayout(), false));
  return {
    update(fn, o) {
      const next = fn(latest);
      if (next === latest) return;
      if (!pending && o?.undoable !== false && !onlyViewport(latest, next)) {
        undoStack.push(latest);
        if (undoStack.length > UNDO_LIMIT) undoStack.shift();
        redoStack.length = 0;
      }
      latest = next;
      opts.onChange(next, loaded);
      if (pending) pending.push(fn);
      else schedule();
    },
    undo: () => step(undoStack, redoStack),
    redo: () => step(redoStack, undoStack),
    dispose() {
      disposed = true;
      if (timer) flush();
    }
  };
}
const onlyViewport = (a, b) => Object.keys({ ...a, ...b }).every((k) => k === "viewport" || k === "updatedAt" || a[k] === b[k]);
function useCanvasLayout() {
  const [state, setState] = reactExports.useState(() => ({ layout: emptyLayout(), loaded: false }));
  const store = reactExports.useRef();
  reactExports.useEffect(() => {
    const bridge = settingsBridge();
    const created = createCanvasLayoutStore({
      read: bridge?.getAll ? () => bridge.getAll().then((all) => all?.[CANVAS_LAYOUT_SETTING_KEY]) : null,
      write: bridge?.update ? (l) => void bridge.update(CANVAS_LAYOUT_SETTING_KEY, l)?.catch?.(() => void 0) : null,
      onChange: (layout, loaded) => setState({ layout, loaded })
    });
    store.current = created;
    return () => {
      created.dispose();
      if (store.current === created) store.current = void 0;
    };
  }, []);
  const update = reactExports.useCallback((fn) => store.current?.update(fn), []);
  const updateQuiet = reactExports.useCallback((fn) => store.current?.update(fn, { undoable: false }), []);
  const undo = reactExports.useCallback((redo) => (redo ? store.current?.redo() : store.current?.undo()) ?? false, []);
  return { layout: state.layout, loaded: state.loaded, update, updateQuiet, undo };
}
function useWorkGroups(layout, layoutLoaded, updateQuiet) {
  reactExports.useEffect(() => startWorkGroupSync(), []);
  const available = useWorkGroupStore((s) => s.available);
  const groups = useWorkGroupStore((s) => s.groups);
  const membership = useWorkGroupStore((s) => s.membership);
  const layoutRef = reactExports.useRef(layout);
  layoutRef.current = layout;
  const migrated = reactExports.useRef(false);
  const hasLegacy = legacyUserGroups(layout).length > 0;
  reactExports.useEffect(() => {
    const api2 = window.shineAI?.workGroups;
    if (!layoutLoaded || !available || !hasLegacy || migrated.current || !api2) return;
    migrated.current = true;
    void migrateLegacyUserGroups(() => layoutRef.current, api2, updateQuiet);
  }, [layoutLoaded, available, hasLegacy, updateQuiet]);
  return reactExports.useMemo(() => available ? { groups, membership } : void 0, [available, groups, membership]);
}
function useThrottledSessionSlice(key, ms2) {
  const [out, setOut] = reactExports.useState(() => useSessionStore.getState()[key]);
  reactExports.useEffect(() => {
    let last = 0;
    let timer;
    const flush = () => {
      timer = void 0;
      last = Date.now();
      setOut(() => useSessionStore.getState()[key]);
    };
    flush();
    const unsub = useSessionStore.subscribe((state, prev) => {
      if (state[key] === prev[key] || timer) return;
      const wait = last + ms2 - Date.now();
      if (wait <= 0) flush();
      else timer = setTimeout(flush, wait);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [key, ms2]);
  return out;
}
function useWorkspaces() {
  const [workspaces, setWorkspaces] = reactExports.useState([]);
  reactExports.useEffect(() => {
    window.shineAI.workspace?.list?.()?.then((list) => setWorkspaces(list || []))?.catch(() => setWorkspaces([]));
  }, []);
  return workspaces;
}
function useCanvasGoals(now) {
  useGoalsSync();
  const storeGoals = useGoalStore((s) => s.goals);
  const [scopeGoals, setScopeGoals] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const bridge = goalsBridge();
    if (!bridge) return;
    let cancelled = false;
    loadWorkbenchGoalScope(bridge).then((list) => !cancelled && setScopeGoals(list), () => void 0);
    return () => {
      cancelled = true;
    };
  }, [now]);
  return reactExports.useMemo(() => mergeGoalLists(storeGoals, scopeGoals), [storeGoals, scopeGoals]);
}
function useCanvasSchedules(lang) {
  const tasks = useSchedulerStore((s) => s.tasks);
  const runHistory = useSchedulerStore((s) => s.runHistory);
  reactExports.useEffect(() => {
    void useSchedulerStore.getState().loadTasks().catch(() => void 0);
    let timer;
    const scheduler = window.shineAI?.scheduler;
    const off = scheduler?.onTaskUpdated?.(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void useSchedulerStore.getState().loadTasks().catch(() => void 0), 300);
    });
    return () => {
      clearTimeout(timer);
      off?.();
    };
  }, []);
  const fetched2 = reactExports.useRef(/* @__PURE__ */ new Map());
  reactExports.useEffect(() => {
    for (const t2 of tasks) {
      const sig2 = `${t2.lastRunAt ?? ""}|${t2.runCount}`;
      if (fetched2.current.get(t2.id) === sig2) continue;
      fetched2.current.set(t2.id, sig2);
      void useSchedulerStore.getState().loadHistory(t2.id, RUN_HISTORY_LIMIT).catch(() => void 0);
    }
  }, [tasks]);
  return reactExports.useMemo(() => tasks.map((t2) => ({
    ...toScheduleLite(t2),
    ...scheduleActionModel(t2.action),
    scheduleText: t2.schedule ? describeSchedule(t2.schedule, lang) : null,
    runs: (runHistory[t2.id] ?? []).map((r) => ({
      id: r.id,
      status: r.status,
      startedAt: r.startedAt,
      durationMs: r.durationMs ?? null,
      output: r.output ?? null,
      error: r.error ?? null,
      sessionId: r.sessionId ?? null,
      teamInstanceId: r.teamInstanceId ?? null
    }))
  })), [tasks, runHistory, lang]);
}
function withWorktreeSourceRepo(session) {
  const root = getSessionProjectRoot(session);
  const main = stripWorktreePath(root);
  return main === root ? session : { ...session, config: { ...session.config, worktreeSourceRepo: main } };
}
function buildProjectIndex(sessions, workspaces) {
  const bySession = /* @__PURE__ */ new Map();
  const byKey = /* @__PURE__ */ new Map();
  const contexts = /* @__PURE__ */ new Map();
  for (const g of groupSessionsByProject(sessions.map(withWorktreeSourceRepo), workspaces)) {
    if (g.type === "directory" && isSystemWorkingDirectory(g.subtitle)) continue;
    const ref = { key: g.key, title: g.title };
    byKey.set(g.key, ref);
    contexts.set(g.key, g.type === "workspace" ? { workspaceId: g.key } : { workingDirectory: g.subtitle });
    for (const s of g.sessions) bySession.set(s.id, ref);
  }
  const wsById = new Map(workspaces.map((w) => [w.id, w]));
  const ofPath = (raw) => {
    const path = raw?.trim() ? stripWorktreePath(raw.trim()) : "";
    if (!path || isSystemWorkingDirectory(path)) return null;
    const key = normalizeDirectoryKey(path);
    return byKey.get(key) ?? { key, title: getShortPath(path) || path };
  };
  const ofGoal = (goal) => {
    const ws = goal.workspaceId ? wsById.get(goal.workspaceId) : void 0;
    if (ws) return byKey.get(ws.id) ?? { key: ws.id, title: ws.name };
    return ofPath(goal.projectPath);
  };
  const contextOf = (key) => contexts.get(key) ?? (wsById.has(key) ? { workspaceId: key } : key.includes("/") ? { workingDirectory: key } : null);
  return { bySession, ofPath, ofGoal, contextOf };
}
const ASK_MAX_QUESTIONS = 2;
const ASK_MAX_OPTIONS = 4;
function inlineAskQuestions(pending) {
  if (pending?.type !== "ask" || pending.questions.length > ASK_MAX_QUESTIONS) return void 0;
  const out = [];
  for (const q of pending.questions) {
    const options = (q.options ?? []).map((o) => o.label).filter(Boolean);
    if (q.multiSelect || options.length < 2 || options.length > ASK_MAX_OPTIONS) return void 0;
    out.push({ label: q.header?.trim() || q.question, options });
  }
  return out;
}
function blockedAskText(pending, list) {
  if (pending?.type === "ask") return pending.questions[0]?.question ?? null;
  if (pending?.type === "permission") return pending.detail || null;
  return list ? getActiveInteractiveActivity(list)?.detail ?? null : null;
}
function toCanvasSessionInput(s, list, userMessages, goalId, projects, pending = null) {
  const config = s.config ?? {};
  const stream = [];
  for (let i = (list?.length ?? 0) - 1; i >= 0 && stream.length < STREAM_MAX; i--) {
    const a = list[i];
    if (STREAM_TYPES.has(a.type) && a.detail) stream.unshift(a.detail.slice(0, 200));
  }
  const blocked = !!pending && pending.type !== "question";
  const questions = inlineAskQuestions(pending);
  return {
    ...toSessionLite(s, list, userMessages, goalId),
    ...sessionModel(s),
    project: projects.bySession.get(s.id) ?? null,
    isGoalSession: isButlerGoalSessionConfig(s.config),
    teamInstanceId: config.teamInstanceId ?? null,
    isAgentChild: isAgentChildSession(s),
    // 会话列表不收的（工作流 / 内部 / 原型）画布也不画；子 Agent 与目标执行会话另有归宿
    unlisted: !isTopLevelListSession(s) && !isAgentChildSession(s) && !isButlerGoalSessionConfig(s.config),
    missionMode: config.missionMode === true,
    ask: blocked ? blockedAskText(pending, list) : s.status === "waiting_input" ? getFirstQuestionText(lastMeaningfulActivity(list)) ?? lastMeaningfulActivity(list)?.detail ?? null : null,
    stream,
    ...blocked ? { blockedOnUser: true } : {},
    // 含文字追问；AskUserQuestion 面板超时收起后仍算在问
    ...pending || getFirstQuestionText(lastMeaningfulActivity(list)) ? { asksUser: true } : {},
    ...questions ? { questions, askId: list && getActiveInteractiveActivity(list)?.id || questions.map((q) => q.label).join("|") } : {}
  };
}
function useDirectionRefresh() {
  reactExports.useEffect(() => {
    const refresh = () => void useDirectionView.getState().refresh();
    let pending;
    refresh();
    const off = window.shineAI?.proposals?.onUpdated?.(() => {
      window.clearTimeout(pending);
      pending = window.setTimeout(refresh, 2e3);
    });
    const id = window.setInterval(refresh, 12e4);
    return () => {
      off?.();
      window.clearInterval(id);
      window.clearTimeout(pending);
    };
  }, []);
}
function useProjectIndex(sessions, workspaces) {
  return reactExports.useMemo(() => buildProjectIndex(sessions, workspaces), [sessions, workspaces]);
}
function useCanvasModel(viewportAspect) {
  const { i18n } = useTranslation();
  const copy = reactExports.useMemo(() => canvasCopyFor(i18n.language), [i18n.language]);
  const now = useNow();
  const { layout, loaded: layoutLoaded, update: updateLayout, updateQuiet, undo: undoLayout } = useCanvasLayout();
  const workGroups = useWorkGroups(layout, layoutLoaded, updateQuiet);
  const workspaces = useWorkspaces();
  const sessions = useSessionStore((s) => s.sessions);
  const watchGraph = useSessionStore((s) => s.watchGraph);
  const activities = useThrottledSessionSlice("activities", ACTIVITY_THROTTLE_MS);
  const conversations = useThrottledSessionSlice("conversations", ACTIVITY_THROTTLE_MS);
  const goals = useCanvasGoals(now);
  const goalsLoaded = useGoalStore((s) => s.listLoaded);
  const schedules = useCanvasSchedules(copy.lang);
  const teamInstances = useTeamStore((s) => s.teamInstances);
  reactExports.useEffect(() => {
    void useTeamStore.getState().loadTeamInstances();
  }, [now]);
  const activeExecutions = useWorkflowStore((s) => s.activeExecutions);
  const recentExecutions = useWorkflowStore((s) => s.recentExecutions);
  const executions = reactExports.useMemo(() => {
    const ids = new Set(activeExecutions.map((e) => e.id));
    return [...activeExecutions, ...recentExecutions.filter((e) => !ids.has(e.id))];
  }, [activeExecutions, recentExecutions]);
  const workflowDefs = useWorkflowStore((s) => s.workflows);
  reactExports.useEffect(() => {
    void useWorkflowStore.getState().fetchActiveExecutions();
    void useWorkflowStore.getState().fetchRecentExecutions(20);
  }, [now]);
  const hasRunningWorkflow = executions.some((e) => e.status === "running");
  reactExports.useEffect(() => {
    if (hasRunningWorkflow && !useWorkflowStore.getState().workflows.length) void useWorkflowStore.getState().fetchWorkflows();
  }, [hasRunningWorkflow]);
  const proposals = useWorkbenchProposals(goals, sessions);
  const projects = useProjectIndex(sessions, workspaces);
  const byDirectionOn = useDirectionView((s) => s.byDirection);
  const directionData = useDirectionView((s) => s.data);
  useDirectionRefresh();
  const byDirection = directionGroupingActive({ byDirection: byDirectionOn, data: directionData });
  const grouping = reactExports.useMemo(() => {
    if (!byDirection) return projects;
    const refs = directionRefs(directionData, now, (days) => i18n.t("workbench:canvas.direction.stale", { days }));
    return { ...projects, bySession: refs, ofGoal: () => null, ofPath: () => null };
  }, [projects, byDirection, directionData, now, i18n]);
  const viewLayout = reactExports.useMemo(() => layoutForGrouping(layout, byDirection), [layout, byDirection]);
  const goalBySession = reactExports.useMemo(() => indexGoalsBySession(goals), [goals]);
  const favoriteIds = useSessionStore((s) => s.favoriteSessionIds);
  const lastActivities = useThrottledSessionSlice("lastActivities", ACTIVITY_THROTTLE_MS);
  const butlerRunning = useButlerStore((s) => s.status === "running");
  const l3Enabled = useButlerStore((s) => !!s.config.enableAIAssist && !!s.config.aiAssistProviderId);
  const l3FallbackSessions = useButlerStore((s) => s.l3FallbackSessions);
  const sessionInputs = reactExports.useMemo(() => sessions.map((s) => {
    const list = activities[s.id];
    const pending = list?.length && BLOCKABLE.has(s.status) ? pendingInteractionOf({
      activities: list,
      lastActivity: lastActivities[s.id],
      l3Guard: { butlerRunning, l3Enabled, l3Fallback: !!l3FallbackSessions[s.id] },
      sessionBusy: s.status !== "waiting_input",
      now
    }) : null;
    return { ...toCanvasSessionInput(
      s,
      list,
      (conversations[s.id] ?? []).filter((m) => m.role === "user").length,
      goalBySession.get(s.id)?.id ?? null,
      grouping,
      pending
    ), favorite: favoriteIds.has(s.id) };
  }), [sessions, activities, lastActivities, conversations, goalBySession, grouping, favoriteIds, butlerRunning, l3Enabled, l3FallbackSessions, now]);
  const teamInputs = reactExports.useMemo(() => teamInstances.map((t2) => ({
    id: t2.id,
    name: t2.name,
    status: t2.status,
    parentSessionId: t2.parentSessionId ?? null,
    startedAt: t2.startedAt,
    endedAt: t2.endedAt ?? null,
    task: t2.task ?? null,
    project: grouping.ofPath(t2.workingDirectory),
    members: (t2.members ?? []).map((m) => ({ name: m.displayName || m.roleName, status: m.status, sessionId: m.childSessionId ?? null }))
  })), [teamInstances, grouping]);
  const workflowInputs = reactExports.useMemo(() => executions.map((e) => {
    const def = workflowDefs.find((w) => w.id === e.workflowId);
    const steps = def?.steps.length ? def.steps.map((s) => ({ name: s.name, status: e.stepStatuses[s.id] ?? "pending" })) : Object.entries(e.stepStatuses).map(([id, status]) => ({ name: id, status }));
    return { id: e.id, name: def?.name ?? e.workflowName ?? copy.workflowFallback, status: e.status, startedAt: e.startedAt, completedAt: e.completedAt ?? null, steps };
  }), [executions, workflowDefs, copy]);
  const prefetched = reactExports.useRef(/* @__PURE__ */ new Set());
  reactExports.useEffect(() => {
    const store = useSessionStore.getState();
    let n = 0;
    for (const s of sessions) {
      if (n >= MAX_ACTIVITY_PREFETCH) break;
      if (prefetched.current.has(s.id) || activities[s.id]?.length) continue;
      if (!["running", "waiting_input", "idle", "starting", "error"].includes(s.status)) continue;
      prefetched.current.add(s.id);
      n++;
      void store.fetchSessionActivities?.(s.id)?.catch?.(() => void 0);
    }
  }, [sessions, activities]);
  const model = reactExports.useMemo(() => buildCanvasModel({
    now,
    sessions: sessionInputs,
    goals,
    schedules,
    teams: teamInputs,
    workflows: workflowInputs,
    proposals: proposals.items,
    layout: viewLayout,
    copy,
    projectOfGoal: grouping.ofGoal,
    viewportAspect,
    watches: watchGraph,
    workGroups
  }), [now, sessionInputs, goals, schedules, teamInputs, workflowInputs, proposals.items, viewLayout, copy, grouping, viewportAspect, watchGraph, workGroups]);
  const ticks = reactExports.useMemo(() => buildTimelineTicks(model.nodes, dayBounds(now)), [model.nodes, now]);
  const replayAt$1 = reactExports.useCallback((atMs) => replayAt(ticks, atMs), [ticks]);
  const groupKeyOfSession = reactExports.useCallback((id) => grouping.bySession.get(id)?.key ?? null, [grouping]);
  return {
    model,
    layout,
    ticks,
    replayAt: replayAt$1,
    loading: !goalsLoaded || !layoutLoaded || proposals.mode === "loading",
    layoutLoaded,
    now,
    updateLayout,
    undoLayout,
    copy,
    projectContextOf: projects.contextOf,
    groupKeyOfSession
  };
}
function WorkbenchCanvas() {
  const [aspect, setAspect] = reactExports.useState();
  const { model, layout, ticks, replayAt: replayAt2, layoutLoaded, now, updateLayout, undoLayout, projectContextOf, groupKeyOfSession } = useCanvasModel(aspect);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-appearance-surface": "shell", className: "relative h-full min-h-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasBoard, { model, layout, ticks, replayAt: replayAt2, layoutLoaded, now, updateLayout, undoLayout, onViewportAspect: setAspect, projectContextOf, groupKeyOfSession }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WorkbenchGoalsPanel, { nodes: model.nodes })
  ] });
}
function WorkbenchView() {
  const rowRef = reactExports.useRef(null);
  const storedPanel = useWorkbenchDockStore((s) => s.panel);
  const panel = storedPanel && canDockPanelHere(storedPanel) ? storedPanel : null;
  const side = useWorkbenchDockStore((s) => s.side);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-appearance-surface": "shell", ref: rowRef, className: cn("flex h-full min-h-0", side === "left" && "flex-row-reverse"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReactFlowProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(WorkbenchCanvas, {}) }) }),
    panel && /* @__PURE__ */ jsxRuntimeExports.jsx(WorkbenchDock, { panel, containerRef: rowRef }, side)
  ] });
}
export {
  WorkbenchView,
  WorkbenchView as default
};
