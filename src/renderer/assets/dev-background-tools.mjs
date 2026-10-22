export function findBackgroundJob(jobs, sessionId, toolUseId, toolResult = '') {
  const id = typeof toolResult === 'string' ? toolResult.match(/^Background job: (\S+)\s*$/m)?.[1] : undefined;
  return jobs.find(job => job.sessionId === sessionId &&
    (toolUseId && job.toolUseId === toolUseId || id && job.id === id));
}
export function backgroundState(job, zh = true) {
  const failed = job.status === 'error' || job.status === 'exited' && Number.isInteger(job.exitCode) && job.exitCode !== 0;
  const labels = zh ? { running: '后台运行中', exited: failed ? '执行失败' : '已完成', error: '执行失败', killed: '已停止', interrupted: '运行已中断', ended: '已结束（结果未知）' }
    : { running: 'Running in background', exited: failed ? 'Failed' : 'Completed', error: 'Failed', killed: 'Stopped', interrupted: 'Interrupted', ended: 'Ended (outcome unknown)' };
  return { label: labels[job.status] || (zh ? '状态未知' : 'Unknown'), failed,
    color: failed ? 'text-accent-red' : job.status === 'running' ? 'text-accent-purple' : 'text-text-secondary' };
}
export function backgroundDetails(job, zh = true, now = Date.now()) {
  const elapsed = (job.status === 'running' ? now : job.endedAt) - job.startedAt;
  const duration = Number.isFinite(elapsed) ? `${(Math.max(0, elapsed) / 1000).toFixed(2)} ${zh ? '秒' : 's'}` : (zh ? '未记录' : 'Not recorded');
  const code = Number.isInteger(job.exitCode) ? String(job.exitCode) + (job.exitCode === 0 ? (zh ? '（正常结束）' : ' (success)') : '') : (zh ? '未提供' : 'Not provided');
  return `${zh ? '用时' : 'Duration'}：${duration}\n${zh ? '退出代码' : 'Exit code'}：${code}`;
}

export function createBackgroundToolUI({ React, jsx, language, api = () => window.shineAI?.session }) {
  const entries = new Map(); let unsubscribe;
  const entry = id => {
    if (!entries.has(id)) entries.set(id, { jobs: [], listeners: new Set(), revision: 0 });
    return entries.get(id);
  };
  function subscribe(id, listener) {
    const state = entry(id); state.listeners.add(listener);
    if (!unsubscribe) unsubscribe = api()?.onBackgroundShellsUpdate?.(payload => {
      const current = entries.get(payload.sessionId); if (!current) return;
      current.revision++; current.jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
      current.listeners.forEach(fn => fn());
    });
    if (state.listeners.size === 1) {
      const revision = state.revision;
      Promise.resolve(api()?.listBackgroundShells?.(id)).then(jobs => {
        // A late initial response must not overwrite a newer completion event.
        if (state.revision !== revision || !Array.isArray(jobs)) return;
        state.jobs = jobs; state.listeners.forEach(fn => fn());
      }).catch(() => {});
    }
    return () => {
      state.listeners.delete(listener);
      if (!state.listeners.size) entries.delete(id);
      if (!entries.size) { unsubscribe?.(); unsubscribe = undefined; }
    };
  }
  function useJobs(sessionId) {
    const [, update] = React.useState(0);
    React.useEffect(() => sessionId ? subscribe(sessionId, () => update(n => n + 1)) : undefined, [sessionId]);
    return entries.get(sessionId)?.jobs || [];
  }
  function useJob(sessionId, toolUseId, result) { return findBackgroundJob(useJobs(sessionId), sessionId, toolUseId, result); }
  function Badge({ job }) {
    const state = backgroundState(job, language().startsWith('zh'));
    return jsx.jsx('span', { 'data-testid': 'background-tool-status', 'data-job-id': job.id,
      className: `shrink-0 text-tiny font-semibold ${state.color}`, children: state.label });
  }
  function Details({ job }) {
    const zh = language().startsWith('zh'), [now, setNow] = React.useState(Date.now);
    React.useEffect(() => {
      if (job.status !== 'running') return;
      const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer);
    }, [job.status]);
    return jsx.jsxs('div', { 'data-testid': 'background-tool-details', className: 'mb-3 space-y-2 text-text-secondary', children: [
      jsx.jsx('div', { className: 'whitespace-pre-wrap', children: backgroundDetails(job, zh, now) }),
      job.summary && jsx.jsx('div', { className: 'whitespace-pre-wrap break-all', children: job.summary }),
      jsx.jsx('div', { className: 'text-text-muted', children: zh ? '命令输出（最多保留最后 16000 个字符）' : 'Command output (last 16000 characters)' }),
      jsx.jsx('pre', { className: `whitespace-pre-wrap break-all ${backgroundState(job, zh).color}`,
        children: job.lastOutput || (zh ? '暂无输出' : 'No output') })
    ] });
  }
  return { useJobs, useJob, Badge, Details };
}
