const answer = m => m?.role === 'assistant' && !m.isThinking && !m.isDelta &&
  (!m.type || m.type === 'text') && !!m.content?.trim();
export function buildBackgroundResults(groups, jobs, sessionId) {
  const turns = []; let turn;
  for (const group of groups) {
    if (!turn || group.type === 'message' && group.message.role === 'user') {
      turn = { id: group.message?.id || 'orphan', messages: [], tools: new Set(), answer: undefined };
      turns.push(turn);
    }
    const messages = group.type === 'tool_group' ? group.messages : [group.message];
    for (const message of messages || []) {
      if (!message) continue;
      turn.messages.push(message);
      if (message.role === 'tool_use' && message.toolUseId) turn.tools.add(message.toolUseId);
      if (answer(message)) turn.answer = message.id;
    }
  }
  const byAnswer = new Map(), hiddenNotices = new Set(), seen = new Set();
  for (const job of jobs) {
    if (job.sessionId !== sessionId || seen.has(job.id) || job.status === 'running' || job.status === 'exited' && job.exitCode === 0) continue;
    const origin = turns.find(t => job.toolUseId && t.tools.has(job.toolUseId));
    if (!origin?.answer || origin.messages.findIndex(m => m.id === origin.answer) < origin.messages.findIndex(m => m.role === 'tool_use' && m.toolUseId === job.toolUseId)) continue;
    seen.add(job.id);
    const rows = byAnswer.get(origin.answer) || [];
    rows.push({ job, turnId: origin.id }); byAnswer.set(origin.answer, rows);
    for (const candidate of turns.flatMap(t => t.messages)) {
      if (candidate.role !== 'system') continue;
      if (candidate.metadata?.backgroundToolNotice?.jobId === job.id) hiddenNotices.add(candidate.id);
      // Older notices have no job ID. Hide only exact outcome/time matches to
      // evidence already represented here; never infer identity from command text.
      const old = /^后台任务已结束 \((exited|error|killed)\) · exit ([\d?-]+)$/.exec(candidate.content || '');
      if (old && old[1] === job.status && old[2] === String(job.exitCode ?? '?') &&
          Number.isFinite(job.endedAt) && Math.abs(Date.parse(candidate.timestamp) - job.endedAt) < 3000) hiddenNotices.add(candidate.id);
    }
  }
  return { byAnswer, hiddenNotices };
}

export function createBackgroundResultsUI({ jsx, language }) {
  function Results({ rows, onReveal }) {
    if (!rows?.length) return null;
    const zh = language().startsWith('zh');
    return jsx.jsxs('div', { 'data-testid': 'background-results', className: 'mt-3 mb-2 space-y-2 border-t border-border-faint pt-3 text-sm text-text-secondary', children: [
      jsx.jsx('div', { className: 'font-medium text-accent-yellow', children: zh ? '⚠ 后台执行结果' : '⚠ Background results' }),
      ...rows.map(({ job, turnId }) => jsx.jsxs('div', { 'data-testid': 'background-result-row', 'data-background-job-id': job.id, className: 'flex items-start gap-3', children: [
        jsx.jsxs('div', { className: 'min-w-0 flex-1', children: [
          jsx.jsx('div', { className: 'text-accent-yellow', children: job.status === 'killed' ? (zh ? '命令已停止' : 'Command stopped') : job.status === 'interrupted' ? (zh ? '命令运行已中断' : 'Command interrupted') : job.status === 'ended' ? (zh ? '命令已结束，结果未知' : 'Command ended; outcome unknown') : (zh ? '命令执行未成功' : 'Command did not succeed') }),
          jsx.jsx('div', { className: 'font-mono break-all text-caption', children: job.command || (zh ? '后台命令' : 'Background command') })
        ] }),
        jsx.jsx('button', { type: 'button', className: 'shrink-0 text-accent-blue hover:underline', onClick: () => onReveal({ toolUseId: job.toolUseId, turnId }), children: zh ? '查看详情' : 'View details' })
      ] }, job.id))
    ] });
  }
  return { Results };
}
