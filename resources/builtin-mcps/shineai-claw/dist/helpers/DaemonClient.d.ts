import { type OpName, type OpParams, type OpResult } from "./ipc/protocol.js";
export interface DaemonClientOptions {
    socketPath: string;
    defaultTimeoutMs?: number;
    reconnectMaxAttempts?: number;
    onReconnect?: () => void;
    onClose?: () => void;
}
export declare class DaemonClient {
    private readonly socketPath;
    private readonly defaultTimeoutMs;
    private readonly reconnectMaxAttempts;
    private readonly onReconnect?;
    private readonly onClose?;
    private socket;
    private readBuffer;
    private connectPromise;
    private reconnectPromise;
    private intentionallyClosing;
    private _connected;
    private readonly pending;
    constructor(opts: DaemonClientOptions);
    get connected(): boolean;
    connect(): Promise<void>;
    call<O extends OpName>(op: O, params: OpParams<O>, timeoutMs?: number): Promise<OpResult<O>>;
    close(): Promise<void>;
    private ensureConnected;
    private attachSocket;
    private handleData;
    private handleProtocolFailure;
    private markReconnectNeeded;
    private reconnectWithBackoff;
    private rejectPendingById;
    private rejectAllPending;
}
