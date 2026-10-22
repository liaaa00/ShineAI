'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const { performance } = require('node:perf_hooks');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const installed = new WeakSet();
const unavailable = 'snapshot-unavailable:';

// Bound the real child process, not just the promise returned to the sender.
// Otherwise Git could keep capturing files after the model has modified them.
function installSnapshotBudget(service, { budgetMs = 3000, retryAfterMs = 60000 } = {}) {
  if (installed.has(service)) return;
  installed.add(service);
  const scope = new AsyncLocalStorage(), failures = new Map(), summaries = new Map(), active = new Map();
  service.cancelSnapshotCapture = id => active.get(id)?.controller.abort();
  const execute = service.execFileImpl.bind(service);
  const capture = service.captureSnapshot.bind(service);
  const resolve = service.resolveSnapshotCommit.bind(service);
  service.resolveSnapshotCommit = (...args) => {
    const value = resolve(...args);
    return typeof value === 'string' && value.startsWith(unavailable) ? null : value;
  };
  service.getCaptureSummary = id => summaries.get(id) || null;
  service.execFileImpl = async (command, args, options) => {
    const state = scope.getStore();
    if (!state) return execute(command, args, options);
    const remaining = Math.floor(state.deadline - performance.now());
    if (remaining <= 0) {
      state.failure = { reason: 'budget', command: args[0] };
      throw Error('Automatic snapshot time budget exhausted');
    }
    try {
      return await execute(command, args, {
        ...options,
        env: { ...options.env, GIT_INDEX_FILE: state.index },
        signal: options.signal ? AbortSignal.any([options.signal, state.controller.signal]) : state.controller.signal,
        timeout: Math.max(1, Math.min(options.timeout || remaining, remaining))
      });
    } catch (error) {
      state.failure = {
        reason: state.controller.signal.aborted ? 'cancelled' : error.killed || error.code === 'ETIMEDOUT' ? 'budget' : 'git-failed',
        command: args[0], code: String(error.code || ''),
        detail: String(error.stderr || error.message || '').replace(/https?:\/\/\S+|sk-[\w-]+/g, '[redacted]').slice(0, 500)
      };
      throw error;
    }
  };
  service.captureSnapshot = async (id, messageId) => {
    const start = performance.now(), state = {
      deadline: start + budgetMs,
      index: path.join(service.shadowDir(id), 'capture-' + randomUUID() + '.index'),
      controller: new AbortController()
    };
    let result;
    const cooling = failures.get(id) > Date.now();
    if (cooling) result = { ok: false, reason: 'cooldown' };
    else {
      active.set(id, state);
      try {
        // Preserve tracked ignored files without sharing a possibly abandoned
        // index.lock with a cancelled capture or a separate rollback operation.
        const current = path.join(service.shadowDir(id), 'index');
        if (fs.existsSync(current)) fs.copyFileSync(current, state.index);
        result = await scope.run(state, () => capture(id, messageId));
      }
      catch { result = { ok: false }; }
      finally {
        if (active.get(id) === state) active.delete(id);
        // execFile has settled and killed timed-out Git before these are removed.
        for (const file of [state.index, state.index + '.lock']) {
          try { fs.rmSync(file, { force: true }); } catch {}
        }
      }
    }
    const summary = { ok: !!result?.ok, elapsedMs: Math.round(performance.now() - start), ...state.failure, ...(cooling ? { reason: 'cooldown' } : {}) };
    summaries.set(id, summary);
    while (summaries.size > 100) summaries.delete(summaries.keys().next().value);
    if (result?.ok) failures.delete(id);
    else {
      if (!cooling && summary.reason !== 'cancelled') failures.set(id, Date.now() + retryAfterMs);
      while (failures.size > 100) failures.delete(failures.keys().next().value);
      // A failed turn must not inherit an older successful file baseline.
      // This row is also a barrier after restarting the application.
      service.recordSnapshot(id, messageId ?? null, unavailable + (summary.reason || 'failed'));
      console.warn('[SnapshotBudget]', JSON.stringify({ sessionId: id, ...summary }));
    }
    return result || { ok: false };
  };
}
module.exports = { installSnapshotBudget };
