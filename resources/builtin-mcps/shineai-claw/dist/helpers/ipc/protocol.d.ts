import { z } from "zod";
export declare function encodeFrame(body: Buffer): Buffer;
export declare function decodeFrame(buf: Buffer): {
    body: Buffer;
    rest: Buffer;
} | null;
export declare const ErrorCodeEnum: z.ZodEnum<{
    ePermission: "ePermission";
    eNotFound: "eNotFound";
    eInvalidArgs: "eInvalidArgs";
    eTimeout: "eTimeout";
    eAXFailure: "eAXFailure";
    eInternal: "eInternal";
    eOpUnsupported: "eOpUnsupported";
    eSnapshotStale: "eSnapshotStale";
}>;
export type ErrorCode = z.infer<typeof ErrorCodeEnum>;
export declare class DaemonError extends Error {
    code: ErrorCode;
    details?: string;
    constructor(code: ErrorCode, message: string, details?: string);
}
declare const BoundsSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
}, z.core.$strip>;
export type Bounds = z.infer<typeof BoundsSchema>;
declare const DetectedElementSchema: z.ZodObject<{
    id: z.ZodString;
    role: z.ZodString;
    subrole: z.ZodNullable<z.ZodString>;
    label: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    value: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    identifier: z.ZodNullable<z.ZodString>;
    keyboardShortcut: z.ZodNullable<z.ZodString>;
    bounds: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>;
    isEnabled: z.ZodBoolean;
    isActionable: z.ZodBoolean;
    parentId: z.ZodNullable<z.ZodString>;
    axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
}, z.core.$strip>;
export type DetectedElement = z.infer<typeof DetectedElementSchema>;
declare const opDefs: {
    readonly ping: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            pong: z.ZodBoolean;
            timestamp: z.ZodNumber;
            daemonVersion: z.ZodString;
        }, z.core.$strip>;
    };
    readonly daemonStatus: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            uptimeMs: z.ZodNumber;
            pid: z.ZodNumber;
            connectionsActive: z.ZodNumber;
            protocolVersion: z.ZodString;
        }, z.core.$strip>;
    };
    readonly daemonStop: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            stopping: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly permissionsStatus: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            screenRecording: z.ZodBoolean;
            accessibility: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly captureScreen: {
        readonly params: z.ZodObject<{
            displayIndex: z.ZodOptional<z.ZodNumber>;
            maxWidth: z.ZodOptional<z.ZodNumber>;
            annotated: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            path: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            displayBounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
    };
    readonly captureWindow: {
        readonly params: z.ZodObject<{
            windowId: z.ZodNumber;
            maxWidth: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            path: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            displayBounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
    };
    readonly captureArea: {
        readonly params: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
            maxWidth: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            path: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            displayBounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
    };
    readonly detectElements: {
        readonly params: z.ZodObject<{
            windowId: z.ZodOptional<z.ZodNumber>;
            pid: z.ZodOptional<z.ZodNumber>;
            allowWebFocus: z.ZodOptional<z.ZodBoolean>;
            maxDepth: z.ZodOptional<z.ZodNumber>;
            maxCount: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            snapshotId: z.ZodString;
            screenshotPath: z.ZodString;
            annotatedPath: z.ZodString;
            elements: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
            applicationName: z.ZodNullable<z.ZodString>;
            windowTitle: z.ZodNullable<z.ZodString>;
            windowBounds: z.ZodNullable<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
            warnings: z.ZodArray<z.ZodString>;
            processId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>;
    };
    readonly getSnapshot: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodString;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            snapshotId: z.ZodString;
            screenshotPath: z.ZodString;
            annotatedPath: z.ZodString;
            elements: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
            applicationName: z.ZodNullable<z.ZodString>;
            windowTitle: z.ZodNullable<z.ZodString>;
            windowBounds: z.ZodNullable<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
            warnings: z.ZodArray<z.ZodString>;
            processId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>;
    };
    readonly listSnapshots: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            snapshots: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                createdAt: z.ZodNumber;
                windowTitle: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly cleanSnapshot: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            removed: z.ZodNumber;
        }, z.core.$strip>;
    };
    readonly click: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodOptional<z.ZodString>;
            elementId: z.ZodOptional<z.ZodString>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            button: z.ZodEnum<{
                left: "left";
                right: "right";
                middle: "middle";
            }>;
            clickCount: z.ZodNumber;
            modifiers: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            clickedAt: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
            targetElement: z.ZodNullable<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
            method: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    readonly type: {
        readonly params: z.ZodObject<{
            text: z.ZodString;
            clearExisting: z.ZodOptional<z.ZodBoolean>;
            delayMsPerChar: z.ZodOptional<z.ZodNumber>;
            snapshotId: z.ZodOptional<z.ZodString>;
            elementId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            typedChars: z.ZodNumber;
            method: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    readonly hotkey: {
        readonly params: z.ZodObject<{
            keys: z.ZodArray<z.ZodString>;
            holdMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly scroll: {
        readonly params: z.ZodObject<{
            direction: z.ZodEnum<{
                left: "left";
                right: "right";
                up: "up";
                down: "down";
            }>;
            amount: z.ZodNumber;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly moveMouse: {
        readonly params: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly waitForElement: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodOptional<z.ZodString>;
            query: z.ZodObject<{
                role: z.ZodOptional<z.ZodString>;
                label: z.ZodOptional<z.ZodString>;
                identifier: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            timeoutMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            found: z.ZodBoolean;
            element: z.ZodNullable<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly listApplications: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            applications: z.ZodArray<z.ZodObject<{
                pid: z.ZodNumber;
                bundleId: z.ZodString;
                name: z.ZodString;
                isActive: z.ZodBoolean;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly listWindows: {
        readonly params: z.ZodObject<{
            pid: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            windows: z.ZodArray<z.ZodObject<{
                windowId: z.ZodNumber;
                pid: z.ZodNumber;
                title: z.ZodString;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isMinimized: z.ZodBoolean;
                isFrontmost: z.ZodBoolean;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly activateApplication: {
        readonly params: z.ZodObject<{
            pid: z.ZodOptional<z.ZodNumber>;
            bundleId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly focusWindow: {
        readonly params: z.ZodObject<{
            windowId: z.ZodNumber;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly closeWindow: {
        readonly params: z.ZodObject<{
            windowId: z.ZodNumber;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
};
export type OpName = keyof typeof opDefs;
export type OpParams<O extends OpName> = z.infer<(typeof opDefs)[O]["params"]>;
export type OpResult<O extends OpName> = z.infer<(typeof opDefs)[O]["result"]>;
export declare function getOpSchema<O extends OpName>(op: O): {
    readonly ping: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            pong: z.ZodBoolean;
            timestamp: z.ZodNumber;
            daemonVersion: z.ZodString;
        }, z.core.$strip>;
    };
    readonly daemonStatus: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            uptimeMs: z.ZodNumber;
            pid: z.ZodNumber;
            connectionsActive: z.ZodNumber;
            protocolVersion: z.ZodString;
        }, z.core.$strip>;
    };
    readonly daemonStop: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            stopping: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly permissionsStatus: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            screenRecording: z.ZodBoolean;
            accessibility: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly captureScreen: {
        readonly params: z.ZodObject<{
            displayIndex: z.ZodOptional<z.ZodNumber>;
            maxWidth: z.ZodOptional<z.ZodNumber>;
            annotated: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            path: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            displayBounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
    };
    readonly captureWindow: {
        readonly params: z.ZodObject<{
            windowId: z.ZodNumber;
            maxWidth: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            path: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            displayBounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
    };
    readonly captureArea: {
        readonly params: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
            maxWidth: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            path: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            displayBounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>;
    };
    readonly detectElements: {
        readonly params: z.ZodObject<{
            windowId: z.ZodOptional<z.ZodNumber>;
            pid: z.ZodOptional<z.ZodNumber>;
            allowWebFocus: z.ZodOptional<z.ZodBoolean>;
            maxDepth: z.ZodOptional<z.ZodNumber>;
            maxCount: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            snapshotId: z.ZodString;
            screenshotPath: z.ZodString;
            annotatedPath: z.ZodString;
            elements: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
            applicationName: z.ZodNullable<z.ZodString>;
            windowTitle: z.ZodNullable<z.ZodString>;
            windowBounds: z.ZodNullable<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
            warnings: z.ZodArray<z.ZodString>;
            processId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>;
    };
    readonly getSnapshot: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodString;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            snapshotId: z.ZodString;
            screenshotPath: z.ZodString;
            annotatedPath: z.ZodString;
            elements: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
            applicationName: z.ZodNullable<z.ZodString>;
            windowTitle: z.ZodNullable<z.ZodString>;
            windowBounds: z.ZodNullable<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
            warnings: z.ZodArray<z.ZodString>;
            processId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>;
    };
    readonly listSnapshots: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            snapshots: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                createdAt: z.ZodNumber;
                windowTitle: z.ZodNullable<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly cleanSnapshot: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            removed: z.ZodNumber;
        }, z.core.$strip>;
    };
    readonly click: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodOptional<z.ZodString>;
            elementId: z.ZodOptional<z.ZodString>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            button: z.ZodEnum<{
                left: "left";
                right: "right";
                middle: "middle";
            }>;
            clickCount: z.ZodNumber;
            modifiers: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            clickedAt: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strip>;
            targetElement: z.ZodNullable<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
            method: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    readonly type: {
        readonly params: z.ZodObject<{
            text: z.ZodString;
            clearExisting: z.ZodOptional<z.ZodBoolean>;
            delayMsPerChar: z.ZodOptional<z.ZodNumber>;
            snapshotId: z.ZodOptional<z.ZodString>;
            elementId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            typedChars: z.ZodNumber;
            method: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    readonly hotkey: {
        readonly params: z.ZodObject<{
            keys: z.ZodArray<z.ZodString>;
            holdMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly scroll: {
        readonly params: z.ZodObject<{
            direction: z.ZodEnum<{
                left: "left";
                right: "right";
                up: "up";
                down: "down";
            }>;
            amount: z.ZodNumber;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly moveMouse: {
        readonly params: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly waitForElement: {
        readonly params: z.ZodObject<{
            snapshotId: z.ZodOptional<z.ZodString>;
            query: z.ZodObject<{
                role: z.ZodOptional<z.ZodString>;
                label: z.ZodOptional<z.ZodString>;
                identifier: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            timeoutMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            found: z.ZodBoolean;
            element: z.ZodNullable<z.ZodObject<{
                id: z.ZodString;
                role: z.ZodString;
                subrole: z.ZodNullable<z.ZodString>;
                label: z.ZodString;
                title: z.ZodNullable<z.ZodString>;
                value: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                identifier: z.ZodNullable<z.ZodString>;
                keyboardShortcut: z.ZodNullable<z.ZodString>;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isEnabled: z.ZodBoolean;
                isActionable: z.ZodBoolean;
                parentId: z.ZodNullable<z.ZodString>;
                axPath: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly listApplications: {
        readonly params: z.ZodObject<{}, z.core.$strip>;
        readonly result: z.ZodObject<{
            applications: z.ZodArray<z.ZodObject<{
                pid: z.ZodNumber;
                bundleId: z.ZodString;
                name: z.ZodString;
                isActive: z.ZodBoolean;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly listWindows: {
        readonly params: z.ZodObject<{
            pid: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            windows: z.ZodArray<z.ZodObject<{
                windowId: z.ZodNumber;
                pid: z.ZodNumber;
                title: z.ZodString;
                bounds: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                    width: z.ZodNumber;
                    height: z.ZodNumber;
                }, z.core.$strip>;
                isMinimized: z.ZodBoolean;
                isFrontmost: z.ZodBoolean;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    };
    readonly activateApplication: {
        readonly params: z.ZodObject<{
            pid: z.ZodOptional<z.ZodNumber>;
            bundleId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly focusWindow: {
        readonly params: z.ZodObject<{
            windowId: z.ZodNumber;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
    readonly closeWindow: {
        readonly params: z.ZodObject<{
            windowId: z.ZodNumber;
        }, z.core.$strip>;
        readonly result: z.ZodObject<{
            ok: z.ZodBoolean;
        }, z.core.$strip>;
    };
}[O];
export declare const OP_NAMES: OpName[];
declare const RequestSchema: z.ZodObject<{
    id: z.ZodString;
    op: z.ZodString;
    params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export type Request = z.infer<typeof RequestSchema>;
declare const ResponseSchema: z.ZodObject<{
    id: z.ZodString;
    ok: z.ZodBoolean;
    result: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodEnum<{
            ePermission: "ePermission";
            eNotFound: "eNotFound";
            eInvalidArgs: "eInvalidArgs";
            eTimeout: "eTimeout";
            eAXFailure: "eAXFailure";
            eInternal: "eInternal";
            eOpUnsupported: "eOpUnsupported";
            eSnapshotStale: "eSnapshotStale";
        }>;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Response = z.infer<typeof ResponseSchema>;
export declare function serializeRequest(id: string, op: OpName, params: Record<string, unknown>): Buffer;
export declare function parseResponse(body: Buffer): Response;
export declare const SOCKET_PATH: string;
export {};
