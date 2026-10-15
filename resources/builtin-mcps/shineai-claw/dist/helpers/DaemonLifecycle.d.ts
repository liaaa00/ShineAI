import { type ChildProcess } from "node:child_process";
import { DaemonClient } from "./DaemonClient.js";
export declare const HELPER_PATH_CANDIDATES: string[];
export interface DaemonLifecycleOptions {
    helperBinary: string;
    socketPath?: string;
    daemonArgs?: string[];
    logFile?: string;
    startupTimeoutMs?: number;
    shutdownOnExit?: boolean;
}
export declare class DaemonLifecycle {
    private readonly options;
    private _client;
    private _childProcess;
    private ensurePromise;
    private stopPromise;
    private shutdownHooksRegistered;
    private readonly onProcessExit;
    private readonly onSigint;
    private readonly onSigterm;
    constructor(opts: DaemonLifecycleOptions);
    get client(): DaemonClient | null;
    get childProcess(): ChildProcess | null;
    ensure(): Promise<DaemonClient>;
    stop(): Promise<void>;
    private ensureInternal;
    private stopInternal;
    private createClient;
    private getOrCreateClient;
    private tryPing;
    private spawnDaemonIfNeeded;
    private killSpawnedProcess;
    private isProcessAlive;
    private registerShutdownHooks;
}
