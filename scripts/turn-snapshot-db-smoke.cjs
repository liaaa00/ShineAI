// Run with the bundled Electron in Node mode (the application's SQLite ABI).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const { builtinModules } = require('node:module');
const { EventEmitter } = require('node:events');
const { installSnapshotBudget } = require('../src/main/extensions/snapshot-budget.cjs');
const { protectRollback } = require('../src/main/extensions/rollback-guard.cjs');
const { beforeTool } = require('../src/main/extensions/turn-snapshot.cjs');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, '.test-data', 'turn-snapshot-db-' + Date.now());
const work = path.join(directory, 'work'); fs.mkdirSync(work, { recursive: true });
const file = path.join(work, 'example.txt'); fs.writeFileSync(file, 'user uncommitted edit');
const Database = require(path.join(root, 'node_modules/better-sqlite3'));
const db = new Database(path.join(directory, 'test.db'));
db.exec(`CREATE TABLE rollback_snapshots(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT,message_uuid TEXT,commit_hash TEXT,created_at TEXT);
CREATE TABLE conversation_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT,message_uuid TEXT,message_id TEXT,timestamp TEXT);`);
const exposed = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'src/main/chunks/RollbackService-CtlxtM3f.js'), 'utf8'), {
  exports: exposed, require: name => builtinModules.includes(name) || name.startsWith('node:') ? require(name) : { getGitCommand: () => 'git' },
  process, console, setTimeout, clearTimeout
}, { timeout: 10000 });
function open() {
  const service = new exposed.RollbackService({ database: { getDb: () => db }, shadowRoot: path.join(directory, 'shadow'), resolveWorkingDirectory: () => work, gitCommand: () => 'git' });
  // File-content restoration, separate from production deadline cancellation tests.
  installSnapshotBudget(service, { budgetMs: 15000 });
  const manager = new EventEmitter(); manager.getSession = () => ({ status: 'waiting_input' });
  service.testManager = manager;
  return protectRollback(service, manager);
}
function message(id, service) {
  db.prepare('INSERT INTO conversation_messages(session_id,message_uuid,message_id,timestamp) VALUES(?,?,?,?)')
    .run('s', id, id, new Date().toISOString());
  service.testManager.emit('conversation-message', 's', { id, role: 'user' });
}
async function run() {
  const service = open();
  service.recordSnapshot('s', null, 'a'.repeat(40));
  db.prepare('UPDATE rollback_snapshots SET created_at=?').run('2026-01-01T00:00:00.000Z');
  service.prepareTurn('s', { providerId: 'openai-api' }); message('anchor', service);
  assert.equal(service.resolveSnapshotCommit('s', 'anchor'), null);
  const before = db.prepare('SELECT * FROM rollback_snapshots ORDER BY id DESC LIMIT 1').get();
  await beforeTool('s', 'write_file');
  const after = db.prepare('SELECT * FROM rollback_snapshots ORDER BY id DESC LIMIT 1').get();
  assert.equal(before.id, after.id); assert.equal(before.created_at, after.created_at);
  assert.equal(after.message_uuid, 'anchor');
  assert.match(service.resolveSnapshotCommit('s', 'anchor') || '', /^[a-f0-9]{40}$/);
  fs.writeFileSync(file, 'model edit');
  const request = { sessionId: 's', targetMessageId: 'anchor', mode: 'files+dialog' };
  assert.equal((await service.dryRun(request)).snapshotAvailable, true);
  assert.equal((await service.applyFilesOnly(request)).ok, true);
  assert.equal(fs.readFileSync(file, 'utf8'), 'user uncommitted edit');
  // Avoid equal-millisecond ordering when checking a later turn's boundary.
  await new Promise(r => setTimeout(r, 5));
  service.prepareTurn('s', { providerId: 'codex' }); message('external', service);
  const restarted = open();
  assert.equal(restarted.resolveSnapshotCommit('s', 'external'), null);
  const preview = await restarted.dryRun({ ...request, targetMessageId: 'external' });
  assert.equal(preview.mode, 'dialog-only'); assert.equal(preview.snapshotAvailable, false);
  return { checks: { lateCapturePreservesOriginalSendBoundary: true, realGitRestoresPreToolUserEdits: true, noOldSnapshotForUngatedAdapterAfterRestart: true } };
}
run().then(report => {
  fs.mkdirSync(path.join(root, 'artifacts/turn-snapshot'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/turn-snapshot/db-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.close());
