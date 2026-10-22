import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const report = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/installer-mac/package-report.json'), 'utf8'));
const checks = {};
const exe = report.executable;
const appRoot = path.resolve(path.dirname(exe), '../Resources/app');
const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
const native = execFileSync(exe, ['-e', `const r=require('node:module').createRequire(${JSON.stringify(path.join(appRoot, 'package.json'))}); const d=new (r('better-sqlite3'))(':memory:'); if(d.prepare('select 42 as n').get().n!==42)process.exit(2);d.close();const p=r('node-pty').spawn('/bin/sh',['-c','echo shineai-pty-ok'],{env:process.env});let out='';p.onData(s=>out+=s);p.onExit(e=>process.exit(e.exitCode||!out.includes('shineai-pty-ok')));setTimeout(()=>process.exit(3),15000).unref();`], { env, timeout: 25000 });
checks.nativeDatabaseAndRealTerminal = true;
for (const cli of ['@anthropic-ai/claude-agent-sdk/cli.js', '@openai/codex/bin/codex.js']) {
  const version = execFileSync(exe, [path.join(appRoot, 'node_modules', cli), '--version'], { env, timeout: 60000 }).toString().trim();
  assert.ok(version); checks[cli] = version;
}
let app;
try {
  const opened = await openTestApp(path.join(root, '.test-data/mac-package'), { auth: 19471, meeting: 18241 }, exe);
  app = opened.app;
  const page = opened.page;
  await completeOnboarding(page);
  const runtime = await page.evaluate(() => window.development.getRuntimeInfo());
  assert.equal(runtime.officialCloud, 'removed');
  assert.equal(await app.evaluate(({ app }) => app.isPackaged), true);
  assert.ok(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().every(w => { const p = w.webContents.getLastWebPreferences(); return p.sandbox && p.contextIsolation && !p.nodeIntegration; })));
  checks.packagedWorkbenchAndSandbox = true;
  await page.screenshot({ path: path.join(root, 'artifacts/installer-mac/workbench.png') });
} finally { if (app) await app.close(); }
fs.writeFileSync(path.join(root, 'artifacts/installer-mac/smoke-report.json'), JSON.stringify({ platform: process.platform, arch: process.arch, checks, scope: 'Packaged workbench, sandbox, native database/terminal and CLI startup; no real provider calls or physical Mac hardware interaction.' }, null, 2));
console.log(checks);
