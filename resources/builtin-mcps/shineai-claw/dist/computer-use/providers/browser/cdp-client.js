import { randomBytes, createHash } from 'node:crypto';
import http from 'node:http';
import net from 'node:net';
import tls from 'node:tls';
import { URL } from 'node:url';
export class CdpError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = 'CdpError';
        this.code = code;
        this.details = details;
    }
}
export class CdpHttpClient {
    host;
    port;
    browserURL;
    defaultTimeoutMs;
    constructor(options = {}) {
        const parsed = options.browserURL ? new URL(options.browserURL) : null;
        this.host = options.host ?? parsed?.hostname ?? process.env.SHINEAI_BROWSER_CDP_HOST ?? '127.0.0.1';
        this.port = options.port ?? (parsed?.port ? Number(parsed.port) : Number(process.env.SHINEAI_BROWSER_CDP_PORT ?? 9222));
        this.browserURL = options.browserURL ?? `http://${this.host}:${this.port}`;
        this.defaultTimeoutMs = options.defaultTimeoutMs ?? 3_000;
    }
    async getJson(path, timeoutMs = this.defaultTimeoutMs) {
        return await this.requestJson('GET', path, timeoutMs);
    }
    async requestJson(method, path, timeoutMs = this.defaultTimeoutMs) {
        const { body } = await this.requestText(method, path, timeoutMs);
        try {
            return JSON.parse(body);
        }
        catch (error) {
            throw new CdpError('invalid_json', `Failed to decode CDP JSON from ${path}`, { body, error });
        }
    }
    async requestText(method, path, timeoutMs = this.defaultTimeoutMs) {
        const href = path.startsWith('http://') || path.startsWith('https://')
            ? path
            : `${this.browserURL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
        const url = new URL(href);
        return await new Promise((resolve, reject) => {
            const request = http.request(url, {
                method,
                timeout: timeoutMs,
                headers: {
                    accept: 'application/json',
                },
            }, (response) => {
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf8');
                    const statusCode = response.statusCode ?? 0;
                    if (!statusCode || statusCode < 200 || statusCode >= 300) {
                        reject(new CdpError('http_error', `CDP HTTP ${method} ${url.pathname} returned ${statusCode}`, { body }));
                        return;
                    }
                    resolve({ statusCode, body });
                });
            });
            request.on('timeout', () => {
                request.destroy(new CdpError('timeout', `Timed out connecting to ${url.href}`));
            });
            request.on('error', (error) => {
                reject(error instanceof CdpError ? error : new CdpError('connection_failed', error.message, { url: url.href }));
            });
            request.end();
        });
    }
    async listTargets() {
        const payload = await this.getJson('/json');
        return this.toPageTargets(payload);
    }
    async getVersion() {
        return await this.getJson('/json/version');
    }
    /** Open a URL via Chrome's HTTP `/json/new?<url>` (GET, then PUT). */
    async openUrl(url, timeoutMs = this.defaultTimeoutMs) {
        const path = `/json/new?${url}`;
        let payload;
        try {
            payload = await this.requestJson('GET', path, timeoutMs);
        }
        catch {
            payload = await this.requestJson('PUT', path, timeoutMs);
        }
        const target = this.toPageTarget(payload);
        if (!target) {
            throw new CdpError('http_error', 'CDP /json/new did not return a page target', { payload });
        }
        return target;
    }
    /** Close a tab via Chrome's HTTP `/json/close/<id>`. Body may be empty or a JSON string. */
    async closeTarget(targetId, timeoutMs = this.defaultTimeoutMs) {
        const { body } = await this.requestText('GET', `/json/close/${encodeURIComponent(targetId)}`, timeoutMs);
        const trimmed = body.trim();
        // ponytail: Chrome may return `"Target is closing"`, empty body, or non-JSON text. 2xx is enough.
        if (!trimmed)
            return;
        try {
            JSON.parse(trimmed);
        }
        catch {
            // non-JSON 2xx still counts as closed
        }
    }
    toPageTargets(payload) {
        return payload
            .map((item) => this.toPageTarget(item))
            .filter((target) => Boolean(target));
    }
    toPageTarget(item) {
        if (!item || typeof item !== 'object')
            return null;
        const type = String(item.type ?? 'page');
        if (type && type !== 'page')
            return null;
        const targetId = String(item.id ?? '');
        if (!targetId)
            return null;
        return {
            targetId,
            type: type || 'page',
            url: String(item.url ?? ''),
            title: String(item.title ?? ''),
            webSocketDebuggerUrl: typeof item.webSocketDebuggerUrl === 'string' ? item.webSocketDebuggerUrl : undefined,
            browserContextId: typeof item.browserContextId === 'string' ? item.browserContextId : undefined,
        };
    }
}
export class CdpSession {
    wsUrl;
    defaultTimeoutMs;
    socket = null;
    connected = false;
    nextId = 1;
    buffer = Buffer.alloc(0);
    pending = new Map();
    constructor(wsUrl, defaultTimeoutMs = 5_000) {
        this.wsUrl = wsUrl;
        this.defaultTimeoutMs = defaultTimeoutMs;
    }
    async connect() {
        if (this.connected)
            return;
        const url = new URL(this.wsUrl);
        const isSecure = url.protocol === 'wss:';
        const port = Number(url.port || (isSecure ? 443 : 80));
        const path = `${url.pathname}${url.search}`;
        const key = randomBytes(16).toString('base64');
        const socket = isSecure
            ? tls.connect({ host: url.hostname, port, servername: url.hostname })
            : net.connect({ host: url.hostname, port });
        this.socket = socket;
        await new Promise((resolve, reject) => {
            const onError = (error) => {
                cleanup();
                reject(new CdpError('connection_failed', `Failed to connect CDP WebSocket: ${error.message}`, { wsUrl: this.wsUrl }));
            };
            const onConnect = () => {
                cleanup();
                resolve();
            };
            const cleanup = () => {
                socket.off('error', onError);
                socket.off(isSecure ? 'secureConnect' : 'connect', onConnect);
            };
            socket.once('error', onError);
            socket.once(isSecure ? 'secureConnect' : 'connect', onConnect);
        });
        const request = [
            `GET ${path} HTTP/1.1`,
            `Host: ${url.host}`,
            'Upgrade: websocket',
            'Connection: Upgrade',
            `Sec-WebSocket-Key: ${key}`,
            'Sec-WebSocket-Version: 13',
            '',
            '',
        ].join('\r\n');
        socket.write(request);
        const handshakeBuffer = await readUntil(socket, Buffer.from('\r\n\r\n'), this.defaultTimeoutMs);
        const headerEnd = handshakeBuffer.indexOf('\r\n\r\n');
        const headerText = handshakeBuffer.subarray(0, headerEnd).toString('utf8');
        const rest = handshakeBuffer.subarray(headerEnd + 4);
        if (!/^HTTP\/1\.1 101\b/i.test(headerText)) {
            throw new CdpError('websocket_handshake_failed', 'CDP WebSocket upgrade was rejected', { headerText });
        }
        const accept = getHeader(headerText, 'sec-websocket-accept');
        const expectedAccept = createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
        if (accept !== expectedAccept) {
            throw new CdpError('websocket_handshake_failed', 'CDP WebSocket accept header mismatch', { accept });
        }
        this.connected = true;
        this.buffer = Buffer.from(rest);
        socket.on('data', (chunk) => this.handleData(chunk));
        socket.on('error', (error) => this.rejectAll(new CdpError('connection_failed', error.message)));
        socket.on('close', () => this.rejectAll(new CdpError('connection_closed', 'CDP WebSocket closed')));
        if (this.buffer.length > 0) {
            this.handleData(Buffer.alloc(0));
        }
    }
    async send(method, params = {}, timeoutMs = this.defaultTimeoutMs) {
        await this.connect();
        if (!this.socket) {
            throw new CdpError('connection_failed', 'CDP WebSocket socket is not available');
        }
        const id = this.nextId++;
        const payload = JSON.stringify({ id, method, params });
        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new CdpError('timeout', `Timed out waiting for CDP command ${method}`));
            }, timeoutMs);
            this.pending.set(id, {
                resolve: (value) => resolve(value),
                reject,
                timeout,
            });
            try {
                this.socket?.write(encodeClientTextFrame(payload));
            }
            catch (error) {
                clearTimeout(timeout);
                this.pending.delete(id);
                reject(error instanceof Error ? error : new CdpError('send_failed', String(error)));
            }
        });
    }
    close() {
        for (const pending of this.pending.values()) {
            clearTimeout(pending.timeout);
            pending.reject(new CdpError('connection_closed', 'CDP session closed'));
        }
        this.pending.clear();
        this.connected = false;
        try {
            this.socket?.destroy();
        }
        catch {
            // ignore close errors
        }
        this.socket = null;
    }
    handleData(chunk) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        while (true) {
            const frame = decodeServerFrame(this.buffer);
            if (!frame)
                return;
            this.buffer = frame.rest;
            if (frame.opcode === 0x8) {
                this.rejectAll(new CdpError('connection_closed', 'CDP WebSocket close frame received'));
                return;
            }
            if (frame.opcode === 0x9) {
                this.socket?.write(encodeControlFrame(0xA, frame.payload));
                continue;
            }
            if (frame.opcode !== 0x1) {
                continue;
            }
            let message;
            try {
                message = JSON.parse(frame.payload.toString('utf8'));
            }
            catch {
                continue;
            }
            if (typeof message.id !== 'number') {
                continue;
            }
            const pending = this.pending.get(message.id);
            if (!pending)
                continue;
            this.pending.delete(message.id);
            clearTimeout(pending.timeout);
            if (message.error) {
                pending.reject(new CdpError('cdp_command_failed', message.error.message, message.error));
            }
            else {
                pending.resolve(message.result);
            }
        }
    }
    rejectAll(error) {
        for (const pending of this.pending.values()) {
            clearTimeout(pending.timeout);
            pending.reject(error);
        }
        this.pending.clear();
        this.connected = false;
    }
}
function getHeader(headerText, name) {
    const wanted = name.toLowerCase();
    for (const line of headerText.split('\r\n').slice(1)) {
        const index = line.indexOf(':');
        if (index < 0)
            continue;
        if (line.slice(0, index).trim().toLowerCase() === wanted) {
            return line.slice(index + 1).trim();
        }
    }
    return undefined;
}
async function readUntil(socket, marker, timeoutMs) {
    return await new Promise((resolve, reject) => {
        let acc = Buffer.alloc(0);
        const timeout = setTimeout(() => {
            cleanup();
            reject(new CdpError('timeout', 'Timed out waiting for CDP WebSocket handshake'));
        }, timeoutMs);
        const cleanup = () => {
            clearTimeout(timeout);
            socket.off('data', onData);
            socket.off('error', onError);
        };
        const onData = (chunk) => {
            acc = Buffer.concat([acc, chunk]);
            if (acc.indexOf(marker) >= 0) {
                cleanup();
                resolve(acc);
            }
        };
        const onError = (error) => {
            cleanup();
            reject(error);
        };
        socket.on('data', onData);
        socket.once('error', onError);
    });
}
function encodeClientTextFrame(text) {
    return encodeClientFrame(0x1, Buffer.from(text, 'utf8'));
}
function encodeControlFrame(opcode, payload) {
    return encodeClientFrame(opcode, payload);
}
function encodeClientFrame(opcode, payload) {
    const length = payload.length;
    const headerLength = length < 126 ? 2 : length <= 0xffff ? 4 : 10;
    const header = Buffer.alloc(headerLength + 4);
    header[0] = 0x80 | opcode;
    if (length < 126) {
        header[1] = 0x80 | length;
    }
    else if (length <= 0xffff) {
        header[1] = 0x80 | 126;
        header.writeUInt16BE(length, 2);
    }
    else {
        header[1] = 0x80 | 127;
        header.writeBigUInt64BE(BigInt(length), 2);
    }
    const maskOffset = headerLength;
    const mask = randomBytes(4);
    mask.copy(header, maskOffset);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i += 1) {
        masked[i] = payload[i] ^ mask[i % 4];
    }
    return Buffer.concat([header, masked]);
}
function decodeServerFrame(buffer) {
    if (buffer.length < 2)
        return null;
    const opcode = buffer[0] & 0x0f;
    const masked = (buffer[1] & 0x80) !== 0;
    let length = buffer[1] & 0x7f;
    let offset = 2;
    if (length === 126) {
        if (buffer.length < offset + 2)
            return null;
        length = buffer.readUInt16BE(offset);
        offset += 2;
    }
    else if (length === 127) {
        if (buffer.length < offset + 8)
            return null;
        const bigLength = buffer.readBigUInt64BE(offset);
        if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) {
            throw new CdpError('frame_too_large', 'CDP WebSocket frame exceeds safe size');
        }
        length = Number(bigLength);
        offset += 8;
    }
    let mask = null;
    if (masked) {
        if (buffer.length < offset + 4)
            return null;
        mask = buffer.subarray(offset, offset + 4);
        offset += 4;
    }
    if (buffer.length < offset + length)
        return null;
    const raw = buffer.subarray(offset, offset + length);
    const payload = Buffer.from(raw);
    if (mask) {
        for (let i = 0; i < payload.length; i += 1) {
            payload[i] = payload[i] ^ mask[i % 4];
        }
    }
    return {
        opcode,
        payload,
        rest: Buffer.from(buffer.subarray(offset + length)),
    };
}
