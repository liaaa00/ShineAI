import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const installed = process.argv.includes('--installed');
const dir = path.join(root, 'artifacts/butler-overview-fix', installed ? 'installed' : 'development');
const data = path.join(root, '.test-data', 'butler-overview-' + Date.now());
fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(data, { recursive: true });
const report = { checks: {}, errors: [], scope: 'Real Electron float window and UI actions; isolated profile and in-memory overview fixtures. No user chats or model requests.' };
const backups = []; let app, page, float;
const source = fs.readFileSync(path.join(root, 'src/renderer/assets/index-0LVJEr5c.js'), 'utf8');
const aliases = Object.fromEntries(['useButlerStore', 'useTeamStore', 'useSessionStore', 'useUIStore'].map(name => [name, source.match(new RegExp(name + ' as (\\w+)'))[1]]));
async function until(fn, label, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await fn()) return; await new Promise(r => setTimeout(r, 100)); }
  throw Error('Timed out: ' + label);
}
async function openFloat() {
  await page.evaluate(() => window.shineAI.butler.openFloatWindow());
  await until(() => !!app.windows().find(p => p.url().includes('#/butler-float')), 'native float window');
  float = app.windows().find(p => p.url().includes('#/butler-float'));
  float.on('pageerror', e => report.errors.push(e.message));
  await float.locator('div[title="左键打开任务总览，右键打开菜单"]').waitFor();
}
async function collapsed(label) {
  await until(async () => await float.evaluate(() => Math.abs(innerWidth - 80) <= 1 && Math.abs(innerHeight - 80) <= 1 && document.documentElement.dataset.butlerView === 'avatar'), 'collapsed size');
  assert.equal(await float.locator('#dev-edition-banner').isVisible(), false);
  const surfaces = await float.evaluate(() => {
    // The material adapter may serialize transparent colors as rgba, oklab or
    // color(srgb). Measure alpha instead of depending on a CSS serialization.
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; const ctx = canvas.getContext('2d');
    const alpha = element => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = getComputedStyle(element).backgroundColor; ctx.fillRect(0, 0, 1, 1); return ctx.getImageData(0, 0, 1, 1).data[3]; };
    return { body: alpha(document.body), root: alpha(document.getElementById('root')), wallpaper: document.querySelector('#dev-background') && getComputedStyle(document.querySelector('#dev-background')).display };
  });
  assert.equal(surfaces.body, 0); assert.equal(surfaces.root, 0);
  if (surfaces.wallpaper) assert.equal(surfaces.wallpaper, 'none');
  await float.screenshot({ path: path.join(dir, label + '.png') });
}
async function fixtures(attention = false) {
  await float.evaluate(async ({ aliases, attention }) => {
    const m = await import('./assets/index-0LVJEr5c.js');
    const sessions = [
      { id: 'overview-ready', name: '回答已完成，等待新消息', status: 'waiting_input', needsAttention: false },
      { id: 'overview-running', name: '正在运行，没有进度数据', status: 'running', needsAttention: false },
      { id: 'overview-error', name: '执行失败，无虚假百分比', status: 'error', needsAttention: true },
      { id: 'overview-complete', name: '已确认结束', status: 'completed' },
      { id: 'overview-progress', name: '真实进度任务', status: 'running', progressPercent: 42 }
    ].map(s => ({ ...s, provider: 'Local fixture', startedAt: new Date(Date.now() - 3600000).toISOString() }));
    if (attention) sessions[0] = { ...sessions[0], needsAttention: true, currentDetection: { reason: 'confirmation', detectedAt: Date.now() } };
    const apply = () => m[aliases.useButlerStore].setState({ sessionOverview: sessions, pendingInterventions: [] });
    m[aliases.useButlerStore].setState({ fetchOverview: async () => apply(), fetchInterventions: async () => apply() });
    m[aliases.useTeamStore].setState({ teamInstances: [], loadTeamInstances: async () => {} }); apply();
  }, { aliases, attention });
}
try {
  for (const scheme of ['shineai-dev', 'claudeops-dev']) {
    const key = 'HKCU\\Software\\Classes\\' + scheme, file = path.join(dir, scheme + '.reg');
    try { execFileSync('reg.exe', ['export', key, file, '/y'], { stdio: 'ignore', windowsHide: true }); backups.push({ key, file }); } catch { backups.push({ key }); }
  }
  ({ app, page } = await openTestApp(data, { auth: 19819, meeting: 18619 }, installed ? 'E:/AI/ShineAI/ShineAI.exe' : undefined));
  page.on('pageerror', e => report.errors.push(e.message)); await completeOnboarding(page);
  assert.equal(await page.locator('#dev-edition-banner').isVisible(), true, 'main window keeps its edition label');
  await openFloat(); await collapsed('collapsed-no-wallpaper');
  report.checks.collapsedPetHasNoBannerOrRectangularFill = true;

  // Import actual local wallpaper through the real appearance bridge.
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 640; c.height = 480; const g = c.getContext('2d'); g.fillStyle = '#23748a'; g.fillRect(0, 0, 640, 480); g.fillStyle = '#b6d1e1'; g.fillRect(280, 0, 360, 480); return c.toDataURL().split(',')[1]; });
  const wallpaper = path.join(data, 'wallpaper.png'); fs.writeFileSync(wallpaper, Buffer.from(png, 'base64'));
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }); }, wallpaper);
  const imported = await page.evaluate(() => window.development.appearance.importMedia()); assert.equal(imported.success, true);
  await page.evaluate(async mediaId => { const state = await window.development.appearance.get(); state.config.media = mediaId; state.config.enabled = true; state.config.light.transparency = 65; state.config.dark.transparency = 65; const result = await window.development.appearance.save(state.config); if (!result.success) throw Error(JSON.stringify(result)); }, imported.media.id);
  await until(async () => await float.evaluate(() => document.documentElement.dataset.devBackground === 'on'), 'wallpaper available in float');
  await collapsed('collapsed-with-wallpaper');
  await fixtures(); await float.locator('div[title="左键打开任务总览，右键打开菜单"]').click();
  await float.locator('[data-task-id="overview-ready"]').waitFor();
  const ready = float.locator('[data-task-id="overview-ready"]');
  assert.equal(await ready.getAttribute('data-status-kind'), 'idle');
  assert.match(await ready.innerText(), /等待新消息/); assert.doesNotMatch(await ready.innerText(), /等待干预|70%/);
  assert.equal(await ready.getByTestId('butler-real-progress').count(), 0);
  assert.equal(await float.locator('[data-task-id="overview-running"]').getByTestId('butler-real-progress').count(), 0);
  assert.equal(await float.locator('[data-task-id="overview-error"]').getAttribute('data-status-kind'), 'error');
  assert.equal(await float.locator('[data-task-id="overview-error"]').getByTestId('butler-real-progress').count(), 0);
  assert.match(await float.locator('[data-task-id="overview-progress"]').innerText(), /42%/);
  assert.match(await float.locator('[data-task-id="overview-complete"]').innerText(), /100%/);
  assert.equal(await float.locator('#dev-edition-banner').isVisible(), false);
  assert.equal(await float.evaluate(() => getComputedStyle(document.querySelector('#dev-background')).display), 'block', 'expanded overview retains wallpaper');
  assert.match(await float.locator('button').filter({ hasText: '空闲/暂停' }).innerText(), /1/);
  await float.screenshot({ path: path.join(dir, 'overview-ready.png') });
  report.checks.ordinaryWaitingSeparatedFromAttention = true;
  report.checks.onlyActualProgressDisplayed = true;
  report.checks.expandedWallpaperRetained = true;

  await float.getByRole('button', { name: /空闲\/暂停/ }).click();
  assert.equal(await float.getByTestId('butler-task-row').count(), 1);
  await float.getByRole('button', { name: /空闲\/暂停/ }).click();
  await fixtures(true);
  await until(async () => await ready.getAttribute('data-status-kind') === 'waiting', 'real confirmation needs attention');
  assert.match(await ready.innerText(), /待处理|等待确认/);
  await fixtures(false);
  await until(async () => await ready.getAttribute('data-status-kind') === 'idle', 'resolved attention returns to ordinary idle');
  report.checks.filtersAndAttentionTransitions = true;
  await float.getByRole('button', { name: '待处理', exact: true }).click();
  await float.getByText('暂无待处理事件', { exact: true }).waitFor();
  await float.getByRole('button', { name: '聊天', exact: true }).click();
  await float.getByText('小光独立聊天', { exact: true }).waitFor();
  await float.getByRole('button', { name: '任务总览', exact: true }).click();
  await page.evaluate(async ({ aliases, data }) => {
    const m = await import('./assets/index-0LVJEr5c.js');
    const session = { id: 'overview-ready', name: '回答已完成，等待新消息', status: 'waiting_input', startedAt: Date.now(), workingDirectory: data, config: { providerId: 'codex', model: 'fixture', workingDirectory: data } };
    m[aliases.useSessionStore].setState({ sessions: [session], selectedSessionId: null, conversations: { 'overview-ready': [{ id: 'fixture-answer', role: 'assistant', timestamp: Date.now(), content: 'OVERVIEW_NAVIGATION_TARGET' }] }, conversationLoading: {} });
    m[aliases.useUIStore].getState().setActiveWorkspace('settings');
  }, { aliases, data });
  await ready.getByTitle('打开会话', { exact: true }).click();
  await page.getByText('OVERVIEW_NAVIGATION_TARGET', { exact: true }).waitFor();
  report.checks.openButtonNavigatesToOriginalConversation = true;
  // Opening a conversation intentionally collapses the float automatically.
  if (await float.getByTitle('收起', { exact: true }).isVisible()) await float.getByTitle('收起', { exact: true }).click();
  await collapsed('collapsed-after-tabs');
  report.checks.tabsAndCollapseWork = true;

  await page.evaluate(() => window.shineAI.butler.closeFloatWindow());
  await openFloat(); await collapsed('reopened');
  report.checks.reopenedPetRemainsClean = true;
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
} catch (error) {
  report.errors.push(error.stack); process.exitCode = 1;
  if (float && !float.isClosed()) report.floatState = await float.evaluate(() => ({ size: [innerWidth, innerHeight], view: document.documentElement.dataset.butlerView, text: document.body.innerText.slice(0,900) })).catch(() => null);
  if (float && !float.isClosed()) await float.screenshot({ path: path.join(dir, 'failure.png') }).catch(() => {});
} finally {
  if (app) await app.close();
  for (const { key, file } of backups) { try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore', windowsHide: true }); } catch {} if (file) execFileSync('reg.exe', ['import', file], { stdio: 'ignore', windowsHide: true }); }
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2));
}
