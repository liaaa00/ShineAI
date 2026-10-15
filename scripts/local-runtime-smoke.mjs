import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root, openTestApp } from './electron-test-helper.mjs';
const dataDir = path.join(root, '.test-data', 'local-runtime-' + Date.now());
const report = { date: new Date().toISOString(), checks: {}, errors: [] };
let app, page;
try {
  ({ app, page } = await openTestApp(dataDir));
  page.on('pageerror', error => report.errors.push(error.message));
  const bindings = await page.evaluate(() => window.shineAI.shortcut.getKeybindings());
  const defaults = await page.evaluate(() => window.shineAI.shortcut.getDefaults());
  assert.equal(defaults.data.screenshotFull, 'Ctrl+Alt+Shift+S');
  assert.equal(defaults.data.screenshotWindow, 'Ctrl+Alt+Shift+W');
  assert.ok(await app.evaluate(({ globalShortcut }, keys) => keys.every(key => globalShortcut.isRegistered(key)), [bindings.data.screenshotFull, bindings.data.screenshotWindow]));
  report.checks.independentScreenshotDefaultsRegistered = true;
  // Reserve keys outside the app's screenshot registration list to simulate another app.
  const blocked = ['Ctrl+Alt+Shift+F7', 'Ctrl+Alt+Shift+F12'];
  await app.evaluate(({ globalShortcut }, keys) => keys.forEach(key => globalShortcut.register(key, () => {})), blocked);
  const saved = await page.evaluate(keys => window.shineAI.shortcut.saveKeybindings({ screenshotFull: keys[0], screenshotWindow: keys[1], newSession: 'Ctrl+Alt+N' }), blocked);
  assert.equal(saved.success, true);
  assert.equal(saved.data.screenshotFull, bindings.data.screenshotFull);
  assert.equal(saved.data.screenshotWindow, bindings.data.screenshotWindow);
  assert.deepEqual((await page.evaluate(() => window.shineAI.shortcut.getKeybindings())).data, saved.data);
  report.checks.occupiedKeysFallBackAndReturnEffectiveBindings = true;
  await app.evaluate(({ globalShortcut }, keys) => keys.forEach(key => globalShortcut.unregister(key)), blocked);
  const started = Date.now();
  // Force a full environment check while repeatedly exercising a separate IPC.
  let complete = false;
  const auditPromise = page.evaluate(() => window.shineAI.environment.check({ force: true })).finally(() => { complete = true; });
  const latencies = [];
  while (!complete) {
    const before = Date.now();
    await page.evaluate(() => window.development.getRuntimeInfo());
    latencies.push(Date.now() - before);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const audit = await auditPromise;
  assert.ok(audit.items?.length > 0 || audit.data?.items?.length > 0);
  report.environmentCheck = { durationMs: Date.now() - started, ipcSamples: latencies.length, maxIpcMs: Math.max(...latencies) };
  assert.ok(latencies.length >= 2);
  assert.ok(Math.max(...latencies) < 1500, 'Tool checks blocked unrelated IPC for over 1.5 seconds');
  report.checks.environmentChecksKeepOtherIpcResponsive = true;
  await app.close(); app = null;
  ({ app, page } = await openTestApp(dataDir));
  const restored = await page.evaluate(() => window.shineAI.shortcut.getKeybindings());
  assert.equal(restored.data.screenshotFull, saved.data.screenshotFull);
  assert.equal(restored.data.screenshotWindow, saved.data.screenshotWindow);
  assert.equal(restored.data.newSession, 'Ctrl+Alt+N');
  report.checks.resolvedScreenshotBindingsSurviveRestart = true;
  assert.equal(report.errors.length, 0);
} catch (error) { report.errors.push(error.message); process.exitCode = 1; }
finally {
  if (app) await app.close();
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/local-runtime-smoke-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
