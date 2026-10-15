import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TraceRecorder } from '../trace.js';
import { calculateBenchmarkMetrics, calculateBenchmarkMetricsFromTraces } from '../benchmark-metrics.js';
// ---- TraceRecorder unit tests ----
describe('TraceRecorder', () => {
    it('initialises with a traceId and empty steps', () => {
        const recorder = new TraceRecorder('test-id-1');
        const trace = recorder.getTrace();
        assert.equal(trace.traceId, 'test-id-1');
        assert.deepStrictEqual(trace.steps, []);
        assert.ok(trace.startedAt > 0);
    });
    it('startTrace sets action metadata', () => {
        const recorder = new TraceRecorder('test-id-2');
        recorder.startTrace({ type: 'click', id: 'a1', target: 'Submit' });
        const trace = recorder.getTrace();
        assert.equal(trace.action?.type, 'click');
        assert.equal(trace.action?.id, 'a1');
    });
    it('recordPreRoute appends a pre-route step', () => {
        const recorder = new TraceRecorder('test-id-3');
        recorder.recordPreRoute();
        const trace = recorder.getTrace();
        assert.equal(trace.steps.length, 1);
        assert.equal(trace.steps[0].phase, 'pre-route');
        assert.ok(trace.steps[0].timestamp > 0);
    });
    it('recordPreFind appends a pre-find step', () => {
        const recorder = new TraceRecorder('test-id-4');
        recorder.recordPreFind({ id: 'prov1', kind: 'browser' }, true);
        const trace = recorder.getTrace();
        assert.equal(trace.steps.length, 1);
        assert.equal(trace.steps[0].phase, 'pre-find');
        assert.equal(trace.steps[0].provider?.id, 'prov1');
        assert.equal(trace.steps[0].selectorAttempted, true);
    });
    it('recordPostFind appends a post-find step with element info', () => {
        const recorder = new TraceRecorder('test-id-5');
        recorder.recordPostFind({ id: 'prov1', kind: 'os-accessibility' }, true, { id: 'el-1', role: 'button', name: 'OK' });
        const trace = recorder.getTrace();
        assert.equal(trace.steps.length, 1);
        assert.equal(trace.steps[0].phase, 'post-find');
        assert.equal(trace.steps[0].elementFound, true);
        assert.equal(trace.steps[0].element?.name, 'OK');
        assert.equal(trace.steps[0].selectorResolved, true);
    });
    it('recordPostFind marks selectorResolved=false when element not found', () => {
        const recorder = new TraceRecorder('test-id-6');
        recorder.recordPostFind({ id: 'prov1', kind: 'hid' }, false);
        const trace = recorder.getTrace();
        assert.equal(trace.steps[0].elementFound, false);
        assert.equal(trace.steps[0].selectorResolved, false);
    });
    it('recordPreDispatch appends a pre-dispatch step', () => {
        const recorder = new TraceRecorder('test-id-7');
        recorder.recordPreDispatch({ id: 'prov1', kind: 'browser' }, { id: 'el-1', role: 'button' });
        const trace = recorder.getTrace();
        assert.equal(trace.steps.length, 1);
        assert.equal(trace.steps[0].phase, 'pre-dispatch');
    });
    it('recordPostDispatch appends a post-dispatch step with result', () => {
        const recorder = new TraceRecorder('test-id-8');
        recorder.recordPostDispatch({ id: 'prov1', kind: 'browser' }, { ok: true, method: 'dom.click', changed: true });
        const trace = recorder.getTrace();
        assert.equal(trace.steps.length, 1);
        assert.equal(trace.steps[0].phase, 'post-dispatch');
        assert.equal(trace.steps[0].actionOk, true);
        assert.equal(trace.steps[0].actionMethod, 'dom.click');
        assert.equal(trace.steps[0].actionChanged, true);
    });
    it('recordPostVerify appends a post-verify step', () => {
        const recorder = new TraceRecorder('test-id-9');
        recorder.recordPostVerify({ id: 'prov1', kind: 'browser' }, { ok: true, mode: 'visible-state', message: undefined });
        const trace = recorder.getTrace();
        assert.equal(trace.steps.length, 1);
        assert.equal(trace.steps[0].phase, 'post-verify');
        assert.equal(trace.steps[0].verificationOk, true);
        assert.equal(trace.steps[0].verificationMode, 'visible-state');
    });
    it('finalize sets finishedAt, durationMs, and final fields', () => {
        const recorder = new TraceRecorder('test-id-10');
        recorder.startTrace({ type: 'invoke' });
        const trace = recorder.finalize({ ok: true, phase: 'execute', providerId: 'prov1' });
        assert.ok(trace.finishedAt != null && trace.finishedAt > 0);
        assert.ok(trace.durationMs != null && trace.durationMs >= 0);
        assert.equal(trace.finalOk, true);
        assert.equal(trace.finalPhase, 'execute');
        assert.equal(trace.finalProviderId, 'prov1');
    });
    it('recording errors never throw (resilience test)', () => {
        const recorder = new TraceRecorder('test-id-11');
        // Force an invalid step (recordStep with bad data should not throw)
        assert.doesNotThrow(() => {
            // @ts-expect-error intentional bad input
            recorder.recordStep(null);
        });
        assert.doesNotThrow(() => recorder.finalize({ ok: false }));
    });
    it('accumulates multiple steps across phases', () => {
        const recorder = new TraceRecorder('test-id-12');
        recorder.recordPreRoute();
        recorder.recordPreFind({ id: 'p1', kind: 'browser' }, true);
        recorder.recordPostFind({ id: 'p1', kind: 'browser' }, true, { id: 'el', role: 'button' });
        recorder.recordPreDispatch({ id: 'p1', kind: 'browser' });
        recorder.recordPostDispatch({ id: 'p1', kind: 'browser' }, { ok: true, method: 'dom.click', changed: true });
        recorder.recordPostVerify({ id: 'p1', kind: 'browser' }, { ok: true, mode: 'visible-state' });
        const trace = recorder.finalize({ ok: true, phase: 'execute', providerId: 'p1' });
        assert.equal(trace.steps.length, 6);
        const phases = trace.steps.map(s => s.phase);
        assert.deepStrictEqual(phases, [
            'pre-route',
            'pre-find',
            'post-find',
            'pre-dispatch',
            'post-dispatch',
            'post-verify',
        ]);
    });
});
// ---- BenchmarkMetrics unit tests ----
function makeTrace(steps, ok = true) {
    return {
        traceId: `t-${Math.random().toString(36).slice(2)}`,
        startedAt: Date.now(),
        steps,
        finalOk: ok,
    };
}
describe('calculateBenchmarkMetrics', () => {
    it('returns zero metrics for empty trace', () => {
        const metrics = calculateBenchmarkMetrics(makeTrace([]));
        assert.equal(metrics.elementLocatingAccuracy.denominator, 0);
        assert.equal(metrics.elementLocatingAccuracy.rate, null);
        assert.equal(metrics.postActionVerificationSuccessRate.denominator, 0);
        assert.equal(metrics.traceCount, 1);
    });
    it('calculates elementLocatingAccuracy from post-find steps', () => {
        const steps = [
            { phase: 'post-find', timestamp: 1, selectorAttempted: true, elementFound: true, selectorResolved: true },
            { phase: 'post-find', timestamp: 2, selectorAttempted: true, elementFound: false, selectorResolved: false },
            { phase: 'post-find', timestamp: 3, selectorAttempted: true, elementFound: true, selectorResolved: true },
        ];
        const metrics = calculateBenchmarkMetrics(makeTrace(steps));
        assert.equal(metrics.elementLocatingAccuracy.numerator, 2);
        assert.equal(metrics.elementLocatingAccuracy.denominator, 3);
        assert.ok(Math.abs((metrics.elementLocatingAccuracy.rate ?? 0) - 0.6667) < 0.001);
    });
    it('calculates postActionVerificationSuccessRate from post-verify steps', () => {
        const steps = [
            { phase: 'post-verify', timestamp: 1, verificationOk: true },
            { phase: 'post-verify', timestamp: 2, verificationOk: false },
            { phase: 'post-verify', timestamp: 3, verificationOk: true },
            { phase: 'post-verify', timestamp: 4, verificationOk: true },
        ];
        const metrics = calculateBenchmarkMetrics(makeTrace(steps));
        assert.equal(metrics.postActionVerificationSuccessRate.numerator, 3);
        assert.equal(metrics.postActionVerificationSuccessRate.denominator, 4);
        assert.ok(Math.abs((metrics.postActionVerificationSuccessRate.rate ?? 0) - 0.75) < 0.001);
    });
    it('calculates fallbackRate from post-dispatch steps', () => {
        const steps = [
            { phase: 'post-dispatch', timestamp: 1, actionOk: true, usedFallback: true },
            { phase: 'post-dispatch', timestamp: 2, actionOk: true, usedFallback: false },
            { phase: 'post-dispatch', timestamp: 3, actionOk: false, usedFallback: true },
        ];
        const metrics = calculateBenchmarkMetrics(makeTrace(steps));
        assert.equal(metrics.fallbackRate.numerator, 2);
        assert.equal(metrics.fallbackRate.denominator, 3);
    });
    it('calculates visionFallbackRate from provider kind', () => {
        const steps = [
            { phase: 'post-dispatch', timestamp: 1, provider: { id: 'v1', kind: 'vision-ocr' }, actionOk: true },
            { phase: 'post-dispatch', timestamp: 2, provider: { id: 'b1', kind: 'browser' }, actionOk: true },
        ];
        const metrics = calculateBenchmarkMetrics(makeTrace(steps));
        assert.equal(metrics.visionFallbackRate.numerator, 1);
        assert.equal(metrics.visionFallbackRate.denominator, 2);
    });
    it('calculates hidFallbackRate from provider kind', () => {
        const steps = [
            { phase: 'post-dispatch', timestamp: 1, provider: { id: 'h1', kind: 'hid' }, actionOk: true },
            { phase: 'post-dispatch', timestamp: 2, provider: { id: 'b1', kind: 'browser' }, actionOk: true },
        ];
        const metrics = calculateBenchmarkMetrics(makeTrace(steps));
        assert.equal(metrics.hidFallbackRate.numerator, 1);
        assert.equal(metrics.hidFallbackRate.denominator, 2);
    });
    it('calculates semanticActionSuccessRate (non-foreground success)', () => {
        const steps = [
            { phase: 'post-dispatch', timestamp: 1, foregroundRequired: false, actionOk: true },
            { phase: 'post-dispatch', timestamp: 2, foregroundRequired: true, actionOk: true },
            { phase: 'post-dispatch', timestamp: 3, foregroundRequired: false, actionOk: false },
        ];
        const metrics = calculateBenchmarkMetrics(makeTrace(steps));
        assert.equal(metrics.semanticActionSuccessRate.numerator, 1);
        assert.equal(metrics.semanticActionSuccessRate.denominator, 2);
    });
    it('aggregates metrics across multiple traces', () => {
        const traces = [
            makeTrace([
                { phase: 'post-dispatch', timestamp: 1, actionOk: true, usedFallback: false },
                { phase: 'post-verify', timestamp: 2, verificationOk: true },
            ]),
            makeTrace([
                { phase: 'post-dispatch', timestamp: 3, actionOk: false, usedFallback: true },
                { phase: 'post-verify', timestamp: 4, verificationOk: false },
            ]),
        ];
        const metrics = calculateBenchmarkMetricsFromTraces(traces);
        assert.equal(metrics.traceCount, 2);
        assert.equal(metrics.postActionVerificationSuccessRate.denominator, 2);
        assert.equal(metrics.postActionVerificationSuccessRate.numerator, 1);
    });
    it('never throws on corrupted trace input', () => {
        assert.doesNotThrow(() => {
            // @ts-expect-error intentional bad input
            calculateBenchmarkMetrics(null);
        });
        assert.doesNotThrow(() => {
            // @ts-expect-error intentional bad input
            calculateBenchmarkMetrics({ steps: null });
        });
    });
});
