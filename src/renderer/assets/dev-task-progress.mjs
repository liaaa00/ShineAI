// A status strip based on observable runtime state, never a simulated percent
// or a claim that a task is done merely because its plan has been checked off.
const aliases = {
  read: '读取文件', read_file: '读取文件', shineai_read_file: '读取文件',
  write: '写入文件', write_file: '写入文件', shineai_write_file: '写入文件',
  edit: '修改文件', edit_file: '修改文件', apply_patch: '修改文件', shineai_edit_file: '修改文件',
  bash: '执行命令', powershell: '执行命令', shell: '执行命令', exec_command: '执行命令', execute_command: '执行命令',
  grep: '搜索内容', search: '搜索内容', search_files: '搜索内容', glob: '查找文件',
  websearch: '搜索网页', web_search: '搜索网页', webfetch: '读取网页', web_fetch: '读取网页',
  agent: '运行子任务', task: '运行子任务', spawn_agent: '启动子任务', consult_experts: '咨询专家',
  skill: '加载技能', invoke_skill: '加载技能', search_skills: '查找技能',
  todowrite: '更新任务计划', todoread: '读取任务计划', update_plan: '更新任务计划',
  view_image: '查看图片', imageview: '查看图片', screenshot: '截图', browser_screenshot: '截图',
  browser_navigate: '打开网页', browser_click: '操作网页', browser_snapshot: '检查网页',
  call_mcp_tool: '调用外部工具', wait: '等待任务返回', write_stdin: '读取命令输出',
  ask_user_question: '等待你的回答', askuserquestion: '等待你的回答'
};
const timestamp = value => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const parse = value => { try { return typeof value === 'string' ? JSON.parse(value) : value || {}; } catch { return {}; } };
const short = value => String(value || '').split('__').pop();

export function displayToolName(value, zh = true) {
  if (!zh) return short(value) || 'tool';
  return aliases[short(value).toLowerCase()] || (/browser/i.test(value) ? '操作浏览器' : '调用工具');
}

// Translate known runtime notices only. Never rewrite paths, command output,
// provider errors, or arbitrary assistant prose in a log or history entry.
export function displayRuntimeActivity(text, zh = true) {
  if (!zh) return text;
  if (/^Turn completed \(waiting for next input(?:, tokens: \d+)?\)$/i.test(text)) return '本轮回复已结束，等待下一条消息';
  if (/^(Thinking|Thinking\.\.\.|Waiting for model response)$/i.test(text)) return '正在等待模型返回';
  return text;
}

export function formatTaskElapsed(seconds, zh = true) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0)), minutes = Math.floor(total / 60);
  return zh ? (minutes ? `${minutes} 分 ${total % 60} 秒` : `${total} 秒`) : (minutes ? `${minutes}m ${total % 60}s` : `${total}s`);
}

export function currentTurn(messages = []) {
  let start = -1;
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i]?.role === 'user') { start = i; break; }
  return { user: messages[start], messages: messages.slice(start + 1) };
}

function operations(messages, jobs, sessionId) {
  const uses = new Map(), results = new Map();
  for (const message of messages) {
    const id = message?.toolUseId || message?.tool_use_id;
    if (!id) continue;
    if (message.role === 'tool_use') uses.set(id, message);
    if (message.role === 'tool_result') results.set(id, message);
  }
  return [...uses].map(([id, use]) => {
    const result = results.get(id);
    const job = jobs.find(item => item.sessionId === sessionId && item.toolUseId === id);
    const failedJob = job && (job.status === 'error' || job.status === 'exited' && Number.isInteger(job.exitCode) && job.exitCode !== 0);
    const state = job ? job.status === 'running' ? 'background' : failedJob ? 'failed' : job.status === 'exited' && job.exitCode === 0 ? 'done' : 'unknown'
      : result ? result.isError ? 'failed' : result.isDelta ? 'running' : 'done' : 'running';
    return { id, name: use.toolName, input: parse(use.toolInput), use, result, state, at: timestamp(use.timestamp) };
  });
}

function operationLabel(op, zh) {
  const input = op?.input || {};
  return displayToolName(input.tool_name || input.name || op?.name, zh);
}

export function deriveTaskProgress(input = {}) {
  const zh = input.zh !== false, now = input.now || Date.now(), status = input.status || '';
  const turn = currentTurn(input.messages);
  const jobs = (input.jobs || []).filter(item => item.sessionId === input.sessionId);
  const ops = operations(turn.messages, jobs, input.sessionId);
  const background = jobs.filter(job => job.status === 'running');
  const relatedFailures = jobs.filter(job => job.status === 'error' || job.status === 'exited' && Number.isInteger(job.exitCode) && job.exitCode !== 0);
  const hasAnswer = turn.messages.some(message => message.role === 'assistant' && !message.isThinking && !message.isDelta && String(message.content || '').trim());
  const terminal = ['error', 'interrupted', 'terminated'].includes(status);
  const ended = ['waiting_input', 'idle', 'completed'].includes(status);
  const waiting = !terminal && (input.pendingPermission || input.pendingAskQuestion || input.pendingPlanApproval);
  const active = !terminal && !ended && (status === 'starting' || status === 'running' || input.streaming || input.hasActiveAgents);
  const raw = input.toolStatus;
  const recorded = raw?.toolUseId && ops.find(op => op.id === raw.toolUseId);
  // An explicit result beats a late running event. lastActivity alone is never
  // evidence that a tool is still executing.
  const turnStart = timestamp(turn.user?.timestamp);
  const rawIsCurrent = recorded || !turnStart || timestamp(raw?.startedAt) >= turnStart;
  const tool = active && raw && rawIsCurrent && ['running', 'started', 'executing', 'pending'].includes(raw.status) && (!recorded || recorded.state === 'running') ? raw : null;
  const pendingOps = ops.filter(op => op.state === 'running');
  const unknownOps = ops.filter(op => op.state === 'unknown');
  const runningOp = active && (tool ? recorded || { name: tool.toolName, input: {}, at: timestamp(tool.startedAt) } : pendingOps.at(-1));
  const good = ops.filter(op => op.state === 'done').length, failed = ops.filter(op => op.state === 'failed').length;
  let stage = 'unknown', label, animate = false;
  if (status === 'error') { stage = 'failed'; label = zh ? '本轮执行失败' : 'Turn failed'; }
  else if (status === 'terminated') { stage = 'stopped'; label = zh ? '本轮已停止' : 'Turn stopped'; }
  else if (status === 'interrupted') { stage = 'interrupted'; label = zh ? '运行已中断，可继续会话' : 'Run interrupted'; }
  else if (waiting) { stage = 'waiting'; label = zh ? input.pendingAskQuestion ? '等待你的回答' : input.pendingPlanApproval ? '等待你确认计划' : '等待你确认操作' : 'Waiting for your response'; }
  else if (status === 'paused') { stage = 'paused'; label = zh ? '当前会话已暂停' : 'Session paused'; }
  else if (active) {
    animate = true;
    stage = status === 'starting' ? 'starting' : runningOp ? 'tool' : turn.messages.some(message => message.role === 'assistant' && message.isDelta && !message.isThinking) ? 'answer' : 'thinking';
    label = zh ? ({ starting: '正在启动对话运行环境', tool: `正在${operationLabel(runningOp, true)}`, answer: '正在生成回复', thinking: '正在思考，等待模型返回' })[stage]
      : ({ starting: 'Starting conversation runtime', tool: `Running · ${operationLabel(runningOp, false)}`, answer: 'Writing the reply', thinking: 'Waiting for the model' })[stage];
  } else if (background.length) { stage = 'background'; animate = true; label = zh ? `回复已结束，${background.length} 个后台任务仍在运行` : `Reply ended · ${background.length} background tasks running`; }
  else if (input.hasActiveAgents) { stage = 'agents'; animate = true; label = zh ? '子任务仍在运行' : 'Child tasks still running'; }
  else if (ended && (hasAnswer || ops.length)) { stage = pendingOps.length || unknownOps.length ? 'unconfirmed' : 'complete'; label = zh ? stage === 'unconfirmed' ? '本轮已结束，部分操作结果未确认' : failed ? '本轮回复已结束，有操作失败' : '本轮回复已结束' : 'Turn ended'; }
  else { label = zh ? '状态暂未确认' : 'Status not confirmed'; }
  const allRelatedFailures = relatedFailures.filter(job => ops.some(op => op.id === job.toolUseId));
  if (stage === 'complete' && allRelatedFailures.length) label = zh ? '本轮回复已结束，后台执行失败' : 'Reply ended · background task failed';
  const visible = active || waiting || terminal || background.length > 0 || input.hasActiveAgents || !!turn.user && (hasAnswer || ops.length > 0 || status === 'paused');
  const parts = [];
  if (ops.length) parts.push(zh ? `${good} 个操作成功` : `${good} succeeded`);
  if (failed) parts.push(zh ? `${failed} 个失败` : `${failed} failed`);
  if (active && pendingOps.length) parts.push(zh ? `${pendingOps.length} 个进行中` : `${pendingOps.length} running`);
  if (background.length) parts.push(zh ? `${background.length} 个后台运行中` : `${background.length} in background`);
  if (!parts.length && stage === 'thinking') parts.push(zh ? '尚未收到下一步结果' : 'Waiting for the next result');
  if (stage === 'complete') parts.push(zh ? '任务是否达成请以回复与验证结果为准' : 'See the reply and verification for the outcome');
  const latestAt = turn.messages.reduce((latest, message) => Math.max(latest, timestamp(message.timestamp)), 0);
  const start = turnStart || timestamp(input.startedAt);
  const lastJobEnd = jobs.reduce((latest, job) => Math.max(latest, timestamp(job.endedAt)), 0);
  const end = animate ? now : Math.max(latestAt, lastJobEnd) || start;
  const elapsed = start ? Math.max(0, Math.floor((end - start) / 1000)) : null;
  const rawDetail = String(tool?.detail || (runningOp ? runningOp.input.file_path || runningOp.input.path || runningOp.input.command || '' : '') || input.liveProgressText || '').slice(0, 2400);
  const freshest = Math.max(timestamp(input.heartbeat?.lastBeatAt), timestamp(input.lastActivity?.timestamp), latestAt);
  return { visible, stage, label, animate, summary: parts.join(' · '), completed: good, failed, total: ops.length,
    pending: active ? pendingOps.length : 0, elapsed, rawDetail, operations: ops, background,
    stale: animate && freshest > 0 && now - freshest >= 45000 };
}

export function createTaskProgressUI({ React, jsx, language }) {
  function TaskProgress(props) {
    const zh = String(language?.() || 'zh-CN').startsWith('zh');
    const [now, setNow] = React.useState(Date.now);
    const data = React.useMemo(() => deriveTaskProgress({ ...props, zh, now }), [props, zh, now]);
    React.useEffect(() => {
      if (!data.animate) return;
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }, [data.animate, props.sessionId]);
    if (!data.visible) return null;
    return jsx.jsxs('section', { className: 'shine-task-progress', 'data-testid': 'task-progress', 'data-task-stage': data.stage, 'data-animating': String(data.animate), children: [
      jsx.jsxs('div', { className: 'shine-task-progress-heading', children: [
        jsx.jsx('span', { className: `shine-task-indicator ${data.animate ? 'is-running' : data.failed || data.stage === 'failed' ? 'is-failed' : data.stage === 'complete' ? 'is-ended' : 'is-waiting'}`, 'aria-hidden': true, children: data.animate ? '' : data.failed || data.stage === 'failed' ? '!' : data.stage === 'complete' ? '✓' : '•' }),
        jsx.jsx('span', { className: 'shine-task-label', role: 'status', 'aria-live': 'polite', children: data.label }),
        data.elapsed != null && jsx.jsx('span', { className: 'shine-task-time', children: (zh ? '已用时 ' : 'Elapsed ') + formatTaskElapsed(data.elapsed, zh) })
      ] }),
      (data.summary || data.stale) && jsx.jsx('div', { className: 'shine-task-summary', children: data.stale ? (zh ? '仍在等待返回，暂未收到新的进度；用时增加不代表实际完成进度。' : 'Still waiting for an update; elapsed time does not measure completion.') : data.summary }),
      (data.operations.length > 0 || data.rawDetail || data.background.length > 0) && jsx.jsxs('details', { className: 'shine-task-details', children: [
        jsx.jsx('summary', { children: zh ? '查看执行进度' : 'View execution progress' }),
        ...data.operations.map(op => jsx.jsxs('div', { className: 'shine-task-operation', 'data-progress-operation': op.id, children: [
          jsx.jsx('span', { children: operationLabel(op, zh) }),
          jsx.jsx('span', { children: zh ? ({ done: '成功', failed: '失败', background: '后台运行中', running: data.animate ? '进行中' : '结果未确认', unknown: '结果未确认' })[op.state] : op.state })
        ] }, op.id)),
        ...data.background.filter(job => !data.operations.some(op => op.id === job.toolUseId)).map(job => jsx.jsx('div', { className: 'shine-task-operation', children: zh ? '后台命令仍在运行' : 'Background command still running' }, job.id)),
        data.rawDetail && jsx.jsxs('div', { className: 'shine-task-raw', children: [jsx.jsx('div', { children: zh ? '原始参数或进度（命令、路径和日志保留原文）' : 'Original tool arguments or progress' }), jsx.jsx('pre', { children: data.rawDetail })] })
      ] })
    ] });
  }
  return { TaskProgress };
}
