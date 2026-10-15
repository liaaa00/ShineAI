import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decodeFrame, encodeFrame, } from "../ipc/protocol.js";
import { DaemonClient } from "../DaemonClient.js";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function createSocketPath(label) {
    const dir = mkdtempSync(join(tmpdir(), `shineai-daemon-client-${label}-`));
    return {
        dir,
        socketPath: join(dir, "claw.sock"),
    };
}
function encodeResponse(payload) {
    return encodeFrame(Buffer.from(JSON.stringify(payload), "utf-8"));
}
async function startMockDaemon(socketPath, handler) {
    const sockets = new Set();
    const ctx = {
        requestCount: 0,
        connectionCount: 0,
    };
    const server = net.createServer((socket) => {
        ctx.connectionCount += 1;
        sockets.add(socket);
        let buffer = Buffer.alloc(0);
        socket.on("data", async (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
            while (true) {
                const decoded = decodeFrame(buffer);
                if (!decoded) {
                    break;
                }
                buffer = Buffer.from(decoded.rest);
                const rawReq = JSON.parse(decoded.body.toString("utf-8"));
                ctx.requestCount += 1;
                await handler(rawReq, socket, ctx);
            }
        });
        socket.on("close", () => {
            sockets.delete(socket);
        });
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(socketPath, () => {
            server.off("error", reject);
            resolve();
        });
    });
    return {
        socketPath,
        close: async () => {
            for (const socket of sockets) {
                socket.destroy();
            }
            await new Promise((resolve) => server.close(() => resolve()));
        },
    };
}
const cleanups = [];
afterEach(async () => {
    while (cleanups.length > 0) {
        const fn = cleanups.pop();
        if (fn) {
            await fn();
        }
    }
});
function assertDaemonErrorCode(error, code) {
    assert.ok(error instanceof Error);
    const withCode = error;
    return withCode.code === code;
}
function writeSuccess(socket, id, result) {
    socket.write(encodeResponse({
        id,
        ok: true,
        result,
    }));
}
describe("DaemonClient", () => {
    it("connects and receives ping response", async () => {
        const { dir, socketPath } = createSocketPath("ping");
        const daemon = await startMockDaemon(socketPath, (request, socket) => {
            if (request.op !== "ping") {
                return;
            }
            writeSuccess(socket, request.id, {
                pong: true,
                timestamp: 1714000000000,
                daemonVersion: "1.0.0",
            });
        });
        cleanups.push(() => daemon.close());
        cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
        const client = new DaemonClient({ socketPath });
        cleanups.push(() => client.close());
        await client.connect();
        const res = await client.call("ping", {});
        assert.strictEqual(res.pong, true);
        assert.strictEqual(res.daemonVersion, "1.0.0");
    });
    it("rejects with timeout when daemon does not respond", async () => {
        const { dir, socketPath } = createSocketPath("timeout");
        const daemon = await startMockDaemon(socketPath, () => {
            // intentionally no response
        });
        cleanups.push(() => daemon.close());
        cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
        const client = new DaemonClient({
            socketPath,
            defaultTimeoutMs: 80,
            reconnectMaxAttempts: 0,
        });
        cleanups.push(() => client.close());
        await assert.rejects(client.call("ping", {}), (error) => assertDaemonErrorCode(error, "eTimeout"));
    });
    it("drops a timed-out socket so later calls do not queue behind it", async () => {
        const { dir, socketPath } = createSocketPath("timeout-recover");
        let lastConnectionCount = 0;
        const daemon = await startMockDaemon(socketPath, (request, socket, ctx) => {
            lastConnectionCount = ctx.connectionCount;
            if (ctx.requestCount === 1) {
                // Simulate the Swift side being stuck on the old connection.
                return;
            }
            writeSuccess(socket, request.id, {
                pong: true,
                timestamp: Date.now(),
                daemonVersion: "1.0.0",
            });
        });
        cleanups.push(() => daemon.close());
        cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
        const client = new DaemonClient({
            socketPath,
            defaultTimeoutMs: 60,
            reconnectMaxAttempts: 0,
        });
        cleanups.push(() => client.close());
        await assert.rejects(client.call("ping", {}), (error) => assertDaemonErrorCode(error, "eTimeout"));
        assert.strictEqual(client.connected, false);
        const recovered = await client.call("ping", {}, 1_000);
        assert.strictEqual(recovered.pong, true);
        assert.ok(lastConnectionCount >= 2);
    });
    it("rejects all pending calls when connection is lost", async () => {
        const { dir, socketPath } = createSocketPath("disconnect");
        let closed = false;
        const daemon = await startMockDaemon(socketPath, async (_request, socket) => {
            if (closed) {
                return;
            }
            closed = true;
            await sleep(20);
            socket.destroy();
        });
        cleanups.push(() => daemon.close());
        cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
        const client = new DaemonClient({ socketPath, reconnectMaxAttempts: 0 });
        cleanups.push(() => client.close());
        const p1 = client.call("ping", {}, 1_000);
        const p2 = client.call("ping", {}, 1_000);
        await assert.rejects(p1, (error) => assertDaemonErrorCode(error, "eInternal"));
        await assert.rejects(p2, (error) => assertDaemonErrorCode(error, "eInternal"));
    });
    it("auto reconnects and can continue calling", async () => {
        const { dir, socketPath } = createSocketPath("reconnect");
        let reconnectCount = 0;
        const daemon = await startMockDaemon(socketPath, async (request, socket, ctx) => {
            if (ctx.connectionCount === 1) {
                socket.destroy();
                return;
            }
            writeSuccess(socket, request.id, {
                pong: true,
                timestamp: Date.now(),
                daemonVersion: "1.0.0",
            });
        });
        cleanups.push(() => daemon.close());
        cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
        const client = new DaemonClient({
            socketPath,
            reconnectMaxAttempts: 2,
            onReconnect: () => {
                reconnectCount += 1;
            },
        });
        cleanups.push(() => client.close());
        await assert.rejects(client.call("ping", {}, 500), (error) => assertDaemonErrorCode(error, "eInternal"));
        await sleep(250);
        const second = await client.call("ping", {}, 1_000);
        assert.strictEqual(second.pong, true);
        assert.ok(reconnectCount >= 1);
    });
    it("matches responses by request id for concurrent calls", async () => {
        const { dir, socketPath } = createSocketPath("concurrency");
        const daemon = await startMockDaemon(socketPath, async (request, socket) => {
            if (request.op !== "captureArea") {
                return;
            }
            const x = Number(request.params.x);
            const delayMs = 60 - x * 10;
            await sleep(delayMs);
            writeSuccess(socket, request.id, {
                path: `/tmp/capture_${x}.png`,
                width: 10,
                height: 10,
                displayBounds: { x: 0, y: 0, width: 10, height: 10 },
            });
        });
        cleanups.push(() => daemon.close());
        cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
        const client = new DaemonClient({ socketPath });
        cleanups.push(() => client.close());
        const calls = Array.from({ length: 5 }, (_, i) => client.call("captureArea", {
            x: i,
            y: 0,
            width: 10,
            height: 10,
        }));
        const results = await Promise.all(calls);
        for (let i = 0; i < results.length; i += 1) {
            assert.strictEqual(results[i].path, `/tmp/capture_${i}.png`);
        }
    });
});
