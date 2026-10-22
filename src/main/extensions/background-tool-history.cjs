'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

// Keep command evidence local. The existing background-shell IPC remains the
// only renderer interface; these records never trigger model notifications.
class BackgroundToolHistory {
  constructor(directory) { this.directory = directory; this.sessions = new Map(); this.timers = new Map(); }
  file(id) { return path.join(this.directory, createHash('sha256').update(id).digest('hex') + '.json'); }
  read(id) {
    if (typeof id !== 'string' || !id || id.length > 200) throw Error('Invalid session id');
    if (!this.sessions.has(id)) {
      const jobs = new Map();
      try {
        const record = JSON.parse(fs.readFileSync(this.file(id), 'utf8'));
        if (record.sessionId === id && Array.isArray(record.jobs)) for (const item of record.jobs) {
          if (item.sessionId !== id || typeof item.id !== 'string') continue;
          const job = { ...item };
          // A PID from a previous process is not evidence of a running job.
          if (job.status === 'running') { job.status = 'interrupted'; delete job.endedAt; }
          jobs.set(job.id, job);
        }
      } catch {}
      this.sessions.set(id, jobs);
    }
    return this.sessions.get(id);
  }
  remember(job) {
    if (!job?.id || !job.sessionId) return;
    const value = { ...job, lastOutput: String(job.lastOutput || '').slice(-16000) };
    this.read(job.sessionId).set(job.id, value);
    if (value.status !== 'running') this.flush(job.sessionId);
    else if (!this.timers.has(job.sessionId)) {
      const timer = setTimeout(() => this.flush(job.sessionId), 500);
      timer.unref?.(); this.timers.set(job.sessionId, timer);
    }
  }
  flush(id) {
    clearTimeout(this.timers.get(id)); this.timers.delete(id);
    try {
      fs.mkdirSync(this.directory, { recursive: true });
      const file = this.file(id), tmp = file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ sessionId: id, jobs: [...this.read(id).values()] }));
      fs.renameSync(tmp, file);
    } catch (error) { console.warn('[BackgroundToolHistory] Save failed:', error.message); }
  }
  list(id, live = []) {
    const jobs = new Map(this.read(id));
    for (const job of live) jobs.set(job.id, { ...job });
    return [...jobs.values()].sort((a, b) => b.startedAt - a.startedAt);
  }
}

let history;
const installed = new WeakSet();
function store() {
  return history ||= new BackgroundToolHistory(path.join(process.env.SHINEAI_USER_DATA_DIR, 'background-tool-history'));
}
function install(native, sdk) {
  if (installed.has(native)) return;
  installed.add(native);
  const records = store();
  const changed = native.emitChange;
  native.emitChange = function (id) {
    for (const job of this.jobs.values()) if (job.sessionId === id) {
      if (job.status !== 'running') job.endedAt ??= Date.now();
      records.remember(job);
    }
    return changed.call(this, id);
  };
  // Output may arrive between exit and close. Capture the final buffered text.
  const append = native.appendOutput;
  native.appendOutput = function (id, text) {
    const result = append.call(this, id, text), job = this.get(id);
    if (job) records.remember(job);
    return result;
  };

  let notification;
  const handle = sdk.handleSystemMessage;
  sdk.handleSystemMessage = function (id, message, owner) {
    const previous = notification; notification = message;
    try {
      const result = handle.call(this, id, message, owner);
      const task = this.tasks.get(message?.task_id);
      if (task?.visible) records.remember(task.job);
      return result;
    } finally { notification = previous; }
  };
  const finish = sdk.finish;
  sdk.finish = function (id) {
    const task = this.tasks.get(id), message = notification || {}, patch = message.patch || message;
    if (task?.visible) {
      const states = { completed: 'exited', failed: 'error', stopped: 'killed', killed: 'killed' };
      const code = patch.exit_code ?? patch.exitCode;
      records.remember({ ...task.job, status: states[patch.status] || 'ended', endedAt: Date.now(),
        exitCode: Number.isInteger(code) ? code : undefined,
        lastOutput: typeof patch.output === 'string' ? patch.output : '',
        summary: typeof message.summary === 'string' ? message.summary : undefined });
    }
    return finish.call(this, id);
  };
  const drop = sdk.dropOwner;
  sdk.dropOwner = function (owner) {
    for (const task of this.tasks.values()) if (task.owner === owner && task.visible) {
      records.remember({ ...task.job, status: 'interrupted' });
    }
    return drop.call(this, owner);
  };
}
function list(id, live) { return store().list(id, live); }
function displayText(job, fallback) {
  // Suppress only a verified success that has an exact tool-card association.
  // Unknown/unmatched outcomes and failures retain the original visible notice.
  return job.toolUseId && job.status === 'exited' && job.exitCode === 0 ? undefined : fallback;
}
module.exports = { BackgroundToolHistory, install, list, displayText };
