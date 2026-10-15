import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const localOnly = process.argv.includes('--local-only');
const executablePath = process.argv.find(arg => arg.startsWith('--executable='))?.slice('--executable='.length);
const reportName = executablePath ? 'installer-local-e2e' : localOnly ? 'local-e2e' : 'e2e';
const dataDir = path.join(root, '.test-data', 'e2e-' + Date.now());
const workspace = path.join(dataDir, 'scratch-project');
fs.mkdirSync(workspace, { recursive: true });
execFileSync('git', ['init', workspace], { windowsHide: true, stdio: 'ignore' });
const report = { date: new Date().toISOString(), mode: localOnly ? 'local-only' : 'live-provider', dataDir, checks: {}, errors: [] };
let app, page, sessionId, ptyId;
function passed(name) { report.checks[name] = true; console.log('PASS ' + name); }
async function conversation() { return page.evaluate(id => window.shineAI.session.getConversation(id), sessionId); }
async function waitReply(marker, timeout = 180000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const messages = await conversation();
    if (messages.some(m => m.role === 'assistant' && JSON.stringify(m.content).includes(marker))) return messages;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const messages = await conversation();
  throw new Error('No assistant marker: ' + JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))).slice(0, 1800));
}
try {
  ({ app, page } = await openTestApp(dataDir, undefined, executablePath));
  if (executablePath) {
    assert.equal(await app.evaluate(({ app }) => app.isPackaged), true);
    assert.equal((await page.evaluate(() => window.development.getRuntimeInfo())).abi, '149');
    passed('packagedRuntimeAndNativeAbi');
  }
  page.on('pageerror', e => report.errors.push(e.message));
  // A real click through the initial acknowledgement, without changing the user's profile.
  await completeOnboarding(page);
  await page.waitForFunction(() => !document.body.innerText.includes('我已了解 AI 可能执行真实操作'), undefined, { timeout: 30000 });
  passed('onboarding');
  const created = await page.evaluate(dir => window.shineAI.workspace.create({ name: 'Development E2E', rootPath: dir, repos: [{ repoPath: dir, name: 'scratch-project', isPrimary: true }] }), workspace);
  assert.equal(created.success, true, JSON.stringify(created));
  const projects = await page.evaluate(() => window.shineAI.workspace.list());
  assert.ok(JSON.stringify(projects).includes(created.workspaceId));
  passed('projectCreation');
  const file = path.join(workspace, 'validation.txt');
  const context = { workspaceId: created.workspaceId };
  const written = await page.evaluate(({ file, context }) => window.shineAI.fileManager.writeFile(file, 'SHINEAI_FILE_READY\n', context), { file, context });
  assert.equal(written.success, true, JSON.stringify(written));
  const read = await page.evaluate(({ file, context }) => window.shineAI.fileManager.readFile(file, context), { file, context });
  assert.ok(JSON.stringify(read).includes('SHINEAI_FILE_READY'));
  assert.equal(fs.readFileSync(file, 'utf8'), 'SHINEAI_FILE_READY\n');
  passed('fileReadWrite');
  const git = await page.evaluate(dir => window.shineAI.git.isRepo(dir), workspace);
  assert.ok(git === true || git?.isRepo === true || git?.success === true, JSON.stringify(git));
  passed('gitRepository');
  const terminal = await page.evaluate(dir => window.shineAI.pty.create({ cwd: dir, shell: 'cmd.exe', cols: 100, rows: 24 }), workspace);
  ptyId = typeof terminal === 'string' ? terminal : terminal.id || terminal.ptyId;
  assert.ok(ptyId, JSON.stringify(terminal));
  await page.evaluate(id => window.shineAI.pty.write(id, 'echo SHINEAI_TERMINAL_%OS%\r'), ptyId);
  await page.waitForFunction(async id => String(await window.shineAI.pty.getOutput(id)).includes('SHINEAI_TERMINAL_Windows_NT'), ptyId, { timeout: 30000 });
  await page.evaluate(id => window.shineAI.pty.kill(id), ptyId); ptyId = null;
  passed('terminalExecution');
  if (!localOnly) {
    report.codexLoggedIn = await page.evaluate(async () => Boolean((await window.shineAI.provider.codexLoginStatus()).loggedIn));
    assert.equal(report.codexLoggedIn, true, 'Codex needs a real provider login');
    const enabled = await page.evaluate(() => window.shineAI.provider.update('codex', { enabled: true }));
    assert.equal(enabled.success, true);
    report.codexConfiguration = await page.evaluate(async () => { const p = (await window.shineAI.provider.getAll()).find(p => p.id === 'codex'); return { id:p.id, adapterType:p.adapterType, defaultModel:p.defaultModel, command:p.command }; });
    console.log('Codex configuration ' + JSON.stringify(report.codexConfiguration));
    let globalConfig = '';
    try { globalConfig = fs.readFileSync(path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml'), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const configuredModel = globalConfig.split(/^\s*\[/m)[0].match(/^\s*model\s*=\s*"([^"]+)"/m)?.[1];
    const session = await page.evaluate(({ workspace, workspaceId, model }) => window.shineAI.session.create({ name: 'Development verification', workingDirectory: workspace, workspaceId, model, providerId: 'codex', worktreeEnabled: false, supervisorMode: false, missionMode: false }), { workspace, workspaceId: created.workspaceId, model: configuredModel });
    assert.equal(session.success, true, JSON.stringify(session));
    sessionId = session.sessionId || session.session?.id || session.id;
    assert.ok(sessionId, JSON.stringify(session)); report.sessionId = sessionId;
    passed('sessionCreation');
    const sent = await page.evaluate(id => window.shineAI.session.sendMessage(id, '只回复 SHINEAI_DEV_READY。不要读写文件、运行命令、调用工具或创建其他代理。'), sessionId);
    assert.equal(sent.success, true, JSON.stringify(sent));
    const messages = await waitReply('SHINEAI_DEV_READY');
    report.assistantReply = messages.filter(m => m.role === 'assistant').map(m => m.content);
    passed('liveCodexReply');
  }
  await page.screenshot({ path: path.join(root, `artifacts/${reportName}-before-restart.png`) });
  await app.close(); app = null;
  ({ app, page } = await openTestApp(dataDir, undefined, executablePath));
  page.on('pageerror', e => report.errors.push(e.message));
  assert.ok(JSON.stringify(await page.evaluate(() => window.shineAI.workspace.list())).includes(created.workspaceId));
  const restoredFile = await page.evaluate(({ file, context }) => window.shineAI.fileManager.readFile(file, context), { file, context });
  assert.ok(JSON.stringify(restoredFile).includes('SHINEAI_FILE_READY'));
  passed('restartLocalPersistence');
  if (!localOnly) {
    assert.ok((await conversation()).some(m => m.role === 'assistant' && JSON.stringify(m.content).includes('SHINEAI_DEV_READY')));
    const history = await page.evaluate(() => window.shineAI.session.getHistory({ limit: 50 }));
    assert.ok(JSON.stringify(history).includes(sessionId));
    assert.ok(JSON.stringify(await page.evaluate(() => window.shineAI.workspace.list())).includes(created.workspaceId));
    passed('restartPersistence');
    const resumed = await page.evaluate(id => window.shineAI.session.resume(id), sessionId);
    assert.equal(resumed.success, true, JSON.stringify(resumed));
    sessionId = resumed.sessionId || resumed.session?.id || resumed.id || sessionId;
    const continued = await page.evaluate(id => window.shineAI.session.sendMessage(id, '只回复 SHINEAI_DEV_RESUMED。不要调用工具。'), sessionId);
    assert.equal(continued.success, true, JSON.stringify(continued));
    await waitReply('SHINEAI_DEV_RESUMED');
    passed('liveSessionResume');
  }
  await page.screenshot({ path: path.join(root, `artifacts/${reportName}-after-restart.png`) });
  assert.equal(report.errors.length, 0, report.errors.join(';'));
} catch (error) {
  report.errors.push(error.message); console.error(error.message); process.exitCode = 1;
} finally {
  if (app) {
    if (ptyId) await page.evaluate(id => window.shineAI.pty.kill(id), ptyId).catch(() => {});
    await app.close();
  }
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, `artifacts/${reportName}-report.json`), JSON.stringify(report, null, 2) + '\n');
}
