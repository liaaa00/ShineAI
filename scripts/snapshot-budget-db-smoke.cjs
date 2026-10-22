// Run with the bundled Electron in Node mode for the application's SQLite ABI.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { builtinModules } = require('node:module');
const root = path.resolve(__dirname, '..');
const Database = require(path.join(root, 'node_modules/better-sqlite3'));
const { protectRollback } = require('../src/main/extensions/rollback-guard.cjs');
const { installSnapshotBudget } = require('../src/main/extensions/snapshot-budget.cjs');
const directory = path.join(root, '.test-data', 'snapshot-db-' + Date.now());
fs.mkdirSync(directory, { recursive: true });
const filename = path.join(directory, 'test.db');
const source = fs.readFileSync(path.join(root, 'src/main/chunks/RollbackService-CtlxtM3f.js'), 'utf8');
const exposed = {};
vm.runInNewContext(source, { exports: exposed, require: name => builtinModules.includes(name) || name.startsWith('node:') ? require(name) : { getGitCommand: () => 'git' }, process, console, setTimeout, clearTimeout }, { timeout: 10000 });
const db = new Database(filename);
db.exec(`CREATE TABLE rollback_snapshots(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT,message_uuid TEXT,commit_hash TEXT,created_at TEXT);
CREATE TABLE conversation_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT,message_uuid TEXT,message_id TEXT,timestamp TEXT);`);
function open() {
  const service = new exposed.RollbackService({ database: { getDb: () => db }, shadowRoot: path.join(directory, 'shadow'), resolveWorkingDirectory: () => directory, gitCommand: () => 'git' });
  // Force a failure using the actual service catch path, without a real Git mutation.
  service.execFileImpl = async () => { throw Object.assign(Error('fixture failure'), { code: 7, stderr: 'fixture failure' }); };
  installSnapshotBudget(service, { budgetMs: 1000 });
  return protectRollback(service, { getSession: () => ({ status: 'waiting_input' }) });
}
async function run() {
  const service = open();
  service.recordSnapshot('s', null, 'a'.repeat(40));
  db.prepare('UPDATE rollback_snapshots SET created_at=?').run('2026-01-01T00:00:00.000Z');
  assert.equal((await service.captureSnapshot('s')).ok, false);
  const timestamp = new Date(Date.now() + 10).toISOString();
  db.prepare('INSERT INTO conversation_messages(session_id,message_uuid,message_id,timestamp) VALUES(?,?,?,?)').run('s', 'anchor', 'anchor', timestamp);
  assert.equal(service.resolveSnapshotCommit('s', 'anchor'), null);
  const restarted = open();
  assert.equal(restarted.resolveSnapshotCommit('s', 'anchor'), null);
  const preview = await restarted.dryRun({ sessionId: 's', targetMessageId: 'anchor', mode: 'files+dialog' });
  assert.equal(preview.snapshotAvailable, false);
  assert.equal(preview.mode, 'dialog-only');
  assert.equal(preview.reason, 'no-snapshot');
  return { checks: { failureBarrierPersistedInRealSqlite: true, olderSuccessfulSnapshotNotReusedAfterRestart: true, missingSnapshotPreviewAllowsDialogOnly: true } };
}
run().then(result => {
  fs.mkdirSync(path.join(root, 'artifacts/snapshot-budget'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/snapshot-budget/db-report.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.close());
