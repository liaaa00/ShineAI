/**
 * Execution trace recording for ShineAI Claw computer-use runtime.
 * Captures pre/post state at each phase without inlining image buffers.
 */
/**
 * Records execution steps for a single executeAction call.
 * All record* methods are wrapped in try/catch — a recording failure
 * never propagates to the caller.
 */
export class TraceRecorder {
    trace;
    stepStart = new Map();
    constructor(traceId, sessionId) {
        this.trace = {
            traceId,
            sessionId,
            startedAt: Date.now(),
            steps: [],
        };
    }
    startTrace(action) {
        try {
            this.trace.action = action;
            this.trace.startedAt = Date.now();
        }
        catch {
            // recording errors must not propagate
        }
    }
    recordStep(step) {
        try {
            const now = Date.now();
            const phaseStart = this.stepStart.get(step.phase);
            const enriched = {
                ...step,
                timestamp: step.timestamp ?? now,
                durationMs: phaseStart != null ? now - phaseStart : step.durationMs,
            };
            this.trace.steps.push(enriched);
        }
        catch {
            // recording errors must not propagate
        }
    }
    markPhaseStart(phase) {
        try {
            this.stepStart.set(phase, Date.now());
        }
        catch {
            // recording errors must not propagate
        }
    }
    recordPreRoute() {
        try {
            this.markPhaseStart('pre-route');
            this.recordStep({ phase: 'pre-route', timestamp: Date.now() });
        }
        catch {
            // recording errors must not propagate
        }
    }
    recordPreFind(provider, selectorAttempted) {
        try {
            this.markPhaseStart('pre-find');
            this.recordStep({
                phase: 'pre-find',
                timestamp: Date.now(),
                provider,
                selectorAttempted,
            });
        }
        catch {
            // recording errors must not propagate
        }
    }
    recordPostFind(provider, elementFound, element) {
        try {
            const phaseStart = this.stepStart.get('pre-find');
            this.recordStep({
                phase: 'post-find',
                timestamp: Date.now(),
                provider,
                elementFound,
                element,
                selectorResolved: elementFound,
                durationMs: phaseStart != null ? Date.now() - phaseStart : undefined,
            });
        }
        catch {
            // recording errors must not propagate
        }
    }
    recordPreDispatch(provider, element) {
        try {
            this.markPhaseStart('pre-dispatch');
            this.recordStep({
                phase: 'pre-dispatch',
                timestamp: Date.now(),
                provider,
                element,
            });
        }
        catch {
            // recording errors must not propagate
        }
    }
    recordPostDispatch(provider, result) {
        try {
            const phaseStart = this.stepStart.get('pre-dispatch');
            this.recordStep({
                phase: 'post-dispatch',
                timestamp: Date.now(),
                provider,
                actionOk: result.ok,
                actionMethod: result.method,
                actionChanged: result.changed,
                actionError: result.error,
                usedFallback: result.usedFallback,
                foregroundRequired: result.foregroundRequired,
                durationMs: phaseStart != null ? Date.now() - phaseStart : undefined,
            });
        }
        catch {
            // recording errors must not propagate
        }
    }
    recordPostVerify(provider, verification) {
        try {
            this.recordStep({
                phase: 'post-verify',
                timestamp: Date.now(),
                provider,
                verificationOk: verification.ok,
                verificationMode: verification.mode,
                verificationMessage: verification.message,
            });
        }
        catch {
            // recording errors must not propagate
        }
    }
    finalize(result) {
        try {
            const now = Date.now();
            this.trace.finishedAt = now;
            this.trace.durationMs = now - this.trace.startedAt;
            this.trace.finalOk = result.ok;
            this.trace.finalPhase = result.phase;
            this.trace.finalProviderId = result.providerId;
            this.trace.finalError = result.error;
        }
        catch {
            // recording errors must not propagate
        }
        return this.trace;
    }
    getTrace() {
        return this.trace;
    }
}
