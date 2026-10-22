import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const installed = process.argv.includes('--installed');
const dir = path.join(root, 'artifacts/memory-context', installed ? 'installed' : 'development');
const data = path.join(root, '.test-data', 'memory-context-' + Date.now()), workspace = path.join(data, 'workspace');
fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(workspace, { recursive: true });
const rule = '服务器与部署状态类问题，一律先读运维文档并实测 DNS 与线上接口，再作答；不凭记忆或会话摘要推断。';
const question = '这里讨论卡片拖动和文字选择的使用方式。'.repeat(130) + '\n请选择：\n1. 保持现状：文字区拖=选字，卡片空白处拖=移动\n2. 按住 Alt 拖动';
const report = { checks: {}, errors: [], scope: 'Actual Electron IPC/native API adapter, memory_save and background evaluation against a deterministic loopback fixture; disk restart and actual follow-up requests. Isolated profile, no real credentials or remote model calls. Does not establish real model instruction-following accuracy.' };
const requests = [], backups = []; let app, page, sessionId;
function answer(response, delta, finish = 'stop') {
  response.setHeader('Content-Type', 'text/event-stream');
  response.write('data: ' + JSON.stringify({ id: 'local-fixture', object: 'chat.completion.chunk', choices: [{ index: 0, delta, finish_reason: null }] }) + '\n\n');
  response.write('data: ' + JSON.stringify({ id: 'local-fixture', object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: finish }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } }) + '\n\n');
  response.end('data: [DONE]\n\n');
}
const server = http.createServer((req, res) => {
  let raw = ''; req.on('data', b => raw += b); req.on('end', () => {
    try {
      const body = JSON.parse(raw || '{}'), text = JSON.stringify(body), evaluation = text.includes('你是 ShineAI 记忆评估助手');
      requests.push({ evaluation, body });
      if (evaluation) {
        answer(res, { content: text.includes('INVALID_EVAL') ? '{"worthRemembering":"true","confidence":"high"}' : JSON.stringify({ worthRemembering: true, confidence: 'high', suggestedType: 'feedback', suggestedName: '核验原则', reason: '明确长期规则', memoryText: rule }) });
        return;
      }
      const latest = [...(body.messages || [])].reverse().find(m => m.role === 'user'), latestText = typeof latest?.content === 'string' ? latest.content : JSON.stringify(latest?.content);
      if (latestText?.includes('保持现状')) { answer(res, { content: 'CHOICE_RECEIVED：文字区拖=选字，卡片空白处拖=移动' }); return; }
      const result = [...(body.messages || [])].reverse().find(m => m.role === 'tool' && String(m.content).includes('persisted'));
      if (result) { answer(res, { content: latestText?.includes('INVALID_EVAL') ? 'EVALUATION_ERROR_RECEIVED' : question }); return; }
      answer(res, { tool_calls: [{ index: 0, id: 'memory-save-fixture', type: 'function', function: { name: 'memory_save', arguments: JSON.stringify({ text: latestText?.includes('INVALID_EVAL') ? 'INVALID_EVAL：以后核验服务器时必须检查文档和实际结果' : rule, type: 'feedback', name: latestText?.includes('INVALID_EVAL') ? '格式失败用例' : '核验原则' }) } }] }, 'tool_calls');
    } catch (error) { report.errors.push(error.stack); res.statusCode = 500; res.end(); }
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
async function until(fn, label, timeout = 45000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw Error('Timed out: ' + label);
}
async function open() {
  ({ app, page } = await openTestApp(data, { auth: 19861, meeting: 18661 }, installed ? 'E:/AI/ShineAI/ShineAI.exe' : undefined, { SHINEAI_DEV_BUTLER_DIR: path.join(data, 'butler') }));
  page.on('pageerror', e => report.errors.push(e.message));
}
async function memories() {
  const result = await page.evaluate(() => window.shineAI.butler.listMemories({ includeArchived: true }));
  return Array.isArray(result) ? result : result.memories || result.data?.memories || result.data || [];
}
async function waitIdle(id) {
  await until(async () => (await page.evaluate(() => window.shineAI.session.getAll())).find(s => s.id === id)?.status === 'waiting_input', 'conversation ends');
}
async function create(name) {
  const result = await page.evaluate(({ name, workspace }) => window.shineAI.session.create({ name, workingDirectory: workspace, providerId: 'memory-fixture', model: 'memory-fixture', permissionMode: 'full_auto', worktreeEnabled: false }), { name, workspace });
  assert.equal(result.success, true, JSON.stringify(result)); return result.sessionId || result.id;
}
const toolResults = () => requests.flatMap(r => (r.body.messages || []).filter(m => m.role === 'tool').map(m => {
  try { return JSON.parse(m.content); } catch { return null; }
})).filter(Boolean);
try {
  for (const scheme of ['shineai-dev', 'claudeops-dev']) {
    const key = 'HKCU\\Software\\Classes\\' + scheme, file = path.join(dir, scheme + '.reg');
    try { execFileSync('reg.exe', ['export', key, file, '/y'], { stdio: 'ignore', windowsHide: true }); backups.push({ key, file }); } catch { backups.push({ key }); }
  }
  await open(); await completeOnboarding(page);
  await page.evaluate(() => window.shineAI.settings.update('backgroundAiAnalysisEnabled', false));
  const provider = await page.evaluate(url => window.shineAI.provider.create({ id: 'memory-fixture', name: '本地记忆验证', adapterType: 'openai-api', command: 'api', enabled: true, apiBaseUrl: url, apiKey: 'local-fixture-only', defaultModel: 'memory-fixture' }), 'http://127.0.0.1:' + server.address().port + '/v1');
  assert.ok(provider.provider?.id || provider.id || provider.data?.id, JSON.stringify(provider));
  await page.evaluate(() => window.shineAI.butler.updateConfig({ memoryEvalProviderId: 'memory-fixture', autoRecallMemoriesEnabled: false, memoryConsolidation: false }));
  sessionId = await create('保存长期核验原则');
  const sent = await page.evaluate(({ id, text }) => window.shineAI.session.sendMessage(id, text), { id: sessionId, text: '请记住以下长期原则：' + rule });
  assert.equal(sent.success, true, JSON.stringify(sent));
  await until(() => toolResults().some(t => t.persisted === true && t.outcome === 'saved'), 'actual memory_save confirms persistence');
  await waitIdle(sessionId);
  await until(async () => (await memories()).some(m => m.claim === rule || m.description === rule), 'saved memory appears after existing tier-index refresh');
  const saved = (await memories()).find(m => m.claim === rule || m.description === rule);
  assert.ok(saved, 'saved rule visible through real memory IPC'); assert.equal(saved.type, 'feedback'); assert.equal(saved.status, 'active');
  report.checks.actualMemoryToolAndEvaluatorPersistPreviouslyRejectedRule = true;
  assert.equal(requests.filter(r => r.evaluation).length, 1, 'no second classification call');
  report.checks.oneExistingBackgroundEvaluationWithoutAdditionalClassifier = true;
  const badId = await create('验证评估格式失败');
  assert.equal((await page.evaluate(id => window.shineAI.session.sendMessage(id, 'INVALID_EVAL：请记住另一条长期规则'), badId)).success, true);
  await until(() => toolResults().some(t => t.reasonCode === 'invalid_evaluation' && t.persisted === false), 'invalid model output reported honestly');
  await waitIdle(badId);
  assert.equal((await memories()).filter(m => m.name === '格式失败用例').length, 0);
  report.checks.malformedEvaluationReportsErrorAndDoesNotSave = true;
  const before = requests.length;
  await app.close(); app = null; await open();
  const restored = (await memories()).find(m => m.id === saved.id);
  assert.ok(restored); assert.equal(restored.claim || restored.description, rule); assert.equal(restored.status, 'active');
  report.checks.savedRuleSurvivesDiskReloadAndMaintenance = true;
  const config = await page.evaluate(() => window.shineAI.butler.getConfig());
  assert.equal(config.autoRecallMemoriesEnabled, false);
  report.checks.autoRecallRemainsDisabledAcrossRestart = true;
  const followup = await page.evaluate(id => window.shineAI.session.sendMessage(id, '保持现状'), sessionId);
  assert.equal(followup.success, true, JSON.stringify(followup));
  await until(() => requests.slice(before).some(r => !r.evaluation && JSON.stringify(r.body).includes('保持现状')), 'short reply delivered after restart');
  await waitIdle(sessionId);
  const wire = requests.slice(before).find(r => !r.evaluation && JSON.stringify(r.body).includes('保持现状'));
  assert.ok(JSON.stringify(wire.body).includes('文字区拖=选字'), 'previous closing option remains in actual request');
  assert.equal(requests.slice(before).filter(r => r.evaluation).length, 0, 'ordinary send does not wait for memory evaluation');
  report.checks.actualRestartFollowupContainsQuestionAndShortReplyWithoutMemoryEvaluation = true;
  report.restoreFollowupWasScheduled = !!followup.dispatch?.scheduled;
  assert.equal(requests.slice(before).filter(r => !r.evaluation).length, 1, 'restoration input dispatched once');
  report.checks.messageSentDuringRestorationDrainsExactlyOnce = true;
  const idleBefore = requests.length;
  const idle = await page.evaluate(id => window.shineAI.session.sendMessage(id, '保持现状，继续按文字选字的方式'), sessionId);
  assert.equal(idle.success, true); assert.equal(idle.dispatch?.scheduled, false);
  await until(() => requests.length > idleBefore, 'ordinary idle follow-up sent directly'); await waitIdle(sessionId);
  assert.equal(requests.slice(idleBefore).length, 1); assert.equal(requests[idleBefore].evaluation, false);
  report.checks.finishedConversationFollowupSendsDirectlyWithoutQueueOrEvaluation = true;
  report.requestCounts = { conversation: requests.filter(r => !r.evaluation).length, memoryEvaluation: requests.filter(r => r.evaluation).length };
  assert.equal(report.errors.length, 0);
} catch (error) {
  report.errors.push(error.stack); process.exitCode = 1;
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(dir, 'failure.png') }).catch(() => {});
} finally {
  if (app) await app.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  for (const { key, file } of backups) {
    try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore', windowsHide: true }); } catch {}
    if (file) execFileSync('reg.exe', ['import', file], { stdio: 'ignore', windowsHide: true });
  }
  fs.writeFileSync(path.join(dir, 'smoke-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
