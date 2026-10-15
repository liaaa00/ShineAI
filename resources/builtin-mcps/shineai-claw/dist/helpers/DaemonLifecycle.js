import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DaemonClient } from "./DaemonClient.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_SOCKET_PATH = join(homedir(), "Library", "Application Support", "shineai-claw", "claw.sock");
const DEFAULT_LOG_FILE = join(homedir(), ".shineai-claw", "daemon.log");
const DEFAULT_STARTUP_TIMEOUT_MS = 5_000;
const PING_RETRY_INTERVAL_MS = 100;
const PING_TIMEOUT_MS = 800;
const STOP_WAIT_CLOSE_MS = 2_000;
export const HELPER_PATH_CANDIDATES = [
    join(__dirname, "..", "bin", "darwin", "shineai-claw-helper"),
    join(__dirname, "..", "..", "src", "swift-helper", ".build", "release", "shineai-claw-helper"),
    join(__dirname, "..", "..", "src", "swift-helper", ".build", "debug", "shineai-claw-helper"),
];
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function resolveHelperBinary(helperBinary) {
    if (!isAbsolute(helperBinary)) {
        throw new Error(`helperBinary must be an absolute path: ${helperBinary}`);
    }
    const candidates = [helperBinary, ...HELPER_PATH_CANDIDATES];
    for (const candidate of candidates) {
        if (isAbsolute(candidate) && existsSync(candidate)) {
            return candidate;
        }
    }
    return helperBinary;
}
export class DaemonLifecycle {
    options;
    _client = null;
    _childProcess = null;
    ensurePromise = null;
    stopPromise = null;
    shutdownHooksRegistered = false;
    onProcessExit = () => {
        this.killSpawnedProcess();
    };
    onSigint = () => {
        void this.stop().finally(() => process.exit(130));
    };
    onSigterm = () => {
        void this.stop().finally(() => process.exit(143));
    };
    constructor(opts) {
        const socketPath = opts.socketPath ?? DEFAULT_SOCKET_PATH;
        this.options = {
            helperBinary: resolveHelperBinary(opts.helperBinary),
            socketPath,
            daemonArgs: opts.daemonArgs ?? ["daemon", "run", "--socket", socketPath],
            logFile: opts.logFile ?? DEFAULT_LOG_FILE,
            startupTimeoutMs: opts.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS,
            shutdownOnExit: opts.shutdownOnExit ?? true,
        };
        this._client = this.createClient();
        if (this.options.shutdownOnExit) {
            this.registerShutdownHooks();
        }
    }
    get client() {
        return this._client;
    }
    get childProcess() {
        return this._childProcess;
    }
    async ensure() {
        if (this.ensurePromise) {
            return this.ensurePromise;
        }
        this.ensurePromise = this.ensureInternal().finally(() => {
            this.ensurePromise = null;
        });
        return this.ensurePromise;
    }
    async stop() {
        if (this.stopPromise) {
            return this.stopPromise;
        }
        this.stopPromise = this.stopInternal().finally(() => {
            this.stopPromise = null;
        });
        return this.stopPromise;
    }
    async ensureInternal() {
        const existingClient = this.getOrCreateClient();
        if (await this.tryPing(existingClient)) {
            return existingClient;
        }
        await existingClient.close().catch(() => undefined);
        this._client = this.createClient();
        this.spawnDaemonIfNeeded();
        const deadline = Date.now() + this.options.startupTimeoutMs;
        while (Date.now() <= deadline) {
            const readyClient = this.getOrCreateClient();
            if (await this.tryPing(readyClient)) {
                return readyClient;
            }
            await sleep(PING_RETRY_INTERVAL_MS);
        }
        throw new Error(`Daemon startup timed out after ${this.options.startupTimeoutMs}ms`);
    }
    async stopInternal() {
        const client = this._client ?? this.createClient();
        try {
            await client.connect();
            await client.call("daemonStop", {}, 1_500);
        }
        catch {
            // daemon might already be down; ignore and continue fallback cleanup
        }
        const waitDeadline = Date.now() + STOP_WAIT_CLOSE_MS;
        while (client.connected && Date.now() < waitDeadline) {
            await sleep(50);
        }
        if (this._childProcess) {
            this.killSpawnedProcess();
        }
        await client.close().catch(() => undefined);
        this._client = null;
    }
    createClient() {
        return new DaemonClient({ socketPath: this.options.socketPath });
    }
    getOrCreateClient() {
        if (!this._client) {
            this._client = this.createClient();
        }
        return this._client;
    }
    async tryPing(client) {
        try {
            await client.connect();
            const res = await client.call("ping", {}, PING_TIMEOUT_MS);
            return res.pong === true;
        }
        catch {
            return false;
        }
    }
    spawnDaemonIfNeeded() {
        if (this._childProcess?.pid && this.isProcessAlive(this._childProcess.pid)) {
            return;
        }
        mkdirSync(dirname(this.options.socketPath), { recursive: true });
        mkdirSync(dirname(this.options.logFile), { recursive: true });
        const stdoutFd = openSync(this.options.logFile, "a");
        const stderrFd = openSync(this.options.logFile, "a");
        try {
            const child = spawn(this.options.helperBinary, this.options.daemonArgs, {
                detached: true,
                stdio: ["ignore", stdoutFd, stderrFd],
            });
            child.once("exit", () => {
                if (this._childProcess === child) {
                    this._childProcess = null;
                }
            });
            this._childProcess = child;
            child.unref();
        }
        finally {
            closeSync(stdoutFd);
            closeSync(stderrFd);
        }
    }
    killSpawnedProcess() {
        const child = this._childProcess;
        if (!child?.pid) {
            this._childProcess = null;
            return;
        }
        if (this.isProcessAlive(child.pid)) {
            try {
                process.kill(child.pid, "SIGTERM");
            }
            catch {
                // ignore process kill failures
            }
        }
        this._childProcess = null;
    }
    isProcessAlive(pid) {
        try {
            process.kill(pid, 0);
            return true;
        }
        catch {
            return false;
        }
    }
    registerShutdownHooks() {
        if (this.shutdownHooksRegistered) {
            return;
        }
        this.shutdownHooksRegistered = true;
        process.once("exit", this.onProcessExit);
        process.once("SIGINT", this.onSigint);
        process.once("SIGTERM", this.onSigterm);
    }
}
