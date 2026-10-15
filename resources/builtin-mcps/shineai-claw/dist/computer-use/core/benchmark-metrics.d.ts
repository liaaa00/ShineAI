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
import type { ExecutionTrace } from './trace.js';
import type { TraceAnalyzer } from './trace-storage.js';
export interface RateMetric {
    numerator: number;
    denominator: number;
    rate: number | null;
}
export interface BenchmarkMetrics {
    /** Rate at which element find succeeded (post-find selectorResolved=true) */
    elementLocatingAccuracy: RateMetric;
    /**
     * postActionVerificationSuccessRate — aligns with REQUIRED_METRIC_DEFINITIONS.
     * Rate at which post-action verify steps passed.
     */
    postActionVerificationSuccessRate: RateMetric;
    /**
     * Fraction of dispatch steps that used a fallback provider/method.
     */
    fallbackRate: RateMetric;
    /**
     * Fraction of dispatch steps where foreground was required.
     * Aligns with foregroundFallbackRate in REQUIRED_METRIC_DEFINITIONS.
     */
    foregroundFallbackRate: RateMetric;
    /**
     * Fraction of actions where vision/OCR fallback was used.
     * Aligns with visionFallbackRate in REQUIRED_METRIC_DEFINITIONS.
     */
    visionFallbackRate: RateMetric;
    /**
     * Fraction of actions where HID fallback was used.
     * Aligns with hidFallbackRate in REQUIRED_METRIC_DEFINITIONS.
     */
    hidFallbackRate: RateMetric;
    /**
     * Dispatch success rate for non-foreground-required steps (proxy for semantic/background).
     * Aligns with semanticActionSuccessRate / backgroundActionSuccessRate in REQUIRED_METRIC_DEFINITIONS.
     */
    semanticActionSuccessRate: RateMetric;
    /**
     * Alias: backgroundActionSuccessRate (same denominator as semanticActionSuccessRate for trace-derived data).
     */
    backgroundActionSuccessRate: RateMetric;
    /**
     * Selector resolution rate (post-find selectorResolved / selectorAttempted).
     */
    selectorHitRate: RateMetric;
    /** Average action dispatch duration in ms, or null if no timing data. */
    avgDurationMs: number | null;
    /** Total traces analysed. */
    traceCount: number;
    /** Timestamp of calculation. */
    calculatedAt: string;
}
/**
 * Calculates benchmark metrics from a single ExecutionTrace.
 * All errors are caught internally; returns a zero/null baseline on failure.
 */
export declare function calculateBenchmarkMetrics(trace: ExecutionTrace): BenchmarkMetrics;
/**
 * Calculates benchmark metrics across multiple ExecutionTraces.
 */
export declare function calculateBenchmarkMetricsFromTraces(traces: ExecutionTrace[]): BenchmarkMetrics;
/**
 * Convenience: compute metrics from a TraceAnalyzer instance.
 */
export declare function metricsFromAnalyzer(analyzer: TraceAnalyzer): BenchmarkMetrics;
