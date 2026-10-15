export interface ShellResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
/** Machine-readable unhealthy prefix for callers / probes */
export declare const PS_UNHEALTHY = "PS_UNHEALTHY";
export declare class PersistentShell {
    private proc;
    private ready;
    private starting;
    private stdoutBuf;
    private pendingResolve;
    private pendingReject;
    private pendingTimer;
    /** Serial queue: at most one script in-flight (ponytail: chain, no PriorityQueue). */
    private queue;
    private consecutivePingFails;
    /** Generation guard so stale exit/error handlers cannot wipe a newer proc. */
    private generation;
    /** Start the persistent PowerShell process (idempotent; awaits in-flight start). */
    start(): Promise<void>;
    /** Explicit cold start after kill/hang. */
    restart(): Promise<void>;
    private forceKill;
    private spawnAndWaitReady;
    private ensureReady;
    private tryResolve;
    private clearTimer;
    /**
     * Confirm the command loop is reading stdin before start() resolves. The first line written right
     * after READY can be swallowed by PowerShell's `-Command -` read-ahead, so retry a cheap ping
     * (without killing the process on a swallowed try) until one echoes back.
     */
    private warmup;
    private execUnlocked;
    /** Execute a script in the persistent process (serialized). */
    exec(script: string, timeout?: number): Promise<ShellResult>;
    /**
     * Lightweight liveness probe. Consecutive failures yield PS_UNHEALTHY and attempt restart.
     */
    ping(timeout?: number): Promise<ShellResult>;
    /** Kill the persistent process (next exec will cold-start). */
    kill(): void;
}
/** Singleton instance */
export declare const shell: PersistentShell;
