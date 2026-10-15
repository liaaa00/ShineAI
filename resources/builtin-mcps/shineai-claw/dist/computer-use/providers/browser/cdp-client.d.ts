import type { BrowserConnectionOptions, BrowserTarget } from './types.js';
export interface CdpCommandResponse {
    id: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
export declare class CdpError extends Error {
    readonly code: string;
    readonly details?: unknown;
    constructor(code: string, message: string, details?: unknown);
}
export declare class CdpHttpClient {
    readonly host: string;
    readonly port: number;
    readonly browserURL: string;
    readonly defaultTimeoutMs: number;
    constructor(options?: BrowserConnectionOptions);
    getJson<T>(path: string, timeoutMs?: number): Promise<T>;
    requestJson<T>(method: 'GET' | 'PUT' | 'POST', path: string, timeoutMs?: number): Promise<T>;
    requestText(method: 'GET' | 'PUT' | 'POST', path: string, timeoutMs?: number): Promise<{
        statusCode: number;
        body: string;
    }>;
    listTargets(): Promise<BrowserTarget[]>;
    getVersion(): Promise<Record<string, unknown>>;
    /** Open a URL via Chrome's HTTP `/json/new?<url>` (GET, then PUT). */
    openUrl(url: string, timeoutMs?: number): Promise<BrowserTarget>;
    /** Close a tab via Chrome's HTTP `/json/close/<id>`. Body may be empty or a JSON string. */
    closeTarget(targetId: string, timeoutMs?: number): Promise<void>;
    private toPageTargets;
    private toPageTarget;
}
export declare class CdpSession {
    private readonly wsUrl;
    private readonly defaultTimeoutMs;
    private socket;
    private connected;
    private nextId;
    private buffer;
    private readonly pending;
    constructor(wsUrl: string, defaultTimeoutMs?: number);
    connect(): Promise<void>;
    send<T = unknown>(method: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<T>;
    close(): void;
    private handleData;
    private rejectAll;
}
