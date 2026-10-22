"use strict";
const electron = require("electron");
// Buffer navigation until the main React shell subscribes.
const taskNavigationListeners = new Set();
let pendingTaskNavigation = null;
electron.ipcRenderer.on("butler:navigate-session", (_event, sessionId) => {
  if (typeof sessionId !== "string" || !sessionId) return;
  if (!taskNavigationListeners.size) pendingTaskNavigation = sessionId;
  else {
    pendingTaskNavigation = null;
    for (const callback of taskNavigationListeners) callback(sessionId);
  }
});
const __devPreloadInfo = electron.ipcRenderer.sendSync("dev:preload-info");
if (!__devPreloadInfo) throw new Error("Development preload origin was rejected");
// Sandboxed preload: unused i18next side effect removed.
const ROLLBACK_IPC = {
  DRY_RUN: "rollback:dryRun",
  APPLY: "rollback:apply",
  REDO: "rollback:redo"
};
const ORG_IPC = {
  GET_FEATURES: "org:get-features",
  REQUEST: "org:request",
  PUBLISH_DIR: "org:publish-dir",
  REVOKE_DIR: "org:revoke-dir",
  REMOTE_REQUEST: "org:remote-request",
  GET_MACHINE_ID: "org:get-machine-id",
  GET_ACCESS_LOG: "org:get-access-log",
  // ── P2a（只新增；任务/里程碑/评论/待办等 REST 一律走既有 org:request 透传）──
  /** invoke：立即拉一次 /org/inbox?since_id=，返回 OrgInboxState */
  INBOX_SYNC: "org:inbox-sync",
  /** main → renderer 推送：有新通知或未读数变化，payload = OrgInboxState */
  INBOX_UPDATED: "org:inbox-updated"
};
const ORG_P2B_IPC = {
  driveUpload: "org:drive-upload",
  driveUploadProgress: "org:drive-upload-progress",
  driveDownload: "org:drive-download",
  draftDeliverable: "org:draft-deliverable",
  draftProjectUpdate: "org:draft-project-update",
  taskSessionStart: "org:task-session-start",
  taskSessions: "org:task-sessions"
};
const ORG_P3_IPC = {
  /** 推送人：主进程弹文件选择框（渲染端不能传路径）+ 本机确认（含敏感路径警告）→ push-requests/create，记本机发件箱 */
  pushCreate: "org:push-create",
  /** 所有者：主进程弹确认框（含敏感文件名警告）→ 写本机已确认表 → push-requests/accept */
  pushAccept: "org:push-accept",
  pushReject: "org:push-reject",
  /** main → renderer：推送/接收进度 */
  pushProgress: "org:push-progress",
  /** 推送人：手动重试传输（accepted 未送达时） */
  pushRetry: "org:push-retry"
};
const ORG_P4_IPC = {
  /** 拉 GET /org/weekly-reports/source → 本机 LLMService 起草；不上传、不读任何会话 */
  draftWeeklyReport: "org:draft-weekly-report"
};
const IPC = {
  // 主进程 → 渲染进程
  SESSION_OUTPUT: "session:output",
  SESSION_STATUS_CHANGE: "session:status-change",
  SESSION_ACTIVITY: "session:activity",
  SESSION_INTERVENTION: "session:intervention",
  SESSION_TOOL_STATUS: "session:tool-status",
  DEEP_LINK_HANDLE: "deep-link:handle",
  // 渲染进程 → 主进程 (invoke)
  SESSION_CREATE: "session:create",
  SESSION_TERMINATE: "session:terminate",
  SESSION_SEND_INPUT: "session:send-input",
  SESSION_CONFIRM: "session:confirm",
  SESSION_RESIZE: "session:resize",
  SESSION_GET_ALL: "session:get-all",
  SESSION_GET_STATS: "session:get-stats",
  SESSION_GET_HISTORY: "session:get-history",
  SESSION_GET_BY_IDS: "session:get-by-ids",
  SESSION_GET_ACTIVITIES: "session:get-activities",
  SESSION_RESUME: "session:resume",
  SESSION_NAME_CHANGE: "session:name-change",
  SESSION_GET_LOGS: "session:get-logs",
  SESSION_GET_OUTPUT: "session:get-output",
  SESSION_GET_DIAGNOSTIC_TIMELINE: "session:get-diagnostic-timeline",
  // 只读：会话诊断/回放时间线
  SESSION_RENAME: "session:rename",
  SESSION_AI_RENAME: "session:ai-rename",
  SESSION_DELETE: "session:delete",
  SESSION_BATCH_DELETE: "session:batch-delete",
  // 批量删除会话（支持快照恢复）
  SESSION_RESTORE: "session:restore",
  SESSION_GET_CHANGE_SET: "session:get-change-set",
  SESSION_GET_CHANGE_DIFF: "session:get-change-diff",
  SESSION_CHECK_WORKTREE_MERGE: "session:check-worktree-merge",
  // 抽屉「通过并合并」预检（只读）
  SESSION_MERGE_WORKTREE: "session:merge-worktree",
  // 抽屉「通过并合并」：squash 合入会话基准分支并清理 worktree
  // SDK V2: 对话 API
  SESSION_SEND_MESSAGE: "session:send-message",
  SESSION_CONVERSATION_MESSAGE: "session:conversation-message",
  SESSION_TODOS_UPDATE: "session:todos:update",
  SESSION_CONVERSATION_HISTORY: "session:conversation-history",
  SESSION_CONVERSATION_HISTORY_PAGED: "session:conversation-history-paged",
  SESSION_PERMISSION_REQUEST: "session:permission-request",
  SESSION_PERMISSION_RESPOND: "session:permission-respond",
  SESSION_INIT_DATA: "session:init-data",
  // 会话初始化数据（tools/skills/mcp）
  SESSION_TOKEN_UPDATE: "session:token-update",
  // SDK V2: 实时 token 用量推送（主进程 → 渲染进程）
  SESSION_ABORT: "session:abort",
  // SDK V2: 中断当前正在执行的轮次（软中断，会话保持可用）
  SESSION_CONTEXT_UPDATE: "session:context-update",
  // 主进程 → 渲染进程：context 压缩状态更新
  SESSION_BACKGROUND_SHELLS_LIST: "session:background-shells:list",
  SESSION_BACKGROUND_SHELLS_KILL: "session:background-shells:kill",
  SESSION_BACKGROUND_SHELLS_UPDATE: "session:background-shells:update",
  SESSION_COMPACT_CONTEXT: "session:compact-context",
  // 渲染进程 → 主进程：触发 context 压缩
  SESSION_UPDATE_CONTEXT_WINDOW: "session:update-context-window",
  // 渲染进程 → 主进程：临时调整当前会话的 max context window
  SESSION_ANSWER_QUESTION: "session:answer-question",
  // 用户回答 AskUserQuestion
  SESSION_APPROVE_PLAN: "session:approve-plan",
  // 用户审批/拒绝 ExitPlanMode
  SESSION_GET_QUEUE: "session:get-queue",
  // SDK V2: 获取排队中的消息列表
  SESSION_CLEAR_QUEUE: "session:clear-queue",
  // SDK V2: 清空排队中的消息（用户主动取消）
  SESSION_REMOVE_QUEUE_MESSAGE: "session:remove-queue-message",
  SESSION_UPDATE_QUEUE_MESSAGE: "session:update-queue-message",
  SESSION_REORDER_QUEUE_MESSAGES: "session:reorder-queue-messages",
  SESSION_PROMOTE_QUEUE_MESSAGE_INTERRUPT: "session:promote-queue-message-interrupt",
  SESSION_QUEUE_UPDATE: "session:queue-update",
  // SDK V2: 队列变更事件（主进程 → 渲染进程）
  SESSION_OPTIMIZE_PROMPT: "session:optimize-prompt",
  // AI 优化提示词（输入框快捷按钮）
  SESSION_TRANSLATE_TEXT: "session:translate-text",
  // 快捷翻译（输入框翻译成目标语言 / 回复翻译）
  SESSION_SET_REASONING_EFFORT: "session:set-reasoning-effort",
  // 动态更新会话推理强度（Codex 推理模型）
  SESSION_SET_PERMISSION_MODE: "session:set-permission-mode",
  // 运行时切换会话权限模式
  SESSION_SET_MODE: "session:set-mode",
  // 运行时切换会话模式（自动 normal ↔ Supervisor；mission 需新建）
  SESSION_SET_DIRECTORY_ACCESS_MODE: "session:set-directory-access-mode",
  // 运行时热更新目录权限（项目目录 / 用户目录 / 完全访问）
  SESSION_SET_WORKSPACE_ID: "session:set-workspace-id",
  // 只改列表归属，不换工作目录
  SESSION_SET_PLAN_MODE: "session:set-plan-mode",
  // 切换统一 Plan 模式（next-turn 生效）
  SESSION_UPDATE_PLAN_STAGE: "session:update-plan-stage",
  // 更新 Plan 模式阶段级路由配置
  SESSION_UPDATE_AGENT_DISPATCH_POOL: "session:update-agent-dispatch-pool",
  // 更新 Supervisor/Mission 子 Agent 调度池（providers + models）
  SESSION_SET_GLOBAL_AGENT_DISPATCH_POOL: "session:set-global-agent-dispatch-pool",
  // 全局子 Agent 调度池：写全局设置并对所有会话即时生效
  SESSION_LIST_MESSAGES: "session:list-messages",
  // 获取指定会话可引用消息摘要列表（@session 精细引用）
  SESSION_SEARCH_CONTENT: "session:search-content",
  // 按对话正文搜索会话
  AGENT_GET_OUTPUT: "agent:get-output",
  // 获取指定 Agent 最近输出片段（@agent 选单）
  SESSION_GET_SYSTEM_PROMPT: "session:get-system-prompt",
  SESSION_GET_REASONING_EFFORT: "session:get-reasoning-effort",
  // 获取会话当前推理强度
  SESSION_SWITCH_PROVIDER: "session:switch-provider",
  // 会话内切换 Provider/模型
  SESSION_SWITCH_PROVIDER_KEY_GROUP: "session:switch-provider-key-group",
  // 会话手切 Key 池 URL 组（无 secret）
  SESSION_PROVIDER_SWITCHED: "session:provider-switched",
  // Provider 切换成功通知（主进程 → 渲染进程）
  SESSION_EDIT_USER_MESSAGE: "session:edit-user-message",
  // 编辑用户消息并截断后续上下文重新发送
  SESSION_ROLLBACK_PREVIEW: "session:rollback-preview",
  // 对话回滚 dry-run：计算将丢弃的消息数
  SESSION_ROLLBACK_APPLY: "session:rollback-apply",
  // 对话回滚 apply：截断历史并重建 adapter runtime
  SESSION_ROLLBACK_REDO: "session:rollback-redo",
  // 对话回滚 redo：恢复被截断消息并重建 runtime
  // Session Favorites (收藏/置顶)
  SESSION_GET_FAVORITES: "session:get-favorites",
  SESSION_TOGGLE_FAVORITE: "session:toggle-favorite",
  SESSION_IS_FAVORITE: "session:is-favorite",
  SESSION_WATCH_LIST_GRAPH: "session:watch-list-graph",
  SESSION_WATCH: "session:watch",
  SESSION_UNWATCH: "session:unwatch",
  // 原型设计项目 (Prototype Projects)
  PROTOTYPE_PROJECT_GET_ALL: "prototype-project:get-all",
  PROTOTYPE_PROJECT_CREATE: "prototype-project:create",
  PROTOTYPE_PROJECT_UPDATE: "prototype-project:update",
  PROTOTYPE_PROJECT_DELETE: "prototype-project:delete",
  PROTOTYPE_PROJECT_GET: "prototype-project:get",
  PROTOTYPE_PROJECT_LINK_SESSION: "prototype-project:link-session",
  PROTOTYPE_PROJECT_GET_BY_SESSION: "prototype-project:get-by-session",
  PROTOTYPE_PROJECT_GET_SESSIONS: "prototype-project:get-sessions",
  // 原型设计页面 (Design Pages)
  DESIGN_PAGE_GET_ALL: "design-page:get-all",
  DESIGN_PAGE_CREATE: "design-page:create",
  DESIGN_PAGE_UPDATE: "design-page:update",
  DESIGN_PAGE_DELETE: "design-page:delete",
  DESIGN_PAGE_REORDER: "design-page:reorder",
  /** 补生成画布真缩略图（async，不阻塞） */
  DESIGN_PAGE_ENSURE_THUMBNAIL: "design-page:ensure-thumbnail",
  // 原型组 (Prototype Groups) — 项目下的功能流 / 画布组
  PROTOTYPE_GROUP_LIST: "prototype-group:list",
  PROTOTYPE_GROUP_GET: "prototype-group:get",
  PROTOTYPE_GROUP_CREATE: "prototype-group:create",
  PROTOTYPE_GROUP_UPDATE: "prototype-group:update",
  PROTOTYPE_GROUP_DELETE: "prototype-group:delete",
  PROTOTYPE_GROUP_REORDER: "prototype-group:reorder",
  // 原型增强会话关联 (Prototype Session Links) — 区分 create / continue / optimize / import
  PROTOTYPE_LINK_LIST: "prototype-link:list",
  PROTOTYPE_LINK_UPSERT: "prototype-link:upsert",
  PROTOTYPE_LINK_DELETE: "prototype-link:delete",
  PROTOTYPE_LINK_TOUCH: "prototype-link:touch",
  // 原型路由 (Prototype Routes) — 页面间跳转关系
  PROTOTYPE_ROUTE_GET_ALL: "prototype-route:get-all",
  PROTOTYPE_ROUTE_CREATE: "prototype-route:create",
  PROTOTYPE_ROUTE_UPDATE: "prototype-route:update",
  PROTOTYPE_ROUTE_DELETE: "prototype-route:delete",
  // 原型快照 (Design Snapshots)
  DESIGN_SNAPSHOT_CREATE: "design-snapshot:create",
  DESIGN_SNAPSHOT_LIST: "design-snapshot:list",
  DESIGN_SNAPSHOT_REVERT: "design-snapshot:revert",
  DESIGN_SNAPSHOT_DIFF: "design-snapshot:diff",
  // 原型评论 (Design Comments)
  DESIGN_COMMENT_CREATE: "design-comment:create",
  DESIGN_COMMENT_LIST: "design-comment:list",
  DESIGN_COMMENT_UPDATE: "design-comment:update",
  DESIGN_COMMENT_DELETE: "design-comment:delete",
  DESIGN_COMMENT_APPLY: "design-comment:apply",
  DESIGN_COMMENT_DISMISS: "design-comment:dismiss",
  // 原型项目化重构：项目详情 / 主会话 / 迭代历史
  PROTOTYPE_SET_PRIMARY_SESSION: "prototype:setPrimarySession",
  PROTOTYPE_GET_PROJECT_DETAIL: "prototype:getProjectDetail",
  PROTOTYPE_ADD_ITERATION: "prototype:addIteration",
  PROTOTYPE_GET_ITERATIONS: "prototype:getIterations",
  PROTOTYPE_UPDATE_CONTEXT_SUMMARY: "prototype:updateContextSummary",
  PROTOTYPE_INCREMENT_ITERATION_COUNT: "prototype:incrementIterationCount",
  PROTOTYPE_TOUCH_LAST_ACTIVE_AT: "prototype:touchLastActiveAt",
  // 原型画布弹出窗口 + 同步
  PROTOTYPE_OPEN_WINDOW: "prototype:open-window",
  PROTOTYPE_WINDOW_CLOSED: "prototype:window-closed",
  PROTOTYPE_SYNC_PAGES: "prototype:sync-pages",
  // 办公室全屏弹出窗口
  OFFICE_OPEN_WINDOW: "office:open-window",
  OFFICE_CLOSE_WINDOW: "office:close-window",
  OFFICE_WINDOW_CLOSED: "office:window-closed",
  OFFICE_TOGGLE_FULLSCREEN: "office:toggle-fullscreen",
  OFFICE_MINIMIZE_WINDOW: "office:minimize-window",
  OFFICE_MAXIMIZE_WINDOW: "office:maximize-window",
  OFFICE_SYNC_INSTANCE: "office:sync-instance",
  // 投屏独立窗口
  SCREENSHARE_OPEN_WINDOW: "screenshare:open-window",
  SCREENSHARE_CLOSE_WINDOW: "screenshare:close-window",
  SCREENSHARE_WINDOW_CLOSED: "screenshare:window-closed",
  SCREENSHARE_TOGGLE_FULLSCREEN: "screenshare:toggle-fullscreen",
  SCREENSHARE_MINIMIZE_WINDOW: "screenshare:minimize-window",
  SCREENSHARE_MAXIMIZE_WINDOW: "screenshare:maximize-window",
  // 多人会议独立窗口
  MEETING_OPEN_WINDOW: "meeting:open-window",
  MEETING_CLOSE_WINDOW: "meeting:close-window",
  MEETING_WINDOW_CLOSED: "meeting:window-closed",
  MEETING_MINIMIZE_WINDOW: "meeting:minimize-window",
  MEETING_MAXIMIZE_WINDOW: "meeting:maximize-window",
  // 表面独立窗口（把工作格里的一个标签拉出来单独看）
  SURFACE_WINDOW_OPEN: "surface-window:open",
  /** 列出当前已打开的表面独立窗口（键 = kind[|绑定会话]，见 shared/surfaceWindow.ts） */
  SURFACE_WINDOW_LIST: "surface-window:list",
  /** 已打开窗口集合变化（打开/关闭）时向所有窗口广播 */
  SURFACE_WINDOW_CHANGED: "surface-window:changed",
  /** 聚焦已有窗口时把新参数（选中实例等）推给该窗口 */
  SURFACE_WINDOW_PARAMS: "surface-window:params",
  // 工作区独立窗口
  WORKSPACE_OPEN_WINDOW: "workspace:open-window",
  WORKSPACE_LIST_OPEN_WINDOWS: "workspace:list-open-windows",
  WORKSPACE_WINDOW_CLOSED: "workspace:window-closed",
  // Mission Control 独立窗口
  MISSION_CONTROL_OPEN_WINDOW: "mission-control:open-window",
  MISSION_CONTROL_CLOSE_WINDOW: "mission-control:close-window",
  MISSION_CONTROL_WINDOW_CLOSED: "mission-control:window-closed",
  // 会话独立聊天窗口（微信/QQ 风格，一会话一 OS 窗）
  SESSION_CHAT_OPEN_WINDOW: "session-chat:open-window",
  SESSION_CHAT_CLOSE_WINDOW: "session-chat:close-window",
  SESSION_CHAT_WINDOW_CLOSED: "session-chat:window-closed",
  SESSION_CHAT_MINIMIZE_WINDOW: "session-chat:minimize-window",
  SESSION_CHAT_MAXIMIZE_WINDOW: "session-chat:maximize-window",
  SESSION_CHAT_SET_ALWAYS_ON_TOP: "session-chat:set-always-on-top",
  SESSION_CHAT_GET_ALWAYS_ON_TOP: "session-chat:get-always-on-top",
  SESSION_CHAT_LIST_OPEN_WINDOWS: "session-chat:list-open-windows",
  SESSION_CHAT_IS_MAXIMIZED: "session-chat:is-maximized",
  SESSION_CHAT_MAXIMIZED_CHANGED: "session-chat:maximized-changed",
  // 主窗口全屏控制
  WINDOW_SET_FULLSCREEN: "window:set-fullscreen",
  WINDOW_IS_FULLSCREEN: "window:is-fullscreen",
  WINDOW_FULLSCREEN_CHANGED: "window:fullscreen-changed",
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_GET_ALL: "task:get-all",
  TASK_STATUS_CHANGE: "task:status-change",
  TASK_START_SESSION: "task:start-session",
  TASK_CREATE_FROM_EXPERT_SUGGESTION: "task:create-from-expert-suggestion",
  // Kanban / Project Board
  KANBAN_LIST_BOARDS: "kanban:list-boards",
  KANBAN_GET_BOARD: "kanban:get-board",
  KANBAN_CREATE_BOARD: "kanban:create-board",
  KANBAN_UPDATE_BOARD: "kanban:update-board",
  KANBAN_ARCHIVE_BOARD: "kanban:archive-board",
  KANBAN_LIST_COLUMNS: "kanban:list-columns",
  KANBAN_CREATE_COLUMN: "kanban:create-column",
  KANBAN_UPDATE_COLUMN: "kanban:update-column",
  KANBAN_REORDER_COLUMNS: "kanban:reorder-columns",
  KANBAN_LIST_TASKS: "kanban:list-tasks",
  KANBAN_GET_TASK: "kanban:get-task",
  KANBAN_CREATE_TASK: "kanban:create-task",
  KANBAN_UPDATE_TASK: "kanban:update-task",
  KANBAN_MOVE_TASK: "kanban:move-task",
  KANBAN_REORDER_TASKS: "kanban:reorder-tasks",
  KANBAN_LIST_TASK_EVENTS: "kanban:list-task-events",
  KANBAN_GET_TASK_TIMELINE: "kanban:get-task-timeline",
  KANBAN_LIST_TASK_EXECUTIONS: "kanban:list-task-executions",
  KANBAN_START_TASK_EXECUTION: "kanban:start-task-execution",
  KANBAN_BIND_TASK_EXECUTION: "kanban:bind-task-execution",
  KANBAN_GET_TASK_WORKTREE_STATUS: "kanban:get-task-worktree-status",
  KANBAN_REFRESH_TASK_WORKTREE: "kanban:refresh-task-worktree",
  KANBAN_REFRESH_TASK_DIFF: "kanban:refresh-task-diff",
  KANBAN_GET_TASK_FILE_DIFF: "kanban:get-task-file-diff",
  KANBAN_REQUEST_TASK_REVIEW: "kanban:request-task-review",
  KANBAN_CHECK_TASK_MERGE: "kanban:check-task-merge",
  KANBAN_MANUAL_MERGE_TASK: "kanban:manual-merge-task",
  KANBAN_MERGE_TASK_WORKTREE: "kanban:merge-task-worktree",
  KANBAN_DELETE_TASK: "kanban:delete-task",
  KANBAN_TASK_TIMELINE_EVENT: "kanban:task-timeline-event",
  // 任务流转简化版（B2）：产物+进度摘要+备注 导出/移交（契约外补充通道）
  TASK_HANDOVER_EXPORT: "task-handover:export",
  TASK_HANDOVER_HANDOVER: "task-handover:handover",
  WORKFLOW_START: "workflow:start",
  WORKFLOW_APPROVE_STEP: "workflow:approve-step",
  WORKFLOW_COMPLETE_STEP: "workflow:complete-step",
  WORKFLOW_SAVE: "workflow:save",
  WORKFLOW_LIST: "workflow:list",
  WORKFLOW_GET: "workflow:get",
  WORKFLOW_UPDATE: "workflow:update",
  WORKFLOW_DELETE: "workflow:delete",
  WORKFLOW_LIST_VERSIONS: "workflow:list-versions",
  WORKFLOW_RESTORE_VERSION: "workflow:restore-version",
  // 多模态创作画布（复用统一 Provider；保留旧渠道兼容）
  CREATIVE_PROVIDER_LIST: "creative-canvas:provider-list",
  CREATIVE_CHANNEL_LIST: "creative-canvas:channel-list",
  CREATIVE_TASK_CREATE: "creative-canvas:task-create",
  CREATIVE_TASK_GET: "creative-canvas:task-get",
  CREATIVE_TASK_LIST: "creative-canvas:task-list",
  CREATIVE_TASK_CANCEL: "creative-canvas:task-cancel",
  CREATIVE_TASK_UPDATED: "creative-canvas:task-updated",
  CREATIVE_ASSET_LIST: "creative-canvas:asset-list",
  CREATIVE_ASSET_IMPORT: "creative-canvas:asset-import",
  CREATIVE_ASSET_EXPORT: "creative-canvas:asset-export",
  CREATIVE_ASSET_DELETE: "creative-canvas:asset-delete",
  SEARCH_LOGS: "search:logs",
  USAGE_GET_SUMMARY: "usage:get-summary",
  USAGE_GET_HISTORY: "usage:get-history",
  USAGE_FLUSH: "usage:flush",
  DIRECTORY_GET_RECENT: "directory:get-recent",
  DIRECTORY_TOGGLE_PIN: "directory:toggle-pin",
  DIRECTORY_REMOVE: "directory:remove",
  PROVIDER_GET_ALL: "provider:get-all",
  PROVIDER_QUOTA_LIST: "provider-quota:list",
  // Provider 额度状态列表
  PROVIDER_QUOTA_RETRY_NOW: "provider-quota:retry-now",
  // 跳过等待立即试探
  PROVIDER_QUOTA_FAILOVER_NOW: "provider-quota:failover-now",
  // 立即把等待中的会话切到备用 Provider
  PROVIDER_QUOTA_UPDATED: "provider-quota:updated",
  // 额度状态变更（主进程 → 渲染进程）
  PROVIDER_GET: "provider:get",
  PROVIDER_CREATE: "provider:create",
  PROVIDER_UPDATE: "provider:update",
  PROVIDER_DELETE: "provider:delete",
  PROVIDER_REORDER: "provider:reorder",
  /** 主进程 → 渲染层：Provider 列表已变更（渲染层刷新 useProviders 缓存） */
  PROVIDER_CHANGED: "provider:changed",
  RELAY_TEMPLATE_GET_ALL: "relay-template:get-all",
  RELAY_TEMPLATE_GET_ALL_ADMIN: "relay-template:get-all-admin",
  RELAY_TEMPLATE_GET: "relay-template:get",
  RELAY_TEMPLATE_CREATE: "relay-template:create",
  RELAY_TEMPLATE_UPDATE: "relay-template:update",
  RELAY_TEMPLATE_DELETE: "relay-template:delete",
  RELAY_TEMPLATE_SYNC: "relay-template:sync",
  PROVIDER_CHECK_CLI: "provider:check-cli",
  /** 测试 Provider 健康状态（按 adapterType 路由，返回延迟与状态） */
  PROVIDER_TEST: "provider:test",
  /** 测试 claude-sdk 可执行文件路径（自动检测或验证指定路径） */
  PROVIDER_TEST_EXECUTABLE: "provider:test-executable",
  /** 测试 OpenAI 兼容 API 连接（验证 apiBaseUrl / apiKey / model 是否可用） */
  PROVIDER_TEST_API: "provider:test-api",
  /** Provider Key 池：读取配置 */
  PROVIDER_KEY_POOL_GET_CONFIG: "provider:key-pool:get-config",
  /** Provider Key 池：更新配置 */
  PROVIDER_KEY_POOL_SET_CONFIG: "provider:key-pool:set-config",
  /** Provider Key 池：列出 Key（无明文） */
  PROVIDER_KEY_POOL_LIST: "provider:key-pool:list",
  /** Provider Key 池：批量添加 Key（唯一接收明文的写入入口之一） */
  PROVIDER_KEY_POOL_ADD: "provider:key-pool:add",
  /** Provider Key 池：更新 Key 元数据（禁止写明文） */
  PROVIDER_KEY_POOL_UPDATE: "provider:key-pool:update",
  /** Provider Key 池：删除 Key */
  PROVIDER_KEY_POOL_REMOVE: "provider:key-pool:remove",
  /** Provider Key 池：测试单个 Key（前端只传 keyId） */
  PROVIDER_KEY_POOL_TEST: "provider:key-pool:test",
  /** Provider Key 池：批量测试（并发上限 3） */
  PROVIDER_KEY_POOL_TEST_ALL: "provider:key-pool:test-all",
  /** Provider Key 池：重置健康状态 */
  PROVIDER_KEY_POOL_RESET_HEALTH: "provider:key-pool:reset-health",
  /** Provider Key 池：清除冷却 */
  PROVIDER_KEY_POOL_CLEAR_COOLDOWN: "provider:key-pool:clear-cooldown",
  /** Provider Key 池：导入当前 provider.apiKey（不删除原字段） */
  PROVIDER_KEY_POOL_IMPORT_CURRENT: "provider:key-pool:import-current",
  /** Provider Key 池：用池内 Key（main 解密）拉取模型列表，不回传 apiKey */
  PROVIDER_KEY_POOL_FETCH_MODELS: "provider:key-pool:fetch-models",
  /** 根据 API URL / API Key 拉取 Provider 模型列表 */
  PROVIDER_FETCH_MODELS: "provider:fetch-models",
  /** 启动 Claude OAuth 登录流程（调用 SDK 内置 cli.js login） */
  PROVIDER_CLAUDE_LOGIN: "provider:claude-login",
  /** 检查 Claude 登录状态 */
  PROVIDER_CLAUDE_LOGIN_STATUS: "provider:claude-login-status",
  /** 启动 Codex 登录流程（调用 codex login，打开浏览器 ChatGPT OAuth） */
  PROVIDER_CODEX_LOGIN: "provider:codex-login",
  /** 检查 Codex 登录状态 */
  PROVIDER_CODEX_LOGIN_STATUS: "provider:codex-login-status",
  /** 启动 Gemini 登录流程（调用 gemini login，打开浏览器 Google OAuth） */
  PROVIDER_GEMINI_LOGIN: "provider:gemini-login",
  /** 检查 Gemini 登录状态 */
  PROVIDER_GEMINI_LOGIN_STATUS: "provider:gemini-login-status",
  /** 启动 GitHub Copilot 登录流程（调用 gh auth login --web） */
  PROVIDER_COPILOT_LOGIN: "provider:copilot-login",
  /** 检查 GitHub Copilot 登录状态 */
  PROVIDER_COPILOT_LOGIN_STATUS: "provider:copilot-login-status",
  /** 打开文件选择对话框，返回选中文件路径 */
  DIALOG_SELECT_FILE: "dialog:select-file",
  DIALOG_SELECT_MEDIA: "dialog:select-media",
  APP_QUIT: "app:quit",
  APP_RELAUNCH_ELEVATED: "app:relaunch-elevated",
  APP_CHECK_ELEVATED: "app:check-elevated",
  OPEN_EXTERNAL: "system:open-external",
  MCP_STARTUP_FAILURE: "mcp:startup-failure",
  /** 打开文件选择对话框，返回选中文件路径 */
  DIALOG_SELECT_IMAGE: "dialog:select-image",
  // Node 版本管理
  NVM_LIST_VERSIONS: "nvm:list-versions",
  // 办公室全屏弹出窗口
  THEME_UPDATE_TITLE_BAR: "theme:update-title-bar",
  // 办公室全屏弹出窗口
  VOICE_TRANSCRIBE: "voice:transcribe",
  VOICE_STREAM_START: "voice:stream:start",
  VOICE_STREAM_CHUNK: "voice:stream:chunk",
  VOICE_STREAM_STOP: "voice:stream:stop",
  VOICE_STREAM_RESULT: "voice:stream:result",
  VOICE_STREAM_ERROR: "voice:stream:error",
  /** 渲染→主：转写后 LLM 整理（纠同音字/去口语），payload = { text, providerId } */
  VOICE_POLISH: "voice:polish",
  VOICE_LOCAL_WHISPER_STATUS: "voice:local-whisper-status",
  VOICE_LOCAL_WHISPER_ENV_STATUS: "voice:local-whisper-env-status",
  // 小光语音中枢 — Sherpa 唤醒层
  /** 主→渲染：唤醒词命中事件，payload = { keywordIndex, keyword, timestamp, source, engine } */
  VOICE_WAKE: "voice:wake",
  /** 渲染→主：唤醒服务控制（start/stop/suspend/resume/devices/set-sensitivity/status） */
  VOICE_WAKE_CONTROL: "voice:wake:control",
  ASSISTANT_CHAT: "assistant:chat",
  ASSISTANT_CONFIRM_REQUEST: "assistant:confirm-request",
  ASSISTANT_CONFIRM_REPLY: "assistant:confirm-reply",
  ASSISTANT_CONFIRM_RESOLVED: "assistant:confirm-resolved",
  ASSISTANT_UI_COMMAND: "assistant:ui-command",
  VOICE_TTS_SYNTHESIZE: "voice:tts:synthesize",
  VOICE_MODELS_CONTROL: "voice:models:control",
  VOICE_MODELS_PROGRESS: "voice:models:progress",
  // 办公室全屏弹出窗口
  FS_SAVE_IMAGE_TO_TEMP: "fs:save-image-to-temp",
  // 办公室全屏弹出窗口
  LOG_GET_RECENT: "log:get-recent",
  LOG_OPEN_FILE: "log:open-file",
  // 办公室全屏弹出窗口
  SETTINGS_GET_ALL: "settings:get-all",
  SETTINGS_UPDATE: "settings:update",
  // AI 工作日报 / 分享海报
  DAILY_REPORT_GET: "daily-report:get",
  DAILY_REPORT_SAVE_POSTER: "daily-report:save-poster",
  DAILY_REPORT_COPY_POSTER: "daily-report:copy-poster",
  DAILY_REPORT_GENERATE_POSTER: "daily-report:generate-poster",
  DAILY_REPORT_PUSH_NOW: "daily-report:push-now",
  // Monaco 代码预览 AI 灰字补全（Copilot 式 inline completion）
  COMPLETION_INLINE: "completion:inline",
  // 会话级 IPC 定向路由：渲染进程上报当前订阅的 topic 全集（替换语义）
  SYSTEM_SET_IPC_TOPICS: "system:set-ipc-topics",
  // Environment diagnostics
  ENVIRONMENT_CHECK: "environment:check",
  // 办公室全屏弹出窗口
  DATA_PATH_GET: "data-path:get",
  DATA_PATH_SELECT_DIR: "data-path:select-dir",
  DATA_PATH_MIGRATE: "data-path:migrate",
  DATA_PATH_MIGRATION_PROGRESS: "data-path:migration-progress",
  DATA_PATH_MIGRATION_STATUS: "data-path:migration-status",
  DATA_PATH_RESET: "data-path:reset",
  DATA_PATH_RESTART: "data-path:restart",
  // 配置导出 / 导入（基础配置跨机迁移，AES-256-GCM 加密）
  CONFIG_EXPORT: "config:export",
  CONFIG_IMPORT_PREVIEW: "config:import:preview",
  CONFIG_IMPORT_APPLY: "config:import:apply",
  // 数据库维护（独立历史库迁移 + 主库瘦身）
  DB_MAINTENANCE_STATS: "db-maintenance:stats",
  DB_MAINTENANCE_MIGRATE: "db-maintenance:migrate",
  // 办公室全屏弹出窗口
  UPDATE_GET_STATE: "update:get-state",
  UPDATE_CHECK: "update:check",
  UPDATE_DOWNLOAD: "update:download",
  UPDATE_INSTALL: "update:install",
  UPDATE_OPEN_DOWNLOAD_PAGE: "update:open-download-page",
  UPDATE_STATE_CHANGED: "update:state-changed",
  // Git Worktree 隔离
  GIT_IS_REPO: "git:is-repo",
  GIT_GET_BRANCHES: "git:get-branches",
  GIT_GET_CURRENT_BRANCH: "git:get-current-branch",
  GIT_DETECT_MAIN_BRANCH: "git:detect-main-branch",
  GIT_GET_REPO_ROOT: "git:get-repo-root",
  GIT_IS_DIRTY: "git:is-dirty",
  GIT_GET_STATUS: "git:get-status",
  GIT_GET_FILE_DIFF: "git:get-file-diff",
  GIT_STAGE: "git:stage",
  GIT_UNSTAGE: "git:unstage",
  GIT_DISCARD: "git:discard",
  GIT_STAGE_ALL: "git:stage-all",
  GIT_COMMIT: "git:commit",
  GIT_PULL: "git:pull",
  GIT_PUSH: "git:push",
  GIT_GET_LOG: "git:get-log",
  GIT_GET_REMOTE_STATUS: "git:get-remote-status",
  GIT_GET_COMMIT_FILES: "git:get-commit-files",
  WORKTREE_CREATE: "worktree:create",
  WORKTREE_REMOVE: "worktree:remove",
  WORKTREE_LIST: "worktree:list",
  WORKTREE_LIFECYCLE: "worktree:lifecycle",
  WORKTREE_CHECK_MERGE: "worktree:check-merge",
  WORKTREE_MERGE: "worktree:merge",
  WORKTREE_DIFF_SUMMARY: "worktree:diff-summary",
  WORKTREE_FILE_DIFF: "worktree:file-diff",
  WORKTREE_LIVE_DIFF_SUMMARY: "worktree:live-diff-summary",
  WORKTREE_LIVE_FILE_DIFF: "worktree:live-file-diff",
  // Workspace 工作区管理
  WORKSPACE_LIST: "workspace:list",
  WORKSPACE_GET: "workspace:get",
  WORKSPACE_CREATE: "workspace:create",
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_DELETE: "workspace:delete",
  WORKSPACE_SCAN_REPOS: "workspace:scan-repos",
  WORKSPACE_IMPORT_VSCODE: "workspace:import-vscode",
  // MCP 管理
  MCP_GET_ALL: "mcp:get-all",
  MCP_GET: "mcp:get",
  MCP_CREATE: "mcp:create",
  MCP_UPDATE: "mcp:update",
  MCP_DELETE: "mcp:delete",
  MCP_TOGGLE: "mcp:toggle",
  MCP_TEST_CONNECTION: "mcp:test-connection",
  MCP_GET_FOR_PROVIDER: "mcp:get-for-provider",
  MCP_INSTALL: "mcp:install",
  MCP_INSTALL_PROGRESS: "mcp:install-progress",
  MCP_LIST_TOOLS: "mcp:list-tools",
  // 列出 sharedMcpGateway 中所有已扫描的工具（@ 工具选单）
  // Skill 技能管理
  SKILL_GET_ALL: "skill:get-all",
  SKILL_GET: "skill:get",
  SKILL_CREATE: "skill:create",
  SKILL_UPDATE: "skill:update",
  SKILL_DELETE: "skill:delete",
  SKILL_TOGGLE: "skill:toggle",
  SKILL_CREATE_LEARNED: "skill:createLearned",
  SKILL_EXECUTE: "skill:execute",
  SKILL_GET_BY_COMMAND: "skill:get-by-command",
  SKILL_LIST_BUILTIN: "skill:list-builtin",
  SKILL_REINSTALL_BUILTIN: "skill:reinstall-builtin",
  // Quick Action 快捷操作
  QUICK_ACTION_GET_ALL: "quick-action:get-all",
  QUICK_ACTION_GET_BY_SCOPE: "quick-action:get-by-scope",
  QUICK_ACTION_CREATE: "quick-action:create",
  QUICK_ACTION_UPDATE: "quick-action:update",
  QUICK_ACTION_DELETE: "quick-action:delete",
  QUICK_ACTION_REORDER: "quick-action:reorder",
  QUICK_ACTION_EXEC_SHELL: "quick-action:exec-shell",
  QUICK_ACTION_SHELL_OUTPUT: "quick-action:shell-output",
  // 主→渲：流式 stdout/stderr
  QUICK_ACTION_SHELL_EXIT: "quick-action:shell-exit",
  // 主→渲：进程退出
  QUICK_ACTION_SHELL_STDIN: "quick-action:shell-stdin",
  // 渲→主：向进程 stdin 写入
  QUICK_ACTION_SHELL_KILL: "quick-action:shell-kill",
  // 渲→主：终止进程
  QUICK_ACTION_GET_BUILTIN_TEMPLATES: "quick-action:get-builtin-templates",
  QUICK_ACTION_EXEC_BUILTIN: "quick-action:exec-builtin",
  // 快速插入模板（用户自定义）
  PROMPT_INSERT_TEMPLATE_GET_ALL: "prompt-insert-template:get-all",
  PROMPT_INSERT_TEMPLATE_CREATE: "prompt-insert-template:create",
  PROMPT_INSERT_TEMPLATE_UPDATE: "prompt-insert-template:update",
  PROMPT_INSERT_TEMPLATE_DELETE: "prompt-insert-template:delete",
  // 办公室全屏弹出窗口
  CUSTOM_PROMPT_GET: "custom-prompt:get",
  CUSTOM_PROMPT_UPSERT: "custom-prompt:upsert",
  CUSTOM_PROMPT_DELETE: "custom-prompt:delete",
  CUSTOM_PROMPT_GET_EFFECTIVE: "custom-prompt:get-effective",
  IMAGE_PROMPT_LIBRARY_SEARCH: "imagePromptLibrary:search",
  IMAGE_PROMPT_LIBRARY_LIST: "imagePromptLibrary:list",
  IMAGE_PROMPT_LIBRARY_GET_BY_ID: "imagePromptLibrary:getById",
  IMAGE_PROMPT_LIBRARY_GET_STATS: "imagePromptLibrary:getStats",
  IMAGE_PROMPT_LIBRARY_GET_MODE: "imagePromptLibrary:getMode",
  IMAGE_PROMPT_LIBRARY_SET_MODE: "imagePromptLibrary:setMode",
  // 在线市场（Registry）
  REGISTRY_FETCH_MCPS: "registry:fetch-mcps",
  REGISTRY_FETCH_SKILLS: "registry:fetch-skills",
  REGISTRY_FORCE_REFRESH: "registry:force-refresh",
  /** 获取市场 MCP 列表（支持 Official Registry + 内置推荐） */
  REGISTRY_FETCH_MARKET_MCPS: "registry:fetch-market-mcps",
  /** 从市场安装 MCP（转为 McpServer 写入数据库） */
  REGISTRY_INSTALL_MCP: "registry:install-mcp",
  SKILL_IMPORT_URL: "skill:import-url",
  /** 打开文件选择对话框，返回选中文件路径 */
  SKILL_IMPORT_LOCAL: "skill:import-local",
  /** 打开文件选择对话框，返回选中文件路径 */
  SKILL_IMPORT_LOCAL_DIR: "skill:import-local-dir",
  /** URL 预览（不入库，仅返回解析结果） */
  SKILL_PREVIEW_URL: "skill:preview-url",
  /** 从 Registry 安装 Skill（支持 contentUrl 远程拉取） */
  SKILL_INSTALL_FROM_REGISTRY: "skill:install-from-registry",
  /** 主进程通知渲染进程：有新 Skill 通过 MCP 安装，需要刷新列表 */
  SKILL_INSTALLED_NOTIFY: "skill:installed-notify",
  // ── npm 包安装技能 ──
  /** npm 技能安装预览（返回将执行的命令列表，不执行） */
  SKILL_NPM_PREVIEW: "skill:npm-preview",
  /** npm 技能安装（执行安装流程） */
  SKILL_NPM_INSTALL: "skill:npm-install",
  /** npm 技能安装日志通道（主→渲，实时推送安装日志） */
  SKILL_NPM_LOG: "skill:npm-log",
  /** 安装 Skill 包（GitHub URL / 本地路径） */
  SKILL_INSTALL_PACKAGE: "skill:install-package",
  /** 卸载 Skill 包（按 packageId 删除包及其所有子 Skill） */
  SKILL_UNINSTALL_PACKAGE: "skill:uninstall-package",
  // 办公室全屏弹出窗口
  AUTH_GET_USER: "auth:get-user",
  AUTH_REFRESH_USER: "auth:refresh-user",
  AUTH_REGISTER: "auth:register",
  AUTH_VERIFY_CODE: "auth:verify-code",
  AUTH_LOGIN_EMAIL: "auth:login-email",
  AUTH_LOGIN_OAUTH: "auth:login-oauth",
  AUTH_LOGOUT: "auth:logout",
  AUTH_GET_PLAN: "auth:get-plan",
  AUTH_RESEND_CODE: "auth:resend-code",
  AUTH_FORGOT_PASSWORD: "auth:forgot-password",
  AUTH_RESET_PASSWORD: "auth:reset-password",
  AUTH_CHANGE_PASSWORD: "auth:change-password",
  AUTH_UPGRADE_PLAN: "auth:upgrade-plan",
  AUTH_GET_PROMOTION_STATUS: "auth:get-promotion-status",
  /** 主进程 → 渲染进程：认证状态变更 */
  AUTH_STATE_CHANGED: "auth:state-changed",
  AUTH_GET_TELEMETRY_ENABLED: "auth:get-telemetry-enabled",
  AUTH_SET_TELEMETRY_ENABLED: "auth:set-telemetry-enabled",
  AUTH_GET_SAVED_CREDENTIALS: "auth:get-saved-credentials",
  AUTH_SAVE_CREDENTIALS: "auth:save-credentials",
  AUTH_CLEAR_SAVED_PASSWORD: "auth:clear-saved-password",
  TELEMETRY_TRACK: "telemetry:track",
  TELEMETRY_GET_ENABLED: "telemetry:get-enabled",
  TELEMETRY_SET_ENABLED: "telemetry:set-enabled",
  // 签到/余额
  CHECKIN_DO: "checkin:do",
  CHECKIN_GET_STATUS: "checkin:get-status",
  CHECKIN_REPORT_USAGE: "checkin:report-usage",
  BALANCE_GET: "balance:get",
  BUILTIN_PROVIDER_GET_CONFIG: "builtin-provider:get-config",
  // 聊天 IPC
  CHAT_CONNECT: "chat:connect",
  CHAT_DISCONNECT: "chat:disconnect",
  CHAT_GET_ROOMS: "chat:get-rooms",
  CHAT_JOIN_ROOM: "chat:join-room",
  CHAT_LEAVE_ROOM: "chat:leave-room",
  CHAT_SEND_MESSAGE: "chat:send-message",
  CHAT_GET_MESSAGES: "chat:get-messages",
  CHAT_UPLOAD_IMAGE: "chat:upload-image",
  CHAT_SET_NICKNAME: "chat:set-nickname",
  CHAT_GET_MEMBERS: "chat:get-members",
  CHAT_CREATE_ROOM: "chat:create-room",
  CHAT_TYPING: "chat:typing",
  CHAT_AI_MESSAGE: "chat:ai-message",
  CHAT_NEW_MESSAGE: "chat:new-message",
  CHAT_MEMBER_STATUS: "chat:member-status",
  PROMOTER_GET_PROFILE: "promoter:get-profile",
  PROMOTER_GET_CONFIG: "promoter:get-config",
  PROMOTER_GET_REWARDS: "promoter:get-rewards",
  PROMOTER_GET_STATS: "promoter:get-stats",
  // 撤回消息
  // ── Bug 反馈 ──
  FEEDBACK_CREATE: "feedback:create",
  FEEDBACK_LIST: "feedback:list",
  FEEDBACK_DETAIL: "feedback:detail",
  FEEDBACK_ADD_COMMENT: "feedback:add-comment",
  FEEDBACK_UPLOAD_IMAGE: "feedback:upload-image",
  // ── Shell 终端（独立 PTY，非 AI 会话） ──
  PTY_CREATE: "pty:create",
  PTY_WRITE: "pty:write",
  PTY_RESIZE: "pty:resize",
  PTY_KILL: "pty:kill",
  PTY_GET_OUTPUT: "pty:get-output",
  PTY_GET_SHELLS: "pty:get-shells",
  PTY_OUTPUT: "pty:output",
  // 主→渲：数据流
  PTY_EXIT: "pty:exit",
  // 主→渲：进程退出
  // ── Obsidian 导出 ──
  OBSIDIAN_EXPORT_SESSION: "obsidian:export-session",
  OBSIDIAN_BATCH_EXPORT: "obsidian:batch-export",
  OBSIDIAN_SELECT_VAULT: "obsidian:select-vault",
  OBSIDIAN_EXPORT_MEMORIES: "obsidian:export-memories",
  // 只读：导出会话记忆为 Obsidian Markdown
  // 主进程 → 渲染进程
  TEAM_GET_EVALUATIONS: "team:get-evaluations",
  TEAM_GET_EVALUATION: "team:get-evaluation",
  TEAM_GET_TASK_EVALUATIONS: "team:get-task-evaluations",
  TEAM_GET_EVALUATION_SUMMARY: "team:get-evaluation-summary",
  TEAM_GET_PROVIDER_SCORE_PROFILES: "team:get-provider-score-profiles",
  TEAM_GET_GOAL_SUMMARIES: "team:get-goal-summaries",
  TEAM_GET_IDLE_STATES: "team:get-idle-states",
  TEAM_GET_MEMBER_SNAPSHOTS: "team:get-member-snapshots",
  TEAM_GET_PRODUCTIVITY_SNAPSHOT: "team:get-productivity-snapshot",
  ROLE_PRESET_SEARCH: "role-preset:search",
  ROLE_PRESET_LIST: "role-preset:list",
  ROLE_PRESET_GET: "role-preset:get",
  ROLE_PRESET_CREATE: "role-preset:create",
  ROLE_PRESET_UPDATE: "role-preset:update",
  ROLE_PRESET_CLONE: "role-preset:clone",
  ROLE_PRESET_ARCHIVE: "role-preset:archive",
  ROLE_PRESET_DELETE: "role-preset:delete",
  ROLE_PRESET_LIST_PRIVATE_SESSIONS: "role-preset:list-private-sessions",
  ROLE_PRESET_LIST_MEMORY_ENTRIES: "role-preset:list-memory-entries",
  /** 专家商店：按需拉取上游专家正文并落库为自定义 RolePreset（逐项回报，失败不中断） */
  EXPERT_STORE_INSTALL: "expert-store:install",
  TEAM_TEMPLATE_SEARCH: "team-template:search",
  TEAM_TEMPLATE_LIST: "team-template:list",
  TEAM_TEMPLATE_GET: "team-template:get",
  TEAM_TEMPLATE_CREATE: "team-template:create",
  TEAM_TEMPLATE_UPDATE: "team-template:update",
  TEAM_TEMPLATE_CLONE: "team-template:clone",
  TEAM_TEMPLATE_ARCHIVE: "team-template:archive",
  /** 专家团收藏：只写 metadata.favorite 偏好位，不改名称/角色/状态，内置团也允许 */
  TEAM_TEMPLATE_SET_FAVORITE: "team-template:set-favorite",
  TEAM_ASSETS_SEED: "team-assets:seed",
  EXPERT_CREATE: "expert:create",
  EXPERT_LIST: "expert:list",
  EXPERT_GET: "expert:get",
  EXPERT_UPDATE: "expert:update",
  EXPERT_ARCHIVE: "expert:archive",
  EXPERT_LINK_SESSION: "expert:link-session",
  EXPERT_LIST_FOR_SESSION: "expert:list-for-session",
  EXPERT_RECORD_INVITATIONS: "expert:record-invitations",
  EXPERT_REMOVE_INVITATION: "expert:remove-invitation",
  EXPERT_UPDATE_INVITATION_RUNTIME: "expert:update-invitation-runtime",
  EXPERT_PERMISSION_PROFILE_UPSERT: "expert-permission-profile:upsert",
  EXPERT_PERMISSION_PROFILE_LIST: "expert-permission-profile:list",
  EXPERT_PERMISSION_PROFILE_GET: "expert-permission-profile:get",
  EXPERT_MEMORY_LINK: "expert-memory:link",
  EXPERT_MEMORY_LIST_LINKS: "expert-memory:list-links",
  EXPERT_MEMORY_RESOLVE_SCOPE: "expert-memory:resolve-scope",
  EXPERT_FIND_PRIVATE_CHAT: "expert:find-private-chat",
  EXPERT_START_PRIVATE_CHAT: "expert:start-private-chat",
  GOAL_RUNTIME_SET: "goal-runtime:set",
  GOAL_RUNTIME_GET: "goal-runtime:get",
  GOAL_RUNTIME_PAUSE: "goal-runtime:pause",
  GOAL_RUNTIME_RESUME: "goal-runtime:resume",
  GOAL_RUNTIME_CLEAR: "goal-runtime:clear",
  GOAL_RUNTIME_UPDATED: "goal-runtime:updated",
  // —— Scheduler（invoke）——
  SCHEDULER_GET_ACCESS: "scheduler:get-access",
  SCHEDULER_LIST_TASKS: "scheduler:list-tasks",
  SCHEDULER_GET_TASK: "scheduler:get-task",
  SCHEDULER_CREATE_TASK: "scheduler:create-task",
  SCHEDULER_UPDATE_TASK: "scheduler:update-task",
  SCHEDULER_DELETE_TASK: "scheduler:delete-task",
  SCHEDULER_TOGGLE_TASK: "scheduler:toggle-task",
  SCHEDULER_TRIGGER_NOW: "scheduler:trigger-now",
  SCHEDULER_GET_HISTORY: "scheduler:get-history",
  SCHEDULER_GET_RUNTIME: "scheduler:get-runtime",
  SCHEDULER_CANCEL_RUN: "scheduler:cancel-run",
  // —— Scheduler（main -> renderer）——
  SCHEDULER_TASK_UPDATED: "scheduler:task-updated",
  SCHEDULER_TASK_STARTED: "scheduler:task-started",
  SCHEDULER_TASK_COMPLETED: "scheduler:task-completed",
  SCHEDULER_TASK_FAILED: "scheduler:task-failed",
  SCHEDULER_RUN_STARTED: "scheduler:run-started",
  SCHEDULER_RUN_FINISHED: "scheduler:run-finished",
  SCHEDULER_RUNTIME_UPDATED: "scheduler:runtime-updated",
  // ---- Hooks (invoke) ----
  HOOK_GET_ACCESS: "hook:get-access",
  HOOK_LIST: "hook:list",
  HOOK_GET: "hook:get",
  HOOK_CREATE: "hook:create",
  HOOK_UPDATE: "hook:update",
  HOOK_DELETE: "hook:delete",
  HOOK_TOGGLE: "hook:toggle",
  HOOK_TEST: "hook:test",
  HOOK_GET_HISTORY: "hook:get-history",
  HOOK_EXECUTIONS: "hook:executions",
  HOOK_CLEAR_EXECUTIONS: "hook:clear-executions",
  HOOK_TRIGGERED: "hook:triggered",
  HOOK_EXECUTION_COMPLETED: "hook:execution-completed",
  HOOK_EXECUTION_FAILED: "hook:execution-failed",
  // ── AI Agent Butler（管家）──
  BUTLER_START: "butler:start",
  BUTLER_STOP: "butler:stop",
  BUTLER_GET_STATUS: "butler:get-status",
  BUTLER_GET_CONFIG: "butler:get-config",
  BUTLER_UPDATE_CONFIG: "butler:update-config",
  BUTLER_GET_OVERVIEW: "butler:get-overview",
  BUTLER_GET_DECISIONS: "butler:get-decisions",
  BUTLER_GET_DECISION_HISTORY: "butler:get-decision-history",
  BUTLER_GET_DECISION_DETAIL: "butler:get-decision-detail",
  BUTLER_RESPOND: "butler:respond",
  // 用户对管家推送的事件做出回应
  BUTLER_DETECTION: "butler:detection",
  // 主→渲：检测到需要介入
  BUTLER_DECISION: "butler:decision",
  // 主→渲：管家做出决策
  BUTLER_AUTO_ACTION: "butler:auto-action",
  // 主→渲：管家自主执行了操作
  BUTLER_STATUS_CHANGE: "butler:status-change",
  // 主→渲：管家状态变化
  // Butler 2.0 新增
  BUTLER_GET_PERSONA: "butler:get-persona",
  BUTLER_SET_PERSONA: "butler:set-persona",
  BUTLER_GET_CONTEXT: "butler:get-context",
  BUTLER_GET_INTERVENTIONS: "butler:get-interventions",
  BUTLER_QUICK_ACTION: "butler:quick-action",
  BUTLER_INTERVENTION: "butler:intervention",
  BUTLER_RESOLVE: "butler:resolve",
  // 渲→主：标记单条介入事件为已处理
  BUTLER_CLEAR_ALL: "butler:clear-all",
  // 渲→主：清除所有待处理介入事件
  BUTLER_TOAST_MUTE: "butler:toast-mute",
  BUTLER_TOAST_MUTES_LIST: "butler:toast-mutes-list",
  BUTLER_TOAST_MUTES_CLEAR: "butler:toast-mutes-clear",
  BUTLER_L3_FALLBACK: "butler:l3-fallback",
  // 主→渲：L3 AI 决策失败/超时，请 UI 显示面板让用户手动处理
  // 办公室全屏弹出窗口
  APP_SET_ALWAYS_ON_TOP: "app:set-always-on-top",
  APP_GET_ALWAYS_ON_TOP: "app:get-always-on-top",
  // 办公室全屏弹出窗口
  BUTLER_FLOAT_OPEN: "butler:float-open",
  BUTLER_FLOAT_CLOSE: "butler:float-close",
  BUTLER_FLOAT_IS_OPEN: "butler:float-is-open",
  BUTLER_FLOAT_MOVE: "butler:float-move",
  BUTLER_FLOAT_RESIZE: "butler:float-resize",
  BUTLER_FLOAT_SET_IGNORE_MOUSE: "butler:float-set-ignore-mouse",
  BUTLER_FLOAT_WINDOW_OPENED: "butler:float-window-opened",
  BUTLER_FLOAT_WINDOW_CLOSED: "butler:float-window-closed",
  BUTLER_NAVIGATE_SESSION: "butler:navigate-session",
  BUTLER_MEMORY_LIST: "butler-memory:list",
  BUTLER_MEMORY_SEARCH_SEMANTIC: "butler-memory:search-semantic",
  BUTLER_MEMORY_DELETE: "butler-memory:delete",
  BUTLER_MEMORY_ARCHIVE: "butler-memory:archive",
  BUTLER_MEMORY_RESTORE: "butler-memory:restore",
  BUTLER_MEMORY_GET_RELATIONS: "butler-memory:get-relations",
  BUTLER_MEMORY_GET_STATS: "butler-memory:get-stats",
  BUTLER_MEMORY_GET_PROJECTS: "butler-memory:get-projects",
  BUTLER_MEMORY_COMPRESS: "butler-memory:compress",
  BUTLER_MEMORY_RESET_DECAY: "butler-memory:reset-decay",
  BUTLER_MEMORY_CONFIRM: "butler-memory:confirm",
  BUTLER_MEMORY_INJECTION_STATUS: "butler-memory:injection-status",
  BUTLER_MEMORY_DISABLE_SESSION_INJECTION: "butler-memory:disable-session-injection",
  BUTLER_MEMORY_EMBEDDING_TEST: "butler-memory:embedding-test",
  BUTLER_MEMORY_EMBEDDING_STATUS: "butler-memory:embedding-status",
  BUTLER_MEMORY_EMBEDDING_REINDEX: "butler-memory:embedding-reindex",
  // ── Butler Assistant（全局助手旁路命名空间，默认 feature flag 关闭）──
  // Canonical Butler Assistant IPC contract (kept separate from legacy butler:* IPC)
  BUTLER_ASSISTANT_GET_FEATURE_FLAG: "butler-assistant:get-feature-flag",
  BUTLER_ASSISTANT_SET_FEATURE_FLAG: "butler-assistant:set-feature-flag",
  BUTLER_ASSISTANT_GET_THREAD: "butler-assistant:get-thread",
  BUTLER_ASSISTANT_LIST_THREADS: "butler-assistant:list-threads",
  BUTLER_ASSISTANT_LIST_MESSAGES: "butler-assistant:list-messages",
  BUTLER_ASSISTANT_SEND_MESSAGE: "butler-assistant:send-message",
  BUTLER_ASSISTANT_CLEAR_THREAD: "butler-assistant:clear-thread",
  BUTLER_ASSISTANT_GET_STATUS_SNAPSHOT: "butler-assistant:get-status-snapshot",
  BUTLER_ASSISTANT_LIST_PENDING_ACTIONS: "butler-assistant:list-pending-actions",
  BUTLER_ASSISTANT_CONFIRM_ACTION: "butler-assistant:confirm-action",
  BUTLER_ASSISTANT_AUDIT_ACTIONS: "butler-assistant:audit-actions",
  BUTLER_ASSISTANT_SEARCH_HISTORY: "butler-assistant:search-history",
  BUTLER_ASSISTANT_GET_ACTION_REGISTRY: "butler-assistant:get-action-registry",
  BUTLER_ASSISTANT_RECOMMEND: "butler-assistant:recommend",
  BUTLER_ASSISTANT_EXECUTE_ACTION: "butler-assistant:execute-action",
  BUTLER_ASSISTANT_MESSAGE: "butler-assistant:message",
  BUTLER_ASSISTANT_ACTION_UPDATED: "butler-assistant:action-updated",
  BUTLER_ASSISTANT_THREAD_CLEARED: "butler-assistant:thread-cleared",
  BUTLER_ASSISTANT_PROGRESS: "butler-assistant:progress",
  BUTLER_ASSISTANT_ASK: "butler-assistant:ask",
  BUTLER_ASSISTANT_ANSWER_QUESTION: "butler-assistant:answer-question",
  BUTLER_ASSISTANT_ABORT: "butler-assistant:abort",
  BUTLER_ASSISTANT_SEARCH_MESSAGES: "butler-assistant:search-messages",
  // ── 剪贴板图片 ──
  CLIPBOARD_WRITE_IMAGE: "clipboard:write-image",
  // ── 剪贴板文本（E44 起 renderer/preload 不再有 clipboard 模块，改由 main 代劳）──
  CLIPBOARD_READ_TEXT: "clipboard:read-text",
  CLIPBOARD_WRITE_TEXT: "clipboard:write-text",
  SESSION_SHARE: "session:share",
  // ── A1 轻量发布：HTML 产物发布为公网链接（独立 channel，不改 session:share 语义）──
  SESSION_SHARE_HTML_PUBLISH: "session:share-html:publish",
  SESSION_SHARE_HTML_REVOKE: "session:share-html:revoke",
  // ── 内置浏览器（契约见 docs/plans/builtin-browser-plan.md §3）──
  BROWSER_CREATE_TAB: "browser:create-tab",
  BROWSER_CLOSE_TAB: "browser:close-tab",
  BROWSER_ACTIVATE_TAB: "browser:activate-tab",
  /** 用户显式接管 AI 标签（右键菜单）；单击只预览 */
  BROWSER_TAKEOVER_TAB: "browser:takeover-tab",
  /** 借用确认 / 登录接力：allow | deny | complete | cancel */
  BROWSER_POLICY_RESOLVE: "browser:policy-resolve",
  BROWSER_NAVIGATE: "browser:navigate",
  BROWSER_BACK: "browser:back",
  BROWSER_FORWARD: "browser:forward",
  BROWSER_RELOAD: "browser:reload",
  BROWSER_STOP: "browser:stop",
  BROWSER_SET_ZOOM: "browser:set-zoom",
  BROWSER_GET_STATE: "browser:get-state",
  BROWSER_SET_VIEW_BOUNDS: "browser:set-view-bounds",
  BROWSER_STATE_CHANGED: "browser:state-changed",
  BROWSER_OPEN_WINDOW: "browser:open-window",
  /** main → renderer：请求把内置浏览器「视角」切到前台（软件内点 http 链接时用） */
  BROWSER_ENSURE_PANE: "browser:ensure-pane",
  /** renderer → main：把这一个页面交给系统默认浏览器打开（不走内置浏览器偏好路由） */
  BROWSER_OPEN_IN_SYSTEM: "browser:open-in-system",
  // 嵌入模式（把内置浏览器作为主区「视角」，视图挂在主窗口上）
  BROWSER_EMBED_ATTACH: "browser:embed:attach",
  BROWSER_EMBED_RECT: "browser:embed:rect",
  BROWSER_EMBED_DETACH: "browser:embed:detach",
  BROWSER_AI_ACTIVITY: "browser:ai-activity",
  // ── 内置浏览器设置（WS-5：CDP 通道开关，读写 userData/browser-cdp.json）──
  BROWSER_CDP_GET_SETTINGS: "browser:cdp-settings:get",
  BROWSER_CDP_SET_SETTINGS: "browser:cdp-settings:set",
  // ── 内置浏览器 偏好（网页链接打开方式，读写 userData/browser-cdp.json，立即生效）──
  BROWSER_PREFS_GET: "browser:prefs:get",
  BROWSER_PREFS_SET: "browser:prefs:set",
  // ── 内置浏览器 批次A（浏览历史 / 书签 / 清除浏览数据）──
  // 契约：docs/plans/reports/builtin-browser-batch-a-contract.md
  BROWSER_HISTORY_LIST: "browser:history:list",
  BROWSER_HISTORY_REMOVE: "browser:history:remove",
  BROWSER_HISTORY_CLEAR: "browser:history:clear",
  BROWSER_BOOKMARKS_LIST: "browser:bookmarks:list",
  BROWSER_BOOKMARKS_ADD: "browser:bookmarks:add",
  BROWSER_BOOKMARKS_REMOVE: "browser:bookmarks:remove",
  BROWSER_DATA_CLEAR: "browser:data:clear",
  RECORDER_LIST: "recorder:list",
  RECORDER_GET: "recorder:get",
  RECORDER_IMPORT: "recorder:import",
  RECORDER_IMPORT_PATHS: "recorder:import-paths",
  RECORDER_WATCH_GET: "recorder:watch-get",
  RECORDER_WATCH_SET: "recorder:watch-set",
  RECORDER_RETRANSCRIBE: "recorder:retranscribe",
  RECORDER_REEXTRACT: "recorder:reextract",
  RECORDER_GET_SETTINGS: "recorder:get-settings",
  RECORDER_SET_SETTINGS: "recorder:set-settings",
  RECORDER_CLOUD_PULL: "recorder:cloud-pull",
  RECORDER_EVENT: "recorder:event",
  RECORDER_LIVE_LIST_PORTS: "recorder:live-list-ports",
  RECORDER_LIVE_CONNECT: "recorder:live-connect",
  RECORDER_LIVE_STOP: "recorder:live-stop",
  RECORDER_LIVE_STATUS: "recorder:live-status",
  RECORDER_LIVE_EVENT: "recorder:live-event",
  RECORDER_DAY_GET: "recorder:day-get",
  RECORDER_DAY_GENERATE: "recorder:day-generate",
  RECORDER_VOICE_STATUS: "recorder:voice-status",
  RECORDER_VOICE_ENROLL: "recorder:voice-enroll",
  // 审计事件流（S3/A4）：只读查询 + 导出某会话审计流，独立 append-only 存储
  AUDIT_LIST_SESSIONS: "audit:list-sessions",
  AUDIT_READ_SESSION: "audit:read-session",
  AUDIT_EXPORT_SESSION: "audit:export-session",
  // ── 资料库（Knowledge Library，P0）──
  // 契约：docs/plans/2026-09-16-knowledge-library-p0.md §4
  KNOWLEDGE_LIBRARY_LIST: "knowledge:library:list",
  KNOWLEDGE_LIBRARY_CREATE: "knowledge:library:create",
  KNOWLEDGE_LIBRARY_UPDATE: "knowledge:library:update",
  KNOWLEDGE_LIBRARY_DELETE: "knowledge:library:delete",
  KNOWLEDGE_DOC_LIST: "knowledge:doc:list",
  KNOWLEDGE_DOC_READ: "knowledge:doc:read",
  KNOWLEDGE_DOC_CREATE: "knowledge:doc:create",
  KNOWLEDGE_DOC_WRITE: "knowledge:doc:write",
  KNOWLEDGE_DOC_RENAME: "knowledge:doc:rename",
  KNOWLEDGE_DOC_DELETE: "knowledge:doc:delete",
  /** 撤销删除（从库内 .trash 移回），契约外补充：§6.3 要求删除可撤销 */
  KNOWLEDGE_DOC_RESTORE: "knowledge:doc:restore",
  KNOWLEDGE_DOC_IMPORT: "knowledge:doc:import",
  /** 选择要导入的文档（多选 + 文档扩展名过滤），返回绝对路径 */
  KNOWLEDGE_DOC_PICK_FILES: "knowledge:doc:pick-files",
  KNOWLEDGE_RESOLVE_CONTEXT: "knowledge:resolve-context",
  /** P3 仓库文档同步（契约外补充通道）：只读扫描（给变更预览） */
  KNOWLEDGE_REPO_SCAN: "knowledge:repo:scan",
  /** P3 仓库文档同步：执行增量入库到项目库 */
  KNOWLEDGE_REPO_SYNC: "knowledge:repo:sync",
  // ── 资料库 P2-a 产出沉淀：会话产出「提议入库」待审（pending-review）──
  // 契约：docs/plans/2026-09-21-feature-gap-roadmap.md §2 A2。独立旁路，不改既有 session:share / knowledge:doc 语义。
  KNOWLEDGE_PROPOSAL_CREATE: "knowledge:proposal:create",
  KNOWLEDGE_PROPOSAL_LIST: "knowledge:proposal:list",
  KNOWLEDGE_PROPOSAL_CONFIRM: "knowledge:proposal:confirm",
  KNOWLEDGE_PROPOSAL_REJECT: "knowledge:proposal:reject",
  // Office 文档生成（A4 生成档）：Markdown → xlsx / pptx，独立新增 channel
  OFFICE_DOC_GENERATE: "office:generate",
  // ── 宠物「目标负责人」Butler Goals（新增段，与 goal-runtime:* 隔离；值同 BUTLER_GOAL_IPC）──
  BUTLER_GOALS_LIST: "butler-goals:list",
  BUTLER_GOALS_GET: "butler-goals:get",
  BUTLER_GOALS_CREATE: "butler-goals:create",
  BUTLER_GOALS_APPROVE: "butler-goals:approve",
  BUTLER_GOALS_REJECT: "butler-goals:reject",
  BUTLER_GOALS_PAUSE: "butler-goals:pause",
  BUTLER_GOALS_RESUME: "butler-goals:resume",
  BUTLER_GOALS_CANCEL: "butler-goals:cancel",
  BUTLER_GOALS_SEND_MESSAGE: "butler-goals:send-message",
  BUTLER_GOALS_UPDATED: "butler-goals:updated",
  // 主→渲
  // ── 目标 Goals（B 阶段，GoalServiceApi；旧 goal-runtime:* / butler-goals:* 兼容期转调到此）──
  GOALS_LIST: "goals:list",
  GOALS_GET: "goals:get",
  GOALS_CREATE: "goals:create",
  GOALS_UPDATE: "goals:update",
  GOALS_ARCHIVE: "goals:archive",
  GOALS_MERGE: "goals:merge",
  GOALS_START: "goals:start",
  GOALS_PAUSE: "goals:pause",
  GOALS_RESUME: "goals:resume",
  GOALS_CANCEL: "goals:cancel",
  GOALS_APPROVE: "goals:approve",
  GOALS_REJECT: "goals:reject",
  GOALS_SEND_MESSAGE: "goals:send-message",
  GOALS_BIND_SESSION: "goals:bind-session",
  GOALS_LIST_EXECUTIONS: "goals:list-executions",
  GOALS_SET_OUTCOME: "goals:set-outcome",
  GOALS_UPDATED: "goals:updated",
  // 主→渲
  // ── 待你拍板 ProposalHub（§6 C1）+ 全局放权档位（§6 C2），类型见 shared/proposalTypes ──
  PROPOSALS_LIST: "proposals:list",
  PROPOSALS_RESOLVE: "proposals:resolve",
  PROPOSALS_UPDATED: "proposals:updated",
  // 主→渲
  DIRECTIONS_MAP: "directions:map",
  // 工作台「按方向看」：方向列表 + 会话归属
  // ── 工作分组（类型见 shared/workGroupTypes） ──
  WORK_GROUPS_SNAPSHOT: "workGroups:snapshot",
  WORK_GROUPS_CREATE: "workGroups:create",
  WORK_GROUPS_UPDATE: "workGroups:update",
  WORK_GROUPS_ARCHIVE: "workGroups:archive",
  WORK_GROUPS_ASSIGN: "workGroups:assign",
  WORK_GROUPS_SET_PRIORITY: "workGroups:set-priority",
  WORK_GROUPS_FROM_DIRECTION: "workGroups:from-direction",
  WORK_GROUPS_SUMMARIZE: "workGroups:summarize",
  WORK_GROUPS_BACKGROUND_MODEL: "workGroups:background-model",
  // 只读：是否已有可用后台模型
  WORK_GROUPS_UPDATED: "workGroups:updated",
  // 主→渲
  // ── 会话抽屉「验收」页签（类型见 shared/review/types） ──
  REVIEW_GENERATE_HANDOFF: "review:generate-handoff",
  // Agent 没写交接段时由后台模型兜底生成
  AUTONOMY_GET: "autonomy:get",
  AUTONOMY_SET: "autonomy:set"
};
const REGISTRY_LIST_SKILL_REPOS = "registry:list-skill-repos";
const REGISTRY_FETCH_SKILLS_SH = "registry:fetch-skills-sh";
const REGISTRY_FETCH_SKILLSSH_LEADERBOARD = "registry:fetch-skillssh-leaderboard";
const REGISTRY_GET_SKILL_DETAIL = "registry:get-skill-detail";
const REGISTRY_INSTALL_SKILLS_SH = "registry:install-skills-sh";
const REGISTRY_CLASSIFY_SKILLS_SH = "registry:classify-skills-sh";
const ALLOWED_INVOKE_CHANNELS = /* @__PURE__ */ new Set([
  // Session channels
  IPC.SESSION_CREATE,
  IPC.SESSION_TERMINATE,
  IPC.SESSION_SEND_INPUT,
  IPC.SESSION_CONFIRM,
  IPC.SESSION_RESIZE,
  IPC.SESSION_GET_ALL,
  IPC.SESSION_GET_STATS,
  IPC.SESSION_GET_HISTORY,
  IPC.SESSION_GET_BY_IDS,
  IPC.SESSION_GET_ACTIVITIES,
  IPC.SESSION_RESUME,
  IPC.SESSION_GET_LOGS,
  IPC.SESSION_RENAME,
  IPC.SESSION_AI_RENAME,
  IPC.SESSION_DELETE,
  IPC.SESSION_GET_OUTPUT,
  IPC.SESSION_GET_SYSTEM_PROMPT,
  IPC.SESSION_GET_CHANGE_SET,
  IPC.SESSION_GET_CHANGE_DIFF,
  IPC.SESSION_CHECK_WORKTREE_MERGE,
  IPC.SESSION_MERGE_WORKTREE,
  IPC.SESSION_SEND_MESSAGE,
  IPC.SESSION_CONVERSATION_HISTORY,
  IPC.SESSION_CONVERSATION_HISTORY_PAGED,
  IPC.SESSION_TODOS_UPDATE,
  IPC.SESSION_PERMISSION_REQUEST,
  IPC.SESSION_PERMISSION_RESPOND,
  IPC.SESSION_ANSWER_QUESTION,
  IPC.SESSION_APPROVE_PLAN,
  IPC.SESSION_GET_QUEUE,
  IPC.SESSION_CLEAR_QUEUE,
  IPC.SESSION_REMOVE_QUEUE_MESSAGE,
  IPC.SESSION_UPDATE_QUEUE_MESSAGE,
  IPC.SESSION_REORDER_QUEUE_MESSAGES,
  IPC.SESSION_PROMOTE_QUEUE_MESSAGE_INTERRUPT,
  IPC.SESSION_OPTIMIZE_PROMPT,
  IPC.SESSION_TRANSLATE_TEXT,
  IPC.SESSION_SET_REASONING_EFFORT,
  IPC.SESSION_GET_REASONING_EFFORT,
  IPC.SESSION_SET_PERMISSION_MODE,
  IPC.SESSION_SET_MODE,
  IPC.SESSION_SET_WORKSPACE_ID,
  IPC.SESSION_LIST_MESSAGES,
  IPC.SESSION_SEARCH_CONTENT,
  IPC.SESSION_ABORT,
  IPC.GOAL_RUNTIME_SET,
  IPC.GOAL_RUNTIME_GET,
  IPC.GOAL_RUNTIME_PAUSE,
  IPC.GOAL_RUNTIME_RESUME,
  IPC.GOAL_RUNTIME_CLEAR,
  IPC.GOALS_LIST,
  IPC.GOALS_GET,
  IPC.GOALS_CREATE,
  IPC.GOALS_UPDATE,
  IPC.GOALS_ARCHIVE,
  IPC.GOALS_MERGE,
  IPC.GOALS_START,
  IPC.GOALS_PAUSE,
  IPC.GOALS_RESUME,
  IPC.GOALS_CANCEL,
  IPC.GOALS_APPROVE,
  IPC.GOALS_REJECT,
  IPC.GOALS_SEND_MESSAGE,
  IPC.GOALS_BIND_SESSION,
  IPC.GOALS_LIST_EXECUTIONS,
  IPC.PROPOSALS_LIST,
  IPC.PROPOSALS_RESOLVE,
  IPC.DIRECTIONS_MAP,
  IPC.AUTONOMY_GET,
  IPC.AUTONOMY_SET,
  IPC.SESSION_BACKGROUND_SHELLS_LIST,
  IPC.SESSION_BACKGROUND_SHELLS_KILL,
  IPC.SESSION_COMPACT_CONTEXT,
  IPC.SESSION_UPDATE_CONTEXT_WINDOW,
  IPC.SESSION_SWITCH_PROVIDER,
  IPC.SESSION_SWITCH_PROVIDER_KEY_GROUP,
  IPC.SESSION_SET_PLAN_MODE,
  IPC.AGENT_GET_OUTPUT,
  IPC.MCP_LIST_TOOLS,
  IPC.SESSION_EDIT_USER_MESSAGE,
  IPC.SESSION_ROLLBACK_PREVIEW,
  IPC.SESSION_ROLLBACK_APPLY,
  IPC.SESSION_ROLLBACK_REDO,
  ROLLBACK_IPC.DRY_RUN,
  ROLLBACK_IPC.APPLY,
  ROLLBACK_IPC.REDO,
  IPC.SESSION_SHARE,
  IPC.SESSION_SHARE_HTML_PUBLISH,
  IPC.SESSION_SHARE_HTML_REVOKE,
  IPC.SESSION_GET_FAVORITES,
  IPC.SESSION_TOGGLE_FAVORITE,
  IPC.SESSION_IS_FAVORITE,
  IPC.SESSION_WATCH_LIST_GRAPH,
  IPC.SESSION_WATCH,
  IPC.SESSION_UNWATCH,
  // Provider channels
  IPC.CREATIVE_PROVIDER_LIST,
  IPC.PROVIDER_GET_ALL,
  IPC.PROVIDER_QUOTA_LIST,
  IPC.PROVIDER_QUOTA_RETRY_NOW,
  IPC.PROVIDER_QUOTA_FAILOVER_NOW,
  IPC.PROVIDER_GET,
  IPC.PROVIDER_CREATE,
  IPC.PROVIDER_UPDATE,
  IPC.PROVIDER_DELETE,
  IPC.PROVIDER_REORDER,
  IPC.PROVIDER_CHECK_CLI,
  IPC.PROVIDER_TEST,
  IPC.PROVIDER_TEST_EXECUTABLE,
  IPC.PROVIDER_TEST_API,
  IPC.PROVIDER_KEY_POOL_GET_CONFIG,
  IPC.PROVIDER_KEY_POOL_SET_CONFIG,
  IPC.PROVIDER_KEY_POOL_LIST,
  IPC.PROVIDER_KEY_POOL_ADD,
  IPC.PROVIDER_KEY_POOL_UPDATE,
  IPC.PROVIDER_KEY_POOL_REMOVE,
  IPC.PROVIDER_KEY_POOL_TEST,
  IPC.PROVIDER_KEY_POOL_TEST_ALL,
  IPC.PROVIDER_KEY_POOL_RESET_HEALTH,
  IPC.PROVIDER_KEY_POOL_CLEAR_COOLDOWN,
  IPC.PROVIDER_KEY_POOL_IMPORT_CURRENT,
  IPC.PROVIDER_KEY_POOL_FETCH_MODELS,
  IPC.PROVIDER_FETCH_MODELS,
  IPC.PROVIDER_CLAUDE_LOGIN,
  IPC.PROVIDER_CLAUDE_LOGIN_STATUS,
  IPC.PROVIDER_CODEX_LOGIN,
  IPC.PROVIDER_CODEX_LOGIN_STATUS,
  IPC.PROVIDER_GEMINI_LOGIN,
  IPC.PROVIDER_GEMINI_LOGIN_STATUS,
  IPC.PROVIDER_COPILOT_LOGIN,
  IPC.PROVIDER_COPILOT_LOGIN_STATUS,
  // Settings channels
  IPC.SETTINGS_GET_ALL,
  IPC.SETTINGS_UPDATE,
  IPC.RECORDER_LIST,
  IPC.RECORDER_GET,
  IPC.RECORDER_IMPORT,
  IPC.RECORDER_IMPORT_PATHS,
  IPC.RECORDER_WATCH_GET,
  IPC.RECORDER_WATCH_SET,
  IPC.RECORDER_RETRANSCRIBE,
  IPC.RECORDER_REEXTRACT,
  IPC.RECORDER_GET_SETTINGS,
  IPC.RECORDER_SET_SETTINGS,
  IPC.RECORDER_CLOUD_PULL,
  IPC.RECORDER_LIVE_LIST_PORTS,
  IPC.RECORDER_LIVE_CONNECT,
  IPC.RECORDER_LIVE_STOP,
  IPC.RECORDER_LIVE_STATUS,
  IPC.RECORDER_DAY_GET,
  IPC.RECORDER_DAY_GENERATE,
  IPC.RECORDER_VOICE_STATUS,
  IPC.RECORDER_VOICE_ENROLL,
  // Daily report channels
  IPC.DAILY_REPORT_GET,
  IPC.DAILY_REPORT_SAVE_POSTER,
  IPC.DAILY_REPORT_COPY_POSTER,
  IPC.DAILY_REPORT_GENERATE_POSTER,
  IPC.DAILY_REPORT_PUSH_NOW,
  // IPC topic 订阅（会话级定向路由）
  IPC.SYSTEM_SET_IPC_TOPICS,
  // Environment diagnostics
  IPC.ENVIRONMENT_CHECK,
  // Dialog channels
  IPC.DIALOG_SELECT_FILE,
  IPC.DIALOG_SELECT_MEDIA,
  IPC.DIALOG_SELECT_IMAGE,
  // Data path channels
  IPC.DATA_PATH_GET,
  IPC.DATA_PATH_SELECT_DIR,
  IPC.DATA_PATH_MIGRATE,
  IPC.DATA_PATH_MIGRATION_STATUS,
  IPC.DATA_PATH_RESET,
  IPC.DATA_PATH_RESTART,
  // Config portability channels（基础配置加密导出/导入）
  IPC.CONFIG_EXPORT,
  IPC.CONFIG_IMPORT_PREVIEW,
  IPC.CONFIG_IMPORT_APPLY,
  // DB maintenance channels（独立历史库迁移 + 主库瘦身）
  IPC.DB_MAINTENANCE_STATS,
  IPC.DB_MAINTENANCE_MIGRATE,
  // Update channels
  IPC.UPDATE_GET_STATE,
  IPC.UPDATE_CHECK,
  IPC.UPDATE_DOWNLOAD,
  IPC.UPDATE_INSTALL,
  IPC.UPDATE_OPEN_DOWNLOAD_PAGE,
  // File system channels
  IPC.FS_SAVE_IMAGE_TO_TEMP,
  // Voice channels
  IPC.VOICE_TRANSCRIBE,
  IPC.VOICE_STREAM_START,
  IPC.VOICE_STREAM_STOP,
  IPC.VOICE_POLISH,
  IPC.VOICE_LOCAL_WHISPER_STATUS,
  IPC.VOICE_LOCAL_WHISPER_ENV_STATUS,
  IPC.VOICE_WAKE_CONTROL,
  IPC.ASSISTANT_CHAT,
  IPC.ASSISTANT_CONFIRM_REPLY,
  IPC.VOICE_TTS_SYNTHESIZE,
  IPC.VOICE_MODELS_CONTROL,
  // App channels
  IPC.APP_QUIT,
  IPC.APP_RELAUNCH_ELEVATED,
  IPC.APP_CHECK_ELEVATED,
  // Telemetry
  IPC.TELEMETRY_TRACK,
  IPC.TELEMETRY_GET_ENABLED,
  IPC.TELEMETRY_SET_ENABLED,
  // Log
  IPC.LOG_GET_RECENT,
  IPC.LOG_OPEN_FILE,
  // Window
  IPC.WINDOW_SET_FULLSCREEN,
  IPC.WINDOW_IS_FULLSCREEN,
  // Clipboard
  IPC.CLIPBOARD_WRITE_IMAGE,
  IPC.CLIPBOARD_READ_TEXT,
  IPC.CLIPBOARD_WRITE_TEXT,
  // File dialog
  "dialog:select-directory",
  // Folder opener
  "folder-opener:open",
  // Open external
  IPC.OPEN_EXTERNAL,
  // Built-in browser prefs（网页链接打开方式）
  IPC.BROWSER_PREFS_GET,
  IPC.BROWSER_PREFS_SET,
  // Startup
  "startup:getError",
  "startup:retry",
  "startup:openLogFile",
  // Payment & promoter
  "payment:get-config",
  "payment:create-order",
  "payment:get-status",
  "payment:get-orders",
  "payment:redeem-code",
  IPC.PROMOTER_GET_PROFILE,
  IPC.PROMOTER_GET_CONFIG,
  IPC.PROMOTER_GET_REWARDS,
  IPC.PROMOTER_GET_STATS,
  // Butler Assistant channels
  IPC.BUTLER_ASSISTANT_GET_FEATURE_FLAG,
  IPC.BUTLER_ASSISTANT_SET_FEATURE_FLAG,
  IPC.BUTLER_ASSISTANT_GET_THREAD,
  IPC.BUTLER_ASSISTANT_LIST_THREADS,
  IPC.BUTLER_ASSISTANT_LIST_MESSAGES,
  IPC.BUTLER_ASSISTANT_SEND_MESSAGE,
  IPC.BUTLER_ASSISTANT_CLEAR_THREAD,
  IPC.BUTLER_ASSISTANT_CONFIRM_ACTION,
  IPC.BUTLER_ASSISTANT_LIST_PENDING_ACTIONS,
  IPC.BUTLER_ASSISTANT_AUDIT_ACTIONS,
  IPC.BUTLER_ASSISTANT_GET_STATUS_SNAPSHOT,
  IPC.BUTLER_ASSISTANT_SEARCH_HISTORY,
  IPC.BUTLER_ASSISTANT_GET_ACTION_REGISTRY,
  IPC.BUTLER_ASSISTANT_RECOMMEND,
  IPC.BUTLER_ASSISTANT_EXECUTE_ACTION,
  // Expert / assistant data layer channels
  IPC.EXPERT_CREATE,
  IPC.EXPERT_LIST,
  IPC.EXPERT_GET,
  IPC.EXPERT_UPDATE,
  IPC.EXPERT_ARCHIVE,
  IPC.EXPERT_LINK_SESSION,
  IPC.EXPERT_LIST_FOR_SESSION,
  IPC.EXPERT_RECORD_INVITATIONS,
  IPC.EXPERT_REMOVE_INVITATION,
  IPC.EXPERT_PERMISSION_PROFILE_UPSERT,
  IPC.EXPERT_PERMISSION_PROFILE_LIST,
  IPC.EXPERT_PERMISSION_PROFILE_GET,
  IPC.EXPERT_MEMORY_LINK,
  IPC.EXPERT_MEMORY_LIST_LINKS,
  IPC.EXPERT_MEMORY_RESOLVE_SCOPE,
  // Kanban / Project Board channels
  IPC.KANBAN_LIST_BOARDS,
  IPC.KANBAN_GET_BOARD,
  IPC.KANBAN_CREATE_BOARD,
  IPC.KANBAN_UPDATE_BOARD,
  IPC.KANBAN_ARCHIVE_BOARD,
  IPC.KANBAN_LIST_COLUMNS,
  IPC.KANBAN_CREATE_COLUMN,
  IPC.KANBAN_UPDATE_COLUMN,
  IPC.KANBAN_REORDER_COLUMNS,
  IPC.KANBAN_LIST_TASKS,
  IPC.KANBAN_GET_TASK,
  IPC.KANBAN_CREATE_TASK,
  IPC.KANBAN_UPDATE_TASK,
  IPC.KANBAN_MOVE_TASK,
  IPC.KANBAN_REORDER_TASKS,
  IPC.KANBAN_LIST_TASK_EVENTS,
  IPC.KANBAN_GET_TASK_TIMELINE,
  IPC.KANBAN_LIST_TASK_EXECUTIONS,
  IPC.KANBAN_START_TASK_EXECUTION,
  IPC.KANBAN_BIND_TASK_EXECUTION,
  IPC.KANBAN_GET_TASK_WORKTREE_STATUS,
  IPC.KANBAN_REFRESH_TASK_WORKTREE,
  IPC.KANBAN_REFRESH_TASK_DIFF,
  IPC.KANBAN_GET_TASK_FILE_DIFF,
  IPC.KANBAN_REQUEST_TASK_REVIEW,
  IPC.KANBAN_CHECK_TASK_MERGE,
  IPC.KANBAN_MANUAL_MERGE_TASK,
  IPC.KANBAN_MERGE_TASK_WORKTREE,
  IPC.KANBAN_DELETE_TASK,
  IPC.TASK_HANDOVER_EXPORT,
  IPC.TASK_HANDOVER_HANDOVER,
  // Audit event stream (S3/A4) — 只读查询 + 导出
  IPC.AUDIT_LIST_SESSIONS,
  IPC.AUDIT_READ_SESSION,
  IPC.AUDIT_EXPORT_SESSION,
  // Integration Worktree
  "team:getIntegrationState",
  "team-integration:land",
  "team:conflict:reassign",
  "team:conflict:resolve",
  "team:conflict:skip",
  "team-integration:force-merge",
  "team:reset-stuck-tasks",
  // Community publish（工作流 / MCP / 技能 / 团队 发布到社区）
  "community:publish"
]);
const ALLOWED_SEND_CHANNELS = /* @__PURE__ */ new Set([
  IPC.THEME_UPDATE_TITLE_BAR,
  IPC.VOICE_STREAM_CHUNK,
  IPC.WINDOW_SET_FULLSCREEN
]);
const ALLOWED_ON_CHANNELS = /* @__PURE__ */ new Set([
  // Session events
  IPC.SESSION_OUTPUT,
  IPC.SESSION_STATUS_CHANGE,
  IPC.SESSION_ACTIVITY,
  IPC.SESSION_INTERVENTION,
  IPC.SESSION_TOOL_STATUS,
  IPC.SESSION_NAME_CHANGE,
  IPC.SESSION_QUEUE_UPDATE,
  IPC.SESSION_CONVERSATION_MESSAGE,
  IPC.SESSION_TODOS_UPDATE,
  IPC.SESSION_INIT_DATA,
  IPC.SESSION_TOKEN_UPDATE,
  IPC.SESSION_PROVIDER_SWITCHED,
  IPC.SESSION_CONTEXT_UPDATE,
  IPC.SESSION_BACKGROUND_SHELLS_UPDATE,
  IPC.GOAL_RUNTIME_UPDATED,
  "session:refresh",
  // Task events
  IPC.TASK_STATUS_CHANGE,
  IPC.KANBAN_TASK_TIMELINE_EVENT,
  // Update events
  IPC.UPDATE_STATE_CHANGED,
  // Data path events
  IPC.DATA_PATH_MIGRATION_PROGRESS,
  // Voice events
  IPC.VOICE_STREAM_RESULT,
  IPC.VOICE_STREAM_ERROR,
  IPC.VOICE_WAKE,
  // Window events
  IPC.WINDOW_FULLSCREEN_CHANGED,
  IPC.WORKSPACE_WINDOW_CLOSED,
  // Orchestrator events
  "orchestrator:workflow-started",
  "orchestrator:workflow-completed",
  "orchestrator:workflow-failed",
  "orchestrator:workflow-paused",
  "orchestrator:workflow-resumed",
  "orchestrator:workflow-cancelled",
  "orchestrator:step-started",
  "orchestrator:step-completed",
  "orchestrator:step-looping",
  "orchestrator:step-condition-routed",
  "orchestrator:step-team-started",
  "orchestrator:step-turn-progress",
  "orchestrator:step-watch-polling",
  "orchestrator:step-review-needed",
  "orchestrator:step-mission-started",
  "orchestrator:step-mission-progress",
  "orchestrator:task-tree-initialized",
  "orchestrator:task-created",
  "orchestrator:task-updated",
  "orchestrator:task-version-bumped",
  "orchestrator:task-artifact-produced",
  "orchestrator:task-approval-required",
  "orchestrator:workflow-resume-required",
  // Agent events
  "agent:created",
  "agent:status-change",
  "agent:completed",
  // Team events
  "team:event",
  "team:alert",
  "team:navigate-cockpit",
  // Mission events
  "mission:event",
  // Scheduler events
  IPC.SCHEDULER_TASK_STARTED,
  IPC.SCHEDULER_TASK_COMPLETED,
  IPC.SCHEDULER_TASK_FAILED,
  IPC.SCHEDULER_TASK_UPDATED,
  IPC.SCHEDULER_RUN_STARTED,
  IPC.SCHEDULER_RUN_FINISHED,
  IPC.SCHEDULER_RUNTIME_UPDATED,
  // PTY events
  IPC.PTY_OUTPUT,
  IPC.PTY_EXIT,
  IPC.QUICK_ACTION_SHELL_OUTPUT,
  IPC.QUICK_ACTION_SHELL_EXIT,
  // Skill events
  IPC.SKILL_INSTALLED_NOTIFY,
  IPC.SKILL_NPM_LOG,
  // MCP events
  IPC.MCP_INSTALL_PROGRESS,
  IPC.MCP_STARTUP_FAILURE,
  // Registry install progress
  "registry:skills-sh:install-progress",
  // Hook events
  IPC.HOOK_TRIGGERED,
  IPC.HOOK_EXECUTION_COMPLETED,
  IPC.HOOK_EXECUTION_FAILED,
  // Auth events
  IPC.AUTH_STATE_CHANGED,
  // Chat events
  IPC.CHAT_NEW_MESSAGE,
  IPC.CHAT_TYPING,
  IPC.CHAT_MEMBER_STATUS,
  // Butler events
  IPC.BUTLER_DETECTION,
  IPC.BUTLER_DECISION,
  IPC.BUTLER_AUTO_ACTION,
  IPC.BUTLER_STATUS_CHANGE,
  IPC.BUTLER_INTERVENTION,
  IPC.BUTLER_L3_FALLBACK,
  IPC.BUTLER_FLOAT_WINDOW_OPENED,
  IPC.BUTLER_FLOAT_WINDOW_CLOSED,
  IPC.BUTLER_ASSISTANT_MESSAGE,
  IPC.BUTLER_ASSISTANT_ACTION_UPDATED,
  IPC.BUTLER_ASSISTANT_THREAD_CLEARED,
  IPC.BUTLER_GOALS_UPDATED,
  IPC.GOALS_UPDATED,
  IPC.PROPOSALS_UPDATED,
  "butler:mood-change",
  "butler:quick-actions-update",
  "butler:memory-stored",
  // File manager events
  "file-manager:watch-change",
  "file-manager:session-files-updated",
  // Prototype events
  IPC.PROTOTYPE_WINDOW_CLOSED,
  IPC.PROTOTYPE_SYNC_PAGES,
  "prototype:switch-page",
  // Screenshot events
  "screenshot:captured",
  "screenshot:image-data",
  IPC.SCREENSHARE_WINDOW_CLOSED,
  IPC.MEETING_WINDOW_CLOSED,
  // Shortcut events
  "shortcut:new-session",
  "shortcut:new-task-session",
  "shortcut:close-session",
  "shortcut:search",
  "shortcut:toggle-sidebar",
  "shortcut:toggle-shell-panel",
  "shortcut:cycle-terminal",
  "shortcut:quick-open",
  "shortcut:search-in-files",
  "shortcut:replace-in-files",
  "shortcut:view-mode",
  // Workflow builder events
  "workflow-builder:draft-updated",
  // Relay events
  "relay:state-changed",
  // Office / Mission control window events
  IPC.OFFICE_WINDOW_CLOSED,
  IPC.MISSION_CONTROL_WINDOW_CLOSED,
  IPC.SESSION_CHAT_WINDOW_CLOSED,
  IPC.SESSION_CHAT_MAXIMIZED_CHANGED,
  IPC.RECORDER_EVENT,
  IPC.RECORDER_LIVE_EVENT,
  // Meeting events
  "meeting:state-changed",
  "meeting:toast",
  "meeting:participants",
  "meeting:share",
  "meeting:connection-state",
  "meeting:error",
  "meeting:member-joined",
  "meeting:member-left",
  "meeting:screen-share-changed",
  "meeting:host-changed",
  "meeting:screen-share-takeover-request",
  "meeting:signaling"
]);
const safeIpcRenderer = {
  invoke: (channel, ...args) => {
    if (!ALLOWED_INVOKE_CHANNELS.has(channel)) {
      console.warn(`[preload] Blocked invoke to unwhitelisted channel: ${channel}`);
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
    }
    return electron.ipcRenderer.invoke(channel, ...args);
  },
  send: (channel, ...args) => {
    if (!ALLOWED_SEND_CHANNELS.has(channel)) {
      console.warn(`[preload] Blocked send to unwhitelisted channel: ${channel}`);
      return;
    }
    return electron.ipcRenderer.send(channel, ...args);
  },
  on: (channel, callback) => {
    if (!ALLOWED_ON_CHANNELS.has(channel)) {
      console.warn(`[preload] Blocked on() listener for unwhitelisted channel: ${channel}`);
      return () => {
      };
    }
    const listener = (_event, ...args) => callback(...args);
    electron.ipcRenderer.on(channel, listener);
    return () => electron.ipcRenderer.removeListener(channel, listener);
  },
  off: (channel, callback) => {
    electron.ipcRenderer.removeListener(channel, callback);
  },
  removeListener: (channel, callback) => {
    electron.ipcRenderer.removeListener(channel, callback);
  }
};
electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: safeIpcRenderer
});
const isRecord = (value) => typeof value === "object" && value !== null;
const normalizeAlertEvent = (value) => {
  if (!isRecord(value)) return null;
  if (value.type === "team:alert") {
    return normalizeAlertEvent(value.data);
  }
  if (typeof value.type === "string" && typeof value.level === "string" && typeof value.instanceId === "string" && typeof value.triggeredAt === "string" && isRecord(value.payload)) {
    return value;
  }
  return null;
};
const getAlertDedupKey = (event) => [event.type, event.level, event.instanceId, event.memberId ?? "", event.triggeredAt].join("|");
const normalizeNavigateCockpitPayload = (value) => {
  if (typeof value === "string") {
    return value ? { instanceId: value } : null;
  }
  if (isRecord(value) && typeof value.instanceId === "string" && value.instanceId) {
    return {
      ...value,
      instanceId: value.instanceId,
      memberId: typeof value.memberId === "string" ? value.memberId : void 0,
      source: typeof value.source === "string" ? value.source : void 0
    };
  }
  return null;
};
electron.ipcRenderer.on(IPC.WORKSPACE_WINDOW_CLOSED, (_event, workspace) => {
  globalThis.window?.dispatchEvent(new CustomEvent("shineai:workspace-window-closed", { detail: workspace }));
});
const kanbanBridgeApi = {
  listBoards: () => electron.ipcRenderer.invoke(IPC.KANBAN_LIST_BOARDS),
  getBoard: (boardId) => electron.ipcRenderer.invoke(IPC.KANBAN_GET_BOARD, boardId),
  createBoard: (input) => electron.ipcRenderer.invoke(IPC.KANBAN_CREATE_BOARD, input),
  updateBoard: (boardId, patch) => electron.ipcRenderer.invoke(IPC.KANBAN_UPDATE_BOARD, boardId, patch),
  archiveBoard: (boardId) => electron.ipcRenderer.invoke(IPC.KANBAN_ARCHIVE_BOARD, boardId),
  listColumns: (boardId) => electron.ipcRenderer.invoke(IPC.KANBAN_LIST_COLUMNS, boardId),
  createColumn: (boardId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_CREATE_COLUMN, boardId, input),
  updateColumn: (boardId, columnId, patch) => electron.ipcRenderer.invoke(IPC.KANBAN_UPDATE_COLUMN, boardId, columnId, patch),
  reorderColumns: (boardId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_REORDER_COLUMNS, boardId, input),
  listTasks: (boardId, query) => electron.ipcRenderer.invoke(IPC.KANBAN_LIST_TASKS, boardId, query),
  getTask: (taskId) => electron.ipcRenderer.invoke(IPC.KANBAN_GET_TASK, taskId),
  createTask: (boardId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_CREATE_TASK, boardId, input),
  updateTask: (taskId, patch) => electron.ipcRenderer.invoke(IPC.KANBAN_UPDATE_TASK, taskId, patch),
  moveTask: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_MOVE_TASK, taskId, input),
  reorderTasks: (input, boardId) => electron.ipcRenderer.invoke(IPC.KANBAN_REORDER_TASKS, boardId ? { ...input, boardId } : input),
  listTaskEvents: (taskId, query) => electron.ipcRenderer.invoke(IPC.KANBAN_LIST_TASK_EVENTS, taskId, query),
  getTaskTimeline: (taskId, query) => electron.ipcRenderer.invoke(IPC.KANBAN_GET_TASK_TIMELINE, taskId, query),
  listTaskTimeline: (taskId, query) => electron.ipcRenderer.invoke(IPC.KANBAN_GET_TASK_TIMELINE, taskId, query),
  listTaskExecutions: (taskId, query) => electron.ipcRenderer.invoke(IPC.KANBAN_LIST_TASK_EXECUTIONS, taskId, query),
  startTaskExecution: (taskId, inputOrMode, options) => {
    const payload = typeof inputOrMode === "string" ? { ...options || {}, mode: inputOrMode, executionMode: inputOrMode, execution_mode: inputOrMode } : inputOrMode || {};
    return electron.ipcRenderer.invoke(IPC.KANBAN_START_TASK_EXECUTION, taskId, payload);
  },
  bindTaskExecution: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_BIND_TASK_EXECUTION, taskId, input),
  getTaskWorktreeStatus: (taskId, query) => electron.ipcRenderer.invoke(IPC.KANBAN_GET_TASK_WORKTREE_STATUS, taskId, query),
  refreshTaskDiff: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_REFRESH_TASK_DIFF, taskId, input),
  refreshTaskWorktree: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_REFRESH_TASK_WORKTREE, taskId, input),
  getTaskFileDiff: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_GET_TASK_FILE_DIFF, taskId, input),
  requestTaskReview: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_REQUEST_TASK_REVIEW, taskId, input),
  checkTaskMerge: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_CHECK_TASK_MERGE, taskId, input),
  mergeTaskWorktree: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_MERGE_TASK_WORKTREE, taskId, input),
  manualMergeTask: (taskId, input) => electron.ipcRenderer.invoke(IPC.KANBAN_MANUAL_MERGE_TASK, taskId, input),
  deleteTask: (taskId) => electron.ipcRenderer.invoke(IPC.KANBAN_DELETE_TASK, taskId),
  onTaskTimelineEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    electron.ipcRenderer.on(IPC.KANBAN_TASK_TIMELINE_EVENT, listener);
    return () => electron.ipcRenderer.removeListener(IPC.KANBAN_TASK_TIMELINE_EVENT, listener);
  }
};
const taskHandoverApi = {
  export: (payload) => electron.ipcRenderer.invoke(IPC.TASK_HANDOVER_EXPORT, payload),
  handover: (payload) => electron.ipcRenderer.invoke(IPC.TASK_HANDOVER_HANDOVER, payload)
};
const auditApi = {
  listSessions: () => electron.ipcRenderer.invoke(IPC.AUDIT_LIST_SESSIONS),
  readSession: (sessionId) => electron.ipcRenderer.invoke(IPC.AUDIT_READ_SESSION, { sessionId }),
  exportSession: (sessionId, format) => electron.ipcRenderer.invoke(IPC.AUDIT_EXPORT_SESSION, { sessionId, format })
};
electron.contextBridge.exposeInMainWorld("shineAI", {
  // ==================== Clipboard API ====================
  // E44 起 renderer/preload 不再暴露 clipboard 模块，文本读写改由 main 进程代理
  clipboard: {
    readText: () => electron.ipcRenderer.invoke(IPC.CLIPBOARD_READ_TEXT),
    writeText: (text) => electron.ipcRenderer.send(IPC.CLIPBOARD_WRITE_TEXT, text),
    writeImage: (path) => electron.ipcRenderer.invoke(IPC.CLIPBOARD_WRITE_IMAGE, path)
  },
  // ==================== Theme API ====================
  theme: {
    updateTitleBar: (themeId) => electron.ipcRenderer.send(IPC.THEME_UPDATE_TITLE_BAR, themeId)
  },
  // ==================== Startup Diagnostics ====================
  startup: {
    getError: () => electron.ipcRenderer.invoke("startup:getError"),
    retry: () => electron.ipcRenderer.invoke("startup:retry"),
    openLogFile: () => electron.ipcRenderer.invoke("startup:openLogFile")
  },
  // ==================== Environment Diagnostics ====================
  environment: {
    check: (options) => electron.ipcRenderer.invoke(IPC.ENVIRONMENT_CHECK, options)
  },
  // ==================== Settings API ====================
  settings: {
    getAll: () => electron.ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
    update: (key, value) => electron.ipcRenderer.invoke(IPC.SETTINGS_UPDATE, key, value)
  },
  recorder: {
    list: () => electron.ipcRenderer.invoke(IPC.RECORDER_LIST),
    get: (id) => electron.ipcRenderer.invoke(IPC.RECORDER_GET, id),
    import: () => electron.ipcRenderer.invoke(IPC.RECORDER_IMPORT),
    importPaths: (paths) => electron.ipcRenderer.invoke(IPC.RECORDER_IMPORT_PATHS, paths),
    getSettings: () => electron.ipcRenderer.invoke(IPC.RECORDER_GET_SETTINGS),
    setSettings: (patch) => electron.ipcRenderer.invoke(IPC.RECORDER_SET_SETTINGS, patch),
    watchGet: () => electron.ipcRenderer.invoke(IPC.RECORDER_WATCH_GET),
    watchSet: (dir) => electron.ipcRenderer.invoke(IPC.RECORDER_WATCH_SET, dir),
    retranscribe: (id) => electron.ipcRenderer.invoke(IPC.RECORDER_RETRANSCRIBE, id),
    reextract: (id) => electron.ipcRenderer.invoke(IPC.RECORDER_REEXTRACT, id),
    cloudPull: () => electron.ipcRenderer.invoke(IPC.RECORDER_CLOUD_PULL),
    liveListPorts: () => electron.ipcRenderer.invoke(IPC.RECORDER_LIVE_LIST_PORTS),
    liveConnect: (opts) => electron.ipcRenderer.invoke(IPC.RECORDER_LIVE_CONNECT, opts),
    liveStop: (opts) => electron.ipcRenderer.invoke(IPC.RECORDER_LIVE_STOP, opts),
    liveStatus: () => electron.ipcRenderer.invoke(IPC.RECORDER_LIVE_STATUS),
    dayGet: (day) => electron.ipcRenderer.invoke(IPC.RECORDER_DAY_GET, day),
    dayGenerate: (day) => electron.ipcRenderer.invoke(IPC.RECORDER_DAY_GENERATE, day),
    voiceStatus: () => electron.ipcRenderer.invoke(IPC.RECORDER_VOICE_STATUS),
    voiceEnroll: () => electron.ipcRenderer.invoke(IPC.RECORDER_VOICE_ENROLL),
    onEvent: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.RECORDER_EVENT, listener);
      return () => electron.ipcRenderer.removeListener(IPC.RECORDER_EVENT, listener);
    },
    onLiveEvent: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.RECORDER_LIVE_EVENT, listener);
      return () => electron.ipcRenderer.removeListener(IPC.RECORDER_LIVE_EVENT, listener);
    }
  },
  // ==================== Desktop Assistant API ====================
  assistant: {
    chat: (request) => electron.ipcRenderer.invoke(IPC.ASSISTANT_CHAT, request),
    replyConfirm: (payload) => electron.ipcRenderer.invoke(IPC.ASSISTANT_CONFIRM_REPLY, payload),
    onConfirmRequest: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.ASSISTANT_CONFIRM_REQUEST, listener);
      return () => electron.ipcRenderer.removeListener(IPC.ASSISTANT_CONFIRM_REQUEST, listener);
    },
    onConfirmResolved: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.ASSISTANT_CONFIRM_RESOLVED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.ASSISTANT_CONFIRM_RESOLVED, listener);
    },
    onUiCommand: (callback) => {
      const listener = (_event, command) => callback(command);
      electron.ipcRenderer.on(IPC.ASSISTANT_UI_COMMAND, listener);
      return () => electron.ipcRenderer.removeListener(IPC.ASSISTANT_UI_COMMAND, listener);
    }
  },
  // ==================== Daily Report API ====================
  dailyReport: {
    get: (request) => electron.ipcRenderer.invoke(IPC.DAILY_REPORT_GET, request),
    savePoster: (request) => electron.ipcRenderer.invoke(IPC.DAILY_REPORT_SAVE_POSTER, request),
    copyPoster: (request) => electron.ipcRenderer.invoke(IPC.DAILY_REPORT_COPY_POSTER, request),
    generatePoster: (options) => electron.ipcRenderer.invoke(IPC.DAILY_REPORT_GENERATE_POSTER, options),
    pushNow: (date) => electron.ipcRenderer.invoke(IPC.DAILY_REPORT_PUSH_NOW, date)
  },
  // ==================== Code Completion API（Monaco AI 灰字补全） ====================
  completion: {
    inline: (request) => electron.ipcRenderer.invoke(IPC.COMPLETION_INLINE, request)
  },
  // ==================== System / IPC topic 订阅 ====================
  system: {
    // 上报当前窗口订阅的 topic 全集（替换语义），用于会话级 IPC 定向路由
    setIpcTopics: (topics) => electron.ipcRenderer.invoke(IPC.SYSTEM_SET_IPC_TOPICS, topics)
  },
  telemetry: {
    track: (event) => electron.ipcRenderer.invoke(IPC.TELEMETRY_TRACK, event),
    getEnabled: () => electron.ipcRenderer.invoke(IPC.TELEMETRY_GET_ENABLED),
    setEnabled: (enabled, anonymousId) => electron.ipcRenderer.invoke(IPC.TELEMETRY_SET_ENABLED, enabled, anonymousId)
  },
  // ==================== Data Path API ====================
  dataPath: {
    get: () => electron.ipcRenderer.invoke(IPC.DATA_PATH_GET),
    selectDir: () => electron.ipcRenderer.invoke(IPC.DATA_PATH_SELECT_DIR),
    migrate: (targetPath) => electron.ipcRenderer.invoke(IPC.DATA_PATH_MIGRATE, targetPath),
    getMigrationStatus: () => electron.ipcRenderer.invoke(IPC.DATA_PATH_MIGRATION_STATUS),
    reset: () => electron.ipcRenderer.invoke(IPC.DATA_PATH_RESET),
    restart: () => electron.ipcRenderer.invoke(IPC.DATA_PATH_RESTART),
    onMigrationProgress: (callback) => {
      const listener = (_event, status) => callback(status);
      electron.ipcRenderer.on(IPC.DATA_PATH_MIGRATION_PROGRESS, listener);
      return () => electron.ipcRenderer.removeListener(IPC.DATA_PATH_MIGRATION_PROGRESS, listener);
    }
  },
  // ==================== Config Portability API（基础配置加密导出/导入） ====================
  config: {
    export: (password) => electron.ipcRenderer.invoke(IPC.CONFIG_EXPORT, { password }),
    importPreview: (password, filePath) => electron.ipcRenderer.invoke(IPC.CONFIG_IMPORT_PREVIEW, { password, filePath }),
    importApply: (filePath, password) => electron.ipcRenderer.invoke(IPC.CONFIG_IMPORT_APPLY, { filePath, password })
  },
  // ==================== DB Maintenance API（独立历史库迁移 + 主库瘦身） ====================
  dbMaintenance: {
    getStats: () => electron.ipcRenderer.invoke(IPC.DB_MAINTENANCE_STATS),
    migrate: (retentionDays) => electron.ipcRenderer.invoke(IPC.DB_MAINTENANCE_MIGRATE, { retentionDays })
  },
  // ==================== File System API ====================
  fs: {
    saveImageToTemp: (base64Data, mimeType) => electron.ipcRenderer.invoke(IPC.FS_SAVE_IMAGE_TO_TEMP, base64Data, mimeType),
    /**
     * 取外部文件（拖拽 / 剪贴板 / 文件选择器）的真实磁盘路径。
     *
     * Electron 32 起渲染层的 `File.path` 已被移除，官方替代品是 `webUtils.getPathForFile`。
     * 已在本机 Electron 44.3.0 实测：渲染层 `file.path` 为 undefined，而 File 对象经
     * contextBridge 传入本函数后仍能取到真实路径。
     *
     * 入参非 File（或非磁盘文件）时 webUtils 会抛错，这里统一降级为空串，调用方跳过即可。
     */
    getPathForFile: (file) => {
      try {
        return electron.webUtils.getPathForFile(file);
      } catch {
        return "";
      }
    }
  },
  // ==================== Voice API（语音转写） ====================
  voice: {
    transcribe: (audioBase64, mimeType) => electron.ipcRenderer.invoke(IPC.VOICE_TRANSCRIBE, audioBase64, mimeType),
    checkLocalWhisperStatus: (baseUrl) => electron.ipcRenderer.invoke(IPC.VOICE_LOCAL_WHISPER_STATUS, baseUrl),
    checkLocalWhisperEnvStatus: (whisperBaseUrl) => electron.ipcRenderer.invoke(IPC.VOICE_LOCAL_WHISPER_ENV_STATUS, whisperBaseUrl),
    streamStart: (mimeType) => electron.ipcRenderer.invoke(IPC.VOICE_STREAM_START, mimeType),
    streamChunk: (audioBase64) => electron.ipcRenderer.send(IPC.VOICE_STREAM_CHUNK, audioBase64),
    streamStop: () => electron.ipcRenderer.invoke(IPC.VOICE_STREAM_STOP),
    polish: (request) => electron.ipcRenderer.invoke(IPC.VOICE_POLISH, request),
    onStreamResult: (callback) => {
      const handler = (_event, text) => callback(text);
      electron.ipcRenderer.on(IPC.VOICE_STREAM_RESULT, handler);
      return () => {
        electron.ipcRenderer.removeListener(IPC.VOICE_STREAM_RESULT, handler);
      };
    },
    onStreamError: (callback) => {
      const handler = (_event, error) => callback(error);
      electron.ipcRenderer.on(IPC.VOICE_STREAM_ERROR, handler);
      return () => {
        electron.ipcRenderer.removeListener(IPC.VOICE_STREAM_ERROR, handler);
      };
    },
    // ---- 小光语音中枢：唤醒层（Sherpa 离线唤醒词） ----
    suspendWakeWord: () => electron.ipcRenderer.invoke(IPC.VOICE_WAKE_CONTROL, { action: "suspend" }),
    resumeWakeWord: () => electron.ipcRenderer.invoke(IPC.VOICE_WAKE_CONTROL, { action: "resume" }),
    getWakeDevices: () => electron.ipcRenderer.invoke(IPC.VOICE_WAKE_CONTROL, { action: "devices" }),
    ttsSynthesize: (request) => electron.ipcRenderer.invoke(IPC.VOICE_TTS_SYNTHESIZE, request),
    modelsControl: (request) => electron.ipcRenderer.invoke(IPC.VOICE_MODELS_CONTROL, request),
    onModelsProgress: (callback) => {
      const listener = (_event, status) => callback(status);
      electron.ipcRenderer.on(IPC.VOICE_MODELS_PROGRESS, listener);
      return () => electron.ipcRenderer.removeListener(IPC.VOICE_MODELS_PROGRESS, listener);
    },
    startWakeWord: () => electron.ipcRenderer.invoke(IPC.VOICE_WAKE_CONTROL, { action: "start" }),
    stopWakeWord: () => electron.ipcRenderer.invoke(IPC.VOICE_WAKE_CONTROL, { action: "stop" }),
    setWakeSensitivity: (value) => electron.ipcRenderer.invoke(IPC.VOICE_WAKE_CONTROL, {
      action: "set-sensitivity",
      sensitivity: value
    }),
    getWakeStatus: () => electron.ipcRenderer.invoke(IPC.VOICE_WAKE_CONTROL, { action: "status" }),
    onVoiceWake: (callback) => {
      const handler = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.VOICE_WAKE, handler);
      return () => {
        electron.ipcRenderer.removeListener(IPC.VOICE_WAKE, handler);
      };
    }
  },
  // ==================== Log API ====================
  log: {
    getRecent: (lines) => electron.ipcRenderer.invoke(IPC.LOG_GET_RECENT, lines),
    openFile: () => electron.ipcRenderer.invoke(IPC.LOG_OPEN_FILE)
  },
  // ==================== 主窗口控制 ====================
  window: {
    setFullScreen: (value, targetWindowId) => electron.ipcRenderer.invoke(IPC.WINDOW_SET_FULLSCREEN, value, targetWindowId),
    isFullScreen: (targetWindowId) => electron.ipcRenderer.invoke(IPC.WINDOW_IS_FULLSCREEN, targetWindowId),
    onFullScreenChanged: (callback) => {
      const listener = (_event, value) => callback(value);
      electron.ipcRenderer.on(IPC.WINDOW_FULLSCREEN_CHANGED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.WINDOW_FULLSCREEN_CHANGED, listener);
    }
  },
  // ==================== App API ====================
  app: {
    getCwd: () => __devPreloadInfo.cwd,
    getPlatform: () => process.platform,
    getHomePath: () => __devPreloadInfo.home,
    selectDirectory: () => electron.ipcRenderer.invoke("dialog:select-directory"),
    selectFile: () => electron.ipcRenderer.invoke(IPC.DIALOG_SELECT_FILE),
    selectMedia: (kind) => electron.ipcRenderer.invoke(IPC.DIALOG_SELECT_MEDIA, kind),
    selectImage: () => electron.ipcRenderer.invoke(IPC.DIALOG_SELECT_IMAGE),
    getRecentDirectories: (limit) => electron.ipcRenderer.invoke(IPC.DIRECTORY_GET_RECENT, limit),
    toggleDirectoryPin: (dirPath) => electron.ipcRenderer.invoke(IPC.DIRECTORY_TOGGLE_PIN, dirPath),
    removeDirectory: (dirPath) => electron.ipcRenderer.invoke(IPC.DIRECTORY_REMOVE, dirPath),
    quit: () => electron.ipcRenderer.invoke(IPC.APP_QUIT),
    relaunchElevated: () => electron.ipcRenderer.invoke(IPC.APP_RELAUNCH_ELEVATED),
    checkElevated: () => electron.ipcRenderer.invoke(IPC.APP_CHECK_ELEVATED),
    onMcpStartupFailure: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.MCP_STARTUP_FAILURE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.MCP_STARTUP_FAILURE, listener);
    },
    /** 在系统外部终端打开目录（default shell） */
    openInTerminal: (dirPath) => electron.ipcRenderer.invoke("file-manager:open-in-terminal", { path: dirPath, shell: "default" }),
    /** 在系统文件管理器中打开/显示路径 */
    openInExplorer: (dirPath) => electron.ipcRenderer.invoke("file-manager:show-in-folder", dirPath)
  },
  // ==================== Shell API (secured: proxied through IPC handlers) ====================
  shell: {
    openExternal: (url) => electron.ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
    openPath: (targetPath) => electron.ipcRenderer.invoke("folder-opener:open", targetPath)
  },
  // ==================== Folder Opener API ====================
  folderOpener: {
    openPath: (targetPath) => electron.ipcRenderer.invoke("folder-opener:open", targetPath)
  },
  // ==================== Util API ====================
  util: {
    openExternal: (url) => electron.ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url)
  },
  // ==================== Update API ====================
  update: {
    getState: () => electron.ipcRenderer.invoke(IPC.UPDATE_GET_STATE),
    checkForUpdates: (manual = true) => electron.ipcRenderer.invoke(IPC.UPDATE_CHECK, manual),
    downloadUpdate: () => electron.ipcRenderer.invoke(IPC.UPDATE_DOWNLOAD),
    quitAndInstall: () => electron.ipcRenderer.invoke(IPC.UPDATE_INSTALL),
    openDownloadPage: () => electron.ipcRenderer.invoke(IPC.UPDATE_OPEN_DOWNLOAD_PAGE),
    onStateChanged: (callback) => {
      const listener = (_event, state) => callback(state);
      electron.ipcRenderer.on(IPC.UPDATE_STATE_CHANGED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.UPDATE_STATE_CHANGED, listener);
    }
  },
  // ==================== Session Goal Runtime API（P0） ====================
  goalRuntime: {
    set: (params) => electron.ipcRenderer.invoke(IPC.GOAL_RUNTIME_SET, params),
    get: (sessionId) => electron.ipcRenderer.invoke(IPC.GOAL_RUNTIME_GET, sessionId),
    pause: (sessionId) => electron.ipcRenderer.invoke(IPC.GOAL_RUNTIME_PAUSE, sessionId),
    resume: (sessionId) => electron.ipcRenderer.invoke(IPC.GOAL_RUNTIME_RESUME, sessionId),
    clear: (sessionId) => electron.ipcRenderer.invoke(IPC.GOAL_RUNTIME_CLEAR, sessionId),
    onUpdated: (callback) => {
      const listener = (_event, runtime) => callback(runtime);
      electron.ipcRenderer.on(IPC.GOAL_RUNTIME_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.GOAL_RUNTIME_UPDATED, listener);
    }
  },
  // ==================== Session API ====================
  session: {
    create: (config) => electron.ipcRenderer.invoke(IPC.SESSION_CREATE, config),
    terminate: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_TERMINATE, sessionId),
    sendInput: (sessionId, input) => electron.ipcRenderer.invoke(IPC.SESSION_SEND_INPUT, sessionId, input),
    confirm: (sessionId, confirmed) => electron.ipcRenderer.invoke(IPC.SESSION_CONFIRM, sessionId, confirmed),
    resize: (sessionId, cols, rows) => electron.ipcRenderer.invoke(IPC.SESSION_RESIZE, sessionId, cols, rows),
    getOutput: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_GET_OUTPUT, sessionId),
    getAll: () => electron.ipcRenderer.invoke(IPC.SESSION_GET_ALL),
    getStats: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_GET_STATS, sessionId),
    getSystemPrompt: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_GET_SYSTEM_PROMPT, sessionId),
    getChangeSet: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_GET_CHANGE_SET, sessionId),
    getChangeDiff: (locator) => electron.ipcRenderer.invoke(IPC.SESSION_GET_CHANGE_DIFF, locator),
    checkWorktreeMerge: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CHECK_WORKTREE_MERGE, sessionId),
    mergeWorktree: (sessionId, opts) => electron.ipcRenderer.invoke(IPC.SESSION_MERGE_WORKTREE, sessionId, opts),
    getHistory: (options) => electron.ipcRenderer.invoke(IPC.SESSION_GET_HISTORY, options),
    getByIds: (ids) => electron.ipcRenderer.invoke(IPC.SESSION_GET_BY_IDS, ids),
    searchContent: (query, options) => electron.ipcRenderer.invoke(IPC.SESSION_SEARCH_CONTENT, query, options),
    getActivities: (sessionId, limit) => electron.ipcRenderer.invoke(IPC.SESSION_GET_ACTIVITIES, sessionId, limit),
    resume: (oldSessionId) => electron.ipcRenderer.invoke(IPC.SESSION_RESUME, oldSessionId),
    getLogs: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_GET_LOGS, sessionId),
    /** 只读：获取会话诊断/回放时间线（工具调用与输出片段） */
    getDiagnosticTimeline: (sessionId, options) => electron.ipcRenderer.invoke(IPC.SESSION_GET_DIAGNOSTIC_TIMELINE, sessionId, options),
    rename: (sessionId, newName) => electron.ipcRenderer.invoke(IPC.SESSION_RENAME, sessionId, newName),
    aiRename: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_AI_RENAME, sessionId),
    delete: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_DELETE, sessionId),
    batchDelete: (sessionIds, options) => electron.ipcRenderer.invoke(IPC.SESSION_BATCH_DELETE, sessionIds, options),
    restore: (snapshots) => electron.ipcRenderer.invoke(IPC.SESSION_RESTORE, snapshots),
    // 事件监听（主进程 → 渲染进程）
    onOutput: (callback) => {
      const listener = (_event, sessionId, data) => {
        callback(sessionId, data);
      };
      electron.ipcRenderer.on(IPC.SESSION_OUTPUT, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_OUTPUT, listener);
    },
    onStatusChange: (callback) => {
      const listener = (_event, sessionId, status) => {
        callback(sessionId, status);
      };
      electron.ipcRenderer.on(IPC.SESSION_STATUS_CHANGE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_STATUS_CHANGE, listener);
    },
    onActivity: (callback) => {
      const listener = (_event, sessionId, activity) => {
        callback(sessionId, activity);
      };
      electron.ipcRenderer.on(IPC.SESSION_ACTIVITY, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_ACTIVITY, listener);
    },
    onIntervention: (callback) => {
      const listener = (_event, sessionId, intervention) => {
        callback(sessionId, intervention);
      };
      electron.ipcRenderer.on(IPC.SESSION_INTERVENTION, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_INTERVENTION, listener);
    },
    onToolStatus: (callback) => {
      const listener = (_event, sessionId, toolStatus) => {
        callback(sessionId, toolStatus);
      };
      electron.ipcRenderer.on(IPC.SESSION_TOOL_STATUS, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_TOOL_STATUS, listener);
    },
    onNameChange: (callback) => {
      const listener = (_event, sessionId, name) => {
        callback(sessionId, name);
      };
      electron.ipcRenderer.on(IPC.SESSION_NAME_CHANGE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_NAME_CHANGE, listener);
    },
    /** 外部变更通知（Telegram 创建/终止会话时触发） */
    onRefresh: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("session:refresh", listener);
      return () => electron.ipcRenderer.removeListener("session:refresh", listener);
    },
    // AI 优化提示词（options 可选，用于按场景注入 few-shot 范例；缺省时行为不变）
    optimizePrompt: (text, options) => electron.ipcRenderer.invoke(IPC.SESSION_OPTIMIZE_PROMPT, text, options),
    // 快捷翻译（compose：输入框翻译成目标语言；reply：AI 回复翻译）
    translateText: (text, options) => electron.ipcRenderer.invoke(IPC.SESSION_TRANSLATE_TEXT, text, options),
    // SDK V2: 结构化消息发送（options 透传专家硬派发等字段）
    sendMessage: (sessionId, text, options) => electron.ipcRenderer.invoke(IPC.SESSION_SEND_MESSAGE, sessionId, text, options),
    // SDK V2: 结构化消息发送
    getConversation: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CONVERSATION_HISTORY, sessionId),
    getConversationPaged: (sessionId, options) => electron.ipcRenderer.invoke(IPC.SESSION_CONVERSATION_HISTORY_PAGED, sessionId, options),
    // SDK V2: 结构化消息发送
    abortSession: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_ABORT, sessionId),
    listBackgroundShells: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_BACKGROUND_SHELLS_LIST, sessionId),
    killBackgroundShell: (sessionId, jobId) => electron.ipcRenderer.invoke(IPC.SESSION_BACKGROUND_SHELLS_KILL, sessionId, jobId),
    onBackgroundShellsUpdate: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SESSION_BACKGROUND_SHELLS_UPDATE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_BACKGROUND_SHELLS_UPDATE, listener);
    },
    // SDK V2: 编辑用户消息并截断后续上下文重新发送
    editUserMessage: (sessionId, messageId, content) => electron.ipcRenderer.invoke(IPC.SESSION_EDIT_USER_MESSAGE, sessionId, messageId, content),
    rollbackDryRun: (request) => electron.ipcRenderer.invoke(ROLLBACK_IPC.DRY_RUN, request),
    rollbackApply: (request) => electron.ipcRenderer.invoke(ROLLBACK_IPC.APPLY, request),
    rollbackRedo: (request) => electron.ipcRenderer.invoke(ROLLBACK_IPC.REDO, request),
    share: (sessionId, options) => electron.ipcRenderer.invoke(IPC.SESSION_SHARE, sessionId, options),
    // A1 轻量发布：HTML 产物发布为公网链接（独立 channel，不改 session:share 语义）
    publishHtml: (options) => electron.ipcRenderer.invoke(IPC.SESSION_SHARE_HTML_PUBLISH, options),
    revokeHtmlPublish: (options) => electron.ipcRenderer.invoke(IPC.SESSION_SHARE_HTML_REVOKE, options),
    // SDK V2: 结构化消息发送
    respondPermission: (sessionId, accept) => electron.ipcRenderer.invoke(IPC.SESSION_PERMISSION_RESPOND, sessionId, accept),
    // SDK V2: AskUserQuestion 答案
    answerQuestion: (sessionId, answers) => electron.ipcRenderer.invoke(IPC.SESSION_ANSWER_QUESTION, sessionId, answers),
    // SDK V2: ExitPlanMode 审批
    approvePlan: (sessionId, approved) => electron.ipcRenderer.invoke(IPC.SESSION_APPROVE_PLAN, sessionId, approved),
    // SDK V2: 结构化消息发送
    getQueue: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_GET_QUEUE, sessionId),
    // SDK V2: 结构化消息发送
    clearQueue: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CLEAR_QUEUE, sessionId),
    removeQueueMessage: (sessionId, messageId) => electron.ipcRenderer.invoke(IPC.SESSION_REMOVE_QUEUE_MESSAGE, sessionId, messageId),
    updateQueueMessage: (sessionId, messageId, text) => electron.ipcRenderer.invoke(IPC.SESSION_UPDATE_QUEUE_MESSAGE, sessionId, messageId, text),
    reorderQueueMessages: (sessionId, orderedIds) => electron.ipcRenderer.invoke(IPC.SESSION_REORDER_QUEUE_MESSAGES, sessionId, orderedIds),
    promoteQueueMessageInterrupt: (sessionId, messageId) => electron.ipcRenderer.invoke(IPC.SESSION_PROMOTE_QUEUE_MESSAGE_INTERRUPT, sessionId, messageId),
    // SDK V2: 队列变更事件订阅（消息排队/派发/清空时推送，保证 UI 与后端一致）
    onQueueUpdate: (callback) => {
      const listener = (_event, sessionId, messages) => {
        callback(sessionId, messages);
      };
      electron.ipcRenderer.on(IPC.SESSION_QUEUE_UPDATE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_QUEUE_UPDATE, listener);
    },
    // SDK V2: 动态设置会话推理强度（Codex 推理模型）
    setReasoningEffort: (sessionId, effort) => electron.ipcRenderer.invoke(IPC.SESSION_SET_REASONING_EFFORT, sessionId, effort),
    // SDK V2: 结构化消息发送
    getReasoningEffort: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_GET_REASONING_EFFORT, sessionId),
    // SDK V2: 运行时切换会话权限模式
    setPermissionMode: (sessionId, mode) => electron.ipcRenderer.invoke(IPC.SESSION_SET_PERMISSION_MODE, sessionId, mode),
    // SDK V2: 运行时切换会话模式（自动 normal ↔ Supervisor；mission 需新建会话）
    setMode: (sessionId, mode) => electron.ipcRenderer.invoke(IPC.SESSION_SET_MODE, sessionId, mode),
    // SDK V2: 运行时热更新目录权限（项目目录 / 用户目录 / 完全访问）
    setDirectoryAccessMode: (sessionId, mode) => electron.ipcRenderer.invoke(IPC.SESSION_SET_DIRECTORY_ACCESS_MODE, sessionId, mode),
    setWorkspaceId: (sessionId, workspaceId) => electron.ipcRenderer.invoke(IPC.SESSION_SET_WORKSPACE_ID, sessionId, workspaceId),
    // SDK V2: 会话内切换 Provider/模型
    switchProvider: (sessionId, newProviderId, options) => electron.ipcRenderer.invoke(IPC.SESSION_SWITCH_PROVIDER, sessionId, newProviderId, options),
    // SDK V2: 会话手切 Key 池 URL 组（无 secret）
    switchProviderKeyGroup: (sessionId, baseUrl) => electron.ipcRenderer.invoke(IPC.SESSION_SWITCH_PROVIDER_KEY_GROUP, sessionId, baseUrl),
    // SDK V2: 切换 Claude SDK 计划模式（next-turn 生效）
    setPlanMode: (sessionId, enabled) => electron.ipcRenderer.invoke(IPC.SESSION_SET_PLAN_MODE, sessionId, enabled),
    // SDK V2: 更新 Plan 模式阶段级路由配置
    updatePlanStage: (sessionId, planStage) => electron.ipcRenderer.invoke(IPC.SESSION_UPDATE_PLAN_STAGE, sessionId, planStage),
    // SDK V2: 更新 Supervisor/Mission 子 Agent 调度池（providers + 可选 models 白名单）
    updateAgentDispatchPool: (sessionId, payload) => electron.ipcRenderer.invoke(IPC.SESSION_UPDATE_AGENT_DISPATCH_POOL, sessionId, payload),
    // SDK V2: 全局子 Agent 调度池（写全局设置 + 对所有会话即时生效）
    setGlobalAgentDispatchPool: (payload) => electron.ipcRenderer.invoke(IPC.SESSION_SET_GLOBAL_AGENT_DISPATCH_POOL, payload),
    // 获取指定会话可引用消息摘要列表（@session 精细引用）
    listMessages: (sessionId, options) => electron.ipcRenderer.invoke(IPC.SESSION_LIST_MESSAGES, sessionId, options),
    // SDK V2: 结构化消息发送
    onConversationMessage: (callback) => {
      const listener = (_event, sessionId, msg) => {
        callback(sessionId, msg);
      };
      electron.ipcRenderer.on(IPC.SESSION_CONVERSATION_MESSAGE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_CONVERSATION_MESSAGE, listener);
    },
    onTodosUpdate: (callback) => {
      const listener = (_event, sessionId, todos) => {
        callback(sessionId, todos);
      };
      electron.ipcRenderer.on(IPC.SESSION_TODOS_UPDATE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_TODOS_UPDATE, listener);
    },
    // SDK V2: 会话初始化数据事件监听
    onInitData: (callback) => {
      const listener = (_event, sessionId, data) => {
        callback(sessionId, data);
      };
      electron.ipcRenderer.on(IPC.SESSION_INIT_DATA, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_INIT_DATA, listener);
    },
    // SDK V2: Token 用量更新事件
    onTokenUpdate: (callback) => {
      const listener = (_event, sessionId, usage) => {
        callback(sessionId, usage);
      };
      electron.ipcRenderer.on(IPC.SESSION_TOKEN_UPDATE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_TOKEN_UPDATE, listener);
    },
    // SDK V2: Provider 切换成功事件
    onProviderSwitched: (callback) => {
      const listener = (_event, sessionId, data) => {
        callback(sessionId, data);
      };
      electron.ipcRenderer.on(IPC.SESSION_PROVIDER_SWITCHED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_PROVIDER_SWITCHED, listener);
    },
    // SDK V2: context 压缩状态更新事件
    onContextUpdate: (callback) => {
      const listener = (_event, sessionId, contextState) => {
        callback(sessionId, contextState);
      };
      electron.ipcRenderer.on(IPC.SESSION_CONTEXT_UPDATE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_CONTEXT_UPDATE, listener);
    },
    // SDK V2: 触发 context 压缩
    compactContext: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_COMPACT_CONTEXT, sessionId),
    // 临时调整当前会话的上下文窗口（不影响 Provider 默认值）
    updateContextWindow: (sessionId, maxContextTokens) => electron.ipcRenderer.invoke(IPC.SESSION_UPDATE_CONTEXT_WINDOW, sessionId, maxContextTokens),
    // Session Favorites (收藏/置顶)
    getFavorites: () => electron.ipcRenderer.invoke(IPC.SESSION_GET_FAVORITES).then(
      (r) => r?.data ?? []
    ),
    toggleFavorite: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_TOGGLE_FAVORITE, sessionId).then(
      (r) => ({ success: r?.success ?? false, isFavorite: r?.isFavorite ?? false })
    ),
    isFavorite: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_IS_FAVORITE, sessionId).then(
      (r) => r?.isFavorite ?? false
    ),
    watchListGraph: () => electron.ipcRenderer.invoke(IPC.SESSION_WATCH_LIST_GRAPH),
    watchSession: (payload) => electron.ipcRenderer.invoke(IPC.SESSION_WATCH, payload),
    unwatchSession: (payload) => electron.ipcRenderer.invoke(IPC.SESSION_UNWATCH, payload)
  },
  // ==================== Task API ====================
  task: {
    create: (task) => electron.ipcRenderer.invoke(IPC.TASK_CREATE, task),
    createFromExpertSuggestion: (params) => electron.ipcRenderer.invoke(IPC.TASK_CREATE_FROM_EXPERT_SUGGESTION, params),
    update: (taskId, updates) => electron.ipcRenderer.invoke(IPC.TASK_UPDATE, taskId, updates),
    delete: (taskId) => electron.ipcRenderer.invoke(IPC.TASK_DELETE, taskId),
    getAll: () => electron.ipcRenderer.invoke(IPC.TASK_GET_ALL),
    startSession: (taskId, config) => electron.ipcRenderer.invoke(IPC.TASK_START_SESSION, taskId, config),
    onStatusChange: (callback) => {
      const listener = (_event, taskId, updates) => {
        callback(taskId, updates);
      };
      electron.ipcRenderer.on(IPC.TASK_STATUS_CHANGE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.TASK_STATUS_CHANGE, listener);
    }
  },
  // ==================== Kanban / Project Board API ====================
  kanban: kanbanBridgeApi,
  // ==================== Task Handover API（B2 任务流转：导出/移交） ====================
  taskHandover: taskHandoverApi,
  // ==================== Audit Event Stream API (S3/A4) ====================
  audit: auditApi,
  // ==================== Orchestrator API ====================
  orchestrator: {
    startWorkflow: (workflow, variables, targetStepId) => electron.ipcRenderer.invoke("orchestrator:start-workflow", workflow, variables, targetStepId),
    cancelWorkflow: (executionId) => electron.ipcRenderer.invoke("orchestrator:cancel-workflow", executionId),
    pauseWorkflow: (executionId) => electron.ipcRenderer.invoke("orchestrator:pause-workflow", executionId),
    resumeWorkflow: (executionId) => electron.ipcRenderer.invoke("orchestrator:resume-workflow", executionId),
    approveStep: (executionId, stepId, approved, reason, reworkFromStepId) => electron.ipcRenderer.invoke(IPC.WORKFLOW_APPROVE_STEP, executionId, stepId, approved, reason, reworkFromStepId),
    completeStep: (executionId, stepId) => electron.ipcRenderer.invoke(IPC.WORKFLOW_COMPLETE_STEP, executionId, stepId),
    getExecution: (executionId) => electron.ipcRenderer.invoke("orchestrator:get-execution", executionId),
    getActiveExecutions: () => electron.ipcRenderer.invoke("orchestrator:get-active-executions"),
    getRecentExecutions: (limit) => electron.ipcRenderer.invoke("orchestrator:get-recent-executions", limit),
    retryFromStep: (executionId, stepId) => electron.ipcRenderer.invoke("orchestrator:retry-from-step", executionId, stepId),
    resetStepReview: (executionId, stepId) => electron.ipcRenderer.invoke("orchestrator:reset-step-review", executionId, stepId),
    // 事件监听
    onWorkflowStarted: (callback) => {
      const listener = (_event, executionId) => callback(executionId);
      electron.ipcRenderer.on("orchestrator:workflow-started", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:workflow-started", listener);
    },
    onWorkflowCompleted: (callback) => {
      const listener = (_event, executionId) => callback(executionId);
      electron.ipcRenderer.on("orchestrator:workflow-completed", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:workflow-completed", listener);
    },
    onWorkflowFailed: (callback) => {
      const listener = (_event, executionId, error) => callback(executionId, error);
      electron.ipcRenderer.on("orchestrator:workflow-failed", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:workflow-failed", listener);
    },
    onStepStarted: (callback) => {
      const listener = (_event, executionId, stepId, sessionId) => callback(executionId, stepId, sessionId);
      electron.ipcRenderer.on("orchestrator:step-started", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-started", listener);
    },
    onStepCompleted: (callback) => {
      const listener = (_event, executionId, stepId) => callback(executionId, stepId);
      electron.ipcRenderer.on("orchestrator:step-completed", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-completed", listener);
    },
    onStepLooping: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:step-looping", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-looping", listener);
    },
    onStepConditionRouted: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:step-condition-routed", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-condition-routed", listener);
    },
    onStepTeamStarted: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:step-team-started", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-team-started", listener);
    },
    onStepWatchPolling: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:step-watch-polling", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-watch-polling", listener);
    },
    onStepReviewNeeded: (callback) => {
      const listener = (_event, executionId, stepId, message) => callback(executionId, stepId, message);
      electron.ipcRenderer.on("orchestrator:step-review-needed", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-review-needed", listener);
    },
    onWorkflowPaused: (callback) => {
      const listener = (_event, executionId) => callback(executionId);
      electron.ipcRenderer.on("orchestrator:workflow-paused", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:workflow-paused", listener);
    },
    onWorkflowResumed: (callback) => {
      const listener = (_event, executionId) => callback(executionId);
      electron.ipcRenderer.on("orchestrator:workflow-resumed", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:workflow-resumed", listener);
    },
    onWorkflowCancelled: (callback) => {
      const listener = (_event, executionId) => callback(executionId);
      electron.ipcRenderer.on("orchestrator:workflow-cancelled", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:workflow-cancelled", listener);
    },
    onStepTurnProgress: (callback) => {
      const listener = (_event, executionId, stepId, progress) => callback(executionId, stepId, progress);
      electron.ipcRenderer.on("orchestrator:step-turn-progress", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-turn-progress", listener);
    },
    onStepMissionStarted: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:step-mission-started", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-mission-started", listener);
    },
    onStepMissionProgress: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:step-mission-progress", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:step-mission-progress", listener);
    },
    onTaskTreeInitialized: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:task-tree-initialized", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:task-tree-initialized", listener);
    },
    onTaskCreated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:task-created", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:task-created", listener);
    },
    onTaskUpdated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:task-updated", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:task-updated", listener);
    },
    onTaskVersionBumped: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:task-version-bumped", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:task-version-bumped", listener);
    },
    onTaskArtifactProduced: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:task-artifact-produced", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:task-artifact-produced", listener);
    },
    onTaskApprovalRequired: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:task-approval-required", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:task-approval-required", listener);
    },
    onWorkflowResumeRequired: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("orchestrator:workflow-resume-required", listener);
      return () => electron.ipcRenderer.removeListener("orchestrator:workflow-resume-required", listener);
    },
    resolveTaskApproval: (approvalId, approved, reason) => electron.ipcRenderer.invoke("orchestrator:resolve-task-approval", approvalId, approved, reason),
    rollbackTaskVersion: (taskId, versionId) => electron.ipcRenderer.invoke("orchestrator:rollback-task-version", taskId, versionId)
  },
  // ==================== Workflow API ====================
  workflow: {
    start: (workflowConfig) => electron.ipcRenderer.invoke(IPC.WORKFLOW_START, workflowConfig),
    approveStep: (workflowId, stepId, approved, reason) => electron.ipcRenderer.invoke(IPC.WORKFLOW_APPROVE_STEP, workflowId, stepId, approved, reason),
    completeStep: (executionId, stepId) => electron.ipcRenderer.invoke(IPC.WORKFLOW_COMPLETE_STEP, executionId, stepId),
    save: (workflowData) => electron.ipcRenderer.invoke(IPC.WORKFLOW_SAVE, workflowData),
    list: () => electron.ipcRenderer.invoke(IPC.WORKFLOW_LIST),
    get: (id) => electron.ipcRenderer.invoke(IPC.WORKFLOW_GET, id),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.WORKFLOW_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.WORKFLOW_DELETE, id),
    listVersions: (id) => electron.ipcRenderer.invoke(IPC.WORKFLOW_LIST_VERSIONS, id),
    restoreVersion: (id, versionId) => electron.ipcRenderer.invoke(IPC.WORKFLOW_RESTORE_VERSION, id, versionId)
  },
  workflowBuilder: {
    getDraft: (sessionId) => electron.ipcRenderer.invoke("workflow-builder:get-draft", sessionId),
    removeDraft: (sessionId) => electron.ipcRenderer.invoke("workflow-builder:remove-draft", sessionId),
    onDraftUpdated: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on("workflow-builder:draft-updated", listener);
      return () => electron.ipcRenderer.removeListener("workflow-builder:draft-updated", listener);
    }
  },
  // ==================== Creative Canvas API ====================
  creativeCanvas: {
    listProviders: () => electron.ipcRenderer.invoke(IPC.CREATIVE_PROVIDER_LIST),
    listChannels: () => electron.ipcRenderer.invoke(IPC.CREATIVE_CHANNEL_LIST),
    createTask: (request) => electron.ipcRenderer.invoke(IPC.CREATIVE_TASK_CREATE, request),
    getTask: (taskId) => electron.ipcRenderer.invoke(IPC.CREATIVE_TASK_GET, taskId),
    listTasks: () => electron.ipcRenderer.invoke(IPC.CREATIVE_TASK_LIST),
    cancelTask: (taskId) => electron.ipcRenderer.invoke(IPC.CREATIVE_TASK_CANCEL, taskId),
    listAssets: (query) => electron.ipcRenderer.invoke(IPC.CREATIVE_ASSET_LIST, query),
    importAsset: (input) => electron.ipcRenderer.invoke(IPC.CREATIVE_ASSET_IMPORT, input),
    exportAsset: (assetId) => electron.ipcRenderer.invoke(IPC.CREATIVE_ASSET_EXPORT, assetId),
    deleteAsset: (assetId) => electron.ipcRenderer.invoke(IPC.CREATIVE_ASSET_DELETE, assetId),
    onTaskUpdated: (callback) => {
      const listener = (_event, task) => callback(task);
      electron.ipcRenderer.on(IPC.CREATIVE_TASK_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.CREATIVE_TASK_UPDATED, listener);
    }
  },
  // ==================== Provider API ====================
  /** Provider 额度状态（按 Provider 维度；耗尽时会话消息排队，恢复后自动继续） */
  providerQuota: {
    list: () => electron.ipcRenderer.invoke(IPC.PROVIDER_QUOTA_LIST),
    retryNow: (providerId) => electron.ipcRenderer.invoke(IPC.PROVIDER_QUOTA_RETRY_NOW, providerId),
    failoverNow: (providerId, targetProviderId) => electron.ipcRenderer.invoke(IPC.PROVIDER_QUOTA_FAILOVER_NOW, providerId, targetProviderId),
    onUpdated: (listener) => {
      const wrapped = (_e, state) => listener(state);
      electron.ipcRenderer.on(IPC.PROVIDER_QUOTA_UPDATED, wrapped);
      return () => electron.ipcRenderer.removeListener(IPC.PROVIDER_QUOTA_UPDATED, wrapped);
    }
  },
  provider: {
    getAll: () => electron.ipcRenderer.invoke(IPC.PROVIDER_GET_ALL),
    get: (id) => electron.ipcRenderer.invoke(IPC.PROVIDER_GET, id),
    /**
     * 新建 Provider。必填 name（唯一）与 adapterType（如 openai-api）；id 可省略，省略时主进程自动生成 UUID。
     * OpenAI 兼容中转还需要 apiBaseUrl / apiKey / defaultModel。id 请勿传 null 或空串——那会写出无法编辑的脏行。
     */
    create: (provider) => electron.ipcRenderer.invoke(IPC.PROVIDER_CREATE, provider),
    /**
     * 更新 Provider。更新前请用 provider.getAll 拿到真实 id 再传，不要用显示名称；找不到目标会返回 success:false 而不是静默成功。
     */
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.PROVIDER_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.PROVIDER_DELETE, id),
    reorder: (orderedIds) => electron.ipcRenderer.invoke(IPC.PROVIDER_REORDER, orderedIds),
    /** 订阅 Provider 列表变更（任一路径写入后主进程广播），返回取消订阅函数 */
    onChanged: (listener) => {
      const wrapped = () => listener();
      electron.ipcRenderer.on(IPC.PROVIDER_CHANGED, wrapped);
      return () => electron.ipcRenderer.removeListener(IPC.PROVIDER_CHANGED, wrapped);
    },
    /** 检测 CLI 命令是否已安装，返回 { found: boolean, path: string | null } */
    checkCli: (command, nodeVersion) => electron.ipcRenderer.invoke(IPC.PROVIDER_CHECK_CLI, command, nodeVersion),
    /** 测试 Provider 健康状态并返回延迟/状态 */
    test: (config) => electron.ipcRenderer.invoke(IPC.PROVIDER_TEST, config),
    /**
     * 测试 Claude Code 可执行文件是否可用。
     * - 传入 executablePath：验证该路径的文件是否存在
     * - 不传参数：自动检测系统中的 claude CLI
     * 返回 { found: boolean, path: string | null, error?: string }
     */
    testExecutable: (executablePath) => electron.ipcRenderer.invoke(IPC.PROVIDER_TEST_EXECUTABLE, executablePath),
    /** 测试 Provider 真实请求（按 adapterType 选择 Anthropic/OpenAI/Gemini 协议；adapterType 缺省时按 OpenAI 兼容处理）。 */
    testApi: (config) => electron.ipcRenderer.invoke(IPC.PROVIDER_TEST_API, config),
    /**
     * Provider 多 Key 池 API。
     * - list/get/test 永不返回 secret/apiKey 明文
     * - add / importCurrent 是唯一接收明文的写入入口
     * - test/testAll 前端只传 keyId，主进程从 DB 解密
     */
    keyPool: {
      getConfig: (providerId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_GET_CONFIG, providerId),
      setConfig: (providerId, updates) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_SET_CONFIG, providerId, updates),
      list: (providerId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_LIST, providerId),
      add: (providerId, inputs) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_ADD, providerId, inputs),
      update: (providerId, keyId, updates) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_UPDATE, providerId, keyId, updates),
      remove: (providerId, keyId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_REMOVE, providerId, keyId),
      test: (providerId, keyId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_TEST, providerId, keyId),
      testAll: (providerId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_TEST_ALL, providerId),
      resetHealth: (providerId, keyId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_RESET_HEALTH, providerId, keyId),
      clearCooldown: (providerId, keyId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_CLEAR_COOLDOWN, providerId, keyId),
      importCurrent: (providerId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_IMPORT_CURRENT, providerId),
      fetchModels: (providerId, keyId) => electron.ipcRenderer.invoke(IPC.PROVIDER_KEY_POOL_FETCH_MODELS, providerId, keyId)
    },
    /** 根据 API URL / API Key 拉取模型列表；CLI Adapter 可只传 adapterType（+ 可选 command）走 CLI */
    fetchModels: (config) => electron.ipcRenderer.invoke(IPC.PROVIDER_FETCH_MODELS, config),
    /** 启动 Claude OAuth 登录流程（自动打开浏览器授权） */
    claudeLogin: () => electron.ipcRenderer.invoke(IPC.PROVIDER_CLAUDE_LOGIN),
    /** 检查 Claude 登录状态 */
    claudeLoginStatus: () => electron.ipcRenderer.invoke(IPC.PROVIDER_CLAUDE_LOGIN_STATUS),
    /** 启动 Codex 登录流程（ChatGPT OAuth） */
    codexLogin: () => electron.ipcRenderer.invoke(IPC.PROVIDER_CODEX_LOGIN),
    /** 检查 Codex 登录状态 */
    codexLoginStatus: () => electron.ipcRenderer.invoke(IPC.PROVIDER_CODEX_LOGIN_STATUS),
    /** 启动 Gemini 登录流程（Google OAuth） */
    geminiLogin: () => electron.ipcRenderer.invoke(IPC.PROVIDER_GEMINI_LOGIN),
    /** 检查 Gemini 登录状态 */
    geminiLoginStatus: () => electron.ipcRenderer.invoke(IPC.PROVIDER_GEMINI_LOGIN_STATUS),
    /** 启动 GitHub Copilot 登录流程（gh auth login --web） */
    copilotLogin: () => electron.ipcRenderer.invoke(IPC.PROVIDER_COPILOT_LOGIN),
    /** 检查 GitHub Copilot 登录状态 */
    copilotLoginStatus: () => electron.ipcRenderer.invoke(IPC.PROVIDER_COPILOT_LOGIN_STATUS)
  },
  relayTemplate: {
    sync: () => electron.ipcRenderer.invoke(IPC.RELAY_TEMPLATE_SYNC),
    getAll: () => electron.ipcRenderer.invoke(IPC.RELAY_TEMPLATE_GET_ALL),
    getAllAdmin: () => electron.ipcRenderer.invoke(IPC.RELAY_TEMPLATE_GET_ALL_ADMIN),
    get: (id) => electron.ipcRenderer.invoke(IPC.RELAY_TEMPLATE_GET, id),
    create: (template) => electron.ipcRenderer.invoke(IPC.RELAY_TEMPLATE_CREATE, template),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.RELAY_TEMPLATE_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.RELAY_TEMPLATE_DELETE, id)
  },
  // ==================== NVM API ====================
  nvm: {
    listVersions: () => electron.ipcRenderer.invoke(IPC.NVM_LIST_VERSIONS)
  },
  // ==================== Search API ====================
  search: {
    logs: (query, sessionId, limit) => electron.ipcRenderer.invoke(IPC.SEARCH_LOGS, query, sessionId, limit)
  },
  // ==================== Usage API ====================
  usage: {
    getSummary: () => electron.ipcRenderer.invoke(IPC.USAGE_GET_SUMMARY),
    getHistory: (days) => electron.ipcRenderer.invoke(IPC.USAGE_GET_HISTORY, days),
    flush: () => electron.ipcRenderer.invoke(IPC.USAGE_FLUSH)
  },
  // Legacy - 保持向后兼容
  getUsageSummary: () => electron.ipcRenderer.invoke(IPC.USAGE_GET_SUMMARY),
  // ==================== Summary API（跨会话上下文） ====================
  summary: {
    getLatest: (sessionId) => electron.ipcRenderer.invoke("summary:get-latest", sessionId),
    getAll: (sessionId, limit) => electron.ipcRenderer.invoke("summary:get-all", sessionId, limit),
    getAllSessions: () => electron.ipcRenderer.invoke("summary:get-all-sessions"),
    generateBriefing: () => electron.ipcRenderer.invoke("summary:generate-briefing")
  },
  // ==================== Agent API ====================
  agent: {
    list: (parentSessionId) => electron.ipcRenderer.invoke("agent:list", parentSessionId),
    spawn: (parentSessionId, config) => electron.ipcRenderer.invoke("agent:spawn", parentSessionId, config),
    cancel: (agentId) => electron.ipcRenderer.invoke("agent:cancel", agentId),
    getOutput: (agentId, lines) => electron.ipcRenderer.invoke(IPC.AGENT_GET_OUTPUT, agentId, lines),
    onCreated: (callback) => {
      const listener = (_event, agentInfo) => callback(agentInfo);
      electron.ipcRenderer.on("agent:created", listener);
      return () => electron.ipcRenderer.removeListener("agent:created", listener);
    },
    onStatusChange: (callback) => {
      const listener = (_event, agentId, status) => callback(agentId, status);
      electron.ipcRenderer.on("agent:status-change", listener);
      return () => electron.ipcRenderer.removeListener("agent:status-change", listener);
    },
    onCompleted: (callback) => {
      const listener = (_event, agentId, result) => callback(agentId, result);
      electron.ipcRenderer.on("agent:completed", listener);
      return () => electron.ipcRenderer.removeListener("agent:completed", listener);
    }
  },
  // ==================== Shortcut API ====================
  shortcut: {
    onViewMode: (callback) => {
      const listener = (_event, mode) => callback(mode);
      electron.ipcRenderer.on("shortcut:view-mode", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:view-mode", listener);
    },
    onCycleTerminal: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:cycle-terminal", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:cycle-terminal", listener);
    },
    onNewSession: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:new-session", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:new-session", listener);
    },
    onNewTaskSession: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:new-task-session", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:new-task-session", listener);
    },
    onCloseSession: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:close-session", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:close-session", listener);
    },
    onToggleSidebar: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:toggle-sidebar", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:toggle-sidebar", listener);
    },
    onToggleShellPanel: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:toggle-shell-panel", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:toggle-shell-panel", listener);
    },
    onSearch: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:search", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:search", listener);
    },
    onQuickOpen: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:quick-open", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:quick-open", listener);
    },
    onOpenCommandPalette: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:open-command-palette", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:open-command-palette", listener);
    },
    onSearchInFiles: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:search-in-files", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:search-in-files", listener);
    },
    onReplaceInFiles: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("shortcut:replace-in-files", listener);
      return () => electron.ipcRenderer.removeListener("shortcut:replace-in-files", listener);
    },
    configureFeatureShortcuts: (updates) => electron.ipcRenderer.invoke("shortcut:configure-feature-shortcuts", updates),
    getFeatureShortcuts: () => electron.ipcRenderer.invoke("shortcut:get-feature-shortcuts"),
    // ── 快捷键绑定管理 ──
    getKeybindings: () => electron.ipcRenderer.invoke("shortcut:get-keybindings"),
    getMeta: () => electron.ipcRenderer.invoke("shortcut:get-meta"),
    getDefaults: () => electron.ipcRenderer.invoke("shortcut:get-defaults"),
    updateKeybindings: (updates) => electron.ipcRenderer.invoke("shortcut:update-keybindings", updates),
    saveKeybindings: (updates) => electron.ipcRenderer.invoke("shortcut:save-keybindings", updates),
    resetKeybindings: () => electron.ipcRenderer.invoke("shortcut:reset-keybindings"),
    // 事件监听（主进程 → 渲染进程）
    capture: (mode) => electron.ipcRenderer.invoke("screenshot:capture", mode),
    captureToFile: (mode) => electron.ipcRenderer.invoke("screenshot:capture-to-file", mode),
    onCaptured: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on("screenshot:captured", listener);
      return () => electron.ipcRenderer.removeListener("screenshot:captured", listener);
    },
    // ── 截图编辑器（框选+标注） ──
    startEditor: () => electron.ipcRenderer.invoke("screenshot:start-editor")
  },
  // ==================== 鎴浘缂栬緫鍣?API ====================
  screenshotEditor: {
    /** 通知主进程编辑器已就绪 */
    ready: () => electron.ipcRenderer.send("screenshot:editor-ready"),
    /** 通知主进程编辑器已就绪 */
    complete: (dataUrl) => electron.ipcRenderer.invoke("screenshot:editor-complete", dataUrl),
    /** 淇濆瓨鎴浘鍒版枃浠?*/
    save: (dataUrl) => electron.ipcRenderer.invoke("screenshot:editor-save", dataUrl),
    /** 通知主进程编辑器已就绪 */
    cancel: () => electron.ipcRenderer.send("screenshot:editor-cancel"),
    /** 通知主进程编辑器已就绪 */
    onImageData: (callback) => {
      const listener = (_event, dataUrl) => callback(_event, dataUrl);
      electron.ipcRenderer.on("screenshot:image-data", listener);
      return () => electron.ipcRenderer.removeListener("screenshot:image-data", listener);
    }
  },
  // ==================== Git / Worktree API ====================
  git: {
    isRepo: (dirPath) => electron.ipcRenderer.invoke(IPC.GIT_IS_REPO, dirPath),
    getBranches: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_GET_BRANCHES, repoPath),
    getCurrentBranch: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_GET_CURRENT_BRANCH, repoPath),
    detectMainBranch: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_DETECT_MAIN_BRANCH, repoPath),
    getRepoRoot: (dirPath) => electron.ipcRenderer.invoke(IPC.GIT_GET_REPO_ROOT, dirPath),
    isDirty: (dirPath) => electron.ipcRenderer.invoke(IPC.GIT_IS_DIRTY, dirPath),
    getStatus: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_GET_STATUS, repoPath),
    getFileDiff: (repoPath, filePath, staged, commitHash) => electron.ipcRenderer.invoke(IPC.GIT_GET_FILE_DIFF, repoPath, filePath, staged, commitHash),
    stage: (repoPath, filePaths) => electron.ipcRenderer.invoke(IPC.GIT_STAGE, repoPath, filePaths),
    unstage: (repoPath, filePaths) => electron.ipcRenderer.invoke(IPC.GIT_UNSTAGE, repoPath, filePaths),
    discard: (repoPath, filePaths) => electron.ipcRenderer.invoke(IPC.GIT_DISCARD, repoPath, filePaths),
    stageAll: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_STAGE_ALL, repoPath),
    commit: (repoPath, message) => electron.ipcRenderer.invoke(IPC.GIT_COMMIT, repoPath, message),
    pull: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_PULL, repoPath),
    push: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_PUSH, repoPath),
    getLog: (repoPath, limit) => electron.ipcRenderer.invoke(IPC.GIT_GET_LOG, repoPath, limit),
    getRemoteStatus: (repoPath) => electron.ipcRenderer.invoke(IPC.GIT_GET_REMOTE_STATUS, repoPath),
    getCommitFiles: (repoPath, hash) => electron.ipcRenderer.invoke(IPC.GIT_GET_COMMIT_FILES, repoPath, hash)
  },
  worktree: {
    create: (repoPath, branch, taskId) => electron.ipcRenderer.invoke(IPC.WORKTREE_CREATE, repoPath, branch, taskId),
    remove: (repoPath, worktreePath, deleteBranch, branchName) => electron.ipcRenderer.invoke(IPC.WORKTREE_REMOVE, repoPath, worktreePath, deleteBranch, branchName),
    list: (repoPath) => electron.ipcRenderer.invoke(IPC.WORKTREE_LIST, repoPath),
    describe: (repoPath, hints) => electron.ipcRenderer.invoke(IPC.WORKTREE_LIFECYCLE, repoPath, hints),
    checkMerge: (repoPath, worktreePath) => electron.ipcRenderer.invoke(IPC.WORKTREE_CHECK_MERGE, repoPath, worktreePath),
    merge: (repoPath, branchName, options) => electron.ipcRenderer.invoke(IPC.WORKTREE_MERGE, repoPath, branchName, options),
    getDiffSummary: (repoPath, worktreePath, baseCommit, baseBranch, worktreeBranchHint) => electron.ipcRenderer.invoke(IPC.WORKTREE_DIFF_SUMMARY, repoPath, worktreePath, baseCommit, baseBranch, worktreeBranchHint),
    getFileDiff: (repoPath, worktreeBranch, filePath, baseCommit, baseBranch) => electron.ipcRenderer.invoke(IPC.WORKTREE_FILE_DIFF, repoPath, worktreeBranch, filePath, baseCommit, baseBranch),
    getLiveDiffSummary: (repoPath, worktreePath, baseCommit, baseBranch, worktreeBranchHint) => electron.ipcRenderer.invoke(IPC.WORKTREE_LIVE_DIFF_SUMMARY, repoPath, worktreePath, baseCommit, baseBranch, worktreeBranchHint),
    getLiveFileDiff: (repoPath, worktreePath, filePath, baseCommit, baseBranch, worktreeBranchHint) => electron.ipcRenderer.invoke(IPC.WORKTREE_LIVE_FILE_DIFF, repoPath, worktreePath, filePath, baseCommit, baseBranch, worktreeBranchHint)
  },
  // ==================== Workspace API ====================
  workspace: {
    list: () => electron.ipcRenderer.invoke(IPC.WORKSPACE_LIST),
    get: (id) => electron.ipcRenderer.invoke(IPC.WORKSPACE_GET, id),
    create: (data) => electron.ipcRenderer.invoke(IPC.WORKSPACE_CREATE, data),
    update: (id, data) => electron.ipcRenderer.invoke(IPC.WORKSPACE_UPDATE, id, data),
    delete: (id) => electron.ipcRenderer.invoke(IPC.WORKSPACE_DELETE, id),
    scanRepos: (dirPath) => electron.ipcRenderer.invoke(IPC.WORKSPACE_SCAN_REPOS, dirPath),
    importVscode: (filePath) => electron.ipcRenderer.invoke(IPC.WORKSPACE_IMPORT_VSCODE, filePath)
  },
  // ==================== Telegram API ====================
  telegram: {
    getConfig: () => electron.ipcRenderer.invoke("telegram:get-config"),
    updateConfig: (key, value) => electron.ipcRenderer.invoke("telegram:update-config", key, value),
    getStatus: () => electron.ipcRenderer.invoke("telegram:get-status"),
    restart: () => electron.ipcRenderer.invoke("telegram:restart"),
    getAIProviders: () => electron.ipcRenderer.invoke("telegram:get-ai-providers"),
    addAIProvider: (provider) => electron.ipcRenderer.invoke("telegram:add-ai-provider", provider),
    updateAIProvider: (id, updates) => electron.ipcRenderer.invoke("telegram:update-ai-provider", id, updates),
    deleteAIProvider: (id) => electron.ipcRenderer.invoke("telegram:delete-ai-provider", id),
    testAIProvider: (provider) => electron.ipcRenderer.invoke("telegram:test-ai-provider", provider),
    getAllowedUsers: () => electron.ipcRenderer.invoke("telegram:get-allowed-users"),
    addAllowedUser: (userId, username, displayName, role) => electron.ipcRenderer.invoke("telegram:add-allowed-user", userId, username, displayName, role),
    removeAllowedUser: (userId) => electron.ipcRenderer.invoke("telegram:remove-allowed-user", userId),
    getAPILogs: (limit) => electron.ipcRenderer.invoke("telegram:get-api-logs", limit)
  },
  // ==================== Feishu API ====================
  feishu: {
    getConfig: () => electron.ipcRenderer.invoke("feishu:get-config"),
    updateConfig: (key, value) => electron.ipcRenderer.invoke("feishu:update-config", key, value),
    getStatus: () => electron.ipcRenderer.invoke("feishu:get-status"),
    restart: () => electron.ipcRenderer.invoke("feishu:restart"),
    getAllowedUsers: () => electron.ipcRenderer.invoke("feishu:get-allowed-users"),
    addAllowedUser: (openId, displayName, role) => electron.ipcRenderer.invoke("feishu:add-allowed-user", openId, displayName, role),
    removeAllowedUser: (openId) => electron.ipcRenderer.invoke("feishu:remove-allowed-user", openId)
  },
  // ==================== WeCom API ====================
  wecom: {
    getConfig: () => electron.ipcRenderer.invoke("wecom:get-config"),
    updateConfig: (key, value) => electron.ipcRenderer.invoke("wecom:update-config", key, value),
    getStatus: () => electron.ipcRenderer.invoke("wecom:get-status"),
    restart: () => electron.ipcRenderer.invoke("wecom:restart"),
    getAllowedUsers: () => electron.ipcRenderer.invoke("wecom:get-allowed-users"),
    addAllowedUser: (userId, displayName, role) => electron.ipcRenderer.invoke("wecom:add-allowed-user", userId, displayName, role),
    removeAllowedUser: (userId) => electron.ipcRenderer.invoke("wecom:remove-allowed-user", userId),
    getAPILogs: (limit) => electron.ipcRenderer.invoke("wecom:get-api-logs", limit),
    testRelayConnection: () => electron.ipcRenderer.invoke("wecom:test-relay-connection")
  },
  // ==================== File Manager API ====================
  fileManager: {
    listDir: (path, context) => electron.ipcRenderer.invoke("file-manager:list-dir", { path, context }),
    openPath: (path, context) => electron.ipcRenderer.invoke("file-manager:open-path", context ? { path, context } : path),
    /** 本地 HTML → shineai-html:// 预览地址（弹框 iframe 与内置浏览器共用） */
    htmlPreviewUrl: (path, context) => electron.ipcRenderer.invoke("file-manager:html-preview-url", context ? { path, context } : path),
    /** 读取文件内容：返回结构化结果，区分文本/二进制/超大文件/错误 */
    readFile: (path, context, includeImageData) => electron.ipcRenderer.invoke("file-manager:read-file", includeImageData ? { path, context, includeImageData } : context ? { path, context } : path),
    watchDir: (path, context) => electron.ipcRenderer.invoke("file-manager:watch-dir", context ? { path, context } : path),
    unwatchDir: (path, context) => electron.ipcRenderer.invoke("file-manager:unwatch-dir", context ? { path, context } : path),
    writeFile: (path, content, context) => electron.ipcRenderer.invoke("file-manager:write-file", { path, content, context }),
    onWatchChange: (callback) => {
      const handler = (_, event) => callback(event);
      electron.ipcRenderer.on("file-manager:watch-change", handler);
      return () => electron.ipcRenderer.removeListener("file-manager:watch-change", handler);
    },
    getSessionFiles: (sessionId) => electron.ipcRenderer.invoke("file-manager:get-session-files", sessionId),
    onSessionFilesUpdated: (callback) => {
      const handler = (_, data) => callback(data);
      electron.ipcRenderer.on("file-manager:session-files-updated", handler);
      return () => electron.ipcRenderer.removeListener("file-manager:session-files-updated", handler);
    },
    /** 递归列举项目目录下的所有文件，用于 @ 符号文件引用 */
    listProjectFiles: (dirPath, maxResults, context) => electron.ipcRenderer.invoke("file-manager:list-project-files", dirPath, maxResults, context),
    getDiff: (filePath, context) => electron.ipcRenderer.invoke("file-manager:get-file-diff", context ? { path: filePath, context } : filePath),
    /** 创建空文件 */
    createFile: (filePath, context) => electron.ipcRenderer.invoke("file-manager:create-file", context ? { path: filePath, context } : filePath),
    /** 创建文件夹 */
    createDir: (dirPath, context) => electron.ipcRenderer.invoke("file-manager:create-dir", context ? { path: dirPath, context } : dirPath),
    /** 重命名文件/目录 */
    rename: (oldPath, newPath, context) => electron.ipcRenderer.invoke("file-manager:rename", { oldPath, newPath, context }),
    /** 删除文件/目录 */
    delete: (targetPath, context) => electron.ipcRenderer.invoke("file-manager:delete", context ? { path: targetPath, context } : targetPath),
    /** 在系统文件管理器中显示 */
    showInFolder: (filePath, context) => electron.ipcRenderer.invoke("file-manager:show-in-folder", context ? { path: filePath, context } : filePath),
    /** 在系统外部终端打开目录；Windows 可指定 cmd/powershell */
    openInTerminal: (dirPath, context, shell) => electron.ipcRenderer.invoke("file-manager:open-in-terminal", {
      path: dirPath,
      context,
      shell: shell ?? "default"
    }),
    /** 在系统文件管理器中显示（showInFolder 别名） */
    openInExplorer: (dirPath, context) => electron.ipcRenderer.invoke("file-manager:show-in-folder", context ? { path: dirPath, context } : dirPath),
    /** 全局文件内容搜索：返回 { success, data?, error? } */
    searchInFiles: (options, context) => electron.ipcRenderer.invoke("file-manager:search-in-files", options, context),
    /** 全局文件内容替换：返回 { success, data?, error? } */
    replaceInFiles: (options, context) => electron.ipcRenderer.invoke("file-manager:replace-in-files", options, context)
  },
  // ==================== MCP API ====================
  mcp: {
    getAll: () => electron.ipcRenderer.invoke(IPC.MCP_GET_ALL),
    get: (id) => electron.ipcRenderer.invoke(IPC.MCP_GET, id),
    create: (server) => electron.ipcRenderer.invoke(IPC.MCP_CREATE, server),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.MCP_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.MCP_DELETE, id),
    toggle: (id, enabled) => electron.ipcRenderer.invoke(IPC.MCP_TOGGLE, id, enabled),
    testConnection: (id) => electron.ipcRenderer.invoke(IPC.MCP_TEST_CONNECTION, id),
    getForProvider: (providerId) => electron.ipcRenderer.invoke(IPC.MCP_GET_FOR_PROVIDER, providerId),
    // Stream A: MCP 一键安装
    install: (id) => electron.ipcRenderer.invoke(IPC.MCP_INSTALL, id),
    onInstallProgress: (cb) => {
      electron.ipcRenderer.on(IPC.MCP_INSTALL_PROGRESS, (_e, data) => cb(data));
    },
    listTools: (query) => electron.ipcRenderer.invoke(IPC.MCP_LIST_TOOLS, query)
  },
  // ==================== Shell 终端 PTY API ====================
  pty: {
    create: (opts) => electron.ipcRenderer.invoke(IPC.PTY_CREATE, opts),
    write: (ptyId, data) => electron.ipcRenderer.invoke(IPC.PTY_WRITE, ptyId, data),
    resize: (ptyId, cols, rows) => electron.ipcRenderer.invoke(IPC.PTY_RESIZE, ptyId, cols, rows),
    kill: (ptyId) => electron.ipcRenderer.invoke(IPC.PTY_KILL, ptyId),
    getOutput: (ptyId) => electron.ipcRenderer.invoke(IPC.PTY_GET_OUTPUT, ptyId),
    getShells: () => electron.ipcRenderer.invoke(IPC.PTY_GET_SHELLS),
    onOutput: (callback) => {
      const listener = (_event, ptyId, data) => callback(ptyId, data);
      electron.ipcRenderer.on(IPC.PTY_OUTPUT, listener);
      return () => electron.ipcRenderer.removeListener(IPC.PTY_OUTPUT, listener);
    },
    onExit: (callback) => {
      const listener = (_event, ptyId, code) => callback(ptyId, code);
      electron.ipcRenderer.on(IPC.PTY_EXIT, listener);
      return () => electron.ipcRenderer.removeListener(IPC.PTY_EXIT, listener);
    }
  },
  // ==================== Skill API ====================
  skill: {
    getAll: () => electron.ipcRenderer.invoke(IPC.SKILL_GET_ALL),
    get: (id) => electron.ipcRenderer.invoke(IPC.SKILL_GET, id),
    create: (skill) => electron.ipcRenderer.invoke(IPC.SKILL_CREATE, skill),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.SKILL_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.SKILL_DELETE, id),
    toggle: (id, enabled) => electron.ipcRenderer.invoke(IPC.SKILL_TOGGLE, id, enabled),
    createLearned: (payload) => electron.ipcRenderer.invoke(IPC.SKILL_CREATE_LEARNED, payload),
    getByCommand: (command) => electron.ipcRenderer.invoke(IPC.SKILL_GET_BY_COMMAND, command),
    execute: (command, userInput = "") => electron.ipcRenderer.invoke(IPC.SKILL_EXECUTE, command, userInput),
    listBuiltin: () => electron.ipcRenderer.invoke(IPC.SKILL_LIST_BUILTIN),
    reinstallBuiltin: (id) => electron.ipcRenderer.invoke(IPC.SKILL_REINSTALL_BUILTIN, id),
    /** 从本地文件导入 Skill（弹出文件选择对话框） */
    importLocal: () => electron.ipcRenderer.invoke(IPC.SKILL_IMPORT_LOCAL),
    /** 从本地目录批量导入 Skill（弹出目录选择对话框） */
    importLocalDir: () => electron.ipcRenderer.invoke(IPC.SKILL_IMPORT_LOCAL_DIR),
    /** 监听 MCP install_skill 安装新技能的通知，返回取消监听函数 */
    onInstalled: (callback) => {
      const listener = (_event, skill) => callback(skill);
      electron.ipcRenderer.on(IPC.SKILL_INSTALLED_NOTIFY, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SKILL_INSTALLED_NOTIFY, listener);
    },
    /** npm 技能安装预览（返回将执行的命令列表） */
    npmPreview: (opts) => electron.ipcRenderer.invoke(IPC.SKILL_NPM_PREVIEW, opts),
    /** npm 技能安装 */
    npmInstall: (opts) => electron.ipcRenderer.invoke(IPC.SKILL_NPM_INSTALL, opts),
    /** 监听 npm 安装实时日志，返回取消监听函数 */
    onNpmLog: (callback) => {
      const listener = (_event, line) => callback(line);
      electron.ipcRenderer.on(IPC.SKILL_NPM_LOG, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SKILL_NPM_LOG, listener);
    },
    /** 安装 Skill 包（GitHub URL / 本地路径） */
    installPackage: (source) => electron.ipcRenderer.invoke(IPC.SKILL_INSTALL_PACKAGE, source),
    /** 卸载 Skill 包 */
    uninstallPackage: (packageId) => electron.ipcRenderer.invoke(IPC.SKILL_UNINSTALL_PACKAGE, packageId)
  },
  // ==================== Deep Link API ====================
  deepLink: {
    handle: (url) => electron.ipcRenderer.invoke(IPC.DEEP_LINK_HANDLE, url)
  },
  // ==================== Quick Action API ====================
  quickAction: {
    getAll: () => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_GET_ALL),
    getByScope: (scope, scopeValue) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_GET_BY_SCOPE, scope, scopeValue),
    create: (data) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_CREATE, data),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_DELETE, id),
    reorder: (ids) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_REORDER, ids),
    execShell: (actionId, cwd) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_EXEC_SHELL, actionId, cwd),
    /** 向正在运行的 Shell 进程写入 stdin */
    shellStdin: (actionId, data) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_SHELL_STDIN, actionId, data),
    /** 缁堟姝ｅ湪杩愯鐨?Shell 进程 */
    shellKill: (actionId) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_SHELL_KILL, actionId),
    /** 终止正在运行的 Shell 进程 */
    onShellOutput: (callback) => {
      const listener = (_event, actionId, stream, data) => callback(actionId, stream, data);
      electron.ipcRenderer.on(IPC.QUICK_ACTION_SHELL_OUTPUT, listener);
      return () => electron.ipcRenderer.removeListener(IPC.QUICK_ACTION_SHELL_OUTPUT, listener);
    },
    /** 监听 Shell 进程退出 */
    onShellExit: (callback) => {
      const listener = (_event, actionId, exitCode) => callback(actionId, exitCode);
      electron.ipcRenderer.on(IPC.QUICK_ACTION_SHELL_EXIT, listener);
      return () => electron.ipcRenderer.removeListener(IPC.QUICK_ACTION_SHELL_EXIT, listener);
    },
    /** 通知主进程编辑器已就绪 */
    getBuiltinTemplates: () => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_GET_BUILTIN_TEMPLATES),
    /** 通知主进程编辑器已就绪 */
    execBuiltin: (builtinId, context) => electron.ipcRenderer.invoke(IPC.QUICK_ACTION_EXEC_BUILTIN, builtinId, context)
  },
  // ==================== Prompt Insert Template API ====================
  promptInsertTemplate: {
    getAll: () => electron.ipcRenderer.invoke(IPC.PROMPT_INSERT_TEMPLATE_GET_ALL),
    create: (data) => electron.ipcRenderer.invoke(IPC.PROMPT_INSERT_TEMPLATE_CREATE, data),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.PROMPT_INSERT_TEMPLATE_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.PROMPT_INSERT_TEMPLATE_DELETE, id)
  },
  // ==================== Custom System Prompt API ====================
  customPrompt: {
    get: (scope, scopeKey) => electron.ipcRenderer.invoke(IPC.CUSTOM_PROMPT_GET, scope, scopeKey),
    upsert: (data) => electron.ipcRenderer.invoke(IPC.CUSTOM_PROMPT_UPSERT, data),
    delete: (id) => electron.ipcRenderer.invoke(IPC.CUSTOM_PROMPT_DELETE, id),
    getEffective: (providerId, workDir) => electron.ipcRenderer.invoke(IPC.CUSTOM_PROMPT_GET_EFFECTIVE, providerId, workDir)
  },
  imagePromptLibrary: {
    search: (query, topK, lang, category) => electron.ipcRenderer.invoke(IPC.IMAGE_PROMPT_LIBRARY_SEARCH, query, topK, lang, category),
    list: (options) => electron.ipcRenderer.invoke(IPC.IMAGE_PROMPT_LIBRARY_LIST, options),
    getById: (id) => electron.ipcRenderer.invoke(IPC.IMAGE_PROMPT_LIBRARY_GET_BY_ID, id),
    getStats: () => electron.ipcRenderer.invoke(IPC.IMAGE_PROMPT_LIBRARY_GET_STATS),
    getMode: () => electron.ipcRenderer.invoke(IPC.IMAGE_PROMPT_LIBRARY_GET_MODE),
    setMode: (mode) => electron.ipcRenderer.invoke(IPC.IMAGE_PROMPT_LIBRARY_SET_MODE, mode)
  },
  // ==================== Registry API（在线市场）====================
  registry: {
    fetchMcps: () => electron.ipcRenderer.invoke(IPC.REGISTRY_FETCH_MCPS),
    fetchSkills: (forceRefresh) => electron.ipcRenderer.invoke(IPC.REGISTRY_FETCH_SKILLS, forceRefresh),
    forceRefresh: () => electron.ipcRenderer.invoke(IPC.REGISTRY_FORCE_REFRESH),
    importSkillFromUrl: (url) => electron.ipcRenderer.invoke(IPC.SKILL_IMPORT_URL, url),
    installFromRegistry: (item) => electron.ipcRenderer.invoke(IPC.SKILL_INSTALL_FROM_REGISTRY, item),
    /** 预览 URL 中的 Skill（不入库，仅解析返回结果） */
    previewSkillFromUrl: (url) => electron.ipcRenderer.invoke(IPC.SKILL_PREVIEW_URL, url),
    /** 获取市场 MCP 列表 */
    fetchMarketMcps: (opts) => electron.ipcRenderer.invoke(IPC.REGISTRY_FETCH_MARKET_MCPS, opts),
    /** 浠庡競鍦哄畨瑁?MCP */
    installMcp: (item, envVars) => electron.ipcRenderer.invoke(IPC.REGISTRY_INSTALL_MCP, item, envVars),
    /** 获取 skills.sh 仓库列表 */
    listSkillRepos: () => electron.ipcRenderer.invoke(REGISTRY_LIST_SKILL_REPOS),
    /** 从 skills.sh 排行榜获取热门技能 */
    fetchLeaderboard: (options) => electron.ipcRenderer.invoke(REGISTRY_FETCH_SKILLSSH_LEADERBOARD, { force: options?.force === true }),
    /** 浠?skills.sh 仓库获取 skill 列表 */
    fetchSkillsSh: (owner, repo) => electron.ipcRenderer.invoke(REGISTRY_FETCH_SKILLS_SH, owner, repo),
    /** 获取 skills.sh skill 详情 */
    getSkillDetail: (owner, repo, path) => electron.ipcRenderer.invoke(REGISTRY_GET_SKILL_DETAIL, owner, repo, path),
    /** 分类 skills.sh skill：返回详情 + 安装方法（prompt/npx/unknown） */
    classifySkillsSh: (source, skillId) => electron.ipcRenderer.invoke(REGISTRY_CLASSIFY_SKILLS_SH, source, skillId),
    /**
     * 从 skills.sh 安装 skill。
     * - 旧模式：(owner, repo, path)
     * - 新模式：(source, skillId, options?) — options.confirmedInstallCommand 用于 npx 路径前端二次确认
     */
    installSkillsSh: (ownerOrSource, repoOrSkillId, pathOrOptions) => electron.ipcRenderer.invoke(REGISTRY_INSTALL_SKILLS_SH, ownerOrSource, repoOrSkillId, pathOrOptions),
    /** 订阅 skills.sh npx 安装实时日志，返回取消订阅函数 */
    onSkillsShInstallProgress: (cb) => {
      const handler = (_e, data) => cb(data);
      electron.ipcRenderer.on("registry:skills-sh:install-progress", handler);
      return () => electron.ipcRenderer.removeListener("registry:skills-sh:install-progress", handler);
    }
  },
  // ==================== Team Assets API ====================
  teamAssets: {
    seed: () => electron.ipcRenderer.invoke(IPC.TEAM_ASSETS_SEED),
    rolePresets: {
      search: (options) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_SEARCH, options),
      list: (options) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_LIST, options),
      get: (id) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_GET, id),
      create: (input) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_CREATE, input),
      update: (id, updates) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_UPDATE, id, updates),
      clone: (id, overrides) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_CLONE, id, overrides),
      archive: (id) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_ARCHIVE, id),
      delete: (id) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_DELETE, id),
      listPrivateSessions: (rolePresetId) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_LIST_PRIVATE_SESSIONS, rolePresetId),
      listMemoryEntries: (rolePresetId) => electron.ipcRenderer.invoke(IPC.ROLE_PRESET_LIST_MEMORY_ENTRIES, rolePresetId)
    },
    // 专家商店：选择性安装上游（agency-agents）专家，落库为自定义 RolePreset
    expertStore: {
      install: (items) => electron.ipcRenderer.invoke(IPC.EXPERT_STORE_INSTALL, items)
    },
    teamTemplates: {
      search: (options) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_SEARCH, options),
      list: (options) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_LIST, options),
      get: (id) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_GET, id),
      create: (input) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_CREATE, input),
      update: (id, updates) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_UPDATE, id, updates),
      clone: (id, overrides) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_CLONE, id, overrides),
      archive: (id) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_ARCHIVE, id),
      setFavorite: (id, favorite) => electron.ipcRenderer.invoke(IPC.TEAM_TEMPLATE_SET_FAVORITE, id, favorite)
    }
  },
  // ==================== Experts / Assistants API ====================
  experts: {
    create: (input) => electron.ipcRenderer.invoke(IPC.EXPERT_CREATE, input),
    list: (options) => electron.ipcRenderer.invoke(IPC.EXPERT_LIST, options),
    get: (id) => electron.ipcRenderer.invoke(IPC.EXPERT_GET, id),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.EXPERT_UPDATE, id, updates),
    archive: (id) => electron.ipcRenderer.invoke(IPC.EXPERT_ARCHIVE, id),
    linkSession: (input) => electron.ipcRenderer.invoke(IPC.EXPERT_LINK_SESSION, input),
    listForSession: (sessionId, includeEnded) => electron.ipcRenderer.invoke(IPC.EXPERT_LIST_FOR_SESSION, sessionId, includeEnded),
    listSessionLinks: (options) => electron.ipcRenderer.invoke(IPC.EXPERT_LIST_FOR_SESSION, options || {}),
    recordInvitations: (sessionId, invitations, options) => electron.ipcRenderer.invoke(IPC.EXPERT_RECORD_INVITATIONS, sessionId, invitations, options),
    removeInvitation: (sessionId, rolePresetId) => electron.ipcRenderer.invoke(IPC.EXPERT_REMOVE_INVITATION, sessionId, rolePresetId),
    updateInvitationRuntime: (sessionId, rolePresetId, runtime) => electron.ipcRenderer.invoke(IPC.EXPERT_UPDATE_INVITATION_RUNTIME, sessionId, rolePresetId, runtime),
    findPrivateChat: (rolePresetId) => electron.ipcRenderer.invoke(IPC.EXPERT_FIND_PRIVATE_CHAT, rolePresetId),
    startPrivateChat: (rolePresetId) => electron.ipcRenderer.invoke(IPC.EXPERT_START_PRIVATE_CHAT, rolePresetId),
    permissionProfiles: {
      upsert: (input) => electron.ipcRenderer.invoke(IPC.EXPERT_PERMISSION_PROFILE_UPSERT, input),
      list: () => electron.ipcRenderer.invoke(IPC.EXPERT_PERMISSION_PROFILE_LIST),
      get: (id) => electron.ipcRenderer.invoke(IPC.EXPERT_PERMISSION_PROFILE_GET, id)
    },
    memory: {
      link: (input) => electron.ipcRenderer.invoke(IPC.EXPERT_MEMORY_LINK, input),
      listLinks: (options) => electron.ipcRenderer.invoke(IPC.EXPERT_MEMORY_LIST_LINKS, options),
      resolveScope: (input) => electron.ipcRenderer.invoke(IPC.EXPERT_MEMORY_RESOLVE_SCOPE, input)
    }
  },
  // ==================== Agent Teams API ====================
  team: {
    // 事件监听
    listDefinitions: () => electron.ipcRenderer.invoke("team:list-definitions"),
    createDefinition: (params) => electron.ipcRenderer.invoke("team:create-definition", params),
    deleteDefinition: (teamId) => electron.ipcRenderer.invoke("team:delete-definition", teamId),
    updateDefinition: (params) => electron.ipcRenderer.invoke("team:update-definition", params),
    // 事件监听
    listInstances: () => electron.ipcRenderer.invoke("team:list-instances"),
    start: (params) => electron.ipcRenderer.invoke("team:start", params),
    upgradeFromExperts: (params) => electron.ipcRenderer.invoke("team:upgrade-from-experts", params),
    stop: (instanceId) => electron.ipcRenderer.invoke("team:stop", instanceId),
    interrupt: (instanceId) => electron.ipcRenderer.invoke("team:interrupt", instanceId),
    resume: (instanceId) => electron.ipcRenderer.invoke("team:resume", instanceId),
    getInstance: (instanceId) => electron.ipcRenderer.invoke("team:get-instance", instanceId),
    deleteInstance: (instanceId) => electron.ipcRenderer.invoke("team:delete-instance", instanceId),
    // 事件监听
    getTasks: (instanceId) => electron.ipcRenderer.invoke("team:get-tasks", instanceId),
    getEvaluations: (instanceId, options) => electron.ipcRenderer.invoke(IPC.TEAM_GET_EVALUATIONS, instanceId, options),
    getEvaluation: (evaluationId) => electron.ipcRenderer.invoke(IPC.TEAM_GET_EVALUATION, evaluationId),
    getTaskEvaluations: (taskId) => electron.ipcRenderer.invoke(IPC.TEAM_GET_TASK_EVALUATIONS, taskId),
    getEvaluationSummary: (instanceId) => electron.ipcRenderer.invoke(IPC.TEAM_GET_EVALUATION_SUMMARY, instanceId),
    getProviderScoreProfiles: (taskType) => electron.ipcRenderer.invoke(IPC.TEAM_GET_PROVIDER_SCORE_PROFILES, taskType),
    createTask: (params) => electron.ipcRenderer.invoke("team:create-task", params),
    createAndAssignTask: (params) => electron.ipcRenderer.invoke("team:create-and-assign-task", params),
    claimTask: (params) => electron.ipcRenderer.invoke("team:claim-task", params),
    completeTask: (params) => electron.ipcRenderer.invoke("team:complete-task", params),
    // 事件监听
    getMessages: (instanceId, limit) => electron.ipcRenderer.invoke("team:get-messages", instanceId, limit),
    sendToRole: (params) => electron.ipcRenderer.invoke("team:send-to-role", params),
    broadcast: (params) => electron.ipcRenderer.invoke("team:broadcast", params),
    // 事件监听
    getStats: (instanceId) => electron.ipcRenderer.invoke("team:get-stats", instanceId),
    getQueueStatus: (instanceId) => electron.ipcRenderer.invoke("team:get-queue-status", instanceId),
    getReviewerPoolStatus: (instanceId) => electron.ipcRenderer.invoke("team:get-reviewer-pool-status", instanceId),
    reprioritize: (params) => electron.ipcRenderer.invoke("team:reprioritize", params),
    cancelQueueMessage: (params) => electron.ipcRenderer.invoke("team:cancel-queue-message", params),
    // 事件监听
    addNewGoal: (params) => electron.ipcRenderer.invoke("team:add-new-goal", params),
    finalizeByUser: (params) => electron.ipcRenderer.invoke("team:finalize-by-user", params),
    continueWithLeader: (params) => electron.ipcRenderer.invoke("team:continue-with-leader", params),
    getMemberSessions: (params) => electron.ipcRenderer.invoke("team:get-member-sessions", params),
    getGoalSummaries: (instanceId) => electron.ipcRenderer.invoke(IPC.TEAM_GET_GOAL_SUMMARIES, instanceId),
    getIdleStates: (instanceId) => electron.ipcRenderer.invoke(IPC.TEAM_GET_IDLE_STATES, instanceId),
    getMemberSnapshots: (instanceId) => electron.ipcRenderer.invoke(IPC.TEAM_GET_MEMBER_SNAPSHOTS, instanceId),
    getProductivitySnapshot: (params) => electron.ipcRenderer.invoke(IPC.TEAM_GET_PRODUCTIVITY_SNAPSHOT, params),
    // 成员级控制 + 健康状态（new team:member:* namespace）
    pauseMember: (params) => electron.ipcRenderer.invoke("team:member:pause", params),
    resumeMember: (params) => electron.ipcRenderer.invoke("team:member:resume", params),
    restartMember: (params) => electron.ipcRenderer.invoke("team:member:restart", params),
    replaceMember: (params) => electron.ipcRenderer.invoke("team:member:replace", params),
    removeMember: (params) => electron.ipcRenderer.invoke("team:member:remove", params),
    injectInstruction: (params) => electron.ipcRenderer.invoke("team:member:inject", params),
    injectMessage: (params) => electron.ipcRenderer.invoke("team:member:inject", params),
    stopMember: (params) => electron.ipcRenderer.invoke("team:member:remove", { ...params, graceful: false }),
    getMemberHealth: (params) => electron.ipcRenderer.invoke("team:member:health", params),
    // Integration Worktree 状态查询
    getIntegrationState: (teamId) => electron.ipcRenderer.invoke("team:getIntegrationState", teamId),
    // Sprint 3 ⑦ — Plan §9.5: Leader 一键 land integration → target branch
    landIntegration: (params) => electron.ipcRenderer.invoke("team-integration:land", params),
    // 冲突解决三条路径（Leader 专属）
    conflictReassign: (instanceId, taskId) => electron.ipcRenderer.invoke("team:conflict:reassign", { instanceId, taskId }),
    conflictResolve: (instanceId, taskId, resolvedDiff) => electron.ipcRenderer.invoke("team:conflict:resolve", { instanceId, taskId, resolvedDiff }),
    conflictSkip: (instanceId, taskId, reason) => electron.ipcRenderer.invoke("team:conflict:skip", { instanceId, taskId, reason }),
    forceMerge: (instanceId, taskId, operator, reason) => electron.ipcRenderer.invoke("team-integration:force-merge", { instanceId, taskId, operator, reason }),
    resetStuckTasks: (instanceId, thresholdMinutes) => electron.ipcRenderer.invoke("team:reset-stuck-tasks", { instanceId, thresholdMinutes }),
    // AI 生成（优化团队名称/描述/角色提示词）
    aiGenerate: (params) => electron.ipcRenderer.invoke("team:ai-generate", params),
    // AI 优化提示词
    aiGenerateTeam: (params) => electron.ipcRenderer.invoke("team:ai-generate-team", params),
    // 事件监听（主进程 → 渲染进程）
    onEvent: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on("team:event", listener);
      return () => electron.ipcRenderer.removeListener("team:event", listener);
    },
    // ---- 人工干预 API（W3 高层 dispatcher + W3 评审强制控制）----
    intervene: (params) => electron.ipcRenderer.invoke("team:intervene", params),
    interruptTeam: (instanceId) => electron.ipcRenderer.invoke("team:interrupt", instanceId),
    forceApproveTask: (params) => electron.ipcRenderer.invoke("team:evaluation:force-approve", params),
    forceRejectTask: (params) => electron.ipcRenderer.invoke("team:evaluation:force-reject", params),
    updateEvaluationThreshold: (params) => electron.ipcRenderer.invoke("team:evaluation:update-threshold", params),
    getInterventions: (instanceId, limit) => electron.ipcRenderer.invoke("team:intervene:list", { instanceId, limit }),
    // ---- 告警与 deeplink 事件（W4 推送）----
    onAlert: (callback) => {
      const seenKeys = /* @__PURE__ */ new Set();
      const emitOnce = (event) => {
        const key = getAlertDedupKey(event);
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        if (seenKeys.size > 100) {
          const oldestKey = seenKeys.values().next().value;
          if (oldestKey) seenKeys.delete(oldestKey);
        }
        callback(event);
      };
      const bareListener = (_event, data) => {
        const alert = normalizeAlertEvent(data);
        if (alert) emitOnce(alert);
      };
      const wrappedListener = (_event, data) => {
        const alert = normalizeAlertEvent(data);
        if (alert) emitOnce(alert);
      };
      electron.ipcRenderer.on("team:alert", bareListener);
      electron.ipcRenderer.on("team:event", wrappedListener);
      return () => {
        electron.ipcRenderer.removeListener("team:alert", bareListener);
        electron.ipcRenderer.removeListener("team:event", wrappedListener);
      };
    },
    onNavigateCockpit: (callback) => {
      const listener = (_event, payloadOrInstanceId, legacyPayload) => {
        const payload = normalizeNavigateCockpitPayload(payloadOrInstanceId) ?? normalizeNavigateCockpitPayload(legacyPayload);
        if (!payload) return;
        callback(payload.instanceId, payload);
      };
      electron.ipcRenderer.on("team:navigate-cockpit", listener);
      return () => electron.ipcRenderer.removeListener("team:navigate-cockpit", listener);
    }
  },
  // ==================== Autonomous Mission API ====================
  mission: {
    create: (params) => electron.ipcRenderer.invoke("mission:create", params),
    confirmBrainstorm: (missionId, brainstorm) => electron.ipcRenderer.invoke("mission:confirm-brainstorm", { missionId, brainstorm }),
    confirmTeam: (missionId, teamDesign) => electron.ipcRenderer.invoke("mission:confirm-team", { missionId, teamDesign }),
    confirmPhases: (missionId, plan) => electron.ipcRenderer.invoke("mission:confirm-phases", { missionId, plan }),
    start: (missionId) => electron.ipcRenderer.invoke("mission:start", missionId),
    updatePlan: (missionId, plan) => electron.ipcRenderer.invoke("mission:update-plan", { missionId, plan }),
    pause: (missionId) => electron.ipcRenderer.invoke("mission:pause", missionId),
    resume: (missionId) => electron.ipcRenderer.invoke("mission:resume", missionId),
    abort: (missionId) => electron.ipcRenderer.invoke("mission:abort", missionId),
    skipPhase: (missionId) => electron.ipcRenderer.invoke("mission:skip-phase", missionId),
    sendMessage: (missionId, message) => electron.ipcRenderer.invoke("mission:send-message", { missionId, message }),
    getStatus: (missionId) => electron.ipcRenderer.invoke("mission:get-status", missionId),
    list: () => electron.ipcRenderer.invoke("mission:list"),
    getRoleTemplates: () => electron.ipcRenderer.invoke("mission:get-role-templates"),
    getRoleTemplatesByCategory: (category) => electron.ipcRenderer.invoke("mission:get-role-templates-by-category", category),
    getTeamRecommendation: (missionId) => electron.ipcRenderer.invoke("mission:get-team-recommendation", missionId),
    getTeamPromotionPreview: (missionId, taskId) => electron.ipcRenderer.invoke("mission:get-team-promotion-preview", { missionId, taskId }),
    promoteTeamTemplate: (params) => electron.ipcRenderer.invoke("mission:promote-team-template", params),
    delete: (missionId) => electron.ipcRenderer.invoke("mission:delete", missionId),
    // v2 task-level APIs
    confirmTaskBreakdown: (missionId, breakdown) => electron.ipcRenderer.invoke("mission:confirm-task-breakdown", { missionId, breakdown }),
    getTasks: (missionId) => electron.ipcRenderer.invoke("mission:get-tasks", missionId),
    retryTask: (missionId, taskId) => electron.ipcRenderer.invoke("mission:retry-task", { missionId, taskId }),
    // 事件监听
    onEvent: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on("mission:event", listener);
      return () => electron.ipcRenderer.removeListener("mission:event", listener);
    }
  },
  // ==================== Feedback API ====================
  feedback: {
    create: (params) => electron.ipcRenderer.invoke(IPC.FEEDBACK_CREATE, params),
    list: (params) => electron.ipcRenderer.invoke(IPC.FEEDBACK_LIST, params),
    getDetail: (id) => electron.ipcRenderer.invoke(IPC.FEEDBACK_DETAIL, id),
    addComment: (feedbackId, content) => electron.ipcRenderer.invoke(IPC.FEEDBACK_ADD_COMMENT, feedbackId, content),
    uploadImage: (imagePath, feedbackId) => electron.ipcRenderer.invoke(IPC.FEEDBACK_UPLOAD_IMAGE, imagePath, feedbackId)
  },
  // ==================== Scheduler API ====================
  scheduler: {
    getAccess: () => electron.ipcRenderer.invoke(IPC.SCHEDULER_GET_ACCESS),
    listTasks: () => electron.ipcRenderer.invoke(IPC.SCHEDULER_LIST_TASKS),
    getTask: (taskId) => electron.ipcRenderer.invoke(IPC.SCHEDULER_GET_TASK, taskId),
    createTask: (input) => electron.ipcRenderer.invoke(IPC.SCHEDULER_CREATE_TASK, input),
    updateTask: (taskId, updates) => electron.ipcRenderer.invoke(IPC.SCHEDULER_UPDATE_TASK, taskId, updates),
    deleteTask: (taskId) => electron.ipcRenderer.invoke(IPC.SCHEDULER_DELETE_TASK, taskId),
    toggleTask: (taskId, enabled) => electron.ipcRenderer.invoke(IPC.SCHEDULER_TOGGLE_TASK, taskId, enabled),
    triggerNow: (taskId) => electron.ipcRenderer.invoke(IPC.SCHEDULER_TRIGGER_NOW, taskId),
    getHistory: (taskId, limit) => electron.ipcRenderer.invoke(IPC.SCHEDULER_GET_HISTORY, taskId, limit),
    getRuntime: () => electron.ipcRenderer.invoke(IPC.SCHEDULER_GET_RUNTIME),
    cancelRun: (params) => electron.ipcRenderer.invoke(IPC.SCHEDULER_CANCEL_RUN, params),
    aiChat: (input) => electron.ipcRenderer.invoke("scheduler:ai-chat", input),
    onTaskUpdated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_UPDATED, listener);
    },
    onTaskStarted: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_STARTED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_STARTED, listener);
    },
    onTaskCompleted: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_COMPLETED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_COMPLETED, listener);
    },
    onTaskFailed: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_FAILED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_FAILED, listener);
    },
    result: {
      onStarted: (callback) => {
        const listener = (_event, payload) => callback(payload);
        electron.ipcRenderer.on(IPC.SCHEDULER_TASK_STARTED, listener);
        return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_STARTED, listener);
      },
      onCompleted: (callback) => {
        const listener = (_event, payload) => callback(payload);
        electron.ipcRenderer.on(IPC.SCHEDULER_TASK_COMPLETED, listener);
        return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_COMPLETED, listener);
      },
      onFailed: (callback) => {
        const listener = (_event, payload) => callback(payload);
        electron.ipcRenderer.on(IPC.SCHEDULER_TASK_FAILED, listener);
        return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_FAILED, listener);
      }
    },
    onRunStarted: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SCHEDULER_RUN_STARTED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_RUN_STARTED, listener);
    },
    onRunFinished: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SCHEDULER_RUN_FINISHED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_RUN_FINISHED, listener);
    },
    onRuntimeUpdated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.SCHEDULER_RUNTIME_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SCHEDULER_RUNTIME_UPDATED, listener);
    },
    onEvent: (callback) => {
      const taskUpdatedListener = (_event, payload) => callback({ type: "task-updated", payload });
      const taskStartedListener = (_event, payload) => callback({ type: "task-started", payload });
      const taskCompletedListener = (_event, payload) => callback({ type: "task-completed", payload });
      const taskFailedListener = (_event, payload) => callback({ type: "task-failed", payload });
      const runtimeUpdatedListener = (_event, payload) => callback({ type: "runtime-updated", payload });
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_UPDATED, taskUpdatedListener);
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_STARTED, taskStartedListener);
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_COMPLETED, taskCompletedListener);
      electron.ipcRenderer.on(IPC.SCHEDULER_TASK_FAILED, taskFailedListener);
      electron.ipcRenderer.on(IPC.SCHEDULER_RUNTIME_UPDATED, runtimeUpdatedListener);
      return () => {
        electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_UPDATED, taskUpdatedListener);
        electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_STARTED, taskStartedListener);
        electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_COMPLETED, taskCompletedListener);
        electron.ipcRenderer.removeListener(IPC.SCHEDULER_TASK_FAILED, taskFailedListener);
        electron.ipcRenderer.removeListener(IPC.SCHEDULER_RUNTIME_UPDATED, runtimeUpdatedListener);
      };
    }
  },
  // ==================== Hooks API ====================
  hooks: {
    getAccess: () => electron.ipcRenderer.invoke(IPC.HOOK_GET_ACCESS),
    list: () => electron.ipcRenderer.invoke(IPC.HOOK_LIST),
    get: (hookId) => electron.ipcRenderer.invoke(IPC.HOOK_GET, hookId),
    create: (input) => electron.ipcRenderer.invoke(IPC.HOOK_CREATE, input),
    update: (hookId, updates) => electron.ipcRenderer.invoke(IPC.HOOK_UPDATE, hookId, updates),
    delete: (hookId) => electron.ipcRenderer.invoke(IPC.HOOK_DELETE, hookId),
    toggle: (hookId, enabled) => electron.ipcRenderer.invoke(IPC.HOOK_TOGGLE, hookId, enabled),
    test: (hookId, payload, event) => electron.ipcRenderer.invoke(IPC.HOOK_TEST, hookId, payload, event),
    getHistory: (hookId, limit) => electron.ipcRenderer.invoke(IPC.HOOK_GET_HISTORY, hookId, limit),
    getExecutions: (hookId, limit) => electron.ipcRenderer.invoke(IPC.HOOK_EXECUTIONS, hookId, limit),
    clearExecutions: (hookId) => electron.ipcRenderer.invoke(IPC.HOOK_CLEAR_EXECUTIONS, hookId),
    onTriggered: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.HOOK_TRIGGERED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.HOOK_TRIGGERED, listener);
    },
    onExecutionCompleted: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.HOOK_EXECUTION_COMPLETED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.HOOK_EXECUTION_COMPLETED, listener);
    },
    onExecutionFailed: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.HOOK_EXECUTION_FAILED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.HOOK_EXECUTION_FAILED, listener);
    }
  },
  // ==================== Auth API ====================
  // ==================== Obsidian 导出 API ====================
  obsidian: {
    exportSession: (sessionId) => electron.ipcRenderer.invoke(IPC.OBSIDIAN_EXPORT_SESSION, sessionId),
    /** 导出会话记忆（决策/关键事实/进度）为 Obsidian Markdown；vaultPath 可选，未传则用默认 Vault */
    exportMemories: (sessionId, vaultPath) => electron.ipcRenderer.invoke(IPC.OBSIDIAN_EXPORT_MEMORIES, sessionId, vaultPath),
    batchExport: (sessionIds) => electron.ipcRenderer.invoke(IPC.OBSIDIAN_BATCH_EXPORT, sessionIds),
    /** 选择 Vault 目录；{ persist: false } 时只返回目录、不写设置（只读） */
    selectVault: (options) => electron.ipcRenderer.invoke(IPC.OBSIDIAN_SELECT_VAULT, options)
  },
  // ==================== Chat API（在线聊天） ====================
  chat: {
    /** 连接聊天 WebSocket 服务 */
    connect: () => electron.ipcRenderer.invoke(IPC.CHAT_CONNECT),
    /** 通知主进程编辑器已就绪 */
    disconnect: () => electron.ipcRenderer.invoke(IPC.CHAT_DISCONNECT),
    /** 获取聊天室列表 */
    getRooms: () => electron.ipcRenderer.invoke(IPC.CHAT_GET_ROOMS),
    /** 加入聊天室 */
    joinRoom: (roomId) => electron.ipcRenderer.invoke(IPC.CHAT_JOIN_ROOM, roomId),
    /** 离开聊天室 */
    leaveRoom: (roomId) => electron.ipcRenderer.invoke(IPC.CHAT_LEAVE_ROOM, roomId),
    /** 发送消息 */
    sendMessage: (params) => electron.ipcRenderer.invoke(IPC.CHAT_SEND_MESSAGE, params),
    /** 通知主进程编辑器已就绪 */
    getMessages: (params) => electron.ipcRenderer.invoke(IPC.CHAT_GET_MESSAGES, params),
    /** 通知主进程编辑器已就绪 */
    uploadImage: (roomId) => electron.ipcRenderer.invoke(IPC.CHAT_UPLOAD_IMAGE, roomId),
    /** 通知主进程编辑器已就绪 */
    setNickname: (nickname) => electron.ipcRenderer.invoke(IPC.CHAT_SET_NICKNAME, nickname),
    /** 获取聊天室成员列表 */
    getMembers: (roomId) => electron.ipcRenderer.invoke(IPC.CHAT_GET_MEMBERS, roomId),
    /** 创建聊天室 */
    createRoom: (params) => electron.ipcRenderer.invoke(IPC.CHAT_CREATE_ROOM, params),
    /** 通知主进程编辑器已就绪 */
    sendTyping: (roomId, isTyping) => electron.ipcRenderer.send(IPC.CHAT_TYPING, roomId, isTyping),
    /** AI 消息（AI 会话发送消息到聊天室） */
    sendAIMessage: (params) => electron.ipcRenderer.invoke(IPC.CHAT_AI_MESSAGE, params),
    // 事件监听（主进程 → 渲染进程）
    /** 监听新消息推送 */
    onNewMessage: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on(IPC.CHAT_NEW_MESSAGE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.CHAT_NEW_MESSAGE, listener);
    },
    /** 监听成员状态变更（上线/下线/加入/离开） */
    onMemberStatus: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on(IPC.CHAT_MEMBER_STATUS, listener);
      return () => electron.ipcRenderer.removeListener(IPC.CHAT_MEMBER_STATUS, listener);
    },
    /** 监听输入状态变更 */
    onTyping: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on(IPC.CHAT_TYPING, listener);
      return () => electron.ipcRenderer.removeListener(IPC.CHAT_TYPING, listener);
    }
  },
  auth: {
    getUser: () => electron.ipcRenderer.invoke(IPC.AUTH_GET_USER),
    refreshUser: () => electron.ipcRenderer.invoke(IPC.AUTH_REFRESH_USER),
    register: (email, password, inviteCode) => electron.ipcRenderer.invoke(IPC.AUTH_REGISTER, email, password, inviteCode),
    verifyCode: (email, code) => electron.ipcRenderer.invoke(IPC.AUTH_VERIFY_CODE, email, code),
    loginWithEmail: (email, password) => electron.ipcRenderer.invoke(IPC.AUTH_LOGIN_EMAIL, email, password),
    loginWithOAuth: (provider) => electron.ipcRenderer.invoke(IPC.AUTH_LOGIN_OAUTH, provider),
    logout: () => electron.ipcRenderer.invoke(IPC.AUTH_LOGOUT),
    getPlan: () => electron.ipcRenderer.invoke(IPC.AUTH_GET_PLAN),
    resendCode: (email) => electron.ipcRenderer.invoke(IPC.AUTH_RESEND_CODE, email),
    forgotPassword: (email) => electron.ipcRenderer.invoke(IPC.AUTH_FORGOT_PASSWORD, email),
    resetPassword: (email, code, password) => electron.ipcRenderer.invoke(IPC.AUTH_RESET_PASSWORD, email, code, password),
    changePassword: (currentPassword, newPassword) => electron.ipcRenderer.invoke(IPC.AUTH_CHANGE_PASSWORD, currentPassword, newPassword),
    upgradePlan: (targetPlan) => electron.ipcRenderer.invoke(IPC.AUTH_UPGRADE_PLAN, targetPlan),
    getPromotionStatus: () => electron.ipcRenderer.invoke(IPC.AUTH_GET_PROMOTION_STATUS),
    onStateChanged: (callback) => {
      const listener = (_event, data) => callback(data);
      electron.ipcRenderer.on(IPC.AUTH_STATE_CHANGED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.AUTH_STATE_CHANGED, listener);
    },
    getTelemetryEnabled: () => electron.ipcRenderer.invoke(IPC.AUTH_GET_TELEMETRY_ENABLED),
    setTelemetryEnabled: (enabled) => electron.ipcRenderer.invoke(IPC.AUTH_SET_TELEMETRY_ENABLED, enabled),
    // 签到 / 余额 / 内置 Provider
    checkin: () => electron.ipcRenderer.invoke(IPC.CHECKIN_DO),
    getCheckinStatus: () => electron.ipcRenderer.invoke(IPC.CHECKIN_GET_STATUS),
    reportUsageTime: () => electron.ipcRenderer.invoke(IPC.CHECKIN_REPORT_USAGE),
    getBalance: () => electron.ipcRenderer.invoke(IPC.BALANCE_GET),
    getBuiltinProviderConfig: () => electron.ipcRenderer.invoke(IPC.BUILTIN_PROVIDER_GET_CONFIG),
    // 保存密码凭证
    getSavedCredentials: () => electron.ipcRenderer.invoke(IPC.AUTH_GET_SAVED_CREDENTIALS),
    saveCredentials: (email, password) => electron.ipcRenderer.invoke(IPC.AUTH_SAVE_CREDENTIALS, email, password),
    clearSavedPassword: () => electron.ipcRenderer.invoke(IPC.AUTH_CLEAR_SAVED_PASSWORD)
  },
  // ==================== Prototype Project API（原型设计项目）====================
  prototypeProject: {
    getAll: () => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_GET_ALL),
    get: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_GET, projectId),
    create: (name, description, workingDirectory) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_CREATE, name, description, workingDirectory),
    update: (projectId, updates) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_UPDATE, projectId, updates),
    delete: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_DELETE, projectId),
    linkSession: (projectId, sessionId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_LINK_SESSION, projectId, sessionId),
    getBySession: (sessionId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_GET_BY_SESSION, sessionId),
    getSessionsByProject: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_PROJECT_GET_SESSIONS, projectId),
    setPrimarySession: (projectId, sessionId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_SET_PRIMARY_SESSION, projectId, sessionId),
    getProjectDetail: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GET_PROJECT_DETAIL, projectId),
    addIteration: (projectId, iteration) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_ADD_ITERATION, projectId, iteration),
    getIterations: (projectId, limit) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GET_ITERATIONS, projectId, limit),
    updateContextSummary: (projectId, summary) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_UPDATE_CONTEXT_SUMMARY, projectId, summary),
    incrementIterationCount: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_INCREMENT_ITERATION_COUNT, projectId),
    touchLastActiveAt: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_TOUCH_LAST_ACTIVE_AT, projectId)
  },
  // ==================== Design Page API（原型设计页面）====================
  designPage: {
    getAll: (projectId) => electron.ipcRenderer.invoke(IPC.DESIGN_PAGE_GET_ALL, projectId),
    create: (projectId, name, htmlCode, sourceMessageId, sourceSessionId, codeType, options) => electron.ipcRenderer.invoke(
      IPC.DESIGN_PAGE_CREATE,
      projectId,
      name,
      htmlCode,
      sourceMessageId,
      sourceSessionId,
      codeType,
      options
    ),
    update: (pageId, updates, projectId) => electron.ipcRenderer.invoke(IPC.DESIGN_PAGE_UPDATE, pageId, updates, projectId),
    delete: (pageId, projectId) => electron.ipcRenderer.invoke(IPC.DESIGN_PAGE_DELETE, pageId, projectId),
    reorder: (projectId, pageIds) => electron.ipcRenderer.invoke(IPC.DESIGN_PAGE_REORDER, projectId, pageIds),
    /** 补生成画布真缩略图；返回 thumbnail 绝对路径或 null */
    ensureThumbnail: (pageId) => electron.ipcRenderer.invoke(IPC.DESIGN_PAGE_ENSURE_THUMBNAIL, pageId),
    onSync: (callback) => {
      const listener = (_event, projectId, pages) => callback(projectId, pages);
      electron.ipcRenderer.on(IPC.PROTOTYPE_SYNC_PAGES, listener);
      return () => electron.ipcRenderer.removeListener(IPC.PROTOTYPE_SYNC_PAGES, listener);
    }
  },
  // ==================== Prototype Group API（原型组，v125 起）====================
  prototypeGroup: {
    list: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GROUP_LIST, projectId),
    get: (groupId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GROUP_GET, groupId),
    create: (input) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GROUP_CREATE, input),
    update: (groupId, updates) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GROUP_UPDATE, groupId, updates),
    delete: (groupId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GROUP_DELETE, groupId),
    reorder: (projectId, groupIds) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_GROUP_REORDER, projectId, groupIds)
  },
  // ==================== Prototype Session Link API（增强会话关联，v125 起）====================
  prototypeLink: {
    list: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_LINK_LIST, projectId),
    upsert: (input) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_LINK_UPSERT, input),
    delete: (linkId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_LINK_DELETE, linkId),
    touch: (linkId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_LINK_TOUCH, linkId)
  },
  // ==================== Design Snapshot API（原型快照）====================
  designSnapshot: {
    create: (input) => electron.ipcRenderer.invoke(IPC.DESIGN_SNAPSHOT_CREATE, input),
    list: (pageId, options) => electron.ipcRenderer.invoke(IPC.DESIGN_SNAPSHOT_LIST, pageId, options),
    revert: (snapshotId) => electron.ipcRenderer.invoke(IPC.DESIGN_SNAPSHOT_REVERT, snapshotId),
    diff: (fromSnapshotId, toSnapshotId) => electron.ipcRenderer.invoke(IPC.DESIGN_SNAPSHOT_DIFF, fromSnapshotId, toSnapshotId)
  },
  // ==================== Design Comment API（原型评论）====================
  designComment: {
    create: (input) => electron.ipcRenderer.invoke(IPC.DESIGN_COMMENT_CREATE, input),
    list: (snapshotId, status) => electron.ipcRenderer.invoke(IPC.DESIGN_COMMENT_LIST, snapshotId, status),
    update: (commentId, updates) => electron.ipcRenderer.invoke(IPC.DESIGN_COMMENT_UPDATE, commentId, updates),
    delete: (commentId) => electron.ipcRenderer.invoke(IPC.DESIGN_COMMENT_DELETE, commentId),
    apply: (commentId, resolutionNote, actor) => electron.ipcRenderer.invoke(IPC.DESIGN_COMMENT_APPLY, commentId, resolutionNote, actor),
    dismiss: (commentId, resolutionNote, actor) => electron.ipcRenderer.invoke(IPC.DESIGN_COMMENT_DISMISS, commentId, resolutionNote, actor)
  },
  // ==================== Prototype Route API（原型页面跳转关系）====================
  prototypeRoute: {
    getAll: (projectId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_ROUTE_GET_ALL, projectId),
    create: (route) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_ROUTE_CREATE, route),
    update: (id, updates) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_ROUTE_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_ROUTE_DELETE, id)
  },
  // ==================== Prototype API（原型预览窗口）====================
  prototype: {
    openWindow: (projectId, pageId, sessionId) => electron.ipcRenderer.invoke(IPC.PROTOTYPE_OPEN_WINDOW, projectId, pageId, sessionId),
    onSwitchPage: (callback) => {
      const listener = (_event, pageId) => callback(pageId);
      electron.ipcRenderer.on("prototype:switch-page", listener);
      return () => electron.ipcRenderer.removeListener("prototype:switch-page", listener);
    },
    onWindowClosed: (callback) => {
      const listener = (_event, projectId) => callback(projectId);
      electron.ipcRenderer.on(IPC.PROTOTYPE_WINDOW_CLOSED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.PROTOTYPE_WINDOW_CLOSED, listener);
    }
  },
  // ==================== Mission Control 独立窗口 ====================
  missionControl: {
    openWindow: (instanceId) => electron.ipcRenderer.invoke(IPC.MISSION_CONTROL_OPEN_WINDOW, instanceId),
    closeWindow: (instanceId) => electron.ipcRenderer.invoke(IPC.MISSION_CONTROL_CLOSE_WINDOW, instanceId),
    onWindowClosed: (callback) => {
      const listener = (_event, instanceId) => callback(instanceId);
      electron.ipcRenderer.on(IPC.MISSION_CONTROL_WINDOW_CLOSED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.MISSION_CONTROL_WINDOW_CLOSED, listener);
    }
  },
  // ==================== 表面独立窗口 ====================
  surfaceWindow: {
    openWindow: (kind, boundSessionId, title, instanceId) => electron.ipcRenderer.invoke(IPC.SURFACE_WINDOW_OPEN, kind, boundSessionId, title, instanceId),
    listOpenWindows: () => electron.ipcRenderer.invoke(IPC.SURFACE_WINDOW_LIST),
    onWindowsChanged: (callback) => {
      const listener = (_event, keys) => callback(keys);
      electron.ipcRenderer.on(IPC.SURFACE_WINDOW_CHANGED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SURFACE_WINDOW_CHANGED, listener);
    },
    onParamsChanged: (callback) => {
      const listener = (_event, params) => callback(params);
      electron.ipcRenderer.on(IPC.SURFACE_WINDOW_PARAMS, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SURFACE_WINDOW_PARAMS, listener);
    }
  },
  // ==================== 工作区独立窗口 ====================
  workspaceWindow: {
    openWindow: (workspace) => electron.ipcRenderer.invoke(IPC.WORKSPACE_OPEN_WINDOW, workspace),
    listOpenWorkspaces: () => electron.ipcRenderer.invoke(IPC.WORKSPACE_LIST_OPEN_WINDOWS),
    onWindowClosed: (callback) => {
      const listener = (_event, workspace) => callback(workspace);
      electron.ipcRenderer.on(IPC.WORKSPACE_WINDOW_CLOSED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.WORKSPACE_WINDOW_CLOSED, listener);
    }
  },
  // ==================== 会话独立聊天窗口 ====================
  sessionChatWindow: {
    openWindow: (sessionId, title) => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_OPEN_WINDOW, sessionId, title),
    closeWindow: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_CLOSE_WINDOW, sessionId),
    minimizeWindow: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_MINIMIZE_WINDOW, sessionId),
    maximizeWindow: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_MAXIMIZE_WINDOW, sessionId),
    setAlwaysOnTop: (value, sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_SET_ALWAYS_ON_TOP, value, sessionId),
    getAlwaysOnTop: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_GET_ALWAYS_ON_TOP, sessionId),
    isMaximized: (sessionId) => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_IS_MAXIMIZED, sessionId),
    listOpenWindows: () => electron.ipcRenderer.invoke(IPC.SESSION_CHAT_LIST_OPEN_WINDOWS),
    onWindowClosed: (callback) => {
      const listener = (_event, sessionId) => callback(sessionId);
      electron.ipcRenderer.on(IPC.SESSION_CHAT_WINDOW_CLOSED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_CHAT_WINDOW_CLOSED, listener);
    },
    onMaximizedChanged: (callback) => {
      const listener = (_event, maximized) => callback(!!maximized);
      electron.ipcRenderer.on(IPC.SESSION_CHAT_MAXIMIZED_CHANGED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.SESSION_CHAT_MAXIMIZED_CHANGED, listener);
    }
  },
  // ==================== Office API（办公室全屏窗口）====================
  office: {
    openWindow: (instanceId) => electron.ipcRenderer.invoke(IPC.OFFICE_OPEN_WINDOW, instanceId),
    closeWindow: () => electron.ipcRenderer.invoke(IPC.OFFICE_CLOSE_WINDOW),
    toggleFullscreen: () => electron.ipcRenderer.invoke(IPC.OFFICE_TOGGLE_FULLSCREEN),
    minimizeWindow: () => electron.ipcRenderer.invoke(IPC.OFFICE_MINIMIZE_WINDOW),
    maximizeWindow: () => electron.ipcRenderer.invoke(IPC.OFFICE_MAXIMIZE_WINDOW),
    syncInstance: (instanceId) => electron.ipcRenderer.invoke(IPC.OFFICE_SYNC_INSTANCE, instanceId),
    onWindowClosed: (callback) => {
      electron.ipcRenderer.on(IPC.OFFICE_WINDOW_CLOSED, () => callback());
    }
  },
  // ==================== ScreenShare API（投屏独立窗口）====================
  screenshare: {
    openWindow: () => electron.ipcRenderer.invoke(IPC.SCREENSHARE_OPEN_WINDOW),
    closeWindow: () => electron.ipcRenderer.invoke(IPC.SCREENSHARE_CLOSE_WINDOW),
    toggleFullscreen: () => electron.ipcRenderer.invoke(IPC.SCREENSHARE_TOGGLE_FULLSCREEN),
    minimizeWindow: () => electron.ipcRenderer.invoke(IPC.SCREENSHARE_MINIMIZE_WINDOW),
    maximizeWindow: () => electron.ipcRenderer.invoke(IPC.SCREENSHARE_MAXIMIZE_WINDOW),
    onWindowClosed: (callback) => {
      electron.ipcRenderer.on(IPC.SCREENSHARE_WINDOW_CLOSED, () => callback());
    }
  },
  // ==================== Butler API（AI 管家） ====================
  butler: {
    start: () => electron.ipcRenderer.invoke(IPC.BUTLER_START),
    stop: () => electron.ipcRenderer.invoke(IPC.BUTLER_STOP),
    getStatus: () => electron.ipcRenderer.invoke(IPC.BUTLER_GET_STATUS),
    getConfig: () => electron.ipcRenderer.invoke(IPC.BUTLER_GET_CONFIG),
    updateConfig: (config) => electron.ipcRenderer.invoke(IPC.BUTLER_UPDATE_CONFIG, config),
    getOverview: () => electron.ipcRenderer.invoke(IPC.BUTLER_GET_OVERVIEW),
    getDecisions: () => electron.ipcRenderer.invoke(IPC.BUTLER_GET_DECISIONS),
    getDecisionHistory: (params = {}) => electron.ipcRenderer.invoke(IPC.BUTLER_GET_DECISION_HISTORY, params),
    getDecisionDetail: (id) => electron.ipcRenderer.invoke(IPC.BUTLER_GET_DECISION_DETAIL, id),
    respond: (detectionId, response) => electron.ipcRenderer.invoke(IPC.BUTLER_RESPOND, detectionId, response),
    respondToIntervention: (id, response) => electron.ipcRenderer.invoke(IPC.BUTLER_RESPOND, id, response),
    // 事件监听（主进程 → 渲染进程）
    onDetection: (callback) => {
      const listener = (_event, detection) => callback(detection);
      electron.ipcRenderer.on(IPC.BUTLER_DETECTION, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_DETECTION, listener);
    },
    onDecision: (callback) => {
      const listener = (_event, decision) => callback(decision);
      electron.ipcRenderer.on(IPC.BUTLER_DECISION, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_DECISION, listener);
    },
    onAutoAction: (callback) => {
      const listener = (_event, action) => callback(action);
      electron.ipcRenderer.on(IPC.BUTLER_AUTO_ACTION, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_AUTO_ACTION, listener);
    },
    onStatusChange: (callback) => {
      const listener = (_event, status) => callback(status);
      electron.ipcRenderer.on(IPC.BUTLER_STATUS_CHANGE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_STATUS_CHANGE, listener);
    },
    // ==================== Butler 2.0 新增 API ====================
    getPersona: () => electron.ipcRenderer.invoke(IPC.BUTLER_GET_PERSONA),
    setPersona: (persona) => electron.ipcRenderer.invoke(IPC.BUTLER_SET_PERSONA, persona),
    getContext: (sessionId) => electron.ipcRenderer.invoke(IPC.BUTLER_GET_CONTEXT, sessionId),
    getInterventions: () => electron.ipcRenderer.invoke(IPC.BUTLER_GET_INTERVENTIONS),
    executeQuickAction: (type, payload) => electron.ipcRenderer.invoke(IPC.BUTLER_QUICK_ACTION, type, payload),
    resolveIntervention: (id) => electron.ipcRenderer.invoke(IPC.BUTLER_RESOLVE, id),
    clearAllInterventions: () => electron.ipcRenderer.invoke(IPC.BUTLER_CLEAR_ALL),
    muteToastType: (candidate) => electron.ipcRenderer.invoke(IPC.BUTLER_TOAST_MUTE, candidate),
    getToastMutes: () => electron.ipcRenderer.invoke(IPC.BUTLER_TOAST_MUTES_LIST),
    clearToastMutes: () => electron.ipcRenderer.invoke(IPC.BUTLER_TOAST_MUTES_CLEAR),
    listMemories: (params) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_LIST, params),
    searchMemoriesSemantic: (query, topK, projectPath) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_SEARCH_SEMANTIC, { query, topK, projectPath }),
    deleteMemory: (memoryId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_DELETE, memoryId),
    archiveMemory: (memoryId, archived) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_ARCHIVE, memoryId, archived),
    restoreMemory: (memoryId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_RESTORE, memoryId),
    getMemoryRelations: (memoryId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_GET_RELATIONS, memoryId),
    getMemoryStats: () => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_GET_STATS),
    getMemoryProjects: () => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_GET_PROJECTS),
    compressMemory: (memoryId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_COMPRESS, memoryId),
    resetMemoryDecay: (memoryId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_RESET_DECAY, memoryId),
    confirmMemory: (memoryId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_CONFIRM, memoryId),
    getMemoryInjectionStatus: (sessionId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_INJECTION_STATUS, sessionId),
    disableSessionInjectedMemory: (sessionId, memoryId) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_DISABLE_SESSION_INJECTION, sessionId, memoryId),
    testMemoryEmbedding: (settings) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_EMBEDDING_TEST, settings),
    getMemoryEmbeddingStatus: () => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_EMBEDDING_STATUS),
    reindexMemoryEmbedding: (force) => electron.ipcRenderer.invoke(IPC.BUTLER_MEMORY_EMBEDDING_REINDEX, force),
    onIntervention: (callback) => {
      const listener = (_event, intervention) => callback(intervention);
      electron.ipcRenderer.on(IPC.BUTLER_INTERVENTION, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_INTERVENTION, listener);
    },
    onL3Fallback: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.BUTLER_L3_FALLBACK, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_L3_FALLBACK, listener);
    },
    onMoodChange: (callback) => {
      const listener = (_event, mood) => callback(mood);
      electron.ipcRenderer.on("butler:mood-change", listener);
      return () => electron.ipcRenderer.removeListener("butler:mood-change", listener);
    },
    onQuickActionsUpdate: (callback) => {
      const listener = (_event, actions) => callback(actions);
      electron.ipcRenderer.on("butler:quick-actions-update", listener);
      return () => electron.ipcRenderer.removeListener("butler:quick-actions-update", listener);
    },
    onConfigChanged: (callback) => {
      const listener = (_event, patch) => callback(patch);
      electron.ipcRenderer.on("butler:config-changed", listener);
      return () => electron.ipcRenderer.removeListener("butler:config-changed", listener);
    },
    onMemoryStored: (callback) => {
      const listener = (_event, memory) => callback(memory);
      electron.ipcRenderer.on("butler:memory-stored", listener);
      return () => electron.ipcRenderer.removeListener("butler:memory-stored", listener);
    },
    // 事件监听
    setAlwaysOnTop: (value) => electron.ipcRenderer.invoke(IPC.APP_SET_ALWAYS_ON_TOP, value),
    getAlwaysOnTop: () => electron.ipcRenderer.invoke(IPC.APP_GET_ALWAYS_ON_TOP),
    // 事件监听
    openFloatWindow: () => electron.ipcRenderer.invoke(IPC.BUTLER_FLOAT_OPEN),
    closeFloatWindow: () => electron.ipcRenderer.invoke(IPC.BUTLER_FLOAT_CLOSE),
    isFloatWindowOpen: () => electron.ipcRenderer.invoke(IPC.BUTLER_FLOAT_IS_OPEN),
    moveFloatWindow: (x, y, options) => electron.ipcRenderer.invoke(IPC.BUTLER_FLOAT_MOVE, x, y, options),
    resizeFloatWindow: (w, h) => electron.ipcRenderer.invoke(IPC.BUTLER_FLOAT_RESIZE, w, h),
    setIgnoreMouse: (ignore) => electron.ipcRenderer.invoke(IPC.BUTLER_FLOAT_SET_IGNORE_MOUSE, ignore),
    openMemoryFolder: () => electron.ipcRenderer.invoke("butler:open-memory-folder"),
    onFloatWindowOpened: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on(IPC.BUTLER_FLOAT_WINDOW_OPENED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_FLOAT_WINDOW_OPENED, listener);
    },
    onFloatWindowClosed: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on(IPC.BUTLER_FLOAT_WINDOW_CLOSED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_FLOAT_WINDOW_CLOSED, listener);
    },
    /** 独立浮窗 → 主进程 → 主窗口：请求主窗口前置并跳转到指定会话 */
    navigateToSession: (sessionId) => electron.ipcRenderer.invoke(IPC.BUTLER_NAVIGATE_SESSION, sessionId),
    /** 主窗口 renderer 监听：主进程请求跳转到指定会话 */
    onNavigateSession: (callback) => {
      taskNavigationListeners.add(callback);
      if (pendingTaskNavigation) {
        const sessionId = pendingTaskNavigation;
        pendingTaskNavigation = null;
        queueMicrotask(() => {
          if (taskNavigationListeners.has(callback)) callback(sessionId);
        });
      }
      return () => taskNavigationListeners.delete(callback);
    }
  },
  // ==================== 团队空间（org:*） ====================
  org: {
    getFeatures: () => electron.ipcRenderer.invoke(ORG_IPC.GET_FEATURES),
    request: (method, path, params) => electron.ipcRenderer.invoke(ORG_IPC.REQUEST, method, path, params),
    publishDir: (input) => electron.ipcRenderer.invoke(ORG_IPC.PUBLISH_DIR, input),
    revokeDir: (sharedDirId) => electron.ipcRenderer.invoke(ORG_IPC.REVOKE_DIR, sharedDirId),
    remoteRequest: (input) => electron.ipcRenderer.invoke(ORG_IPC.REMOTE_REQUEST, input),
    getMachineId: () => electron.ipcRenderer.invoke(ORG_IPC.GET_MACHINE_ID),
    getAccessLog: (input) => electron.ipcRenderer.invoke(ORG_IPC.GET_ACCESS_LOG, input),
    inboxSync: () => electron.ipcRenderer.invoke(ORG_IPC.INBOX_SYNC),
    onInboxUpdated: (callback) => {
      const listener = (_event, state) => callback(state);
      electron.ipcRenderer.on(ORG_IPC.INBOX_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(ORG_IPC.INBOX_UPDATED, listener);
    },
    // ── P2b（只新增）：上传只传 project_id，文件由主进程对话框选择 ──
    driveUpload: (input) => electron.ipcRenderer.invoke(ORG_P2B_IPC.driveUpload, { project_id: input?.project_id }),
    onDriveUploadProgress: (callback) => {
      const listener = (_event, progress) => callback(progress);
      electron.ipcRenderer.on(ORG_P2B_IPC.driveUploadProgress, listener);
      return () => electron.ipcRenderer.removeListener(ORG_P2B_IPC.driveUploadProgress, listener);
    },
    driveDownload: (input) => electron.ipcRenderer.invoke(ORG_P2B_IPC.driveDownload, input),
    draftDeliverable: (input) => electron.ipcRenderer.invoke(ORG_P2B_IPC.draftDeliverable, input),
    draftProjectUpdate: (input) => electron.ipcRenderer.invoke(ORG_P2B_IPC.draftProjectUpdate, input),
    taskSessionStart: (input) => electron.ipcRenderer.invoke(ORG_P2B_IPC.taskSessionStart, input),
    taskSessions: (input) => electron.ipcRenderer.invoke(ORG_P2B_IPC.taskSessions, input),
    // ── P3（只新增）：推送文件由主进程对话框选择，accept 只经主进程本机确认框 ──
    pushCreate: (input) => electron.ipcRenderer.invoke(ORG_P3_IPC.pushCreate, { shared_dir_id: input?.shared_dir_id, target_rel_dir: input?.target_rel_dir, note: input?.note }),
    pushAccept: (input) => electron.ipcRenderer.invoke(ORG_P3_IPC.pushAccept, { push_request_id: input?.push_request_id }),
    pushReject: (input) => electron.ipcRenderer.invoke(ORG_P3_IPC.pushReject, { push_request_id: input?.push_request_id, reason: input?.reason }),
    pushRetry: (input) => electron.ipcRenderer.invoke(ORG_P3_IPC.pushRetry, { push_request_id: input?.push_request_id }),
    onPushProgress: (callback) => {
      const listener = (_event, progress) => callback(progress);
      electron.ipcRenderer.on(ORG_P3_IPC.pushProgress, listener);
      return () => electron.ipcRenderer.removeListener(ORG_P3_IPC.pushProgress, listener);
    },
    // ── P4（只新增）：本机 AI 起草周报，其余 P4 REST 走 request 透传 ──
    draftWeeklyReport: (input) => electron.ipcRenderer.invoke(ORG_P4_IPC.draftWeeklyReport, {
      org_id: input?.org_id,
      scope: input?.scope,
      project_id: input?.project_id,
      week_start: input?.week_start
    })
  },
  // ==================== Goals API（goals:*，B 阶段统一目标） ====================
  goals: {
    list: (query) => electron.ipcRenderer.invoke(IPC.GOALS_LIST, query),
    get: (ref) => electron.ipcRenderer.invoke(IPC.GOALS_GET, ref),
    create: (input) => electron.ipcRenderer.invoke(IPC.GOALS_CREATE, input),
    update: (input) => electron.ipcRenderer.invoke(IPC.GOALS_UPDATE, input),
    archive: (input) => electron.ipcRenderer.invoke(IPC.GOALS_ARCHIVE, input),
    merge: (input) => electron.ipcRenderer.invoke(IPC.GOALS_MERGE, input),
    start: (input) => electron.ipcRenderer.invoke(IPC.GOALS_START, input),
    pause: (input) => electron.ipcRenderer.invoke(IPC.GOALS_PAUSE, input),
    resume: (input) => electron.ipcRenderer.invoke(IPC.GOALS_RESUME, input),
    cancel: (input) => electron.ipcRenderer.invoke(IPC.GOALS_CANCEL, input),
    approve: (input) => electron.ipcRenderer.invoke(IPC.GOALS_APPROVE, input),
    reject: (input) => electron.ipcRenderer.invoke(IPC.GOALS_REJECT, input),
    sendMessage: (input) => electron.ipcRenderer.invoke(IPC.GOALS_SEND_MESSAGE, input),
    bindSession: (input) => electron.ipcRenderer.invoke(IPC.GOALS_BIND_SESSION, input),
    listExecutions: (input) => electron.ipcRenderer.invoke(IPC.GOALS_LIST_EXECUTIONS, input),
    setOutcome: (input) => electron.ipcRenderer.invoke(IPC.GOALS_SET_OUTCOME, input),
    onUpdated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.GOALS_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.GOALS_UPDATED, listener);
    }
  },
  // ==================== 待你拍板 Proposals API（proposals:*，§6 C1） ====================
  proposals: {
    list: (query) => electron.ipcRenderer.invoke(IPC.PROPOSALS_LIST, query),
    resolve: (input) => electron.ipcRenderer.invoke(IPC.PROPOSALS_RESOLVE, input),
    onUpdated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.PROPOSALS_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.PROPOSALS_UPDATED, listener);
    }
  },
  // ==================== 工作台持续方向（directions:map） ====================
  directions: {
    map: () => electron.ipcRenderer.invoke(IPC.DIRECTIONS_MAP)
  },
  // ==================== 工作分组（workGroups:*，类型见 shared/workGroupTypes） ====================
  workGroups: {
    snapshot: () => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_SNAPSHOT),
    create: (input) => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_CREATE, input),
    update: (id, patch) => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_UPDATE, { id, patch }),
    archive: (id) => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_ARCHIVE, { id }),
    assign: (sessionIds, groupId) => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_ASSIGN, { sessionIds, groupId }),
    setPriority: (sessionIds, priority) => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_SET_PRIORITY, { sessionIds, priority }),
    fromDirection: (directionId) => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_FROM_DIRECTION, { directionId }),
    summarize: (groupId, range, force = false) => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_SUMMARIZE, { groupId, range, force }),
    backgroundModelReady: () => electron.ipcRenderer.invoke(IPC.WORK_GROUPS_BACKGROUND_MODEL),
    onUpdated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.WORK_GROUPS_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.WORK_GROUPS_UPDATED, listener);
    }
  },
  // ==================== 会话抽屉「验收」页签（review:*，类型见 shared/review/types） ====================
  review: {
    generateHandoff: (sessionId, opts) => electron.ipcRenderer.invoke(IPC.REVIEW_GENERATE_HANDOFF, sessionId, opts)
  },
  // ==================== 全局放权档位 Autonomy API（autonomy:*，§6 C2） ====================
  autonomy: {
    get: () => electron.ipcRenderer.invoke(IPC.AUTONOMY_GET),
    set: (level) => electron.ipcRenderer.invoke(IPC.AUTONOMY_SET, { level })
  },
  // ==================== Butler Goals API（宠物目标负责人，新增段） ====================
  butlerGoals: {
    /** 列出长期目标。query.statuses 可过滤（running/sleeping/waiting_approval/paused/done/failed/cancelled） */
    list: (query) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_LIST, query),
    /** 目标详情 + 时间线 */
    get: (goalId) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_GET, goalId),
    /**
     * 新建长期目标（后台定时唤醒、自主推进，只在要拍板/完成/卡住时找用户）。
     * 必填 objective（用户原话目标）；推进类目标还要 workingDirectory（已存在的目录绝对路径）。
     * 定时类（追踪/定期推送）传 schedule（5 段 cron，本地时间，如 "30 8,20 * * *"），可不给目录、不过期、每次结果都推给用户。
     * 可选 title、rulePreset（cautious/balanced/hands_off，默认 balanced）、rules.never（追加禁令）、
     * cadenceMinutes（0=连续推进，N>=15 每 N 分钟一轮，仅推进类）。providerId 省略即用默认。
     */
    create: (input) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_CREATE, input),
    /** 批准目标当前待拍板的问题（status=waiting_approval），note 可附言 */
    approve: (input) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_APPROVE, input),
    /** 驳回目标当前待拍板的问题，reason 必填，会被沉淀为该目标的长期偏好 */
    reject: (input) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_REJECT, input),
    pause: (goalId) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_PAUSE, goalId),
    resume: (goalId) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_RESUME, goalId),
    cancel: (goalId) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_CANCEL, goalId),
    /**
     * 把用户的话转给某个目标：睡眠中会立即唤醒，运行中插话，待拍板时视为带意见驳回。
     * 用户在聊天里对某个目标提要求/改方向时用它，text ≤ 2000 字。
     */
    sendMessage: (input) => electron.ipcRenderer.invoke(IPC.BUTLER_GOALS_SEND_MESSAGE, input),
    onUpdated: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.BUTLER_GOALS_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_GOALS_UPDATED, listener);
    }
  },
  // ==================== Butler Assistant API（全局助手独立线程） ====================
  butlerAssistant: {
    getFeatureFlag: () => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_GET_FEATURE_FLAG),
    setFeatureFlag: (enabled) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_SET_FEATURE_FLAG, { enabled }),
    getThread: () => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_GET_THREAD),
    listMessages: (threadId, limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_LIST_MESSAGES, { threadId, limit }),
    sendMessage: (params) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_SEND_MESSAGE, params),
    clearThread: (threadId) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_CLEAR_THREAD, { threadId }),
    getStatusSnapshot: () => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_GET_STATUS_SNAPSHOT),
    listPendingActions: (threadId, limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_LIST_PENDING_ACTIONS, { threadId, limit }),
    confirmAction: (actionId, approvedOrDecision, note) => electron.ipcRenderer.invoke(
      IPC.BUTLER_ASSISTANT_CONFIRM_ACTION,
      typeof approvedOrDecision === "boolean" ? { actionId, approved: approvedOrDecision, note } : { actionId, decision: approvedOrDecision, note }
    ),
    onMessage: (callback) => {
      const listener = (_event, message) => callback(message);
      electron.ipcRenderer.on(IPC.BUTLER_ASSISTANT_MESSAGE, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_ASSISTANT_MESSAGE, listener);
    },
    onActionUpdated: (callback) => {
      const listener = (_event, action) => callback(action);
      electron.ipcRenderer.on(IPC.BUTLER_ASSISTANT_ACTION_UPDATED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_ASSISTANT_ACTION_UPDATED, listener);
    },
    onThreadCleared: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.BUTLER_ASSISTANT_THREAD_CLEARED, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_ASSISTANT_THREAD_CLEARED, listener);
    },
    /** 运行时会话工具进度（正在 → …） */
    onProgress: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.BUTLER_ASSISTANT_PROGRESS, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_ASSISTANT_PROGRESS, listener);
    },
    /** 运行时会话向用户提问（宠物窗弹选项面板） */
    onAskUserQuestion: (callback) => {
      const listener = (_event, payload) => callback(payload);
      electron.ipcRenderer.on(IPC.BUTLER_ASSISTANT_ASK, listener);
      return () => electron.ipcRenderer.removeListener(IPC.BUTLER_ASSISTANT_ASK, listener);
    },
    /** 提交 AskUserQuestion 答案 */
    answerQuestion: (answers) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_ANSWER_QUESTION, { answers }),
    /** 真停止：打断运行时会话当前轮 */
    abort: () => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_ABORT),
    /** Butler 线程消息全文检索（含已清空归档的） */
    searchMessages: (query, limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_SEARCH_MESSAGES, { query, limit }),
    // Backward-compatible aliases from the first P0 backend skeleton.
    listThreads: (limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_LIST_THREADS, { limit }),
    getOrCreateThread: (threadId, metadata) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_GET_THREAD, { threadId, metadata }),
    getMessages: (threadId, limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_LIST_MESSAGES, { threadId, limit }),
    send: (content, options) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_SEND_MESSAGE, { content, threadId: options?.threadId, metadata: options?.metadata }),
    getPendingActions: (threadId, limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_LIST_PENDING_ACTIONS, { threadId, limit }),
    getAuditActions: (threadId, limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_AUDIT_ACTIONS, { threadId, limit }),
    getSystemStatus: () => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_GET_STATUS_SNAPSHOT),
    searchHistory: (query, limit) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_SEARCH_HISTORY, { query, limit }),
    getActionRegistry: () => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_GET_ACTION_REGISTRY),
    recommend: (content) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_RECOMMEND, { content }),
    executeAction: (params) => electron.ipcRenderer.invoke(IPC.BUTLER_ASSISTANT_EXECUTE_ACTION, params)
  },
  // ==================== Remote API (局域网访问) ====================
  remote: {
    start: (port) => electron.ipcRenderer.invoke("remote:start", port),
    stop: () => electron.ipcRenderer.invoke("remote:stop"),
    getStatus: () => electron.ipcRenderer.invoke("remote:get-status"),
    generatePair: () => electron.ipcRenderer.invoke("remote:generate-pair"),
    getDevices: () => electron.ipcRenderer.invoke("remote:get-devices"),
    revokeDevice: (deviceId) => electron.ipcRenderer.invoke("remote:revoke-device", deviceId)
  },
  // ==================== Relay API (公网中转) ====================
  relay: {
    connect: () => electron.ipcRenderer.invoke("relay:connect"),
    disconnect: () => electron.ipcRenderer.invoke("relay:disconnect"),
    getStatus: () => electron.ipcRenderer.invoke("relay:get-status"),
    updateConfig: (config) => electron.ipcRenderer.invoke("relay:update-config", config),
    getConfig: () => electron.ipcRenderer.invoke("relay:get-config"),
    getQrUrl: () => electron.ipcRenderer.invoke("relay:get-qr-url"),
    listDevices: () => electron.ipcRenderer.invoke("relay:list-devices"),
    remoteRequest: (params) => electron.ipcRenderer.invoke("relay:remote-request", params),
    onStateChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("relay:state-changed", handler);
      return () => electron.ipcRenderer.removeListener("relay:state-changed", handler);
    }
  },
  // ==================== 共享资料空间 ====================
  sharedFiles: {
    getConfig: () => electron.ipcRenderer.invoke("shared-files:get-config"),
    selectDirectory: () => electron.ipcRenderer.invoke("shared-files:select-directory"),
    setEnabled: (enabled) => electron.ipcRenderer.invoke("shared-files:set-enabled", enabled),
    pickFiles: () => electron.ipcRenderer.invoke("shared-files:pick-files"),
    saveFile: (payload) => electron.ipcRenderer.invoke("shared-files:save-file", payload)
  },
  // ==================== Meeting API (多人会议) ====================
  // 方法名与 renderer store MeetingApiLike 接口对齐：
  //   createRoom / joinRoom / leaveRoom / getState / refreshState /
  //   listScreenSources / startShare / stopShare / enableMic / disableMic /
  //   setDevices / requestTakeoverShare / transferHost / endRoom /
  //   onStateChanged / onConnectionStateChanged / onParticipantsChanged /
  //   onShareChanged / onToast / onError
  meeting: {
    /** 创建房间 - 接受 { name?, sessionId?, displayName?, userId? } */
    createRoom: (options) => electron.ipcRenderer.invoke("meeting:create-room", options),
    /** 加入已有房间 - 接受 { roomId, sessionId? } 或 (roomId, sessionId?) */
    joinRoom: (optionsOrRoomId, sessionId) => {
      if (typeof optionsOrRoomId === "string") {
        return electron.ipcRenderer.invoke("meeting:join-room", { roomId: optionsOrRoomId, sessionId });
      }
      return electron.ipcRenderer.invoke("meeting:join-room", optionsOrRoomId);
    },
    /** 离开当前房间 */
    leaveRoom: (options) => electron.ipcRenderer.invoke("meeting:leave-room", options),
    /** 结束会议（仅 Host） */
    endRoom: (options) => electron.ipcRenderer.invoke("meeting:end-room", options),
    /** 开启麦克风 */
    enableMic: (options) => electron.ipcRenderer.invoke("meeting:enable-mic", options),
    /** 关闭麦克风 */
    disableMic: (options) => electron.ipcRenderer.invoke("meeting:disable-mic", options),
    /** 开启摄像头 */
    enableCamera: (options) => electron.ipcRenderer.invoke("meeting:enable-camera", options),
    /** 关闭摄像头 */
    disableCamera: (options) => electron.ipcRenderer.invoke("meeting:disable-camera", options),
    /** 开始投屏 - 接受 sourceId 字符串或 { sourceId } 对象 */
    startScreenShare: (arg) => electron.ipcRenderer.invoke("meeting:start-screen-share", arg),
    /** startShare 是 startScreenShare 的别名（renderer store 用这个名字） */
    startShare: (arg) => electron.ipcRenderer.invoke("meeting:start-screen-share", arg),
    /** 停止投屏 */
    stopScreenShare: (options) => electron.ipcRenderer.invoke("meeting:stop-screen-share", options),
    /** stopShare 是 stopScreenShare 的别名 */
    stopShare: (options) => electron.ipcRenderer.invoke("meeting:stop-screen-share", options),
    /** 请求抢占投屏权（Host 可强制，普通成员发通知） */
    requestTakeoverShare: (options) => electron.ipcRenderer.invoke("meeting:request-takeover-share", options),
    /** 转让主持人角色 - 接受 participantId 字符串或 { participantId } 对象 */
    transferHost: (arg) => electron.ipcRenderer.invoke("meeting:transfer-host", arg),
    /** 查询当前会议状态（返回 renderer-compat 扁平结构） */
    getState: (options) => electron.ipcRenderer.invoke("meeting:get-state", options),
    /** refreshState 是 getState 的别名（renderer store 用这个名字） */
    refreshState: (options) => electron.ipcRenderer.invoke("meeting:get-state", options),
    /** 列出可投屏的屏幕/窗口源 */
    listScreenSources: (options) => electron.ipcRenderer.invoke("meeting:list-screen-sources", options),
    /** 设置音视频设备 */
    setDevices: (options) => electron.ipcRenderer.invoke("meeting:set-devices", options),
    /** 重签媒体 token（主持人转移后刷新 roomAdmin 授权） */
    refreshMediaToken: () => electron.ipcRenderer.invoke("meeting:refresh-media-token"),
    /** 获取本地网关端口（供第三方软件接入，默认 17980） */
    getGatewayPort: () => electron.ipcRenderer.invoke("meeting:get-gateway-port"),
    // ─── 事件监听（与 renderer store MeetingApiLike 接口对齐）───
    /** 完整状态变更（preload.onStateChanged → meeting:state-changed） */
    onStateChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:state-changed", handler);
      return () => electron.ipcRenderer.removeListener("meeting:state-changed", handler);
    },
    /** 连接状态变更（meeting:connection-state） */
    onConnectionStateChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:connection-state", handler);
      return () => electron.ipcRenderer.removeListener("meeting:connection-state", handler);
    },
    /** 参与者列表变更（meeting:participants） */
    onParticipantsChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:participants", handler);
      return () => electron.ipcRenderer.removeListener("meeting:participants", handler);
    },
    /** 共享状态变更（meeting:share） */
    onShareChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:share", handler);
      return () => electron.ipcRenderer.removeListener("meeting:share", handler);
    },
    /** Toast 通知（meeting:toast） */
    onToast: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:toast", handler);
      return () => electron.ipcRenderer.removeListener("meeting:toast", handler);
    },
    /** 错误通知（meeting:error） */
    onError: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:error", handler);
      return () => electron.ipcRenderer.removeListener("meeting:error", handler);
    },
    // ─── 保留旧命名（向后兼容，转发到新通道）───
    onMemberJoined: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:member-joined", handler);
      return () => electron.ipcRenderer.removeListener("meeting:member-joined", handler);
    },
    onMemberLeft: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:member-left", handler);
      return () => electron.ipcRenderer.removeListener("meeting:member-left", handler);
    },
    onScreenShareChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:screen-share-changed", handler);
      return () => electron.ipcRenderer.removeListener("meeting:screen-share-changed", handler);
    },
    onHostChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:host-changed", handler);
      return () => electron.ipcRenderer.removeListener("meeting:host-changed", handler);
    },
    onTakeoverRequest: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:screen-share-takeover-request", handler);
      return () => electron.ipcRenderer.removeListener("meeting:screen-share-takeover-request", handler);
    },
    onSignaling: (callback) => {
      const handler = (_event, data) => callback(data);
      electron.ipcRenderer.on("meeting:signaling", handler);
      return () => electron.ipcRenderer.removeListener("meeting:signaling", handler);
    },
    // ─── 会议独立窗口控制 ───
    /** 打开会议独立窗口 */
    openWindow: () => electron.ipcRenderer.invoke(IPC.MEETING_OPEN_WINDOW),
    /** 关闭会议独立窗口 */
    closeWindow: () => electron.ipcRenderer.invoke(IPC.MEETING_CLOSE_WINDOW),
    /** 最小化会议独立窗口 */
    minimizeWindow: () => electron.ipcRenderer.invoke(IPC.MEETING_MINIMIZE_WINDOW),
    /** 最大化/还原会议独立窗口 */
    maximizeWindow: () => electron.ipcRenderer.invoke(IPC.MEETING_MAXIMIZE_WINDOW),
    /** 监听会议独立窗口关闭事件 */
    onWindowClosed: (callback) => {
      const handler = () => callback();
      electron.ipcRenderer.on(IPC.MEETING_WINDOW_CLOSED, handler);
      return () => electron.ipcRenderer.removeListener(IPC.MEETING_WINDOW_CLOSED, handler);
    }
  },
  // ==================== 内置浏览器 API（契约见 docs/plans/builtin-browser-plan.md §3.2） ====================
  browser: {
    createTab: (url) => electron.ipcRenderer.invoke(IPC.BROWSER_CREATE_TAB, { url }),
    closeTab: (tabId) => electron.ipcRenderer.invoke(IPC.BROWSER_CLOSE_TAB, { tabId }),
    activateTab: (tabId) => electron.ipcRenderer.invoke(IPC.BROWSER_ACTIVATE_TAB, { tabId }),
    takeoverTab: (tabId) => electron.ipcRenderer.invoke(IPC.BROWSER_TAKEOVER_TAB, { tabId }),
    resolvePolicy: (action) => electron.ipcRenderer.invoke(IPC.BROWSER_POLICY_RESOLVE, { action }),
    navigate: (tabId, url) => electron.ipcRenderer.invoke(IPC.BROWSER_NAVIGATE, { tabId, url }),
    back: (tabId) => electron.ipcRenderer.invoke(IPC.BROWSER_BACK, { tabId }),
    forward: (tabId) => electron.ipcRenderer.invoke(IPC.BROWSER_FORWARD, { tabId }),
    reload: (tabId) => electron.ipcRenderer.invoke(IPC.BROWSER_RELOAD, { tabId }),
    stop: (tabId) => electron.ipcRenderer.invoke(IPC.BROWSER_STOP, { tabId }),
    // 网页缩放：factor=1 为 100%；按站点记忆在主进程完成
    setZoom: (tabId, factor) => electron.ipcRenderer.invoke(IPC.BROWSER_SET_ZOOM, { tabId, factor }),
    getState: () => electron.ipcRenderer.invoke(IPC.BROWSER_GET_STATE),
    setViewBounds: (bounds) => electron.ipcRenderer.send(IPC.BROWSER_SET_VIEW_BOUNDS, bounds),
    onStateChanged: (callback) => {
      const handler = (_event, state) => callback(state);
      electron.ipcRenderer.on(IPC.BROWSER_STATE_CHANGED, handler);
      return () => electron.ipcRenderer.removeListener(IPC.BROWSER_STATE_CHANGED, handler);
    },
    onAiActivity: (callback) => {
      const handler = (_event, e) => callback(e);
      electron.ipcRenderer.on(IPC.BROWSER_AI_ACTIVITY, handler);
      return () => electron.ipcRenderer.removeListener(IPC.BROWSER_AI_ACTIVITY, handler);
    },
    openWindow: (url, opts) => electron.ipcRenderer.invoke(IPC.BROWSER_OPEN_WINDOW, { url, newTab: opts?.newTab }),
    // main → renderer：请求把内置浏览器「视角」切到前台（软件内点 http 链接时，见 main/browser/browserLinkRouting.ts）
    onEnsurePane: (callback) => {
      const handler = (_event, payload) => callback(payload ?? {});
      electron.ipcRenderer.on(IPC.BROWSER_ENSURE_PANE, handler);
      return () => electron.ipcRenderer.removeListener(IPC.BROWSER_ENSURE_PANE, handler);
    },
    // 把这一个页面交给系统默认浏览器打开（刻意不走内置浏览器的打开方式偏好）
    openInSystem: (url) => electron.ipcRenderer.invoke(IPC.BROWSER_OPEN_IN_SYSTEM, { url }),
    // 嵌入模式（主区「视角」）：视图挂到主窗口，位置由宿主容器矩形驱动
    attachEmbed: () => electron.ipcRenderer.invoke(IPC.BROWSER_EMBED_ATTACH),
    setEmbedRect: (rect) => electron.ipcRenderer.send(IPC.BROWSER_EMBED_RECT, rect),
    detachEmbed: () => electron.ipcRenderer.invoke(IPC.BROWSER_EMBED_DETACH),
    // 内置浏览器设置（WS-5）：CDP 通道开关读写，修改后需重启生效
    getCdpSettings: () => electron.ipcRenderer.invoke(IPC.BROWSER_CDP_GET_SETTINGS),
    setCdpSettings: (enabled) => electron.ipcRenderer.invoke(IPC.BROWSER_CDP_SET_SETTINGS, { enabled }),
    // 浏览器偏好（立即生效，无需重启）
    // - webOpenTarget：软件内网页链接打开方式
    // - sessionIsolation：会话隔离浏览器上下文（P2，默认 false = 共享登录态）
    getPrefs: () => electron.ipcRenderer.invoke(IPC.BROWSER_PREFS_GET),
    setPrefs: (target, options) => electron.ipcRenderer.invoke(IPC.BROWSER_PREFS_SET, {
      ...target ? { target } : {},
      ...options && options.sessionIsolation != null ? { sessionIsolation: options.sessionIsolation } : {}
    }),
    // 批次A：浏览历史 / 书签 / 清除浏览数据
    // 契约：docs/plans/reports/builtin-browser-batch-a-contract.md §5
    listHistory: (query) => electron.ipcRenderer.invoke(IPC.BROWSER_HISTORY_LIST, { query }),
    removeHistory: (id) => electron.ipcRenderer.invoke(IPC.BROWSER_HISTORY_REMOVE, { id }),
    clearHistory: () => electron.ipcRenderer.invoke(IPC.BROWSER_HISTORY_CLEAR),
    listBookmarks: () => electron.ipcRenderer.invoke(IPC.BROWSER_BOOKMARKS_LIST),
    addBookmark: (url, title) => electron.ipcRenderer.invoke(IPC.BROWSER_BOOKMARKS_ADD, { url, title }),
    removeBookmark: (url) => electron.ipcRenderer.invoke(IPC.BROWSER_BOOKMARKS_REMOVE, { url }),
    clearBrowsingData: (options) => electron.ipcRenderer.invoke(IPC.BROWSER_DATA_CLEAR, options)
  },
  // ==================== 资料库 API（P0；契约见 docs/plans/2026-09-16-knowledge-library-p0.md §4） ====================
  knowledge: {
    library: {
      list: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_LIBRARY_LIST, input),
      create: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_LIBRARY_CREATE, input),
      update: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_LIBRARY_UPDATE, input),
      delete: (libraryId) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_LIBRARY_DELETE, libraryId)
    },
    doc: {
      list: (libraryId) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_LIST, libraryId),
      read: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_READ, input),
      create: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_CREATE, input),
      write: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_WRITE, input),
      rename: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_RENAME, input),
      delete: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_DELETE, input),
      restore: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_RESTORE, input),
      import: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_IMPORT, input),
      /** 打开系统「选择文件」对话框，返回绝对路径（导入用） */
      pickFiles: () => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_DOC_PICK_FILES)
    },
    // 会话产出「提议入库」待审（P2-a 产出沉淀）：独立旁路，确认后才落入库
    proposal: {
      create: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_PROPOSAL_CREATE, input),
      list: () => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_PROPOSAL_LIST),
      confirm: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_PROPOSAL_CONFIRM, input),
      reject: (id) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_PROPOSAL_REJECT, id)
    },
    resolveContext: (projectPath) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_RESOLVE_CONTEXT, projectPath),
    /** P3 仓库文档同步（独立补充通道）：scan=只读预览，sync=增量入库到项目库 */
    repo: {
      scan: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_REPO_SCAN, input),
      sync: (input) => electron.ipcRenderer.invoke(IPC.KNOWLEDGE_REPO_SYNC, input)
    }
  },
  // ==================== Office 文档生成（A4 生成档；独立新增 channel）====================
  officeDoc: {
    /** Markdown → .xlsx / .pptx，弹保存对话框后落盘，返回路径 */
    generate: (input) => electron.ipcRenderer.invoke(IPC.OFFICE_DOC_GENERATE, input)
  }
});
electron.contextBridge.exposeInMainWorld("api", {
  kanban: kanbanBridgeApi
});

electron.contextBridge.exposeInMainWorld("development", {
  chatFiles: { readImage: (path, context) => electron.ipcRenderer.invoke("file-manager:read-file", { path, context, includeImageData: true, cacheChatImage: true }), prepare: (path, context) => electron.ipcRenderer.invoke("dev:chat-file:prepare", { path, context }) },
  inputFlow: {get: id => electron.ipcRenderer.invoke("dev:input-flow:get",id),retry:(id,inputId)=>electron.ipcRenderer.invoke("dev:input-flow:retry",id,inputId),onChanged:callback=>{const listener=(_event,value)=>callback(value);electron.ipcRenderer.on("dev:input-flow:changed",listener);return()=>electron.ipcRenderer.removeListener("dev:input-flow:changed",listener);}},
  getRequestSummary: (sessionId) => electron.ipcRenderer.invoke("dev:request-summary", sessionId), getRuntimeInfo: () => electron.ipcRenderer.invoke("dev:runtime-info"),
  getServiceAccess: () => electron.ipcRenderer.invoke("dev:service-access"),
  startup: {
    launchContext: () => electron.ipcRenderer.invoke("dev:startup:launch-context"),
    get: () => electron.ipcRenderer.invoke("dev:startup:get"),
    save: value => electron.ipcRenderer.invoke("dev:startup:save",value),
    importAudio: () => electron.ipcRenderer.invoke("dev:startup:import-audio"),
    removeAudio: () => electron.ipcRenderer.invoke("dev:startup:remove-audio")
  },
  pet: {
    importImage: () => electron.ipcRenderer.invoke("dev:pet:import"),
    discardImage: id => electron.ipcRenderer.invoke("dev:pet:discard", id),
    onPersonaChanged: callback => { const handler=(_event,persona)=>callback(persona); electron.ipcRenderer.on("dev:pet:persona-changed",handler); return()=>electron.ipcRenderer.removeListener("dev:pet:persona-changed",handler); }
  },
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
});
