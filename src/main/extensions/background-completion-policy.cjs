'use strict';

const history = require('./background-tool-history.cjs');
const notified = new WeakMap();
const tag = /^\[SYSTEM\]\[BACKGROUND_SHELL_(?:EXITED|KILLED|ERROR|COALESCED)\]/;
const terminal = new Set(['completed', 'terminated', 'interrupted', 'error', 'stopped']);
const settled = new Set(['waiting_input', 'idle']);

function isAnswer(message) {
  return message.role === 'assistant' && !message.isThinking && !message.isDelta &&
    (!message.type || message.type === 'text') && !!message.content?.trim();
}

// Use runtime boundaries and exact originating tools, never guess completion
// from phrases in the answer, unfinished Todos, or the shell command itself.
function decision(status, messages, jobs) {
  if (terminal.has(status) || !status) return 'record_only';
  let lastUser = -1, lastTool = -1, lastAnswer = -1;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.role === 'user') lastUser = i;
    if (message.role === 'tool_use' || message.role === 'tool_result') lastTool = i;
    if (isAnswer(message)) lastAnswer = i;
  }
  // Completion from an older user turn must not steer a newer request.
  const origins = jobs.map(job => messages.findIndex(m =>
    m.role === 'tool_use' && job.toolUseId && m.toolUseId === job.toolUseId));
  if (origins.length && origins.every(i => i >= 0 && i < lastUser)) return 'record_only';
  if (!settled.has(status)) return 'continue';
  // At a safe boundary, a final answer following the latest tool means the
  // user turn has finished. Without such an answer, retain continuation.
  return lastAnswer > lastUser && lastAnswer > lastTool ? 'record_only' : 'continue';
}

function completionJobs(sessionId, text) {
  const ids = new Set([...text.matchAll(/(?:^- jobId:\s*|\bjobId=)([\w-]+)/gm)].map(m => m[1]));
  return history.list(sessionId, []).filter(job => ids.has(job.id));
}

function relatedAnswer(messages, job) {
  const origin = messages.findIndex(m => m.role === 'tool_use' && job.toolUseId && m.toolUseId === job.toolUseId);
  if (origin < 0) return;
  let result;
  for (let i = origin + 1; i < messages.length && messages[i].role !== 'user'; i++) if (isAnswer(messages[i])) result = messages[i].id;
  return result;
}

function handleCompletionInput(manager, sessionId, text, options) {
  if (options?.source !== 'system_internal' || typeof text !== 'string' || !tag.test(text)) return;
  const session = manager.getSession(sessionId);
  const messages = manager.getConversation(sessionId);
  const jobs = completionJobs(sessionId, text);
  if (decision(session?.status, messages, jobs) === 'continue') return;

  // Errors remain visible, without creating a new model turn that replaces
  // the user's final answer. The original tool card also retains the evidence.
  let seen = notified.get(manager);
  if (!seen) notified.set(manager, seen = new Set());
  const relatedAnswerId = [...messages].reverse().find(isAnswer)?.id;
  const notices = jobs.length ? jobs.filter(job => job.status !== 'exited' || job.exitCode !== 0)
    .map(job => ({ id: job.id, content: `后台任务已结束 (${job.status}) · exit ${job.exitCode ?? '?'}` }))
    : [{ id: text, content: options.displayText }];
  for (const notice of notices) {
    const key = sessionId + ':' + notice.id;
    if (!notice.content || seen.has(key)) continue;
    // The tool card retains the evidence; the renderer may show a compact link
    // for failures occurring after the answer. Never append a duplicate notice.
    const matched = jobs.find(job => job.id === notice.id);
    if (matched && relatedAnswer(messages, matched)) continue;
    seen.add(key);
    manager.appendSyntheticConversationMessage(sessionId, {
      role: 'system', content: notice.content,
      metadata: { backgroundToolNotice: { jobId: notice.id, relatedAnswerId } }
    });
  }
  return { dispatched: false, scheduled: false, reason: 'background_result_recorded' };
}

module.exports = { decision, handleCompletionInput };
