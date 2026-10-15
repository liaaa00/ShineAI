import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const packageReport = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/installer/package-report.json'), 'utf8'));
const testRoot = path.join(root, '.test-data', `installer-${Date.now()}`);
// Keep silent /D arguments simple; executable names still contain spaces.
const installDir = path.join(testRoot, 'Installed');
const dataDir = path.join(testRoot, 'profile');
const executable = path.join(installDir, 'ShineAI.exe');
const report = { date: new Date().toISOString(), installer: packageReport.installer, installDir, checks: {}, errors: [] };
let app, page, installed = false, profileDatabase;
const protocolBackups = [];
function run(exe, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(`${path.basename(exe)} exited ${code}: ${stderr.slice(-1200)}`)));
  });
}
function passed(name) { report.checks[name] = true; console.log(`PASS ${name}`); }
async function runInstaller(exe, args) {
  // Launch through the native process API without redirected installer handles,
  // matching the normal desktop launch more closely than the test driver's pipes.
  const literal = value => "'" + value.replaceAll("'", "''") + "'";
  await run('powershell.exe', ['-NoProfile', '-Command',
    `$process = Start-Process -FilePath ${literal(exe)} -ArgumentList ${literal(args.join(' '))} -WindowStyle Hidden -Wait -PassThru; exit $process.ExitCode`]);
}
function countFiles(directory) {
  let count = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    count += entry.isDirectory() ? countFiles(path.join(directory, entry.name)) : 1;
  }
  return count;
}
function findDatabase(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { const found = findDatabase(file); if (found) return found; }
    else if (entry.name === 'claudeops.db') return file;
  }
}
try {
  // Refuse to replace an existing independently installed development edition.
  const existing = await run('powershell.exe', ['-NoProfile', '-Command', "$taskKeys = @('HKCU:/Software/Microsoft/Windows/CurrentVersion/Uninstall','HKLM:/Software/Microsoft/Windows/CurrentVersion/Uninstall','HKLM:/Software/WOW6432Node/Microsoft/Windows/CurrentVersion/Uninstall'); foreach ($taskKey in $taskKeys) { if (Test-Path -LiteralPath $taskKey) { Get-ChildItem -LiteralPath $taskKey | ForEach-Object { $item = Get-ItemProperty -LiteralPath $_.PSPath; if ($item.DisplayName -eq 'ShineAI') { Write-Output 'EXISTS' } } } }; $taskShortcut = Join-Path ([Environment]::GetFolderPath('Programs')) 'ShineAI.lnk'; if (Test-Path -LiteralPath $taskShortcut) { Write-Output 'EXISTS' }; if (Get-Process -Name 'ShineAI' -ErrorAction SilentlyContinue) { Write-Output 'EXISTS' }"]);
  assert.ok(!existing.includes('EXISTS'), 'An installed ShineAI already exists; refusing to replace it for testing');
  fs.mkdirSync(testRoot, { recursive: true });
  for (const scheme of ['shineai-dev', 'claudeops-dev']) {
    const registryKey = `HKCU\\Software\\Classes\\${scheme}`;
    const backup = path.join(testRoot, `${scheme}.reg`);
    try { await run('reg.exe', ['export', registryKey, backup, '/y']); protocolBackups.push({ registryKey, backup }); }
    catch { protocolBackups.push({ registryKey, backup: null }); }
  }
  console.log('Installing into an isolated directory…');
  const started = Date.now();
  await runInstaller(packageReport.installer, ['/S', '/currentuser', '/NoDesktopShortcut', '/D=' + installDir]);
  report.installDurationMs = Date.now() - started;
  assert.ok(fs.existsSync(executable), 'Installed executable is missing'); installed = true;
  passed('silentPerUserInstall');
  const shortcutTarget = await run('powershell.exe', ['-NoProfile', '-Command', "$link = Join-Path ([Environment]::GetFolderPath('Programs')) 'ShineAI.lnk'; (New-Object -ComObject WScript.Shell).CreateShortcut($link).TargetPath"]);
  assert.equal(path.resolve(shortcutTarget.trim()).toLowerCase(), executable.toLowerCase());
  passed('startMenuShortcutTargetsInstalledExecutable');
  const appRoot = path.join(installDir, 'resources/app');
  assert.deepEqual(fs.readdirSync(appRoot).sort(), ['node_modules', 'out', 'package.json', 'resources']);
  passed('noProjectProfilesOrDevelopmentToolsInPackage');
  report.applicationFileCount = countFiles(appRoot);
  assert.equal(report.applicationFileCount, countFiles(path.join(root, 'artifacts/installer-stage/resources/app')), 'Installation omitted application files');
  passed('allApplicationFilesExtracted');
  const nodeEnv = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
  const cliVersions = {};
  for (const [name, entry] of Object.entries({ claude: '@anthropic-ai/claude-agent-sdk/cli.js', codex: '@openai/codex/bin/codex.js' })) {
    cliVersions[name] = (await run(executable, [path.join(appRoot, 'node_modules', entry), '--version'], { env: nodeEnv, cwd: installDir })).trim();
    assert.ok(cliVersions[name]);
  }
  report.cliVersions = cliVersions;
  passed('bundledClaudeAndCodexCliLaunchWithoutSystemNode');
  ({ app, page } = await openTestApp(dataDir, { auth: 19331, meeting: 18101 }, executable));
  page.on('pageerror', error => report.errors.push(error.message));
  await completeOnboarding(page);
  const runtime = await page.evaluate(() => window.development.getRuntimeInfo());
  assert.equal(runtime.userData, dataDir); assert.equal(runtime.abi, '149');
  assert.equal(runtime.officialCloud, 'removed');
  const state = await app.evaluate(({ app, BrowserWindow }) => {
    return { packaged: app.isPackaged, appData: app.getPath('appData'), root: app.getAppPath(),
      safeWindows: BrowserWindow.getAllWindows().every(w => { const p = w.webContents.getLastWebPreferences(); return p.sandbox && p.contextIsolation && !p.nodeIntegration; }),
    };
  });
  const { createConfig } = createRequire(path.join(appRoot, 'package.json'))('./out/main/runtime/config.cjs');
  assert.equal(state.packaged, true);
  assert.equal(createConfig(state.root, {}, { isPackaged: state.packaged, appData: state.appData }).userData, path.join(state.appData, 'ShineAI'));
  assert.equal(state.safeWindows, true);
  passed('packagedAbiSandboxAndAppDataIsolation');
  const skills = await page.evaluate(() => window.shineAI.registry.fetchSkills(true));
  assert.ok(skills.length > 0); report.skillCount = skills.length;
  const builtin = await page.evaluate(() => window.shineAI.registry.fetchMarketMcps({ source: 'builtin' }));
  assert.ok(builtin.items.length > 0);
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByText('全部设置', { exact: true }).click();
  await page.getByRole('button', { name: '能力', exact: true }).click();
  await page.getByRole('button', { name: '技能', exact: true }).click();
  await page.getByRole('button', { name: /技能市场/ }).click();
  await page.getByText('Code Review', { exact: true }).first().waitFor({ timeout: 35000 });
  passed('packagedSkillMarketAndBuiltinMcpCatalog');
  await page.screenshot({ path: path.join(root, 'artifacts/installer/installed-market.png') });
  await app.close(); app = null;
  // Uses the installed application to exercise SQLite, node-pty and persistence.
  await run(process.execPath, [path.join(root, 'scripts/e2e.mjs'), '--local-only', '--executable=' + executable], { cwd: root });
  const e2e = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/installer-local-e2e-report.json'), 'utf8'));
  assert.equal(e2e.errors.length, 0); report.localE2e = e2e.checks;
  passed('installedProjectFilesGitTerminalAndRestart');
  assert.equal(report.errors.length, 0, report.errors.join(';'));
} catch (error) {
  report.errors.push(error.message); process.exitCode = 1;
} finally {
  if (app) await app.close();
  if (installed) {
    try {
      profileDatabase = findDatabase(dataDir);
      assert.ok(profileDatabase, 'The test never created its application database');
      const uninstaller = path.join(installDir, 'Uninstall ShineAI.exe');
      assert.ok(fs.existsSync(uninstaller));
      // NSIS otherwise launches a temporary process and returns before removal.
      await runInstaller(uninstaller, ['/S', '/currentuser', '_?=' + installDir]);
      assert.equal(fs.existsSync(executable), false);
      assert.ok(fs.existsSync(profileDatabase), 'Uninstall removed the profile');
      const existing = await run('powershell.exe', ['-NoProfile', '-Command', "Get-ChildItem 'HKCU:/Software/Microsoft/Windows/CurrentVersion/Uninstall' | ForEach-Object { $item = Get-ItemProperty $_.PSPath; if ($item.DisplayName -eq 'ShineAI') { Write-Output 'EXISTS' } }"]);
      assert.ok(!existing.includes('EXISTS'));
      const remainingShortcut = (await run('powershell.exe', ['-NoProfile', '-Command', "Test-Path -LiteralPath (Join-Path ([Environment]::GetFolderPath('Programs')) 'ShineAI.lnk')"])).trim();
      assert.equal(remainingShortcut, 'False');
      passed('uninstallRemovesApplicationAndPreservesData');
      for (const scheme of ['shineai-dev', 'claudeops-dev']) {
        let remains = false;
        try { await run('reg.exe', ['query', `HKCU\\Software\\Classes\\${scheme}`]); remains = true; } catch {}
        assert.equal(remains, false, 'Uninstall left a broken URL handler');
      }
      passed('uninstallRemovesRegisteredDevelopmentProtocols');
    } catch (error) { report.errors.push(error.message); process.exitCode = 1; }
  }
  // URL handlers are machine state even with an isolated test profile.
  for (const { registryKey, backup } of protocolBackups) {
    try {
      if (backup) await run('reg.exe', ['import', backup]);
      else await run('reg.exe', ['delete', registryKey, '/f']).catch(() => {});
    } catch (error) { report.errors.push(error.message); process.exitCode = 1; }
  }
  fs.writeFileSync(path.join(root, 'artifacts/installer/installer-smoke-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
