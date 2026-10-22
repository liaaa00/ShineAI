import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding, waitForStartupHandoff } from './electron-test-helper.mjs';
const installed = process.argv.includes('--installed');
const dir = path.join(root, 'artifacts/pet-persona', installed ? 'installed' : 'development'), data = path.join(root, '.test-data', 'pet-persona-' + Date.now());
fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(data, { recursive: true });
const report = { checks: {}, errors: [], scope: 'Real Electron settings, image decoding/protocol, native file-dialog selection and separate float window. Isolated profile; no model requests or user chats.' }, backups = [];
let app, page, float;
async function until(fn, label, timeout = 30000) { const end = Date.now() + timeout; while (Date.now() < end) { if (await fn()) return; await new Promise(r => setTimeout(r, 100)); } throw Error('Timed out: ' + label); }
async function open() { ({ app, page } = await openTestApp(data, { auth: 19839, meeting: 18639 }, installed ? 'E:/AI/ShineAI/ShineAI.exe' : undefined)); page.on('pageerror', e => report.errors.push(e.message)); }
async function settings() {
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByText('全部设置', { exact: true }).click();
  await page.getByRole('button', { name: '小光', exact: true }).last().click();
  await page.getByRole('button', { name: '配置', exact: true }).click();
  await page.getByTestId('pet-persona-panel').waitFor();
}
async function configure() { if (!await page.getByTestId('pet-persona-panel').isVisible()) await page.getByRole('button', { name: '配置', exact: true }).click(); }
async function selectFile(file) {
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: !file, filePaths: file ? [file] : [] }); }, file);
  await page.getByRole('button', { name: '导入 PNG / GIF', exact: true }).click();
  await until(async () => !await page.getByRole('button', { name: '导入 PNG / GIF', exact: true }).isDisabled(), 'import completes');
}
async function save() { await page.getByRole('button', { name: '保存配置', exact: true }).click(); await page.getByTestId('pet-persona-panel').waitFor({ state: 'detached' }); }
async function openFloat() {
  await page.evaluate(() => window.shineAI.butler.openFloatWindow());
  await until(() => !!app.windows().find(p => p.url().includes('#/butler-float')), 'float opens');
  float = app.windows().find(p => p.url().includes('#/butler-float')); float.on('pageerror', e => report.errors.push(e.message));
  await float.locator('div[title="左键打开任务总览，右键打开菜单"]').waitFor();
}
async function floatPersona() { return float.evaluate(async () => (await import('./assets/index-0LVJEr5c.js')).p.getState().persona); }
try {
  for (const scheme of ['shineai-dev', 'claudeops-dev']) { const key = 'HKCU\\Software\\Classes\\' + scheme, file = path.join(dir, scheme + '.reg'); try { execFileSync('reg.exe', ['export', key, file, '/y'], { stdio: 'ignore', windowsHide: true }); backups.push({ key, file }); } catch { backups.push({ key }); } }
  await open(); await completeOnboarding(page); await settings(); await openFloat();
  assert.equal(await page.getByText(/成体、觉醒及经验成长暂未实现/).count(), 1);
  assert.equal(await page.getByText(/累计 1000|累计 5000|Phase 2/).count(), 0);
  report.checks.growthUnavailableClearlyExplained = true;
  await page.getByRole('button', { name: '铁蛋', exact: true }).click();
  await page.getByLabel('小光名称', { exact: true }).fill('同步小光');
  await page.getByText('性格风格', { exact: true }).locator('..').getByRole('button').first().click(); await save();
  await until(async () => (await floatPersona()).petSpecies === 'robot', 'built-in update reaches open float');
  assert.equal((await floatPersona()).name, '同步小光'); assert.equal((await floatPersona()).personality, 'formal');
  report.checks.builtInSelectionSynchronizesWithoutReopening = true;
  await configure();
  const base = await page.evaluate(() => window.shineAI.butler.getPersona());
  await selectFile(null); assert.deepEqual(await page.evaluate(() => window.shineAI.butler.getPersona()), base);
  const corrupt = path.join(data, 'bad.png'); fs.writeFileSync(corrupt, Buffer.from('not a PNG'));
  await selectFile(corrupt); await page.getByRole('alert').waitFor(); assert.deepEqual(await page.evaluate(() => window.shineAI.butler.getPersona()), base);
  const png = path.join(data, 'transparent-avatar.png');
  const bytes = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); g.fillStyle = '#4ab8ed'; g.beginPath(); g.arc(80, 80, 56, 0, 2 * Math.PI); g.fill(); g.fillStyle = '#fff'; g.fillRect(52, 58, 15, 18); g.fillRect(94, 58, 15, 18); return c.toDataURL().split(',')[1]; });
  fs.writeFileSync(png, Buffer.from(bytes, 'base64')); await selectFile(png);
  await page.getByTestId('pet-custom-image').first().waitFor();
  assert.equal((await floatPersona()).avatarType, 'robot', 'preview does not update float before save');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.shineAI.butler.getPersona()), base);
  report.checks.cancelInvalidFileAndUnsavedPreviewPreservePersona = true;
  await configure(); await selectFile(png);
  const missingId = await page.getByTestId('pet-custom-image').first().getAttribute('src');
  fs.unlinkSync(path.join(data, 'pet-images', missingId.split('/').at(-1)));
  await page.getByRole('button', { name: '保存配置', exact: true }).click();
  await page.getByRole('alert').waitFor(); assert.equal(await page.getByTestId('pet-persona-panel').isVisible(), true);
  assert.deepEqual(await page.evaluate(() => window.shineAI.butler.getPersona()), base);
  report.checks.failedSaveKeepsPanelAndPreviousPersona = true;
  await selectFile(png); await page.getByLabel('小光名称', { exact: true }).fill('自定义小光');
  await page.screenshot({ path: path.join(dir, 'png-preview.png') }); await save();
  const saved = await page.evaluate(() => window.shineAI.butler.getPersona()); assert.equal(saved.avatarType, 'custom');
  await until(async () => (await floatPersona()).customAvatarId === saved.customAvatarId, 'custom PNG synchronized');
  const image = float.getByTestId('pet-custom-image'); await image.waitFor();
  await until(() => image.evaluate(e => e.complete && e.naturalWidth === 160), 'custom PNG actually decoded');
  fs.renameSync(png, png + '.moved');
  assert.equal((await page.evaluate(async id => { const r = await fetch(`shineai-pet://avatar/${id}`); return { ok: r.ok, bytes: (await r.arrayBuffer()).byteLength }; }, saved.customAvatarId)).ok, true);
  await float.screenshot({ path: path.join(dir, 'png-float.png') });
  report.checks.transparentPngCopiedAndRenderedInOpenFloat = true;
  // Switch back to a built-in and reselect the saved image, without importing again.
  await configure(); await page.getByRole('button', { name: '黑猫', exact: true }).click(); await save();
  await until(async () => (await floatPersona()).avatarType === 'cat', 'return to built-in');
  assert.equal(await float.getByTestId('pet-custom-image').count(), 0);
  await configure(); await page.getByRole('button', { name: '使用自定义形象', exact: true }).click(); await save();
  await float.getByTestId('pet-custom-image').waitFor(); report.checks.builtInAndSavedCustomCanBeSwitched = true;
  await configure(); const gif = path.join(data, 'animated-avatar.gif'); fs.copyFileSync(path.join(root, 'scripts/fixtures/appearance/animated.gif'), gif);
  await selectFile(gif); assert.equal(await page.getByRole('alert').count(), 0, await page.getByRole('alert').allTextContents()); await save();
  const animated = await page.evaluate(() => window.shineAI.butler.getPersona()); assert.match(animated.customAvatarId, /\.gif$/);
  await until(() => float.getByTestId('pet-custom-image').evaluate(e => e.complete && e.naturalWidth === 96), 'GIF decoded in float');
  const colors = new Set();
  // The float deliberately moves while idle, so capture its current clip without
  // Playwright's element-stability wait (which never settles on this animation).
  for (let n = 0; n < 10; n++) { const clip = await float.getByTestId('pet-custom-image').boundingBox(); const pixels = await float.screenshot({clip}); colors.add(execFileSync('python', ['-c', 'from PIL import Image;import sys,io;im=Image.open(io.BytesIO(sys.stdin.buffer.read()));print(im.getpixel((im.width//2,im.height//2)))'], { input: pixels, encoding: 'utf8', windowsHide: true }).trim()); await float.waitForTimeout(130); }
  assert.ok(colors.size > 1, 'GIF must render distinct actual frames');
  await float.emulateMedia({ reducedMotion: 'reduce' }); await until(() => float.getByTestId('pet-custom-image').evaluate(e => e.src.endsWith('.poster.png') && e.complete), 'reduced motion static frame');
  await float.emulateMedia({ reducedMotion: 'no-preference' }); await until(() => float.getByTestId('pet-custom-image').evaluate(e => e.src.endsWith('.gif')), 'GIF resumes');
  report.checks.gifActuallyAnimatesAndRespectsReducedMotion = true;
  await app.close(); app = null; await open(); await waitForStartupHandoff(page); await openFloat();
  const restored = await page.evaluate(() => window.shineAI.butler.getPersona()); assert.equal(restored.customAvatarId, animated.customAvatarId); assert.equal(restored.name, '自定义小光');
  await until(() => float.getByTestId('pet-custom-image').evaluate(e => e.complete && e.naturalWidth === 96), 'persisted custom image rendered after restart');
  await float.screenshot({ path: path.join(dir, 'after-restart.png') }); report.checks.customPersonaPersistsAcrossAppRestart = true;
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
} catch (error) { report.errors.push(error.stack); process.exitCode = 1; if (page && !page.isClosed()) await page.screenshot({ path: path.join(dir, 'failure.png') }).catch(() => {}); }
finally { if (app) await app.close(); for (const { key, file } of backups) { try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore', windowsHide: true }); } catch {} if (file) execFileSync('reg.exe', ['import', file], { stdio: 'ignore', windowsHide: true }); } fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2)); }
