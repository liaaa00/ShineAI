import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const data = path.join(root, '.test-data', 'branding-' + Date.now());
const report = { checks: {}, errors: [], scope: 'Fresh isolated desktop profile; no user credentials or paid model requests' };
let app;
try {
  const opened = await openTestApp(data, { auth: 19541, meeting: 18341 });
  app = opened.app; const page = opened.page;
  page.on('pageerror', error => report.errors.push(error.message));
  const legacy = Buffer.from('U3BlY3RyQUk=', 'base64').toString().toLowerCase();
  const check = async label => {
    const visible = await page.locator('body').innerText();
    assert.ok(!visible.toLowerCase().includes(legacy), label + ': old product label');
    report.checks[label] = true;
  };
  await check('onboardingBrand');
  const titles = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(w => w.getTitle()));
  assert.ok(titles.some(t => t.startsWith('ShineAI')));
  assert.ok(titles.every(t => !t.toLowerCase().includes(legacy)));
  report.checks.windowTitle = true;
  assert.ok(await page.evaluate(() => Boolean(window.shineAI?.session && window.shineAI?.app)));
  report.checks.preloadBridge = true;
  await completeOnboarding(page); await check('workspaceBrand');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByText('全部设置', { exact: true }).click();
  await check('settingsBrand');
  const runningRoot = await app.evaluate(({ app }) => app.getAppPath());
  const entry = path.join(runningRoot, 'resources/builtin-mcps/shineai-claw/dist/index.js');
  const metadata = JSON.parse(fs.readFileSync(path.join(runningRoot, 'resources/builtin-mcps/shineai-claw/package.json'), 'utf8'));
  const builtins = { exists: fs.existsSync(entry), name: metadata.name };
  assert.ok(builtins.exists); assert.equal(builtins.name, 'shineai-claw');
  report.checks.builtinMcpPath = true;
  assert.deepEqual(report.errors, []);
  await page.screenshot({ path: path.join(root, 'artifacts/shineai-brand.png') });
} finally {
  if (app) await app.close();
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/brand-smoke-report.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
