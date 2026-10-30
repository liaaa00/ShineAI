import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { displayToolName, displayRuntimeActivity, formatTaskElapsed, deriveTaskProgress } from '../src/renderer/assets/dev-task-progress.mjs';
import { patchTaskProgressMain, patchTaskProgressRenderer, patchTaskProgressHtml } from '../scripts/patch-task-progress.mjs';
const user = { role: 'user', timestamp: 100000, content: '检查项目' };
const use = (id, toolName = 'Bash') => ({ role: 'tool_use', toolUseId: id, toolName, timestamp: 101000 });
const result = (id, extra = {}) => ({ role: 'tool_result', toolUseId: id, timestamp: 102000, ...extra });
const answer = { role: 'assistant', content: '检查结果如下。', timestamp: 103000 };
const derive = (extra = {}) => deriveTaskProgress({ sessionId: 's', status: 'running', now: 108000, messages: [user], ...extra });
test('tool aliases and elapsed time are readable Chinese', () => {
  assert.equal(displayToolName('mcp__builtin__grep'), '搜索内容');
  assert.equal(displayToolName('Read'), '读取文件');
  assert.equal(displayToolName('unknown'), '调用工具');
  assert.equal(formatTaskElapsed(402), '6 分 42 秒');
  assert.equal(displayRuntimeActivity('Turn completed (waiting for next input, tokens: 314)'), '本轮回复已结束，等待下一条消息');
  assert.equal(displayRuntimeActivity('npm run test'), 'npm run test');
  assert.equal(displayRuntimeActivity('Thinking', false), 'Thinking');
});
test('runtime counts come from actual uses and results, not plan or percentages', () => {
  const p = derive({ messages: [user, use('a', 'Read'), result('a'), use('b')] });
  assert.equal(p.stage, 'tool'); assert.equal(p.label, '正在执行命令');
  assert.equal(p.completed, 1); assert.equal(p.pending, 1); assert.equal(p.total, 2);
  assert.match(p.summary, /1 个操作成功.*1 个进行中/);
  assert.equal(p.animate, true); assert.equal('percent' in p, false);
});
test('counts exclude older turns and results must match tool IDs', () => {
  const p = derive({ messages: [use('old'), result('old'), user, use('new'), result('different')] });
  assert.equal(p.total, 1); assert.equal(p.completed, 0); assert.equal(p.pending, 1);
});
test('a settled result beats late running status and old lastActivity', () => {
  const p = derive({ messages: [user, use('a'), result('a')], toolStatus: { status: 'running', toolUseId: 'a', toolName: 'Bash' }, lastActivity: { type: 'tool', toolName: 'Bash' } });
  assert.equal(p.stage, 'thinking'); assert.equal(p.pending, 0);
  const old = derive({ toolStatus: { status: 'running', toolUseId: 'old', toolName: 'Bash', startedAt: 99000 } });
  assert.equal(old.stage, 'thinking');
});
test('gateway names resolve to a Chinese operation while raw params stay in details', () => {
  const p = derive({ messages: [user, { ...use('a', 'call_mcp_tool'), toolInput: JSON.stringify({ tool_name: 'mcp__tools__read_file', file_path: 'D:/example.txt' }) }] });
  assert.equal(p.label, '正在读取文件'); assert.equal(p.rawDetail, 'D:/example.txt');
});
test('permission, question, pause, error and stop never show a running animation', () => {
  for (const [input, stage] of [[{ pendingPermission: true }, 'waiting'], [{ pendingAskQuestion: true }, 'waiting'], [{ pendingPlanApproval: true }, 'waiting'], [{ status: 'paused' }, 'paused'], [{ status: 'error' }, 'failed'], [{ status: 'terminated' }, 'stopped'], [{ status: 'interrupted' }, 'interrupted']]) {
    const p = derive({ streaming: true, ...input }); assert.equal(p.stage, stage); assert.equal(p.animate, false);
  }
});
test('reply ended is explicit and not a claim that all work succeeded', () => {
  const p = derive({ status: 'waiting_input', streaming: true, messages: [user, use('a'), result('a'), answer] });
  assert.equal(p.stage, 'complete'); assert.equal(p.animate, false); assert.equal(p.elapsed, 3);
  assert.equal(p.label, '本轮回复已结束'); assert.match(p.summary, /以回复与验证结果为准/);
  assert.doesNotMatch(p.label, /全部完成|任务成功/);
});
test('missing tool results and unknown background outcomes do not become success', () => {
  const p = derive({ status: 'waiting_input', messages: [user, use('a'), answer] });
  assert.equal(p.stage, 'unconfirmed'); assert.equal(p.completed, 0); assert.equal(p.animate, false);
  const bg = derive({ status: 'waiting_input', messages: [user, use('a'), result('a'), answer], jobs: [{ sessionId: 's', toolUseId: 'a', status: 'exited' }] });
  assert.equal(bg.stage, 'unconfirmed'); assert.equal(bg.completed, 0);
});
test('background process remains visibly running after the model reply ends', () => {
  const p = derive({ status: 'waiting_input', messages: [user, use('a'), result('a'), answer], jobs: [{ sessionId: 's', toolUseId: 'a', status: 'running' }, { sessionId: 'other', status: 'running' }] });
  assert.equal(p.stage, 'background'); assert.equal(p.animate, true); assert.equal(p.background.length, 1);
  assert.match(p.label, /1 个后台任务仍在运行/); assert.equal(p.completed, 0);
});
test('failed results and nonzero exits are counted as failures, not successes', () => {
  for (const input of [{ messages: [user, use('a'), result('a', { isError: true }), answer] }, { messages: [user, use('a'), result('a'), answer], jobs: [{ sessionId: 's', toolUseId: 'a', status: 'exited', exitCode: 1 }] }]) {
    const p = derive({ status: 'waiting_input', ...input }); assert.equal(p.completed, 0); assert.equal(p.failed, 1); assert.match(p.label, /失败/);
  }
});
test('idle empty sessions have no invented task; elapsed accepts ISO times', () => {
  assert.equal(derive({ status: 'idle', messages: [] }).visible, false);
  const p = derive({ messages: [{ ...user, timestamp: new Date(100000).toISOString() }, { ...answer, timestamp: new Date(103000).toISOString() }], status: 'waiting_input' });
  assert.equal(p.elapsed, 3);
});
test('patches reproduce without duplication and distinguish plan completion', () => {
  for (const [file, patch] of [['src/main/index.js', patchTaskProgressMain], ['src/renderer/assets/index-0LVJEr5c.js', patchTaskProgressRenderer], ['src/renderer/index.html', patchTaskProgressHtml]]) {
    const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    const once = patch(source); assert.equal(patch(once), once);
    if (file.endsWith('index-0LVJEr5c.js')) {
      assert.equal(once.split('jsxRuntimeExports.jsx(TaskProgressUI.TaskProgress,').length - 1, 1);
      assert.match(once, /allCompleted: "计划步骤已完成"/);
    }
    if (file === 'src/main/index.js') {
      assert.match(once, /'alwaysReplyInChinese':!0x0,/);
      assert.match(once, /技能中的英文模板不能覆盖这一语言要求/);
    }
  }
});
