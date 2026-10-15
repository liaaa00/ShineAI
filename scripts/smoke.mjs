import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, '.runtime/package.json'));
const { _electron } = require('playwright-core');
const dataDir = path.join(root, '.test-data', 'smoke-' + Date.now());
const env = { ...process.env, SHINEAI_DEV_USER_DATA_DIR: dataDir, SHINEAI_LOCAL_AUTH_PORT: '19311', SHINEAI_MEETING_GATEWAY_PORT: '18081' };
delete env.ELECTRON_RUN_AS_NODE;
let application;
try {
  application = await _electron.launch({ executablePath: path.join(root, '.runtime/electron/electron.exe'), args: [root], cwd: root, env, timeout: 120000 });
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
  const report = { dataDir, checks: {}, errors: [] };
  application.process().stderr.on('data', chunk => fs.appendFileSync(path.join(root, 'artifacts/smoke-runtime.log'),chunk));
  let page;
  const deadline=Date.now()+120000;
  while(Date.now()<deadline) {
    page=application.windows().find(candidate=>!candidate.isClosed() && candidate.url().includes('/renderer/index.html'));
    if(page)break;
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  if(!page)throw new Error('Main renderer did not open');
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.waitForFunction(() => window.development?.getRuntimeInfo && window.shineAI?.provider, undefined, { timeout: 120000 });
  await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, undefined, { timeout: 120000 });
  report.runtime = await page.evaluate(() => window.development.getRuntimeInfo());
  report.windows = await application.evaluate(({ BrowserWindow, app }) => ({ userData: app.getPath('userData'), packaged: app.isPackaged, windows: BrowserWindow.getAllWindows().map(w => ({ title:w.getTitle(), preferences: { sandbox:w.webContents.getLastWebPreferences().sandbox, nodeIntegration:w.webContents.getLastWebPreferences().nodeIntegration, contextIsolation:w.webContents.getLastWebPreferences().contextIsolation } })) }));
  report.bridgeKeys = await page.evaluate(() => Object.keys(window.shineAI));
  report.preview = (await page.locator('body').innerText()).slice(0,5000);
  report.checks.noRendererFailure = !/渲染失败|module not found|not a function/.test(report.preview) && report.errors.length===0;
  report.checks.renderer = true;
  report.checks.developmentBanner = await page.locator('#dev-edition-banner').isVisible();
  report.checks.sandbox = report.windows.windows.every(w => w.preferences.sandbox && !w.preferences.nodeIntegration && w.preferences.contextIsolation);
  report.checks.dataIsolation = report.windows.userData === dataDir;
  report.checks.officialCloudRemoved = report.runtime.officialCloud === 'removed';
  report.providers = await page.evaluate(() => window.shineAI.provider.getAll()).then(p => p.map(v=>({id:v.id,name:v.name,adapterType:v.adapterType,enabled:v.enabled})));
  report.checks.noOfficialBuiltinProvider = report.providers.every(p=>p.id !== 'claudeops-builtin');
  report.codexLogin = await page.evaluate(() => window.shineAI.provider.codexLoginStatus()).then(p=>({loggedIn:p.loggedIn}));
  await page.screenshot({path:path.join(root,'artifacts/smoke-window.png')});
  fs.writeFileSync(path.join(root,'artifacts/smoke-report.json'),JSON.stringify(report,null,2)+'\n');
  if (Object.values(report.checks).some(value => !value)) throw new Error('Runtime smoke checks failed');
  console.log(JSON.stringify({checks:report.checks,errors:report.errors,report:'artifacts/smoke-report.json'},null,2));
} finally {
  if(application) await application.close();
}
