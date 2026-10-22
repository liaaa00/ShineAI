import { backgroundState } from './dev-background-tools.mjs';

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
  const byAnswer = new Map(), hiddenNotices = new Set(), preservedAnswers = new Set(), seen = new Set();
  const messages = turns.flatMap(t => t.messages);
  for (const job of jobs) {
    if (job.sessionId !== sessionId || seen.has(job.id)) continue;
    const origin = turns.find(t => job.toolUseId && t.tools.has(job.toolUseId));
    if (!origin) continue;
    seen.add(job.id);
    // The original tool card owns all command evidence, even when no final
    // answer exists yet. Suppress only notices associated with that evidence.
    for (const candidate of messages) {
      if (candidate.role !== 'system') continue;
      if (candidate.metadata?.backgroundToolNotice?.jobId === job.id) hiddenNotices.add(candidate.id);
      // Older notices have no job ID. Hide only exact outcome/time matches to
      // evidence retained in the tool card; never infer identity from command text.
      const old = /^后台任务已结束 \((exited|error|killed)\) · exit ([\d?-]+)$/.exec(candidate.content || '');
      if (old && old[1] === job.status && old[2] === String(job.exitCode ?? '?') &&
          Number.isFinite(job.endedAt) && Math.abs(Date.parse(candidate.timestamp) - job.endedAt) < 3000) hiddenNotices.add(candidate.id);
    }
    if (!origin.answer || origin.messages.findIndex(m => m.id === origin.answer) < origin.messages.findIndex(m => m.role === 'tool_use' && m.toolUseId === job.toolUseId)) continue;
    preservedAnswers.add(origin.answer);
    const finalAnswer = origin.messages.find(m => m.id === origin.answer);
    const answeredAt = Date.parse(finalAnswer.timestamp);
    // Already-ended attempts belong to the execution history. This also drops
    // an earlier failure hint once a later answer follows a retry. Missing
    // timestamps, stopped commands and unknown outcomes are never called failures.
    if (!backgroundState(job).failed || !Number.isFinite(answeredAt) ||
        !Number.isFinite(job.endedAt) || job.endedAt <= answeredAt) continue;
    const rows = byAnswer.get(origin.answer) || [];
    rows.push({ job, turnId: origin.id }); byAnswer.set(origin.answer, rows);
  }
  return { byAnswer, hiddenNotices, preservedAnswers };
}

export function createBackgroundResultsUI({ jsx, language }) {
  function Results({ rows, onReveal }) {
    if (!rows?.length) return null;
    const zh = language().startsWith('zh');
    return jsx.jsx('div', { 'data-testid': 'background-results', className: 'mt-2 mb-2 space-y-1 text-caption text-text-secondary', children:
      rows.map(({ job, turnId }) => jsx.jsx('button', {
        type: 'button', 'data-testid': 'background-result-row', 'data-background-job-id': job.id,
        className: 'block max-w-full text-left hover:text-accent-blue hover:underline',
        onClick: () => onReveal({ toolUseId: job.toolUseId, turnId }),
        children: zh ? '⚠ 后台命令失败 · 查看详情' : '⚠ Background command failed · View details'
      }, job.id))
    });
  }
  return { Results };
}
