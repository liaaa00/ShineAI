const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { installSnapshotBudget } = require('../src/main/extensions/snapshot-budget.cjs');

function fixture(t, { budgetMs = 200, capture, records = ['old-valid-snapshot'] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shine-capture-budget-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const service = {
    execFileImpl: promisify(execFile), shadowDir: () => dir,
    resolveSnapshotCommit: () => records.at(-1),
    recordSnapshot: (_id, _message, value) => records.push(value),
    async captureSnapshot(id) {
      try { await capture(service, dir, id); return { ok: true }; }
      catch { return { ok: false }; }
    }
  };
  installSnapshotBudget(service, { budgetMs });
  return { service, dir, records };
}

test('timeout kills the real subprocess before sending can proceed and cannot later write a snapshot', async t => {
  let completed = false;
  const { service, dir } = fixture(t, { capture: async (s, dir) => {
    const code = 'setTimeout(()=>require("fs").writeFileSync(process.argv[1],"late"),700)';
    try { await s.execFileImpl(process.execPath, ['-e', code, path.join(dir, 'late')], { timeout: 60000, env: process.env }); }
    finally { completed = true; }
  } });
  assert.equal((await service.captureSnapshot('s')).ok, false);
  assert.equal(completed, true);
  assert.equal(service.getCaptureSummary('s').reason, 'budget');
  await new Promise(resolve => setTimeout(resolve, 800));
  assert.equal(fs.existsSync(path.join(dir, 'late')), false);
  assert.equal(service.resolveSnapshotCommit('s', 'new-message'), null);
});

test('the deadline covers all commands together and failure cooldown avoids repeating slow capture', async t => {
  const timeouts = [];
  const { service } = fixture(t, { budgetMs: 400, capture: async s => {
    for (let i = 0; i < 3; i++) {
      await s.execFileImpl(process.execPath, ['-e', 'setTimeout(()=>{},180)'], { env: process.env, timeout: 60000 });
    }
  } });
  const execute = service.execFileImpl;
  service.execFileImpl = async (...args) => {
    timeouts.push(Date.now());
    return execute(...args);
  };
  assert.equal((await service.captureSnapshot('s')).ok, false);
  const count = timeouts.length;
  assert.equal((await service.captureSnapshot('s')).ok, false);
  assert.equal(timeouts.length, count);
  assert.equal(service.getCaptureSummary('s').reason, 'cooldown');
});

test('superseding a capture kills its real child without cooling down the replacement turn', async t => {
  let captures = 0;
  const { service, dir } = fixture(t, { capture: async (s, dir) => {
    captures++;
    await s.execFileImpl(process.execPath, ['-e', 'setTimeout(()=>require("fs").writeFileSync(process.argv[1],"late"),700)', path.join(dir, 'late')], { env: process.env, timeout: 60000 });
  } });
  const pending = service.captureSnapshot('s');
  service.cancelSnapshotCapture('s');
  assert.equal((await pending).ok, false);
  assert.equal(service.getCaptureSummary('s').reason, 'cancelled');
  await service.captureSnapshot('s');
  assert.equal(captures, 2, 'Replacement turn must attempt a new baseline');
  assert.equal(service.getCaptureSummary('s').reason, 'budget');
  await new Promise(resolve => setTimeout(resolve, 800));
  assert.equal(fs.existsSync(path.join(dir, 'late')), false);
});

test('failed baselines remain unavailable after reinstalling the service and never reuse a previous success', async t => {
  const records = ['old-valid-snapshot'];
  const { service } = fixture(t, { records, budgetMs: 2000, capture: async s => {
    await s.execFileImpl(process.execPath, ['-e', 'process.stderr.write("specific git failure");process.exit(7)'], { env: process.env });
  } });
  await service.captureSnapshot('s');
  assert.equal(service.getCaptureSummary('s').reason, 'git-failed');
  assert.match(service.getCaptureSummary('s').detail, /specific git failure/);
  const restarted = fixture(t, { records, capture: async () => {} }).service;
  assert.equal(restarted.resolveSnapshotCommit('s', 'new-message'), null);
  records.push('new-valid-snapshot');
  assert.equal(restarted.resolveSnapshotCommit('s', 'later-message'), 'new-valid-snapshot');
});

test('capture isolates and cleans its index without changing the ordinary rollback execution timeout', async t => {
  let index;
  const { service, dir } = fixture(t, { budgetMs: 1000, capture: async (s, dir) => {
    const result = await s.execFileImpl(process.execPath, ['-e', 'process.stdout.write(process.env.GIT_INDEX_FILE)'], { env: process.env });
    index = result.stdout;
    fs.writeFileSync(index, 'temporary index');
    fs.writeFileSync(index + '.lock', 'temporary lock');
  } });
  fs.writeFileSync(path.join(dir, 'index'), 'ordinary index');
  assert.equal((await service.captureSnapshot('s')).ok, true);
  assert.notEqual(index, path.join(dir, 'index'));
  assert.equal(fs.existsSync(index), false);
  assert.equal(fs.existsSync(index + '.lock'), false);
  assert.equal(fs.readFileSync(path.join(dir, 'index'), 'utf8'), 'ordinary index');
  const ordinary = await service.execFileImpl(process.execPath, ['-e', 'process.stdout.write("ordinary rollback")'], { env: process.env, timeout: 10000 });
  assert.equal(ordinary.stdout, 'ordinary rollback');
});
