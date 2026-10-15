import net from "node:net";
import { randomUUID } from "node:crypto";
import { decodeFrame, serializeRequest, parseResponse, DaemonError, } from "./ipc/protocol.js";
const RECONNECT_DELAYS_MS = [100, 500];
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export class DaemonClient {
    socketPath;
    defaultTimeoutMs;
    reconnectMaxAttempts;
    onReconnect;
    onClose;
    socket = null;
    readBuffer = Buffer.alloc(0);
    connectPromise = null;
    reconnectPromise = null;
    intentionallyClosing = false;
    _connected = false;
    pending = new Map();
    constructor(opts) {
        this.socketPath = opts.socketPath;
        this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 30_000;
        this.reconnectMaxAttempts = opts.reconnectMaxAttempts ?? 1;
        this.onReconnect = opts.onReconnect;
        this.onClose = opts.onClose;
    }
    get connected() {
        return this._connected;
    }
    async connect() {
        if (this._connected) {
            return;
        }
        if (this.connectPromise) {
            await this.connectPromise;
            return;
        }
        this.intentionallyClosing = false;
        this.connectPromise = new Promise((resolve, reject) => {
            const socket = net.createConnection({ path: this.socketPath });
            const onConnect = () => {
                cleanup();
                this.attachSocket(socket);
                resolve();
            };
            const onError = (error) => {
                cleanup();
                socket.destroy();
                reject(new DaemonError("eInternal", `Failed to connect daemon socket: ${error.message}`));
            };
            const onClose = () => {
                cleanup();
                reject(new DaemonError("eInternal", "Connection closed before socket became ready"));
            };
            const cleanup = () => {
                socket.off("connect", onConnect);
                socket.off("error", onError);
                socket.off("close", onClose);
            };
            socket.once("connect", onConnect);
            socket.once("error", onError);
            socket.once("close", onClose);
        });
        try {
            await this.connectPromise;
        }
        finally {
            this.connectPromise = null;
        }
    }
    async call(op, params, timeoutMs) {
        await this.ensureConnected();
        const requestId = randomUUID();
        const frame = serializeRequest(requestId, op, params);
        const effectiveTimeoutMs = timeoutMs ?? this.defaultTimeoutMs;
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.rejectPendingById(requestId, new DaemonError("eTimeout", `Operation ${op} timed out after ${effectiveTimeoutMs}ms`));
                this.markReconnectNeeded();
            }, effectiveTimeoutMs);
            this.pending.set(requestId, {
                op,
                resolve: (value) => resolve(value),
                reject: (error) => reject(error),
                timeoutHandle,
            });
            const socket = this.socket;
            if (!socket || !this._connected) {
                this.rejectPendingById(requestId, new DaemonError("eInternal", "Connection is not available"));
                return;
            }
            socket.write(frame, (error) => {
                if (!error) {
                    return;
                }
                this.rejectPendingById(requestId, new DaemonError("eInternal", `Failed to write request: ${error.message}`));
                this.markReconnectNeeded();
            });
        });
    }
    async close() {
        this.intentionallyClosing = true;
        this.rejectAllPending(new DaemonError("eInternal", "Connection closed"));
        const socket = this.socket;
        this.socket = null;
        this._connected = false;
        this.readBuffer = Buffer.alloc(0);
        if (!socket || socket.destroyed) {
            return;
        }
        await new Promise((resolve) => {
            socket.once("close", () => resolve());
            socket.end();
            setTimeout(() => {
                if (!socket.destroyed) {
                    socket.destroy();
                }
            }, 200);
        });
    }
    async ensureConnected() {
        if (this._connected) {
            return;
        }
        if (this.reconnectPromise) {
            const reconnected = await this.reconnectPromise;
            if (reconnected && this._connected) {
                return;
            }
        }
        await this.connect();
    }
    attachSocket(socket) {
        this.socket = socket;
        this.readBuffer = Buffer.alloc(0);
        this._connected = true;
        socket.on("data", (chunk) => {
            if (this.socket !== socket) {
                return;
            }
            this.handleData(chunk);
        });
        socket.on("error", () => {
            if (this.socket !== socket || this.intentionallyClosing) {
                return;
            }
            if (!socket.destroyed) {
                socket.destroy();
            }
        });
        socket.on("close", () => {
            if (this.socket !== socket) {
                return;
            }
            this.socket = null;
            this._connected = false;
            this.readBuffer = Buffer.alloc(0);
            this.rejectAllPending(new DaemonError("eInternal", "Connection lost"));
            this.onClose?.();
            if (!this.intentionallyClosing && this.reconnectMaxAttempts > 0) {
                void this.reconnectWithBackoff();
            }
        });
    }
    handleData(chunk) {
        this.readBuffer = Buffer.concat([this.readBuffer, chunk]);
        while (true) {
            let decoded;
            try {
                decoded = decodeFrame(this.readBuffer);
            }
            catch (error) {
                this.handleProtocolFailure(error);
                return;
            }
            if (!decoded) {
                return;
            }
            this.readBuffer = Buffer.from(decoded.rest);
            let response;
            try {
                response = parseResponse(decoded.body);
            }
            catch (error) {
                this.handleProtocolFailure(error);
                return;
            }
            const pending = this.pending.get(response.id);
            if (!pending) {
                continue;
            }
            this.pending.delete(response.id);
            clearTimeout(pending.timeoutHandle);
            if (response.ok) {
                if (response.result === undefined) {
                    pending.reject(new DaemonError("eInternal", "Daemon response missing result payload"));
                    continue;
                }
                pending.resolve(response.result);
                continue;
            }
            pending.reject(new DaemonError(response.error?.code ?? "eInternal", response.error?.message ?? "Daemon request failed", response.error?.details));
        }
    }
    handleProtocolFailure(error) {
        const message = error instanceof Error ? error.message : String(error);
        this.rejectAllPending(new DaemonError("eInternal", `Invalid daemon response: ${message}`));
        this.markReconnectNeeded();
    }
    markReconnectNeeded() {
        const socket = this.socket;
        if (socket) {
            this.socket = null;
            this._connected = false;
            this.readBuffer = Buffer.alloc(0);
            this.rejectAllPending(new DaemonError("eInternal", "Connection reset for reconnect"));
            if (!socket.destroyed) {
                socket.destroy();
            }
            this.onClose?.();
        }
        if (!this.intentionallyClosing && this.reconnectMaxAttempts > 0) {
            void this.reconnectWithBackoff();
        }
    }
    reconnectWithBackoff() {
        if (this.reconnectPromise) {
            return this.reconnectPromise;
        }
        this.reconnectPromise = (async () => {
            for (let attempt = 0; attempt < this.reconnectMaxAttempts; attempt += 1) {
                const delayMs = RECONNECT_DELAYS_MS[attempt] ?? RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1];
                await sleep(delayMs);
                if (this.intentionallyClosing) {
                    return false;
                }
                try {
                    await this.connect();
                    this.onReconnect?.();
                    return true;
                }
                catch {
                    // continue next retry
                }
            }
            return false;
        })().finally(() => {
            this.reconnectPromise = null;
        });
        return this.reconnectPromise;
    }
    rejectPendingById(id, error) {
        const pending = this.pending.get(id);
        if (!pending) {
            return;
        }
        this.pending.delete(id);
        clearTimeout(pending.timeoutHandle);
        pending.reject(error);
    }
    rejectAllPending(error) {
        for (const [id, pending] of this.pending.entries()) {
            this.pending.delete(id);
            clearTimeout(pending.timeoutHandle);
            pending.reject(new DaemonError(error.code, error.message, error.details));
        }
    }
}
