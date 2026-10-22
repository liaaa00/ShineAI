'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const { installTurnSnapshots, beforeTool } = require('../src/main/extensions/turn-snapshot.cjs');
const { permissionHook } = require('../src/main/extensions/execution-policy.cjs');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/main/index.js'), 'utf8');
const start = source.indexOf("async['execute'](a02,a03,a04){await require(\"./extensions/turn-snapshot.cjs\")");
assert.ok(start > 0, 'Native executor must have the write barrier');
const executorMethod = source.slice(start, source.indexOf('["resolveLockKey"](a02,a03){', start));
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function fixture(t, adapter = { providerId: 'openai-api' }) {
  const id = randomUUID(), rows = [], entered = deferred(), finish = deferred();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shine-lazy-snapshot-'));
  const file = path.join(directory, 'work.txt'); fs.writeFileSync(file, 'user edit');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let captures = 0, baseline;
  const service = {
    database: { getDb: () => ({ prepare: () => ({ run(commit, session, token) {
      const row = rows.find(r => r.session === session && r.token === token);
      if (!row) return { changes: 0 }; row.commit = commit; return { changes: 1 };
    } }) }) },
    recordSnapshot(session, token, commit) { rows.push({ session, token, commit, createdAt: Date.now() }); },
    async captureSnapshot(session, token) {
      captures++; baseline = fs.readFileSync(file, 'utf8'); entered.resolve();
      const ok = await finish.promise;
      this.recordSnapshot(session, token, ok ? 'valid-commit' : 'snapshot-unavailable:failed');
      return { ok };
    }
  };
  installTurnSnapshots(service);
  service.prepareTurn(id, adapter);
  const executor = vm.runInNewContext('({' + executorMethod + '})', {
    require: name => require(path.join(root, 'src/main', name)), a7z: () => {}, console
  });
  Object.assign(executor, { options: { sessionId: id }, handlers: new Map(), resolveLockKey: () => null });
  executor.handlers.set('write_file', () => { fs.writeFileSync(file, 'model edit'); return 'written'; });
  return { id, rows, entered, finish, service, executor, file, captures: () => captures, baseline: () => baseline };
}
test('sending and safe reads perform no Git capture; concurrent writes wait for one baseline', async t => {
  const f = fixture(t), beforeSend = f.rows[0].createdAt;
  assert.equal(f.captures(), 0);
  await beforeTool(f.id, 'read_file');
  assert.equal(f.captures(), 0);
  const writes = [f.executor.execute('write_file', {}), f.executor.execute('write_file', {})];
  await f.entered.promise;
  assert.equal(f.captures(), 1);
  assert.equal(fs.readFileSync(f.file, 'utf8'), 'user edit');
  f.finish.resolve(true); await Promise.all(writes);
  assert.equal(f.baseline(), 'user edit');
  assert.equal(fs.readFileSync(f.file, 'utf8'), 'model edit');
  assert.equal(f.rows.length, 1);
  assert.equal(f.rows[0].commit, 'valid-commit');
  assert.equal(f.rows[0].createdAt, beforeSend, 'Capture must preserve the pre-send rollback boundary');
});
test('the actual dispatch options establish a boundary for each user dispatch, preserving internal completions', () => {
  const start = source.indexOf('["buildAdapterSendMessageOptions"](a02,a03){');
  const end = source.indexOf('["buildPlanDocumentSessionInfo"]', start);
  const object = vm.runInNewContext('({' + source.slice(start, end) + '})', {
    require: name => require(path.join(root, 'src/main', name)), a7z: () => {}, a01: () => {}
  });
  const seen = [], adapter = { providerId: 'openai-api' };
  Object.assign(object, { resolveAdapter: () => adapter, rollbackService: { prepareTurn: id => seen.push(id) } });
  const session = { id: 'dispatch-options-test', provider: {}, config: {} };
  object.buildAdapterSendMessageOptions(session);
  object.buildAdapterSendMessageOptions(session, { source: 'user' });
  object.buildAdapterSendMessageOptions(session, { source: 'agent_completion' });
  object.buildAdapterSendMessageOptions({ ...session, config: { internal: true } });
  assert.deepEqual(seen, [session.id, session.id]);
});
test('snapshot failure leaves an unavailable barrier while allowing the original tool after capture settles', async t => {
  const f = fixture(t);
  const write = f.executor.execute('write_file', {}); await f.entered.promise;
  f.finish.resolve(false); await write;
  assert.equal(f.rows.length, 1);
  assert.equal(f.rows[0].commit, 'snapshot-unavailable:failed');
  assert.equal(fs.readFileSync(f.file, 'utf8'), 'model edit');
});
test('a cancelled tool never captures or modifies files', async t => {
  const f = fixture(t), controller = new AbortController(); controller.abort();
  await assert.rejects(f.executor.execute('write_file', {}, { signal: controller.signal }), /cancelled/);
  assert.equal(f.captures(), 0); assert.equal(fs.readFileSync(f.file, 'utf8'), 'user edit');
});
test('Claude SDK pre-tool barrier runs before existing permission decisions, including full auto', async t => {
  const f = fixture(t, { createPermissionHandler() {} }); let permissions = 0;
  const hook = permissionHook({ createPermissionHandler: () => async () => { permissions++; return { behavior: 'deny', message: 'policy' }; } }, f.id, { permissionMode: 'full_auto' }).hooks[0];
  const result = hook({ tool_name: 'Bash', tool_input: { command: 'arbitrary command' } });
  await f.entered.promise; assert.equal(permissions, 0);
  f.finish.resolve(true);
  assert.equal((await result).hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(permissions, 1);
});
test('a superseded capture cannot replace the earlier unavailable barrier or allow an old tool', async t => {
  const f = fixture(t); const write = f.executor.execute('write_file', {});
  await f.entered.promise;
  f.service.prepareTurn(f.id, { providerId: 'openai-api' });
  f.finish.resolve(true);
  await assert.rejects(write, /cancelled/);
  assert.equal(fs.readFileSync(f.file, 'utf8'), 'user edit');
  assert.equal(f.rows.length, 2);
  assert.ok(f.rows.every(r => r.commit === 'snapshot-unavailable:pending-tool'));
});
test('unknown MCP/delegation tools are gated; external adapters without a write hook never claim file rollback', async t => {
  const f = fixture(t); const gate = beforeTool(f.id, 'mcp__external__read_and_modify');
  await f.entered.promise; f.finish.resolve(true); await gate;
  assert.equal(f.captures(), 1);
  const external = fixture(t, { providerId: 'codex' });
  await beforeTool(external.id, 'write_file');
  assert.equal(external.captures(), 0);
  assert.equal(external.rows[0].commit, 'snapshot-unavailable:adapter-without-write-gate');
});
