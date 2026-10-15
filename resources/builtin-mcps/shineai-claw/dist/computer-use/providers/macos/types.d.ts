import type { Bounds } from '../../../helpers/ipc/protocol.js';
export type MacOSPermissionName = 'Accessibility' | 'Screen Recording' | 'Automation' | 'Input Monitoring';
export type MacOSActionName = 'focus' | 'press' | 'invoke' | 'setValue' | 'type' | 'select' | 'selectMenu' | 'menu';
export type MacOSActionMethod = 'unsupported' | 'daemon.activateApplication' | 'daemon.focusWindow' | 'daemon.axPress' | 'daemon.axSetValue' | 'daemon.hidClick' | 'daemon.hidType' | 'jxa.systemEventsMenu' | 'visionFallback';
export interface MacOSAppDescriptor {
    provider: 'macos-ax';
    pid: number;
    bundleId: string;
    processName: string;
    isActive: boolean;
}
export interface MacOSWindowDescriptor {
    provider: 'macos-ax';
    windowId: number;
    pid: number;
    title: string;
    bounds: Bounds;
    isMinimized: boolean;
    isFrontmost: boolean;
}
export interface MacOSAXSelector {
    app?: {
        bundleId?: string;
        processName?: string;
        pid?: number;
    };
    bundleId?: string;
    processName?: string;
    pid?: number;
    windowId?: number;
    windowTitle?: string;
    AXRole?: string;
    role?: string;
    AXIdentifier?: string;
    identifier?: string;
    AXTitle?: string;
    title?: string;
    AXDescription?: string;
    description?: string;
    label?: string;
    value?: string;
    path?: number[] | string;
    bounds?: Partial<Bounds> & {
        tolerance?: number;
    };
}
export interface MacOSElementNode {
    provider: 'macos-ax';
    id: string;
    role: string;
    subrole: string | null;
    label: string;
    title: string | null;
    value: string | null;
    description: string | null;
    identifier: string | null;
    keyboardShortcut: string | null;
    bounds: Bounds;
    enabled: boolean;
    actionable: boolean;
    parentId: string | null;
    path: number[] | null;
    selector: MacOSAXSelector;
    children: MacOSElementNode[];
}
export interface MacOSAXTreeSnapshot {
    provider: 'macos-ax';
    snapshotId: string;
    app: {
        pid: number | null;
        bundleId?: string;
        processName: string | null;
    };
    window: {
        title: string | null;
        bounds: Bounds | null;
        windowId?: number;
    };
    screenshotPath: string | null;
    annotatedPath: string | null;
    warnings: string[];
    elements: MacOSElementNode[];
    flatElements: MacOSElementNode[];
}
export interface MacOSReadTreeOptions {
    maxDepth?: number;
    maxCount?: number;
    allowWebFocus?: boolean;
    includeVisionFallback?: boolean;
}
export interface MacOSComputerAction {
    name: MacOSActionName;
    selector?: MacOSAXSelector;
    snapshotId?: string;
    elementId?: string;
    windowId?: number;
    windowTitle?: string;
    pid?: number;
    bundleId?: string;
    processName?: string;
    text?: string;
    value?: string;
    clearExisting?: boolean;
    menuPath?: string[];
    requireBackground?: boolean;
    verify?: boolean;
}
export interface MacOSActionVerification {
    status: 'success' | 'failure' | 'unknown';
    strategy: 'ax-value' | 'ax-tree' | 'window-state' | 'snapshot' | 'none';
    checks: string[];
    reason?: string;
    observed?: unknown;
}
export interface MacOSActionResult {
    provider: 'macos-ax';
    ok: boolean;
    action: MacOSActionName;
    method: MacOSActionMethod;
    requiresForeground: boolean;
    visionFallbackNeeded: boolean;
    warnings: string[];
    verification: MacOSActionVerification;
    target?: MacOSElementNode;
    raw?: unknown;
}
export interface MacOSPermissionRequirement {
    name: MacOSPermissionName;
    requiredFor: string[];
    required: boolean;
    status: 'granted' | 'missing' | 'unknown' | 'not-applicable';
    notes: string;
}
export interface MacOSCapabilityReport {
    provider: 'macos-ax';
    platform: NodeJS.Platform;
    supported: boolean;
    reason?: string;
    backgroundRead: boolean;
    backgroundInvoke: boolean;
    backgroundType: boolean;
    requiresForeground: boolean;
    visionFallbackNeeded: boolean;
    permissionsRequired: MacOSPermissionRequirement[];
    operations: Record<string, {
        supported: boolean;
        backgroundCapable: boolean;
        requiresForeground: boolean;
        fallback: 'none' | 'vision' | 'hid' | 'jxa' | 'browser-cdp';
        notes: string;
    }>;
}
export type MacOSProviderResult<T> = {
    ok: true;
    platform: NodeJS.Platform;
    data: T;
    warnings: string[];
} | {
    ok: false;
    platform: NodeJS.Platform;
    unsupported?: boolean;
    error: string;
    warnings: string[];
    capabilityReport?: MacOSCapabilityReport;
};
