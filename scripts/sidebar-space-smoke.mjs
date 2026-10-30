import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const executable = process.argv.find(arg => arg.startsWith('--executable='))?.slice('--executable='.length);
const data = path.join(root, '.test-data', 'sidebar-space-' + Date.now());
const artifact = path.join(root, 'artifacts', 'sidebar-space');
const directories = ['sidebar-space-a', 'sidebar-space-b'].map(name => path.join(data, name));
for (const directory of directories) fs.mkdirSync(directory, { recursive: true });
fs.mkdirSync(artifact, { recursive: true });
const source = fs.readFileSync(path.join(root, 'src/renderer/assets/index-0LVJEr5c.js'), 'utf8');
const alias = source.match(new RegExp('useSessionStore as ([A-Za-z0-9_$]+)'))?.[1];
assert.ok(alias, 'Session store export missing');
const report = { executable: executable || 'project Electron', checks: {}, errors: [], scope: 'Isolated Electron space/session sidebar; offline provider and no model requests' };
const backups = [];
let app, page;
try {
  for (const scheme of ['shineai-dev', 'claudeops-dev']) {
    const key = ['HKCU', 'Software', 'Classes', scheme].join(String.fromCharCode(92));
    const file = path.join(artifact, scheme + '.reg');
    try { execFileSync('reg.exe', ['export', key, file, '/y'], { stdio: 'ignore', windowsHide: true }); backups.push({ key, file }); }
    catch { backups.push({ key }); }
  }
  ({ app, page } = await openTestApp(data, { auth: 19991, meeting: 18891 }, executable, { SHINEAI_TEST_LANGUAGE: 'zh-CN' }));
  page.on('pageerror', error => report.errors.push(error.message));
  await completeOnboarding(page);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/renderer/index.html')).setSize(1440, 900));
  const created = await page.evaluate(async directories => {
    await window.shineAI.settings.update('backgroundAiAnalysisEnabled', false);
    await window.shineAI.provider.create({ id: 'sidebar-offline', name: '侧栏离线验证', adapterType: 'openai-api', command: 'api', enabled: true, apiBaseUrl: 'http://127.0.0.1:1/v1', apiKey: 'fixture', defaultModel: 'offline' });
    const out = [];
    for (let index = 0; index < directories.length; index++) {
      const result = await window.shineAI.session.create({ name: '侧栏测试会话 ' + (index + 1), workingDirectory: directories[index], providerId: 'sidebar-offline', model: 'offline', worktreeEnabled: false });
      if (!result.success) throw Error(JSON.stringify(result));
      out.push(result.sessionId || result.id);
    }
    return out;
  }, directories);
  assert.equal(created.length, 2);
  await page.evaluate(async alias => { const module = await import('./assets/index-0LVJEr5c.js'); await module[alias].getState().fetchSessions(); window.__sidebarSpaceStore = module[alias]; }, alias);
  await page.locator('button[aria-label="项目会话"]').click();
  const heading = page.locator('[data-shine-space-heading]');
  await heading.waitFor();
  assert.equal((await heading.innerText()).trim().replaceAll(String.fromCharCode(10), ' '), '空间 (2)');
  report.checks.spaceHeadingAndCount = true;
  const groups = page.locator('[data-shine-space-group]');
  await page.waitForFunction(() => document.querySelectorAll('[data-shine-space-group]').length >= 2);
  assert.equal(await groups.count(), 2, 'Each directory should have a directly visible space group');
  for (const id of created) assert.equal(await groups.locator('[data-session-id="' + id + '"]').count(), 1, 'Session should appear once inside its space');
  assert.equal(await page.locator('[data-tour="session-list"] [data-shine-space-group]').count(), 2);
  report.checks.directSpacesAndNestedSessions = true;
  const favorite = await page.evaluate(id => window.shineAI.session.toggleFavorite(id), created[0]);
  assert.ok(favorite && favorite.success !== false, JSON.stringify(favorite));
  await page.evaluate(async alias => { const module = await import('./assets/index-0LVJEr5c.js'); await module[alias].getState().fetchSessions(); }, alias);
  assert.equal(await groups.locator('[data-session-id="' + created[0] + '"]').count(), 1, 'Favorite must remain nested without duplication');
  report.checks.favoriteRemainsInsideSpace = true;
  const first = groups.filter({ hasText: 'sidebar-space-a' });
  assert.equal(await first.count(), 1);
  const fold = first.locator('.shine-space-header button[aria-expanded]').first();
  assert.equal(await fold.getAttribute('aria-expanded'), 'true');
  await fold.click();
  assert.equal(await fold.getAttribute('aria-expanded'), 'false');
  assert.equal(await first.locator('[data-session-id]').count(), 0);
  await fold.click();
  assert.equal(await first.locator('[data-session-id]').count(), 1);
  report.checks.individualSpaceFold = true;
  const row = first.locator('.shine-space-session-row .cursor-pointer').first();
  const styling = await row.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, minHeight: getComputedStyle(element).minHeight, accent: getComputedStyle(document.documentElement).getPropertyValue('--color-accent-blue').trim() }));
  assert.ok(Number.parseFloat(styling.minHeight) >= 34, JSON.stringify(styling));
  assert.ok(styling.accent, 'Theme accent variable unavailable');
  report.checks.themeAwareRows = styling;
  await page.screenshot({ path: path.join(artifact, (executable ? 'installed-spaces.png' : 'spaces.png')), scale: 'css' });
  const terminated = await page.evaluate(id => window.shineAI.session.terminate(id), created[1]);
  assert.ok(terminated && terminated.success !== false, JSON.stringify(terminated));
  await page.evaluate(async alias => { const module = await import('./assets/index-0LVJEr5c.js'); await module[alias].getState().fetchSessions(); }, alias);
  const completedSpace = groups.filter({ hasText: 'sidebar-space-b' });
  assert.equal(await completedSpace.count(), 1);
  assert.equal(await groups.count(), 2, 'Completed-only space must remain directly listed');
  const doneFold = completedSpace.locator('.shine-space-body > button[aria-expanded]');
  assert.equal(await doneFold.count(), 1);
  await doneFold.evaluate(button => button.click());
  assert.equal(await completedSpace.locator('[data-session-id]').count(), 1);
  report.checks.completedOnlySpaceStaysVisible = true;
  await page.screenshot({ path: path.join(artifact, (executable ? 'installed-completed-space.png' : 'completed-space.png')), scale: 'css' });
  const search = page.locator('[data-tour="session-list"] input[type="text"]').first();
  await search.fill('侧栏测试会话 2');
  await page.waitForFunction(id => document.querySelector('[data-tour="session-list"] [data-session-id="' + id + '"]'), created[1]);
  assert.equal(await page.locator('[data-tour="session-list"] [data-session-id="' + created[0] + '"]').count(), 0);
  await search.fill('');
  report.checks.searchStillWorks = true;
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack || String(error));
  process.exitCode = 1;
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(artifact, (executable ? 'installed-failure.png' : 'failure.png')) }).catch(() => {});
} finally {
  if (app) await app.close();
  for (const { key, file } of backups) {
    try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore', windowsHide: true }); } catch {}
    if (file) execFileSync('reg.exe', ['import', file], { stdio: 'ignore', windowsHide: true });
  }
  fs.writeFileSync(path.join(artifact, (executable ? 'installed-report.json' : 'report.json')), JSON.stringify(report, null, 2) + String.fromCharCode(10));
  console.log(JSON.stringify(report, null, 2));
}