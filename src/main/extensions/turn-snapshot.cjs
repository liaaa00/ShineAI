'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');
const installed = new WeakSet(), turns = new Map();
const safeTools = new Set([
  'read_file', 'list_files', 'list_directory', 'search_files', 'web_search',
  'Read', 'Glob', 'Grep', 'LS', 'WebFetch', 'WebSearch', 'TodoRead', 'TodoWrite',
  'update_plan', 'AskUserQuestion', 'ExitPlanMode', 'view_image'
]);

// A model request does not need Git. Only a tool that could modify the workspace
// waits for its turn's baseline. Unknown tools (including shells/MCP/delegation)
// are deliberately gated; a tool name containing "read" is not proof of safety.
function supportsGate(adapter) {
  return adapter?.providerId === 'openai-api' ||
    typeof adapter?.createPermissionHandler === 'function';
}
function installTurnSnapshots(service, manager) {
  if (installed.has(service)) return;
  installed.add(service);
  const scope = new AsyncLocalStorage(), record = service.recordSnapshot.bind(service);
  service.recordSnapshot = (id, messageId, commit) => {
    const turn = scope.getStore();
    if (!turn) return record(id, messageId, commit);
    if (turn.obsolete) return;
    // Keep the original pre-send timestamp. Appending a late snapshot would
    // miss this turn's user message and could incorrectly restore older files.
    const db = service.database?.getDb();
    const result = db?.prepare('UPDATE rollback_snapshots SET commit_hash = ? WHERE session_id = ? AND message_uuid = ?')
      .run(commit, id, turn.rowToken);
    if (!result?.changes) throw Error('Cannot persist the file baseline for this turn');
  };
  service.prepareTurn = (id, adapter) => {
    const previous = turns.get(id);
    if (previous) {
      previous.obsolete = true;
      previous.service.cancelSnapshotCapture?.(id);
    }
    const turn = { id, service, token: 'turn-' + randomUUID(), supported: supportsGate(adapter), previous: previous?.pending };
    turn.rowToken = turn.token;
    turn.capture = () => scope.run(turn, () => service.captureSnapshot(id, turn.token));
    // Persist a barrier immediately, without Git or a subprocess. A failed,
    // unsupported or interrupted turn must never inherit an older baseline.
    record(id, turn.token, 'snapshot-unavailable:' + (turn.supported ? 'pending-tool' : 'adapter-without-write-gate'));
    turns.set(id, turn);
    if (turns.size > 500) for (const [key, value] of turns) {
      if (!value.capturing && key !== id) { turns.delete(key); break; }
    }
  };
  manager?.on?.('conversation-message', (id, message) => {
    const turn = turns.get(id);
    if (turn?.service !== service || turn.obsolete || turn.messageId || message?.role !== 'user' || !message.id) return;
    try {
      const result = service.database?.getDb()?.prepare('UPDATE rollback_snapshots SET message_uuid = ? WHERE session_id = ? AND message_uuid = ?')
        .run(message.id, id, turn.rowToken);
      if (result?.changes) { turn.rowToken = message.id; turn.messageId = message.id; }
    } catch (error) { console.warn('[TurnSnapshot] Cannot bind user message:', error.message); }
  });
}
async function beforeTool(id, name, signal) {
  const turn = turns.get(id);
  const checkCancelled = () => {
    if (signal?.aborted || turn?.obsolete) throw Error('Tool cancelled before file changes');
  };
  checkCancelled();
  if (!turn?.supported || safeTools.has(name)) return;
  if (!turn.pending) {
    turn.capturing = true;
    turn.pending = (async () => {
      await turn.previous?.catch(() => {});
      checkCancelled();
      return turn.capture();
    })().finally(() => { turn.capturing = false; });
  }
  await turn.pending;
  checkCancelled();
}
module.exports = { installTurnSnapshots, beforeTool, supportsGate };
