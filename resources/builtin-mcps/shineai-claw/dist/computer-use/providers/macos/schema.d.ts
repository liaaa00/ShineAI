import type { Bounds } from '../../../helpers/ipc/protocol.js';
import type { MacOSAXSelector } from './types.js';
export declare const MACOS_AX_CORE_PROVIDER_ID: "macos-ax";
export type MacOSCoreOperation = 'listApps' | 'getAppState' | 'getAppTree' | 'findElement' | 'invokeElement' | 'setValue' | 'selectMenu' | 'getCapabilities';
export type MacOSCoreActionName = 'invoke' | 'setValue' | 'selectMenu';
export type MacOSCoreActionStatus = 'success' | 'failed' | 'blocked' | 'not-found';
export type MacOSCorePermissionState = 'granted' | 'missing' | 'unknown' | 'not-applicable';
export type MacOSCoreFallbackKind = 'none' | 'hid' | 'vision' | 'jxa' | 'manual';
export interface MacOSCorePermissionReport {
    name: string;
    state: MacOSCorePermissionState;
    required: boolean;
    requiredFor: string[];
    remediation: string;
}
export interface MacOSCoreOperationCapability {
    supported: boolean;
    backgroundCapable: boolean;
    requiresForeground: boolean;
    fallback: MacOSCoreFallbackKind;
    verification: 'state-read' | 'ax-tree' | 'snapshot' | 'none';
    notes: string;
}
export interface MacOSCoreCapabilityReport {
    providerId: typeof MACOS_AX_CORE_PROVIDER_ID;
    platform: NodeJS.Platform;
    supported: boolean;
    blockedReason?: string;
    permissions: MacOSCorePermissionReport[];
    operations: Record<MacOSCoreOperation, MacOSCoreOperationCapability>;
    warnings: string[];
}
export interface MacOSCoreAppDescriptor {
    providerId: typeof MACOS_AX_CORE_PROVIDER_ID;
    pid: number;
    bundleId: string;
    name: string;
    isActive: boolean;
}
export interface MacOSCoreWindowState {
    providerId: typeof MACOS_AX_CORE_PROVIDER_ID;
    windowId: number;
    pid: number;
    title: string;
    bounds: Bounds;
    isMinimized: boolean;
    isFrontmost: boolean;
}
export interface MacOSCoreAppState {
    providerId: typeof MACOS_AX_CORE_PROVIDER_ID;
    app: MacOSCoreAppDescriptor | null;
    windows: MacOSCoreWindowState[];
    activeWindow: MacOSCoreWindowState | null;
    blocked: boolean;
    blockedReason?: string;
    warnings: string[];
}
export interface MacOSCoreElementNode {
    providerId: typeof MACOS_AX_CORE_PROVIDER_ID;
    id: string;
    role: string;
    nativeRole: string;
    name: string;
    title: string | null;
    value: string | null;
    description: string | null;
    identifier: string | null;
    bounds: Bounds;
    enabled: boolean;
    actionable: boolean;
    parentId: string | null;
    path: number[] | null;
    selector: MacOSAXSelector;
    children: MacOSCoreElementNode[];
}
export interface MacOSCoreAppTree {
    providerId: typeof MACOS_AX_CORE_PROVIDER_ID;
    snapshotId: string;
    app: {
        pid: number | null;
        bundleId?: string;
        name: string | null;
    };
    window: {
        title: string | null;
        bounds: Bounds | null;
        windowId?: number;
    };
    screenshotPath: string | null;
    annotatedPath: string | null;
    elements: MacOSCoreElementNode[];
    flatElements: MacOSCoreElementNode[];
    warnings: string[];
}
export interface MacOSCoreVerificationResult {
    ok: boolean;
    strategy: 'state-read' | 'ax-tree' | 'window-state' | 'snapshot' | 'none';
    message: string;
    observed?: unknown;
}
export interface MacOSCoreFallbackReport {
    used: boolean;
    kind: MacOSCoreFallbackKind;
    requiresForeground: boolean;
    requiresScreenRecording: boolean;
    reason: string;
}
export interface MacOSCoreActionResult {
    providerId: typeof MACOS_AX_CORE_PROVIDER_ID;
    status: MacOSCoreActionStatus;
    action: MacOSCoreActionName;
    method: string;
    target: MacOSCoreElementNode | MacOSAXSelector | {
        path: string[];
    } | null;
    verification: MacOSCoreVerificationResult;
    fallback: MacOSCoreFallbackReport;
    warnings: string[];
    message: string;
    raw?: unknown;
}
export interface MacOSCoreMenuSelectionRequest {
    pid?: number;
    bundleId?: string;
    processName?: string;
    path: string[];
}
export interface MacOSCoreProviderContract {
    readonly id: typeof MACOS_AX_CORE_PROVIDER_ID;
    getCapabilities(): Promise<MacOSCoreCapabilityReport>;
    listApps(): Promise<MacOSCoreAppDescriptor[]>;
    getAppState(selector?: MacOSAXSelector): Promise<MacOSCoreAppState>;
    getAppTree(selector?: MacOSAXSelector): Promise<MacOSCoreAppTree>;
    findElement(selector: MacOSAXSelector): Promise<MacOSCoreElementNode | null>;
    invokeElement(selector: MacOSAXSelector): Promise<MacOSCoreActionResult>;
    setValue(selector: MacOSAXSelector, value: string, options?: {
        clearExisting?: boolean;
    }): Promise<MacOSCoreActionResult>;
    selectMenu(request: MacOSCoreMenuSelectionRequest): Promise<MacOSCoreActionResult>;
}
