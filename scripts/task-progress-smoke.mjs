import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const executable = process.argv.find(arg => arg.startsWith('--executable='))?.slice(13);
const data = path.join(root, '.test-data', `task-progress-${Date.now()}`);
const workspace = path.join(data, 'workspace');
const output = path.join(root, 'artifacts', 'task-progress', ...(executable ? ['installed'] : []));
fs.mkdirSync(output, { recursive: true }); fs.mkdirSync(workspace, { recursive: true });
const report = { scope: 'Isolated Electron, real native background Bash process, deterministic local HTTP model; no paid provider calls or live profile edits.', checks: {}, errors: [] };
const requests = [], backups = [];
let app, page, sessionId, releaseFirst, releaseFinal;
const first = new Promise(resolve => releaseFirst = resolve), final = new Promise(resolve => releaseFinal = resolve);
const finish = (res, delta, reason = 'stop') => {
  res.setHeader('Content-Type', 'text/event-stream');
  for (const item of [{ delta, finish_reason: null }, { delta: {}, finish_reason: reason }]) res.write('data: ' + JSON.stringify({ id: 'progress-fixture', choices: [{ index: 0, ...item }] }) + '\n\n');
  res.end('data: [DONE]\n\n');
};
const server = http.createServer((req, res) => {
  let raw = ''; req.on('data', chunk => raw += chunk);
  req.on('end', async () => {
    try {
      const body = JSON.parse(raw);
      if (!body.stream) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: '进度验证' } }] })); return; }
      requests.push(body);
      if (requests.length === 1) {
        await first;
        finish(res, { tool_calls: [{ index: 0, id: 'progress-background', type: 'function', function: { name: 'bash', arguments: JSON.stringify({ command: 'sleep 18; echo TASK_PROGRESS_VERIFIED; exit 0', run_in_background: true, timeout: 500 }) } }] }, 'tool_calls');
      } else if (requests.length === 2) {
        await final;
        finish(res, { content: '后台检查已经启动，命令仍在执行；请等待实际运行结果。此次回复先结束，后台任务状态会继续更新。' });
      } else finish(res, { content: '后台检查已返回，命令正常结束。' });
    } catch (error) { res.statusCode = 500; res.end(String(error)); }
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
async function until(fn, label, timeout = 60000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw Error('Timed out: ' + label);
}
try {
  const source = fs.readFileSync(path.join(root, 'src/renderer/assets/index-0LVJEr5c.js'), 'utf8');
  const aliases = Object.fromEntries(['useSessionStore', 'useUIStore'].map(name => [name, source.match(new RegExp(name + ' as (\\w+)'))[1]]));
  for (const scheme of ['shineai-dev', 'claudeops-dev']) {
    const key = 'HKCU\\Software\\Classes\\' + scheme, file = path.join(output, scheme + '.reg');
    try { execFileSync('reg.exe', ['export', key, file, '/y'], { stdio: 'ignore', windowsHide: true }); backups.push({ key, file }); }
    catch { backups.push({ key }); }
  }
  ({ app, page } = await openTestApp(data, { auth: 19991, meeting: 18991 }, executable, { SHINEAI_TEST_LANGUAGE: 'zh-CN' }));
  assert.equal(path.resolve((await page.evaluate(() => window.development.getRuntimeInfo())).userData), path.resolve(data));
  report.checks.isolatedProfile = true;
  page.on('pageerror', error => report.errors.push(error.message));
  await completeOnboarding(page);
  assert.equal(await page.evaluate(async () => (await window.shineAI.settings.getAll()).alwaysReplyInChinese), true);
  report.checks.defaultLanguageSettingIsChinese = true;
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/renderer/index.html')).setSize(1440, 960));
  const created = await page.evaluate(async ({ workspace, base }) => {
    await window.shineAI.settings.update('backgroundAiAnalysisEnabled', false);
    await window.shineAI.provider.create({ id: 'task-progress-fixture', name: '进度动画本地验证', adapterType: 'openai-api', command: 'api', enabled: true, apiBaseUrl: base, apiKey: 'fixture-only', defaultModel: 'fixture' });
    return window.shineAI.session.create({ name: '运行进度验证', workingDirectory: workspace, providerId: 'task-progress-fixture', model: 'fixture', worktreeEnabled: false });
  }, { workspace, base: 'http://127.0.0.1:' + server.address().port + '/v1' });
  assert.equal(created.success, true, JSON.stringify(created)); sessionId = created.sessionId || created.id;
  await page.evaluate(async ({ aliases, sessionId }) => {
    const module = await import('./assets/index-0LVJEr5c.js'), store = module[aliases.useSessionStore];
    await store.getState().fetchSessions(); store.setState({ selectedSessionId: sessionId });
    module[aliases.useUIStore].getState().setActiveWorkspace('project');
    module[aliases.useUIStore].setState({ newSessionEntryActive: false });
    await store.getState().openSessionForChat(sessionId);
  }, { aliases, sessionId });
  assert.equal((await page.evaluate(id => window.shineAI.session.sendMessage(id, '运行一次后台检查；完成前不要把任务说成成功。'), sessionId)).success, true);
  await until(() => requests.length >= 1, 'native request reaches test HTTP server');
  const progress = page.getByTestId('task-progress');
  await progress.waitFor({ state: 'visible' });
  await until(async () => (await progress.getAttribute('data-animating')) === 'true', 'running animation');
  assert.match(await progress.innerText(), /正在/);
  assert.equal(await progress.locator('.is-running').evaluate(e => getComputedStyle(e).animationName), 'shine-task-spin');
  const before = await progress.locator('.shine-task-time').innerText();
  await until(async () => (await progress.locator('.shine-task-time').innerText()) !== before, 'elapsed clock changes', 5000);
  const system = requests[0].messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  assert.match(system, /默认中文回复/); assert.match(system, /执行进度和最终交付默认都用简明中文/);
  report.checks.chinesePolicyInActualRequest = true;
  report.checks.animatedRunningStatusAndClock = true;
  await page.screenshot({ path: path.join(output, 'running.png') });
  await progress.screenshot({ path: path.join(output, 'running-strip.png') });
  releaseFirst();
  await until(() => requests.length >= 2, 'real command launches');
  assert.ok((await page.evaluate(id => window.shineAI.session.listBackgroundShells(id), sessionId)).some(j => j.status === 'running'));
  await progress.locator('summary').click();
  assert.match(await progress.innerText(), /执行命令/);
  await page.screenshot({ path: path.join(output, 'operations.png') });
  releaseFinal();
  await until(async () => (await progress.getAttribute('data-task-stage')) === 'background', 'reply ended but real background process stays running');
  assert.match(await progress.innerText(), /回复已结束，1 个后台任务仍在运行/);
  assert.equal(await progress.getAttribute('data-animating'), 'true');
  report.checks.replyEndsWhileRealBackgroundProcessStillRuns = true;
  await page.screenshot({ path: path.join(output, 'background.png') });
  await progress.screenshot({ path: path.join(output, 'background-strip.png') });
  await until(async () => (await page.evaluate(id => window.shineAI.session.listBackgroundShells(id), sessionId)).some(j => j.status === 'exited' && j.exitCode === 0), 'real command exits');
  await until(async () => (await progress.getAttribute('data-task-stage')) === 'complete', 'completion follows actual process exit');
  assert.equal(await progress.getAttribute('data-animating'), 'false');
  assert.equal(await page.getByText('Turn completed (waiting for next input, tokens: 314)', { exact: true }).count(), 0);
  assert.match(await progress.innerText(), /本轮回复已结束/);
  assert.match(await progress.innerText(), /1 个操作成功/);
  assert.equal(requests.length, 2, 'no unnecessary model follow-up');
  report.checks.actualProcessExitStopsAnimation = true;
  const frozen = await progress.locator('.shine-task-time').innerText();
  await page.waitForTimeout(1200); assert.equal(await progress.locator('.shine-task-time').innerText(), frozen);
  report.checks.completionTimeStopsChanging = true;
  await page.screenshot({ path: path.join(output, 'complete.png') });
  await progress.screenshot({ path: path.join(output, 'complete-strip.png') });
  await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/renderer/index.html')); win.setMinimumSize(700, 600); win.setSize(760, 820);
  });
  const geometry = await progress.evaluate(e => ({ width: e.clientWidth, overflow: e.scrollWidth > e.clientWidth, background: getComputedStyle(e).backgroundColor, bottom: e.getBoundingClientRect().bottom, viewport: innerHeight }));
  assert.equal(geometry.overflow, false); assert.equal(geometry.background, 'rgba(0, 0, 0, 0)'); assert.ok(geometry.bottom < geometry.viewport);
  report.checks.transparentAndFitsNarrowWindow = geometry;
  await page.screenshot({ path: path.join(output, 'complete-narrow.png') });
  await page.evaluate(() => window.shineAI.settings.update('alwaysReplyInChinese', false));
  assert.equal(await page.evaluate(async () => (await window.shineAI.settings.getAll()).alwaysReplyInChinese), false);
  report.checks.explicitLanguageOptOutIsPreserved = true;
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) {
  report.errors.push(error.stack || String(error)); process.exitCode = 1;
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
} finally {
  releaseFirst(); releaseFinal();
  if (app) {
    const child = app.process(); let timer;
    const closed = await Promise.race([app.close().then(() => true).catch(() => false), new Promise(resolve => { timer = setTimeout(() => resolve(false), 10000); })]);
    clearTimeout(timer);
    if (!closed && child.exitCode === null && child.signalCode === null) {
      try { execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch { child.kill(); }
    }
  }
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  for (const { key, file } of backups) {
    try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore', windowsHide: true }); } catch {}
    if (file) execFileSync('reg.exe', ['import', file], { stdio: 'ignore', windowsHide: true });
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
// Playwright's close RPC may retain a transport after the bounded shutdown.
// All isolated processes, sockets, protocol keys and the report are handled above.
process.exit(process.exitCode || 0);
