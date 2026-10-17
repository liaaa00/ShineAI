import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const data = path.join(root, '.test-data', 'branding-' + Date.now());
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const report = { checks: {}, errors: [], scope: 'Fresh isolated desktop profile; no user credentials or paid model requests' };
let app;
const protocolBackups=[];
try {
  fs.mkdirSync(data,{recursive:true});
  for(const scheme of ['shineai-dev','claudeops-dev']) {
    const key='HKCU\\Software\\Classes\\'+scheme,backup=path.join(data,scheme+'.reg');
    try{execFileSync('reg.exe',['export',key,backup,'/y'],{stdio:'ignore',windowsHide:true});protocolBackups.push({key,backup});}
    catch{protocolBackups.push({key});}
  }
  const opened = await openTestApp(data, { auth: 19541, meeting: 18341 },executable);
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
  assert.equal(await page.evaluate(()=>Boolean(window.spectrAI)),false);
  assert.equal(path.resolve((await page.evaluate(()=>window.development.getRuntimeInfo())).userData),path.resolve(data));
  assert.equal(await app.evaluate(({app})=>app.getName()),'shineai-dev');
  await page.locator('img[src="./assets/shineai-mark.svg"]').first().waitFor();
  assert.equal(await page.locator('img[src="./assets/shineai-mark.svg"]').first().evaluate(e=>e.complete&&e.naturalWidth>0),true);
  report.checks.independentIdentityAndOriginalMark = true;
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
  for(const {key,backup} of protocolBackups) {
    try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}
    if(backup)execFileSync('reg.exe',['import',backup],{stdio:'ignore',windowsHide:true});
  }
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/brand-smoke-report.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
