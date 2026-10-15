/**
 * Benchmark metrics calculation from execution traces.
 *
 * Primary metrics align with generate-canonical-report.mjs REQUIRED_METRIC_DEFINITIONS:
 *   semanticActionSuccessRate, backgroundActionSuccessRate, foregroundFallbackRate,
 *   visionFallbackRate, hidFallbackRate, postActionVerificationSuccessRate
 *
 * Additional trace-derived metrics:
 *   elementLocatingAccuracy, fallbackRate, selectorHitRate, avgDurationMs
 *
 * Note: "semantic" means the action used a structured selector (non-HID).
 * "background" is approximated as non-foreground-required + action succeeded.
 */
function makeRate(numerator, denominator) {
    return {
        numerator,
        denominator,
        rate: denominator === 0 ? null : Number((numerator / denominator).toFixed(4)),
    };
}
/**
 * Calculates benchmark metrics from a single ExecutionTrace.
 * All errors are caught internally; returns a zero/null baseline on failure.
 */
export function calculateBenchmarkMetrics(trace) {
    return calculateBenchmarkMetricsFromTraces([trace]);
}
/**
 * Calculates benchmark metrics across multiple ExecutionTraces.
 */
export function calculateBenchmarkMetricsFromTraces(traces) {
    try {
        const allSteps = traces.flatMap(t => t.steps);
        const findSteps = allSteps.filter(s => s.phase === 'post-find');
        const dispatchSteps = allSteps.filter(s => s.phase === 'post-dispatch');
        const verifySteps = allSteps.filter(s => s.phase === 'post-verify');
        // elementLocatingAccuracy: selectorResolved / selectorAttempted
        const selectorAttempted = findSteps.filter(s => s.selectorAttempted !== false);
        const selectorResolved = selectorAttempted.filter(s => s.selectorResolved === true || s.elementFound === true);
        const elementLocatingAccuracy = makeRate(selectorResolved.length, selectorAttempted.length);
        // selectorHitRate: same as element locating accuracy (post-find)
        const selectorHitRate = elementLocatingAccuracy;
        // postActionVerificationSuccessRate
        const verifyPassed = verifySteps.filter(s => s.verificationOk === true);
        const postActionVerificationSuccessRate = makeRate(verifyPassed.length, verifySteps.length);
        // fallbackRate
        const fallbackSteps = dispatchSteps.filter(s => s.usedFallback === true);
        const fallbackRate = makeRate(fallbackSteps.length, dispatchSteps.length);
        // foregroundFallbackRate
        const foregroundSteps = dispatchSteps.filter(s => s.foregroundRequired === true);
        const foregroundFallbackRate = makeRate(foregroundSteps.length, dispatchSteps.length);
        // visionFallbackRate: provider kind 'vision-ocr'
        const visionSteps = dispatchSteps.filter(s => s.provider?.kind === 'vision-ocr' || s.usedFallback === true && s.provider?.kind === 'vision-ocr');
        const visionFallbackRate = makeRate(visionSteps.length, dispatchSteps.length);
        // hidFallbackRate: provider kind 'hid'
        const hidSteps = dispatchSteps.filter(s => s.provider?.kind === 'hid');
        const hidFallbackRate = makeRate(hidSteps.length, dispatchSteps.length);
        // semanticActionSuccessRate: non-foreground dispatch steps that succeeded
        const semanticSteps = dispatchSteps.filter(s => s.foregroundRequired !== true);
        const semanticSuccess = semanticSteps.filter(s => s.actionOk === true);
        const semanticActionSuccessRate = makeRate(semanticSuccess.length, semanticSteps.length);
        // backgroundActionSuccessRate: same bucket for trace-derived data
        const backgroundActionSuccessRate = semanticActionSuccessRate;
        // avgDurationMs from post-dispatch steps
        const dispatchDurations = dispatchSteps
            .map(s => s.durationMs)
            .filter((d) => d != null && d >= 0);
        const avgDurationMs = dispatchDurations.length > 0
            ? dispatchDurations.reduce((a, b) => a + b, 0) / dispatchDurations.length
            : null;
        return {
            elementLocatingAccuracy,
            postActionVerificationSuccessRate,
            fallbackRate,
            foregroundFallbackRate,
            visionFallbackRate,
            hidFallbackRate,
            semanticActionSuccessRate,
            backgroundActionSuccessRate,
            selectorHitRate,
            avgDurationMs,
            traceCount: traces.length,
            calculatedAt: new Date().toISOString(),
        };
    }
    catch {
        const zero = makeRate(0, 0);
        return {
            elementLocatingAccuracy: zero,
            postActionVerificationSuccessRate: zero,
            fallbackRate: zero,
            foregroundFallbackRate: zero,
            visionFallbackRate: zero,
            hidFallbackRate: zero,
            semanticActionSuccessRate: zero,
            backgroundActionSuccessRate: zero,
            selectorHitRate: zero,
            avgDurationMs: null,
            traceCount: traces.length,
            calculatedAt: new Date().toISOString(),
        };
    }
}
/**
 * Convenience: compute metrics from a TraceAnalyzer instance.
 */
export function metricsFromAnalyzer(analyzer) {
    return calculateBenchmarkMetricsFromTraces(
    // TraceAnalyzer exposes allSteps, but we need full traces.
    // Re-expose via a synthetic single trace that aggregates all steps.
    [{
            traceId: 'aggregate',
            startedAt: 0,
            steps: analyzer.allSteps,
            finalOk: analyzer.successCount > 0,
        }]);
}
