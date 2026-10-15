import { type ChildProcess, type SpawnOptions } from 'node:child_process';
import type { BrowserConnectionOptions } from './types.js';
export interface EnsureDebugBrowserOptions extends BrowserConnectionOptions {
    readyTimeoutMs?: number;
    pollIntervalMs?: number;
}
export interface EnsureDebugBrowserResult {
    host: string;
    port: number;
    browserURL: string;
    alreadyRunning: boolean;
    spawned: boolean;
    browserPath?: string;
    userDataDir?: string;
}
export interface EnsureDebugBrowserDeps {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    existsSync?: (filePath: string) => boolean;
    mkdirSync?: (dirPath: string, options?: {
        recursive?: boolean;
    }) => void;
    spawn?: (command: string, args: readonly string[], options: SpawnOptions) => ChildProcess;
    probeVersion?: (browserURL: string, timeoutMs?: number) => Promise<Record<string, unknown>>;
    /** Count type=page targets from /json. Used after /json/version is up; missing pages are not fatal. */
    probePageTargets?: (browserURL: string, timeoutMs?: number) => Promise<number>;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    homedir?: () => string;
}
export declare function resolveCdpEndpoint(options?: EnsureDebugBrowserOptions, env?: NodeJS.ProcessEnv): {
    host: string;
    port: number;
    browserURL: string;
};
export declare function resolveAutoChromeUserDataDir(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, resolveHomedir?: () => string): string;
export declare function findChromiumExecutable(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, existsSync?: (filePath: string) => boolean): string | null;
export declare function ensureDebugBrowser(options?: EnsureDebugBrowserOptions, deps?: EnsureDebugBrowserDeps): Promise<EnsureDebugBrowserResult>;
/** ponytail: test helper only — clears in-flight map between cases. */
export declare function resetEnsureDebugBrowserStateForTests(): void;
