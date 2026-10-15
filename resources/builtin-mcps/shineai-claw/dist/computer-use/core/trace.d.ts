/**
 * Execution trace recording for ShineAI Claw computer-use runtime.
 * Captures pre/post state at each phase without inlining image buffers.
 */
export type TracePhase = 'pre-route' | 'pre-find' | 'post-find' | 'pre-dispatch' | 'post-dispatch' | 'post-verify';
export interface ScreenshotRef {
    /** Absolute path to the screenshot file on disk. Never inline buffer. */
    path: string;
    capturedAt: number;
    /** Optional element count from annotation if available. */
    elementCount?: number;
}
export interface TraceElementInfo {
    id?: string;
    role?: string;
    name?: string;
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    source?: string;
    confidence?: number;
}
export interface TraceProviderInfo {
    id: string;
    kind: string;
    priority?: number;
    fallback?: boolean;
}
export interface TraceStep {
    phase: TracePhase;
    timestamp: number;
    provider?: TraceProviderInfo;
    screenshotBefore?: ScreenshotRef;
    screenshotAfter?: ScreenshotRef;
    elementFound?: boolean;
    element?: TraceElementInfo;
    actionOk?: boolean;
    actionMethod?: string;
    actionChanged?: boolean;
    actionError?: string;
    verificationOk?: boolean;
    verificationMode?: string;
    verificationMessage?: string;
    selectorAttempted?: boolean;
    selectorResolved?: boolean;
    usedFallback?: boolean;
    foregroundRequired?: boolean;
    durationMs?: number;
    metadata?: Record<string, unknown>;
}
export interface TraceActionSummary {
    type: string;
    id?: string;
    target?: string;
}
export interface ExecutionTrace {
    traceId: string;
    sessionId?: string;
    startedAt: number;
    finishedAt?: number;
    durationMs?: number;
    action?: TraceActionSummary;
    steps: TraceStep[];
    finalOk?: boolean;
    finalPhase?: string;
    finalProviderId?: string;
    finalError?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Records execution steps for a single executeAction call.
 * All record* methods are wrapped in try/catch — a recording failure
 * never propagates to the caller.
 */
export declare class TraceRecorder {
    private trace;
    private stepStart;
    constructor(traceId: string, sessionId?: string);
    startTrace(action?: TraceActionSummary): void;
    recordStep(step: TraceStep): void;
    markPhaseStart(phase: TracePhase): void;
    recordPreRoute(): void;
    recordPreFind(provider: TraceProviderInfo, selectorAttempted: boolean): void;
    recordPostFind(provider: TraceProviderInfo, elementFound: boolean, element?: TraceElementInfo): void;
    recordPreDispatch(provider: TraceProviderInfo, element?: TraceElementInfo): void;
    recordPostDispatch(provider: TraceProviderInfo, result: {
        ok: boolean;
        method?: string;
        changed?: boolean;
        error?: string;
        usedFallback?: boolean;
        foregroundRequired?: boolean;
    }): void;
    recordPostVerify(provider: TraceProviderInfo, verification: {
        ok: boolean;
        mode?: string;
        message?: string;
    }): void;
    finalize(result: {
        ok: boolean;
        phase?: string;
        providerId?: string;
        error?: string;
    }): ExecutionTrace;
    getTrace(): ExecutionTrace;
}
