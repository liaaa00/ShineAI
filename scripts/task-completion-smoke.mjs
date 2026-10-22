import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const installed = process.argv.includes('--installed');
const dir = path.join(root, 'artifacts/task-completion', installed ? 'installed' : 'development');
const data = path.join(root, '.test-data', 'task-completion-' + Date.now());
const workspace = path.join(data, 'workspace');
fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(workspace, { recursive: true });
const source = fs.readFileSync(path.join(root, 'src/renderer/assets/index-0LVJEr5c.js'), 'utf8');
const aliases = Object.fromEntries(['useSessionStore', 'useUIStore'].map(name => [name, source.match(new RegExp(name + ' as (\\w+)'))[1]]));
const report = { checks: {}, errors: [], scope: 'Actual Electron application, IPC, native API adapter and loopback model responses. The native toast presenter is intercepted; no real Windows toast clicks or external model calls. Startup no-replay is additionally covered by exact application event-wiring tests.' };
const requests = [], backups = []; let app, page, held;
function answer(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  for (const choices of [[{ index: 0, delta: { content: 'NOTIFICATION_FRESH_ANSWER' }, finish_reason: null }], [{ index: 0, delta: {}, finish_reason: 'stop' }]]) {
    res.write('data: ' + JSON.stringify({ id: 'notification-fixture', object: 'chat.completion.chunk', choices }) + '\n\n');
  }
  res.end('data: [DONE]\n\n');
}
const server = http.createServer((req, res) => {
  let raw = ''; req.on('data', b => raw += b); req.on('end', () => {
    requests.push(JSON.parse(raw || '{}'));
    if (raw.includes('HOLD_FOREGROUND')) held = res;
    else answer(res);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
async function until(fn, label, timeout = 45000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await fn()) return; await new Promise(r => setTimeout(r, 100)); }
  throw Error('Timed out: ' + label);
}
async function open() {
  ({ app, page } = await openTestApp(data, { auth: 19863, meeting: 18663 }, installed ? 'E:/AI/ShineAI/ShineAI.exe' : undefined, { SHINEAI_DEV_BUTLER_DIR: path.join(data, 'butler') }));
  page.on('pageerror', error => report.errors.push(error.message));
  await app.evaluate(({ app }) => {
    const path = process.getBuiltinModule('path'), { createRequire } = process.getBuiltinModule('module');
    const require = createRequire(path.join(app.getAppPath(), 'out/main/index.js'));
    const presenter = require('./extensions/task-notifications.cjs');
    globalThis.completionToasts = [];
    const policy = require('./extensions/task-completion-policy.cjs'), originalViewed = policy.isSessionViewed;
    globalThis.completionViews = [];
    policy.isSessionViewed = options => {
      globalThis.completionViewOptions = options;
      const result = originalViewed(options);
      globalThis.completionViews.push({ sessionId: options.sessionId, result, subscriptions: [...options.subscriptions.values()].map(({ wc, topics }) => {
        const w = options.BrowserWindow.fromWebContents(wc);
        return { topics: [...topics], focused: w?.isFocused(), visible: w?.isVisible(), minimized: w?.isMinimized() };
      }) });
      return result;
    };
    presenter.showTaskNotification = options => { globalThis.completionToasts.push({ title: options.title, sessionId: options.sessionId }); };
  });
}
const toasts = () => app.evaluate(() => globalThis.completionToasts);
async function idle(id) {
  await until(async () => (await page.evaluate(() => window.shineAI.session.getAll())).find(s => s.id === id)?.status === 'waiting_input', 'session waits for input');
  await page.waitForTimeout(200);
}
async function background() {
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/renderer/index.html')).hide());
}
async function create(name) {
  const result = await page.evaluate(({ name, workspace }) => window.shineAI.session.create({ name, workingDirectory: workspace, providerId: 'notification-fixture', model: 'notification-fixture', permissionMode: 'full_auto', worktreeEnabled: false }), { name, workspace });
  assert.equal(result.success, true); return result.sessionId || result.id;
}
async function send(id, text) {
  const result = await page.evaluate(({ id, text }) => window.shineAI.session.sendMessage(id, text), { id, text });
  assert.equal(result.success, true, JSON.stringify(result)); return result;
}
try {
  for (const scheme of ['shineai-dev', 'claudeops-dev']) {
    const key = 'HKCU\\Software\\Classes\\' + scheme, file = path.join(dir, scheme + '.reg');
    try { execFileSync('reg.exe', ['export', key, file, '/y'], { stdio: 'ignore', windowsHide: true }); backups.push({ key, file }); } catch { backups.push({ key }); }
  }
  await open(); await completeOnboarding(page);
  await page.evaluate(() => window.shineAI.settings.update('backgroundAiAnalysisEnabled', false));
  await page.evaluate(url => window.shineAI.provider.create({ id: 'notification-fixture', name: '通知本地验证', adapterType: 'openai-api', command: 'api', enabled: true, apiBaseUrl: url, apiKey: 'local-fixture-only', defaultModel: 'notification-fixture' }), 'http://127.0.0.1:' + server.address().port + '/v1');
  const id = await create('后台完成通知验证'); await background();
  await send(id, 'BACKGROUND_ONE'); await idle(id);
  await until(async () => (await toasts()).length === 1, 'background answer notifies');
  assert.equal((await toasts())[0].sessionId, id);
  report.checks.freshBackgroundAnswerNotifiesOnce = true;
  await send(id, 'BACKGROUND_TWO'); await idle(id);
  assert.equal((await toasts()).length, 2);
  report.checks.nextUserRoundNotifiesAgain = true;

  const foreground = await create('前台静默验证');
  await page.evaluate(async ({ aliases, id }) => {
    const m = await import('./assets/index-0LVJEr5c.js');
    m[aliases.useUIStore].getState().setActiveWorkspace('project');
    m[aliases.useSessionStore].getState().selectSession(id);
  }, { aliases, id: foreground });
  await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/renderer/index.html')); w.show(); w.focus(); });
  await page.getByText('前台静默验证', { exact: true }).first().click();
  await send(foreground, 'HOLD_FOREGROUND'); await until(() => !!held, 'foreground request reaches fixture');
  await until(() => app.evaluate((_electron, id) => [...globalThis.completionViewOptions.subscriptions.values()].some(({topics}) => topics.has('task-notification-view:' + id)), foreground), 'visible conversation subscription reaches main process', 5000);
  const focused = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/renderer/index.html')).isFocused());
  assert.equal(focused, true, 'Foreground test requires actual focus');
  answer(held); held = null; await idle(foreground);
  assert.equal((await toasts()).length, 2);
  await page.getByText('NOTIFICATION_FRESH_ANSWER', { exact: true }).first().waitFor();
  await page.screenshot({ path: path.join(dir, 'foreground-answer.png') });
  report.checks.exactForegroundConversationCompletesWithoutDesktopToast = true;

  await send(id, 'BACKGROUND_WHILE_VIEWING_ANOTHER'); await idle(id);
  await until(async () => (await toasts()).length === 3, 'background conversation still notifies while another conversation is viewed');
  assert.equal((await toasts()).at(-1).sessionId, id);
  report.checks.otherBackgroundConversationNotifiesWhileAppIsFocused = true;

  const count = requests.length;
  await app.close(); app = null; await open();
  await page.waitForTimeout(4000);
  assert.equal(requests.length, count, 'Restoration must not send a model request');
  assert.equal((await toasts()).length, 0, 'Restoration observed after renderer readiness stays quiet');
  report.checks.restartDoesNotRequestNewAnswersOrReplayObservedToasts = true;
  await background(); await send(id, 'BACKGROUND_AFTER_RESTART'); await idle(id);
  await until(async () => (await toasts()).length === 1, 'new round after restart notifies');
  assert.equal((await toasts())[0].sessionId, id);
  report.checks.newRoundAfterRestartStillNotifies = true;
  report.requestCount = requests.length;
  assert.equal(report.errors.length, 0);
} catch (error) {
  report.errors.push(error.stack); process.exitCode = 1;
  if (app) {
    report.views = await app.evaluate(() => globalThis.completionViews).catch(() => []);
  }
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(dir, 'failure.png') }).catch(() => {});
} finally {
  if (held) held.destroy();
  if (app) await app.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  for (const { key, file } of backups) {
    try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore', windowsHide: true }); } catch {}
    if (file) execFileSync('reg.exe', ['import', file], { stdio: 'ignore', windowsHide: true });
  }
  fs.writeFileSync(path.join(dir, 'smoke-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
