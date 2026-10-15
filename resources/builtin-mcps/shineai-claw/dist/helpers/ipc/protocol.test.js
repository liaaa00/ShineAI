import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { encodeFrame, decodeFrame, serializeRequest, parseResponse, ErrorCodeEnum, OP_NAMES, } from "./protocol.js";
describe("Frame encode/decode", () => {
    it("round-trips a payload", () => {
        const payload = Buffer.from('{"hello":"world"}', "utf-8");
        const frame = encodeFrame(payload);
        const result = decodeFrame(frame);
        assert.ok(result);
        assert.deepStrictEqual(result.body, payload);
        assert.strictEqual(result.rest.length, 0);
    });
    it("returns null for incomplete frame (half-packet)", () => {
        const payload = Buffer.from('{"test":true}', "utf-8");
        const frame = encodeFrame(payload);
        const partial = frame.subarray(0, frame.length - 3);
        const result = decodeFrame(partial);
        assert.strictEqual(result, null);
    });
    it("returns null when buffer has only header bytes", () => {
        const buf = Buffer.alloc(2);
        assert.strictEqual(decodeFrame(buf), null);
    });
    it("handles multiple frames in one buffer", () => {
        const a = Buffer.from('{"a":1}', "utf-8");
        const b = Buffer.from('{"b":2}', "utf-8");
        const combined = Buffer.concat([encodeFrame(a), encodeFrame(b)]);
        const first = decodeFrame(combined);
        assert.ok(first);
        assert.deepStrictEqual(first.body, a);
        const second = decodeFrame(first.rest);
        assert.ok(second);
        assert.deepStrictEqual(second.body, b);
        assert.strictEqual(second.rest.length, 0);
    });
    it("throws on frame exceeding 64 MiB", () => {
        const header = Buffer.alloc(4);
        header.writeUInt32BE(64 * 1024 * 1024 + 1, 0);
        assert.throws(() => decodeFrame(header), /Frame too large/);
    });
    it("throws on encode of oversized payload", () => {
        const huge = Buffer.alloc(64 * 1024 * 1024 + 1);
        assert.throws(() => encodeFrame(huge), /Frame too large/);
    });
});
describe("ping request serialize/parse round-trip", () => {
    it("serializes and parses back consistently", () => {
        const id = "550e8400-e29b-41d4-a716-446655440000";
        const frame = serializeRequest(id, "ping", {});
        const decoded = decodeFrame(frame);
        assert.ok(decoded);
        const request = JSON.parse(decoded.body.toString("utf-8"));
        assert.strictEqual(request.id, id);
        assert.strictEqual(request.op, "ping");
        assert.deepStrictEqual(request.params, {});
        const responseBody = Buffer.from(JSON.stringify({
            id,
            ok: true,
            result: { pong: true, timestamp: 1714000000000, daemonVersion: "1.0.0" },
        }), "utf-8");
        const response = parseResponse(responseBody);
        assert.strictEqual(response.id, id);
        assert.strictEqual(response.ok, true);
        assert.deepStrictEqual(response.result, {
            pong: true,
            timestamp: 1714000000000,
            daemonVersion: "1.0.0",
        });
    });
});
describe("error codes round-trip", () => {
    it("all error codes are valid", () => {
        const codes = [
            "ePermission",
            "eNotFound",
            "eInvalidArgs",
            "eTimeout",
            "eAXFailure",
            "eInternal",
            "eOpUnsupported",
            "eSnapshotStale",
        ];
        for (const code of codes) {
            const parsed = ErrorCodeEnum.parse(code);
            assert.strictEqual(parsed, code);
            const responseBody = Buffer.from(JSON.stringify({
                id: "test-id",
                ok: false,
                error: { code, message: `Error: ${code}` },
            }), "utf-8");
            const response = parseResponse(responseBody);
            assert.strictEqual(response.ok, false);
            assert.strictEqual(response.error?.code, code);
        }
    });
});
describe("detectElements large result", () => {
    it("serializes 100 elements", () => {
        const elements = Array.from({ length: 100 }, (_, i) => ({
            id: `elem_${i}`,
            role: "button",
            subrole: null,
            label: `Button ${i}`,
            title: `Button ${i}`,
            value: null,
            description: null,
            identifier: `btn-${i}`,
            keyboardShortcut: null,
            bounds: { x: i * 10, y: 0, width: 80, height: 32 },
            isEnabled: true,
            isActionable: true,
            parentId: null,
        }));
        const result = {
            snapshotId: "snap_large",
            screenshotPath: "/tmp/test.png",
            annotatedPath: "/tmp/test_ann.png",
            elements,
            applicationName: "TestApp",
            windowTitle: "Test Window",
            windowBounds: { x: 0, y: 0, width: 1440, height: 900 },
            warnings: [],
        };
        const responseJson = JSON.stringify({ id: "large-test", ok: true, result });
        const body = Buffer.from(responseJson, "utf-8");
        const frame = encodeFrame(body);
        const decoded = decodeFrame(frame);
        assert.ok(decoded);
        const parsed = parseResponse(decoded.body);
        assert.strictEqual(parsed.ok, true);
    });
});
describe("op names", () => {
    it("has all expected operations", () => {
        const expected = [
            "ping", "daemonStatus", "daemonStop", "permissionsStatus",
            "captureScreen", "captureWindow", "captureArea",
            "detectElements", "getSnapshot", "listSnapshots", "cleanSnapshot",
            "click", "type", "hotkey", "scroll", "moveMouse", "waitForElement",
            "listApplications", "listWindows", "activateApplication", "focusWindow", "closeWindow",
        ];
        for (const name of expected) {
            assert.ok(OP_NAMES.includes(name), `Missing op: ${name}`);
        }
        assert.strictEqual(OP_NAMES.length, expected.length);
    });
});
