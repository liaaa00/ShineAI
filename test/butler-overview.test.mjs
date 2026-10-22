import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describeButlerSession as describe, describeButlerTeam } from '../src/renderer/assets/dev-butler-overview.mjs';
import { patchButlerRenderer, patchButlerHtml, patchButlerFloat } from '../scripts/patch-butler-overview.mjs';

test('normal waiting for another message is idle; actual outstanding actions require attention', () => {
  const ready = { status: 'waiting_input', needsAttention: false, startedAt: new Date(0).toISOString() };
  assert.equal(describe(ready).statusKind, 'idle');
  assert.equal(describe(ready).statusLabel, '等待新消息');
  assert.equal(describe(ready).isWaiting, false);
  assert.equal(describe(ready, 1).statusKind, 'waiting');
  assert.equal(describe({ ...ready, needsAttention: true }).statusKind, 'waiting');
  for (const status of ['waiting_approval', 'waiting_question', 'waiting_permission', 'waiting_confirmation', 'waiting_user']) assert.equal(describe({ status }).statusKind, 'waiting', status);
  assert.equal(describe({ status: 'waiting_input', currentDetection: { reason: 'question' } }).statusKind, 'waiting');
  assert.equal(describe({ ...ready, currentDetection: { reason: 'question' } }).statusKind, 'idle', 'cleared attention must not reappear from an old detection');
  assert.equal(describe({ status: 'waiting_input', currentDetection: { resolved: true } }).statusKind, 'idle');
});
test('terminal outcomes override stale pending events; stopped and unknown states never look running', () => {
  assert.equal(describe({ status: 'failed', needsAttention: true }, 2).statusKind, 'error');
  assert.equal(describe({ status: 'completed', needsAttention: true }, 2).statusKind, 'completed');
  for (const status of ['interrupted', 'stopped', 'cancelled', 'paused', 'unrecognized']) assert.equal(describe({ status }).statusKind, 'idle');
  assert.equal(describe({ status: 'waiting_input' }, 0, 'en').statusLabel, 'Ready for a message');
  assert.equal(describeButlerTeam({ status: 'running' }).statusKind, 'running');
});
test('percentages come only from actual numeric evidence or confirmed completion', () => {
  for (const status of ['running', 'starting', 'waiting_input', 'failed', 'paused', 'waiting_user']) {
    assert.equal(describe({ status, runningTime: 999999999 }).progress, null, status);
    assert.equal(describeButlerTeam({ status }).progressLabel, '');
  }
  assert.equal(describe({ status: 'running', progress: 0 }).progress, 0);
  assert.equal(describe({ status: 'running', progressPercent: 42 }).progressLabel, '42%');
  for (const progress of [undefined, null, '70', -1, 101, NaN, Infinity]) assert.equal(describe({ status: 'running', progress }).progress, null);
  assert.equal(describe({ status: 'completed' }).progress, 100);
  assert.equal(describeButlerTeam({ status: 'completed' }).progress, 100);
});
test('integration patches are repeatable for the main bundle, float chunk and initial HTML', () => {
  for (const [file, patch] of [['assets/index-0LVJEr5c.js', patchButlerRenderer], ['assets/ButlerFloatWindow-zp2h9K2r.js', patchButlerFloat], ['index.html', patchButlerHtml]]) {
    const source = fs.readFileSync(new URL('../src/renderer/' + file, import.meta.url), 'utf8');
    assert.equal(patch(source), source, file);
  }
});
