import { z } from "zod";
// --- Frame encoding/decoding ---
const MAX_FRAME_SIZE = 64 * 1024 * 1024; // 64 MiB
export function encodeFrame(body) {
    const length = body.length;
    if (length > MAX_FRAME_SIZE) {
        throw new Error(`Frame too large: ${length} > ${MAX_FRAME_SIZE}`);
    }
    const header = Buffer.alloc(4);
    header.writeUInt32BE(length, 0);
    return Buffer.concat([header, body]);
}
export function decodeFrame(buf) {
    if (buf.length < 4)
        return null;
    const length = buf.readUInt32BE(0);
    if (length > MAX_FRAME_SIZE) {
        throw new Error(`Frame too large: ${length} > ${MAX_FRAME_SIZE}`);
    }
    const totalNeeded = 4 + length;
    if (buf.length < totalNeeded)
        return null;
    return {
        body: buf.subarray(4, totalNeeded),
        rest: buf.subarray(totalNeeded),
    };
}
// --- Error codes ---
export const ErrorCodeEnum = z.enum([
    "ePermission",
    "eNotFound",
    "eInvalidArgs",
    "eTimeout",
    "eAXFailure",
    "eInternal",
    "eOpUnsupported",
    "eSnapshotStale",
]);
export class DaemonError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = "DaemonError";
        this.code = code;
        this.details = details;
    }
}
// --- Shared schemas ---
const BoundsSchema = z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
});
const DetectedElementSchema = z.object({
    id: z.string(),
    role: z.string(),
    subrole: z.string().nullable(),
    label: z.string(),
    title: z.string().nullable(),
    value: z.string().nullable(),
    description: z.string().nullable(),
    identifier: z.string().nullable(),
    keyboardShortcut: z.string().nullable(),
    bounds: BoundsSchema,
    isEnabled: z.boolean(),
    isActionable: z.boolean(),
    parentId: z.string().nullable(),
    axPath: z.array(z.number()).nullable().optional(),
});
const CaptureResultSchema = z.object({
    path: z.string(),
    width: z.number(),
    height: z.number(),
    displayBounds: BoundsSchema,
});
const DetectElementsResultSchema = z.object({
    snapshotId: z.string(),
    screenshotPath: z.string(),
    annotatedPath: z.string(),
    elements: z.array(DetectedElementSchema),
    applicationName: z.string().nullable(),
    windowTitle: z.string().nullable(),
    windowBounds: BoundsSchema.nullable(),
    warnings: z.array(z.string()),
    processId: z.number().nullable().optional(),
});
// --- Op definitions ---
const opDefs = {
    ping: {
        params: z.object({}),
        result: z.object({
            pong: z.boolean(),
            timestamp: z.number(),
            daemonVersion: z.string(),
        }),
    },
    daemonStatus: {
        params: z.object({}),
        result: z.object({
            uptimeMs: z.number(),
            pid: z.number(),
            connectionsActive: z.number(),
            protocolVersion: z.string(),
        }),
    },
    daemonStop: {
        params: z.object({}),
        result: z.object({ stopping: z.boolean() }),
    },
    permissionsStatus: {
        params: z.object({}),
        result: z.object({
            screenRecording: z.boolean(),
            accessibility: z.boolean(),
        }),
    },
    captureScreen: {
        params: z.object({
            displayIndex: z.number().optional(),
            maxWidth: z.number().optional(),
            annotated: z.boolean().optional(),
        }),
        result: CaptureResultSchema,
    },
    captureWindow: {
        params: z.object({
            windowId: z.number(),
            maxWidth: z.number().optional(),
        }),
        result: CaptureResultSchema,
    },
    captureArea: {
        params: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number(),
            maxWidth: z.number().optional(),
        }),
        result: CaptureResultSchema,
    },
    detectElements: {
        params: z.object({
            windowId: z.number().optional(),
            pid: z.number().optional(),
            allowWebFocus: z.boolean().optional(),
            maxDepth: z.number().optional(),
            maxCount: z.number().optional(),
        }),
        result: DetectElementsResultSchema,
    },
    getSnapshot: {
        params: z.object({ snapshotId: z.string() }),
        result: DetectElementsResultSchema,
    },
    listSnapshots: {
        params: z.object({}),
        result: z.object({
            snapshots: z.array(z.object({
                id: z.string(),
                createdAt: z.number(),
                windowTitle: z.string().nullable(),
            })),
        }),
    },
    cleanSnapshot: {
        params: z.object({ snapshotId: z.string().nullable() }),
        result: z.object({ removed: z.number() }),
    },
    click: {
        params: z.object({
            snapshotId: z.string().optional(),
            elementId: z.string().optional(),
            x: z.number().optional(),
            y: z.number().optional(),
            button: z.enum(["left", "right", "middle"]),
            clickCount: z.number(),
            modifiers: z.array(z.string()),
        }),
        result: z.object({
            clickedAt: z.object({ x: z.number(), y: z.number() }),
            targetElement: DetectedElementSchema.nullable(),
            method: z.string().optional(),
        }),
    },
    type: {
        params: z.object({
            text: z.string(),
            clearExisting: z.boolean().optional(),
            delayMsPerChar: z.number().optional(),
            snapshotId: z.string().optional(),
            elementId: z.string().optional(),
        }),
        result: z.object({ typedChars: z.number(), method: z.string().optional() }),
    },
    hotkey: {
        params: z.object({
            keys: z.array(z.string()),
            holdMs: z.number().optional(),
        }),
        result: z.object({ ok: z.boolean() }),
    },
    scroll: {
        params: z.object({
            direction: z.enum(["up", "down", "left", "right"]),
            amount: z.number(),
            x: z.number().optional(),
            y: z.number().optional(),
        }),
        result: z.object({ ok: z.boolean() }),
    },
    moveMouse: {
        params: z.object({ x: z.number(), y: z.number() }),
        result: z.object({ ok: z.boolean() }),
    },
    waitForElement: {
        params: z.object({
            snapshotId: z.string().optional(),
            query: z.object({
                role: z.string().optional(),
                label: z.string().optional(),
                identifier: z.string().optional(),
            }),
            timeoutMs: z.number().optional(),
        }),
        result: z.object({
            found: z.boolean(),
            element: DetectedElementSchema.nullable(),
        }),
    },
    listApplications: {
        params: z.object({}),
        result: z.object({
            applications: z.array(z.object({
                pid: z.number(),
                bundleId: z.string(),
                name: z.string(),
                isActive: z.boolean(),
            })),
        }),
    },
    listWindows: {
        params: z.object({ pid: z.number().optional() }),
        result: z.object({
            windows: z.array(z.object({
                windowId: z.number(),
                pid: z.number(),
                title: z.string(),
                bounds: BoundsSchema,
                isMinimized: z.boolean(),
                isFrontmost: z.boolean(),
            })),
        }),
    },
    activateApplication: {
        params: z.object({
            pid: z.number().optional(),
            bundleId: z.string().optional(),
        }),
        result: z.object({ ok: z.boolean() }),
    },
    focusWindow: {
        params: z.object({ windowId: z.number() }),
        result: z.object({ ok: z.boolean() }),
    },
    closeWindow: {
        params: z.object({ windowId: z.number() }),
        result: z.object({ ok: z.boolean() }),
    },
};
export function getOpSchema(op) {
    return opDefs[op];
}
export const OP_NAMES = Object.keys(opDefs);
// --- Request / Response schemas ---
const RequestSchema = z.object({
    id: z.string(),
    op: z.string(),
    params: z.record(z.string(), z.unknown()),
});
const ResponseErrorSchema = z.object({
    code: ErrorCodeEnum,
    message: z.string(),
    details: z.string().optional(),
});
const ResponseSchema = z.object({
    id: z.string(),
    ok: z.boolean(),
    result: z.record(z.string(), z.unknown()).optional(),
    error: ResponseErrorSchema.optional(),
});
// --- Serialize / Parse helpers ---
export function serializeRequest(id, op, params) {
    const json = JSON.stringify({ id, op, params });
    return encodeFrame(Buffer.from(json, "utf-8"));
}
export function parseResponse(body) {
    const text = body.toString("utf-8");
    const parsed = JSON.parse(text);
    return ResponseSchema.parse(parsed);
}
// --- Socket path ---
export const SOCKET_PATH = `${process.env.HOME}/Library/Application Support/shineai-claw/claw.sock`;
