/**
 * Persistent storage for execution traces.
 * Writes traces to .shineai-traces/<date>/trace-<uuid>.json
 * Screenshots go in .shineai-traces/<date>/screenshots/
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
function dateTag() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function traceDir(baseDir) {
    return join(baseDir, dateTag());
}
function screenshotDir(baseDir) {
    return join(traceDir(baseDir), 'screenshots');
}
/**
 * Writes a single ExecutionTrace to disk as JSON.
 * Returns the file path written, or null on failure.
 * Failures are swallowed — storage errors must not affect main flow.
 */
export async function writeTrace(trace, options = {}) {
    try {
        const baseDir = options.baseDir ?? resolve('.shineai-traces');
        const dir = traceDir(baseDir);
        await mkdir(dir, { recursive: true });
        await mkdir(screenshotDir(baseDir), { recursive: true });
        const filePath = join(dir, `trace-${trace.traceId}.json`);
        await writeFile(filePath, JSON.stringify(trace, null, 2), 'utf8');
        return filePath;
    }
    catch {
        return null;
    }
}
/**
 * Loads a trace from disk by its file path.
 */
export async function loadTrace(filePath) {
    try {
        const raw = await readFile(filePath, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
/**
 * Lists all trace file paths under the given base directory.
 */
export async function listTraceFiles(baseDir) {
    try {
        const base = baseDir ?? resolve('.shineai-traces');
        if (!existsSync(base))
            return [];
        const dates = await readdir(base);
        const paths = [];
        for (const date of dates) {
            const dateDir = join(base, date);
            try {
                const files = await readdir(dateDir);
                for (const file of files) {
                    if (file.startsWith('trace-') && file.endsWith('.json')) {
                        paths.push(join(dateDir, file));
                    }
                }
            }
            catch {
                // skip unreadable date dirs
            }
        }
        return paths;
    }
    catch {
        return [];
    }
}
/**
 * Loads all traces from the given base directory.
 */
export async function loadAllTraces(baseDir) {
    const files = await listTraceFiles(baseDir);
    const traces = [];
    for (const file of files) {
        const trace = await loadTrace(file);
        if (trace)
            traces.push(trace);
    }
    return traces;
}
/**
 * TraceLoader: loads traces from a directory, filters by date range.
 */
export class TraceLoader {
    baseDir;
    constructor(baseDir) {
        this.baseDir = baseDir;
    }
    async load() {
        return loadAllTraces(this.baseDir);
    }
    async loadById(traceId) {
        const files = await listTraceFiles(this.baseDir);
        for (const file of files) {
            if (file.includes(`trace-${traceId}`)) {
                return loadTrace(file);
            }
        }
        return null;
    }
}
/**
 * TraceAnalyzer: aggregates multiple traces into summary statistics.
 */
export class TraceAnalyzer {
    traces;
    constructor(traces) {
        this.traces = traces;
    }
    get count() {
        return this.traces.length;
    }
    get successCount() {
        return this.traces.filter(t => t.finalOk).length;
    }
    get failureCount() {
        return this.traces.filter(t => !t.finalOk).length;
    }
    /** Average duration across finished traces (ms). */
    get avgDurationMs() {
        const finished = this.traces.filter(t => t.durationMs != null && t.durationMs >= 0);
        if (finished.length === 0)
            return null;
        const total = finished.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
        return total / finished.length;
    }
    /** All steps across all traces, flattened. */
    get allSteps() {
        return this.traces.flatMap(t => t.steps);
    }
    /** Steps that attempted selector resolution (pre-find + post-find phases). */
    get findSteps() {
        return this.allSteps.filter(s => s.phase === 'post-find');
    }
    /** Steps that completed dispatch (post-dispatch phase). */
    get dispatchSteps() {
        return this.allSteps.filter(s => s.phase === 'post-dispatch');
    }
    /** Steps that completed verification (post-verify phase). */
    get verifySteps() {
        return this.allSteps.filter(s => s.phase === 'post-verify');
    }
}
