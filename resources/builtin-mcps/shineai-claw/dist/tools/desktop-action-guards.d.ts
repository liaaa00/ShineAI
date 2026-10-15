/**
 * Pure guards for desktop click/focus postconditions.
 * Kept side-effect free so unit tests do not touch PersistentShell.
 */
export interface ActivationTitles {
    windowTitle: string;
    foregroundTitle: string;
}
export interface ForegroundProbe {
    targetHwnd: number;
    foregroundHwnd: number;
    visible: boolean;
    iconic: boolean;
    foregroundTitle?: string;
}
/** List/Tree/Tab/Menu rows where Select/IsSelected ≠ activate/open. */
export declare function isActivatableSelectionItem(element: {
    controlType?: string;
    automationId?: string;
}): boolean;
export interface ElementLocalState {
    toggle?: string;
    expand?: string;
    value?: string;
    selected?: string;
    focus?: string;
    alive?: boolean;
}
/**
 * Local UIA activation signal for selection-like rows.
 * Selected-only / Focus-only flips are NOT activation (common Select false positives).
 * Toggle / Expand / Value change, or element leaving the tree, count.
 */
export declare function localActivationStateChanged(before: ElementLocalState, after: ElementLocalState): boolean;
/**
 * Whether a UIA control type can count as targetNameOutsideSelection evidence.
 * Excludes selection rows and query containers (Edit residual ≠ activated session).
 */
export declare function isActivationOutsideNameControl(controlType?: string): boolean;
/** Pure outsideName hit: exact name match on a non-selection, non-query control. */
export declare function activationOutsideNameHit(input: {
    controlType?: string;
    name?: string;
    targetName?: string;
}): boolean;
/**
 * Cheap activation evidence after Select / HID:
 * 1) non-Selected local UIA state change, or
 * 2) target name appears on a non-selection / non-query control in-process, or
 * 3) owning/fg window title contains target name, or
 * 4) window/fg title changed vs before.
 * Selected/Focus-only flips alone are never evidence.
 * Lone elementGone is NOT evidence (search/popup list close ≠ activate).
 */
export declare function activationEvidenceMatches(input: {
    targetName?: string;
    beforeTitle?: string;
    afterTitle?: string;
    foregroundTitle?: string;
    localStateChanged?: boolean;
    elementGone?: boolean;
    targetNameOutsideSelection?: boolean;
}): boolean;
/**
 * Select/IsSelected alone is not "activated" for selection-like rows.
 * UIA path should force one HID fallback when activation evidence is missing.
 * Activatable success requires verify==='verified' — uncertain/resnapshot/empty ≠ success.
 */
export declare function shouldFallbackClickAfterUia(result: {
    ok: boolean;
    verify?: string;
    reason?: string;
}, isActivatable: boolean): boolean;
/** Treat Select without activation evidence as non-success. */
export declare function interpretActivatableSelectVerify(input: {
    activatedAfter: boolean;
}): {
    ok: boolean;
    verify: string;
    reason: string;
};
/**
 * Final HID probe for activatable rows: still no evidence → hard fail
 * (not another needs_fallback_click loop).
 */
export declare function interpretActivatableHidVerify(input: {
    activatedAfter: boolean;
}): {
    ok: boolean;
    verify: string;
    reason: string;
};
/** One short HID path: escalate left-single → double for activatable rows. */
export declare function resolveHidClickTypeForActivatable(input: {
    isActivatable: boolean;
    button: string;
    clickType: string;
}): string;
export declare function classifyForegroundResult(probe: ForegroundProbe): {
    ok: boolean;
    reason: string;
};
/**
 * Focus ShowWindow policy: restore minimized OR tray/hidden (visible=false, often non-iconic).
 * Already-visible non-iconic windows must not get unconditional SW_SHOW(5).
 * ponytail: ceiling = restore+repaint for hidden; upgrade to SW_SHOWNA only if a real app needs it.
 */
export type FocusShowAction = 'none' | 'restore';
export declare function resolveFocusShowAction(input: {
    iconic: boolean;
    visible?: boolean;
}): FocusShowAction;
export type ScreenshotCaptureMode = 'explicit' | 'allScreens' | 'monitor' | 'followWindow' | 'primary';
/**
 * Pick screenshot capture mode. Explicit region / allScreens / monitor win.
 * Optional follow* only applies when caller did not pin region/monitor/allScreens.
 * Missing follow target → caller falls back to primary (same as legacy monitor=0).
 */
export declare function resolveScreenshotCaptureMode(input: {
    hasExplicitRegion?: boolean;
    allScreens?: boolean;
    monitorExplicit?: boolean;
    followForeground?: boolean;
    followHandle?: number | null;
    followWindowTitle?: string | null;
    followProcessId?: number | null;
}): ScreenshotCaptureMode;
export interface ScreenBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * Choose follow* capture bounds: windowRect → windowScreen → primary.
 * Pure: GetWindowRect / Screen.FromHandle results are injected by caller.
 * ponytail: ceiling = rect-first crop; upgrade to DWM thumb only if rect stays blank.
 */
export declare function resolveFollowWindowCaptureBounds(input: {
    windowRect?: ScreenBounds | null;
    windowScreen?: ScreenBounds | null;
    primaryScreen: ScreenBounds;
}): ScreenBounds;
/** Alias: same priority as resolveFollowWindowCaptureBounds (window → screen → primary). */
export declare function resolveFollowTargetCaptureBounds(input: {
    windowRect?: ScreenBounds | null;
    windowScreen?: ScreenBounds | null;
    primaryScreen: ScreenBounds;
}): ScreenBounds;
/**
 * After iconic SW_RESTORE, force a cheap client/frame repaint before SetForeground.
 * Visible non-iconic windows must not get ShowWindow(5); repaint is restore-only.
 */
export declare function shouldRepaintAfterFocusShow(action: FocusShowAction): boolean;
/** Cheap downsample unique-color ceiling for "整窗灰" / DWM placeholder detection. */
export declare const NEAR_MONO_MAX_UNIQUE = 4;
/** Luma variance ceiling (0–255 scale); solid gray ≈ 0. */
export declare const NEAR_MONO_MAX_LUMINANCE_VARIANCE = 8;
/**
 * Follow-path "near gray" after tray/hide restore: uniq still above near-mono
 * (smoke ≈149) but palette+variance stay suspiciously low.
 */
export declare const SUSPICIOUS_BLANK_MAX_UNIQUE = 256;
export declare const SUSPICIOUS_BLANK_MAX_LUMINANCE_VARIANCE = 200;
export interface CaptureColorStats {
    /** Distinct packed RGB after cheap downsample / grid sample. */
    uniqueColors: number;
    /** Optional luminance variance; omit when only uniq is available. */
    luminanceVariance?: number;
}
/**
 * Near-monochrome / blank capture heuristic.
 * uniq≤N OR (when provided) luma variance≤threshold → blank.
 */
export declare function isNearMonochromeCapture(stats: CaptureColorStats, opts?: {
    maxUnique?: number;
    maxLuminanceVariance?: number;
}): boolean;
/**
 * Follow* only: near-mono OR (low uniq ∧ low variance) → try PrintWindow.
 * Keeps solid wallpapers on non-follow paths out of scope (caller gates allowPwFallback).
 * ponytail: ceiling = one extra band for post-restore gray; tighten if UI false-triggers.
 */
export declare function isSuspiciousBlankCapture(stats: CaptureColorStats): boolean;
export declare function hasResolvableCaptureHwnd(hwnd?: number | null): boolean;
/**
 * PrintWindow(PW_RENDERFULLCONTENT) only when the GDI screen grab looks blank
 * AND the caller already resolved a target HWND (follow* / fg).
 */
export declare function shouldPrintWindowFallback(input: {
    isNearBlank: boolean;
    targetHwnd?: number | null;
}): boolean;
export type CaptureBlankDecision = 'ok' | 'try_printwindow' | 'capture_blank';
/**
 * Screenshot blank-path state machine:
 * blank+hwnd → try PrintWindow once; still blank → capture_blank signal;
 * blank without hwnd → capture_blank (do not silently annotate as success).
 */
export declare function resolveCaptureBlankDecision(input: {
    isNearBlank: boolean;
    targetHwnd?: number | null;
    printWindowTried?: boolean;
    stillBlankAfterPrintWindow?: boolean;
}): CaptureBlankDecision;
