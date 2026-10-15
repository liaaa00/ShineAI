/**
 * Persistent storage for execution traces.
 * Writes traces to .shineai-traces/<date>/trace-<uuid>.json
 * Screenshots go in .shineai-traces/<date>/screenshots/
 */
import type { ExecutionTrace, TraceStep } from './trace.js';
export interface TraceStorageOptions {
    baseDir?: string;
    /** Max age in days for traces (0 = no cleanup). Default: 0 */
    retentionDays?: number;
}
/**
 * Writes a single ExecutionTrace to disk as JSON.
 * Returns the file path written, or null on failure.
 * Failures are swallowed — storage errors must not affect main flow.
 */
export declare function writeTrace(trace: ExecutionTrace, options?: TraceStorageOptions): Promise<string | null>;
/**
 * Loads a trace from disk by its file path.
 */
export declare function loadTrace(filePath: string): Promise<ExecutionTrace | null>;
/**
 * Lists all trace file paths under the given base directory.
 */
export declare function listTraceFiles(baseDir?: string): Promise<string[]>;
/**
 * Loads all traces from the given base directory.
 */
export declare function loadAllTraces(baseDir?: string): Promise<ExecutionTrace[]>;
/**
 * TraceLoader: loads traces from a directory, filters by date range.
 */
export declare class TraceLoader {
    private readonly baseDir?;
    constructor(baseDir?: string | undefined);
    load(): Promise<ExecutionTrace[]>;
    loadById(traceId: string): Promise<ExecutionTrace | null>;
}
/**
 * TraceAnalyzer: aggregates multiple traces into summary statistics.
 */
export declare class TraceAnalyzer {
    private readonly traces;
    constructor(traces: ExecutionTrace[]);
    get count(): number;
    get successCount(): number;
    get failureCount(): number;
    /** Average duration across finished traces (ms). */
    get avgDurationMs(): number | null;
    /** All steps across all traces, flattened. */
    get allSteps(): TraceStep[];
    /** Steps that attempted selector resolution (pre-find + post-find phases). */
    get findSteps(): TraceStep[];
    /** Steps that completed dispatch (post-dispatch phase). */
    get dispatchSteps(): TraceStep[];
    /** Steps that completed verification (post-verify phase). */
    get verifySteps(): TraceStep[];
}
