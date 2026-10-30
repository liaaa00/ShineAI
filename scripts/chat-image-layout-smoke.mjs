import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const executable = process.argv.find(arg => arg.startsWith('--executable='))?.slice(13);
const dir = path.join(root, 'artifacts/chat-image-layout', ...(executable ? ['installed'] : []));
const data = path.join(root, '.test-data', 'image-layout-' + Date.now());
const workspace = path.join(data, 'images');
fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(workspace, { recursive: true });
const report = { checks: {}, errors: [], scope: 'Actual isolated Electron chat, native image reader, responsive attachment and Markdown rendering, expand/collapse and existing preview. Synthetic images; no model requests or live profile changes.' };
const source = fs.readFileSync(path.join(root, 'src/renderer/assets/index-0LVJEr5c.js'), 'utf8');
const aliases = Object.fromEntries(['useSessionStore', 'useUIStore'].map(name => [name, source.match(new RegExp(name + ' as (\\w+)'))[1]]));
const backups = [];
let app, page, id;
const picture = name => page.locator(`[data-chat-image="${name}"]`);
async function show(content, role = 'assistant') {
  await page.evaluate(async ({ aliases, id, content, role }) => {
    const module = await import('./assets/index-0LVJEr5c.js');
    const store = module[aliases.useSessionStore];
    await store.getState().fetchSessions();
    store.setState({ selectedSessionId: id });
    module[aliases.useUIStore].getState().setActiveWorkspace('project');
    module[aliases.useUIStore].setState({ newSessionEntryActive: false });
    await store.getState().openSessionForChat(id);
    store.setState({ conversations: { [id]: [{ id: 'image-layout', sessionId: id, role, content, timestamp: Date.now() }] }, conversationLoading: {}, streamingSessions: new Set() });
  }, { aliases, id, content, role });
}
async function loaded(name) {
  await picture(name).scrollIntoViewIfNeeded();
  await page.waitForFunction(name => {
    const card = [...document.querySelectorAll('[data-chat-image]')].find(e => e.dataset.chatImage === name);
    const img = card?.querySelector('img');
    return img?.complete && img.naturalWidth > 0;
  }, name);
}
async function geometry(name) {
  return picture(name).evaluate(card => {
    const image = card.querySelector('img'), caption = card.querySelector('.shine-chat-image-caption');
    const r = image.getBoundingClientRect(), c = caption.getBoundingClientRect();
    return { width: r.width, height: r.height, ratio: image.naturalWidth / image.naturalHeight, captionBelow: c.top >= r.bottom - 1, objectFit: getComputedStyle(image).objectFit, cardWidth: card.getBoundingClientRect().width };
  });
}
try {
  for (const scheme of ['shineai-dev', 'claudeops-dev']) {
    const key = 'HKCU\\Software\\Classes\\' + scheme, file = path.join(dir, scheme + '.reg');
    try { execFileSync('reg.exe', ['export', key, file, '/y'], { stdio: 'ignore', windowsHide: true }); backups.push({ key, file }); }
    catch { backups.push({ key }); }
  }
  ({ app, page } = await openTestApp(data, { auth: 19893, meeting: 18693 }, executable, { SHINEAI_TEST_LANGUAGE: 'zh-CN' }));
  assert.equal(path.resolve((await page.evaluate(() => window.development.getRuntimeInfo())).userData), path.resolve(data));
  report.checks.isolatedUserData = true;
  page.on('pageerror', error => report.errors.push(error.message));
  await completeOnboarding(page);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/renderer/index.html')).setSize(1540, 1080));
  const images = await page.evaluate(() => {
    return [[1400, 760, 'landscape.png'], [800, 1200, 'portrait.png'], [900, 3600, 'long.png'], [80, 80, 'small.png']].map(([width, height, name]) => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#edf3fa'; ctx.fillRect(0, 0, width, height);
      for (let y = 0, index = 0; y < height; y += 200, index++) {
        ctx.fillStyle = index % 2 ? '#cbdbee' : '#e2ebf6'; ctx.fillRect(0, y, width, 190);
        ctx.fillStyle = '#163752'; ctx.font = 'bold 32px sans-serif'; ctx.fillText(`${name} · section ${index + 1}`, 24, y + 65);
        ctx.font = '24px sans-serif'; ctx.fillText('Original proportions · readable chat preview', 24, y + 120);
      }
      return { name, base64: canvas.toDataURL().split(',')[1] };
    });
  });
  for (const image of images) fs.writeFileSync(path.join(workspace, image.name), Buffer.from(image.base64, 'base64'));
  const created = await page.evaluate(async workspace => {
    await window.shineAI.settings.update('backgroundAiAnalysisEnabled', false);
    await window.shineAI.provider.create({ id: 'layout-offline', name: '图片布局离线验证', adapterType: 'openai-api', command: 'api', enabled: true, apiBaseUrl: 'http://127.0.0.1:1/v1', apiKey: 'fixture', defaultModel: 'offline' });
    return window.shineAI.session.create({ name: '图片布局验证', workingDirectory: workspace, providerId: 'layout-offline', model: 'offline', worktreeEnabled: false });
  }, workspace);
  assert.equal(created.success, true); id = created.sessionId || created.id;
  const tag = name => `[图片:${path.join(workspace, name)}]`;
  await show('横图预览\n\n' + tag('landscape.png')); await loaded('landscape.png');
  let g = await geometry('landscape.png');
  assert.ok(g.width > 520, JSON.stringify(g)); assert.ok(Math.abs(g.width / g.height - g.ratio) < .01); assert.ok(g.captionBelow); assert.equal(g.objectFit, 'contain');
  report.checks.landscapeLargerThanOld520pxAndUncropped = g;
  await page.screenshot({ path: path.join(dir, 'landscape.png') });
  await picture('landscape.png').getByRole('button', { name: '点击放大：landscape.png', exact: true }).click();
  await page.locator('img.max-h-\\[90vh\\]').waitFor({ state: 'visible', timeout: 10000 });
  await page.keyboard.press('Escape');
  await page.locator('img.max-h-\\[90vh\\]').waitFor({ state: 'detached' });
  report.checks.existingPreviewOpensAndEscapeCloses = true;
  await show('竖图预览\n\n' + tag('portrait.png')); await loaded('portrait.png');
  g = await geometry('portrait.png'); assert.ok(g.height >= 550); assert.ok(Math.abs(g.width / g.height - g.ratio) < .01); assert.ok(g.captionBelow);
  report.checks.portraitFullyVisibleAt560px = g;
  await page.screenshot({ path: path.join(dir, 'portrait.png') });
  await show('长截图预览\n\n' + tag('long.png')); await loaded('long.png');
  const expand = picture('long.png').getByRole('button', { name: '展开完整图片', exact: true }); await expand.waitFor();
  const viewport = picture('long.png').locator('.shine-chat-image-viewport');
  assert.ok((await viewport.boundingBox()).height <= 561);
  await page.screenshot({ path: path.join(dir, 'long-collapsed.png') });
  await expand.click();
  assert.equal(await picture('long.png').getByRole('button', { name: '收起长图', exact: true }).getAttribute('aria-expanded'), 'true');
  assert.ok((await viewport.boundingBox()).height > 1500);
  await picture('long.png').getByRole('button', { name: '收起长图', exact: true }).click();
  assert.ok((await viewport.boundingBox()).height <= 561); report.checks.longScreenshotExpandsAndCollapses = true;
  await show('多图预览\n\n' + tag('landscape.png') + '\n' + tag('portrait.png')); await loaded('landscape.png'); await loaded('portrait.png');
  const wide = await page.locator('.shine-chat-image-grid').evaluate(e => ({ columns: getComputedStyle(e).gridTemplateColumns, width: e.getBoundingClientRect().width }));
  // auto-fit retains zero-width empty tracks in Chromium's computed value.
  assert.equal(wide.columns.split(' ').filter(track => parseFloat(track) > 0).length, 2); assert.ok(wide.width > 600); report.checks.wideWindowHasTwoReadableColumns = wide;
  await page.screenshot({ path: path.join(dir, 'multiple-wide.png') });
  // Emulate a narrow chat pane inside the real app, without resizing the OS
  // window below Electron's minimum width or touching the user's layout.
  await page.locator('[data-message-id="image-layout"] > div').first().evaluate(e => { e.style.width = '360px'; e.style.maxWidth = '100%'; });
  const narrow = await page.locator('.shine-chat-image-grid').evaluate(e => ({ columns: getComputedStyle(e).gridTemplateColumns, width: e.getBoundingClientRect().width, overflow: e.scrollWidth > e.clientWidth }));
  assert.equal(narrow.columns.split(' ').filter(track => parseFloat(track) > 0).length, 1); assert.equal(narrow.overflow, false); report.checks.narrowChatStacksWithoutHorizontalOverflow = narrow;
  await page.screenshot({ path: path.join(dir, 'multiple-narrow.png') });
  await page.locator('[data-message-id="image-layout"] > div').first().evaluate(e => { e.style.width = '100%'; e.style.removeProperty('max-width'); });
  await show('用户上传\n\n' + tag('landscape.png'), 'user'); await loaded('landscape.png');
  g = await geometry('landscape.png'); assert.ok(g.width > 520); assert.ok(g.captionBelow); report.checks.userAttachmentAlsoUsesLargerLayout = g;
  await show(`Markdown 图片\n\n![Markdown 横图](${path.join(workspace, 'landscape.png').replaceAll('\\', '/')})`); await loaded('Markdown 横图');
  g = await geometry('Markdown 横图'); assert.ok(g.width > 520); assert.ok(g.captionBelow); report.checks.markdownUsesSameUncroppedLayout = g;
  await picture('Markdown 横图').getByRole('button').click();
  await page.locator('img.max-h-\\[90vh\\]').waitFor({ state: 'visible' }); await page.keyboard.press('Escape'); report.checks.markdownPreviewWorks = true;
  await show(tag('small.png')); await loaded('small.png');
  g = await geometry('small.png'); assert.equal(g.width, 80); assert.equal(g.height, 80); report.checks.smallImagesNotArtificiallyUpscaled = true;
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) {
  report.errors.push(error.stack); process.exitCode = 1;
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(dir, 'failure.png') }).catch(() => {});
} finally {
  if (app) await app.close();
  for (const { key, file } of backups) {
    try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore', windowsHide: true }); } catch {}
    if (file) execFileSync('reg.exe', ['import', file], { stdio: 'ignore', windowsHide: true });
  }
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
