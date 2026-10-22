// Overview status describes runtime state, not guessed task completion.
const complete = new Set(['completed', 'terminated', 'done', 'succeeded']);
const failed = new Set(['error', 'failed']);
const inactive = new Set(['idle', 'waiting_input', 'interrupted', 'stopped', 'cancelled', 'paused']);
const actionable = new Set(['waiting_user', 'waiting_permission', 'waiting_approval', 'waiting_confirmation', 'waiting_question']);

function progressOf(value, status) {
  if (complete.has(status)) return 100;
  // Both fields are percentages. Do not convert duration/status into progress.
  const number = value.progressPercent ?? value.progress;
  return typeof number === 'number' && Number.isFinite(number) && number >= 0 && number <= 100 ? number : null;
}

export function describeButlerSession(session, interventionCount = 0, language = 'zh') {
  const zh = language.startsWith('zh');
  const status = String(session.status || 'unknown').toLowerCase();
  const detection = session.currentDetection;
  const detectionPending = detection && !detection.resolved && session.needsAttention !== false;
  const needsAction = Boolean(interventionCount > 0 || session.needsAttention || session.isWaiting || detectionPending || actionable.has(status));
  // Terminal outcomes take precedence over stale pending events.
  const statusKind = failed.has(status) ? 'error' : complete.has(status) ? 'completed' :
    needsAction ? 'waiting' : inactive.has(status) ? 'idle' : ['running', 'starting', 'pending'].includes(status) ? 'running' : 'idle';
  const statusLabel = statusKind === 'waiting' ? (zh ? '待处理' : 'Needs attention') :
    status === 'waiting_input' || status === 'idle' ? (zh ? '等待新消息' : 'Ready for a message') :
    statusKind === 'completed' ? (zh ? '已结束' : 'Finished') :
    statusKind === 'error' ? (zh ? '执行异常' : 'Failed') :
    status === 'interrupted' ? (zh ? '已中断' : 'Interrupted') :
    status === 'stopped' || status === 'cancelled' ? (zh ? '已停止' : 'Stopped') :
    status === 'paused' ? (zh ? '已暂停' : 'Paused') :
    status === 'starting' ? (zh ? '启动中' : 'Starting') :
    status === 'pending' ? (zh ? '排队中' : 'Queued') :
    status === 'running' ? (zh ? '运行中' : 'Running') : (zh ? '状态未知' : 'Unknown');
  const progress = progressOf(session, status);
  return { statusKind, statusLabel, isWaiting: statusKind === 'waiting', progress,
    progressLabel: progress === null ? '' : `${progress}%` };
}

export function describeButlerTeam(team, language = 'zh') {
  return describeButlerSession(team, 0, language);
}
