import type { MacOSCapabilityReport } from './types.js';
export interface MacOSPermissionStatusInput {
    accessibility?: boolean;
    screenRecording?: boolean;
    automation?: boolean;
    inputMonitoring?: boolean;
}
export declare function createMacOSCapabilityReport(platform?: NodeJS.Platform, permissions?: MacOSPermissionStatusInput): MacOSCapabilityReport;
export declare const MACOS_AX_BACKGROUND_BOUNDARIES: {
    readonly canStayBackground: readonly ["list running apps with NSWorkspace", "list windows with CGWindowList", "read most AX trees by pid/window without activation", "AXPress on controls exposing kAXPressAction", "AXSetValue on AXTextField/AXTextArea/AXSearchField/AXComboBox when AXValue is settable"];
    readonly needsForeground: readonly ["activate/focus application or window", "HID click/type/scroll fallback because events go to the active session", "menu-bar selection through System Events/JXA", "controls that only materialize children after focus/hover"];
    readonly needsVisionFallback: readonly ["canvas/custom-drawn UI without meaningful AX nodes", "secure text fields where AXValue is hidden or not settable", "web content without enough AX exposure and without Browser/CDP provider access", "post-action verification when AX state does not expose a changed value/selection"];
};
