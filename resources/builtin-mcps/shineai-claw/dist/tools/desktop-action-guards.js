/**
 * Pure guards for desktop click/focus postconditions.
 * Kept side-effect free so unit tests do not touch PersistentShell.
 */
/** List/Tree/Tab/Menu rows where Select/IsSelected ≠ activate/open. */
export function isActivatableSelectionItem(element) {
    const ct = String(element.controlType || '').replace(/^ControlType\./i, '');
    return /^(ListItem|TreeItem|TabItem|MenuItem)$/i.test(ct);
}
/**
 * Local UIA activation signal for selection-like rows.
 * Selected-only / Focus-only flips are NOT activation (common Select false positives).
 * Toggle / Expand / Value change, or element leaving the tree, count.
 */
export function localActivationStateChanged(before, after) {
    if (after.alive === false)
        return true;
    return (String(before.toggle || '') !== String(after.toggle || '') ||
        String(before.expand || '') !== String(after.expand || '') ||
        String(before.value || '') !== String(after.value || ''));
}
/** Selection rows themselves are never an "outside" activation display surface. */
const ACTIVATION_SELECTION_CONTROL = /^(ListItem|TreeItem|TabItem|MenuItem)$/i;
/**
 * Query/input containers often still hold the typed search string after a popup closes.
 * Keep in sync with UIA PowerShell exclusions in desktop-tools.ts.
 */
const ACTIVATION_QUERY_CONTROL = /^(Edit|Document|ComboBox)$/i;
/**
 * Whether a UIA control type can count as targetNameOutsideSelection evidence.
 * Excludes selection rows and query containers (Edit residual ≠ activated session).
 */
export function isActivationOutsideNameControl(controlType) {
    const ct = String(controlType || '').replace(/^ControlType\./i, '');
    if (!ct)
        return false;
    if (ACTIVATION_SELECTION_CONTROL.test(ct))
        return false;
    if (ACTIVATION_QUERY_CONTROL.test(ct))
        return false;
    return true;
}
/** Pure outsideName hit: exact name match on a non-selection, non-query control. */
export function activationOutsideNameHit(input) {
    const target = String(input.targetName || '').trim();
    const name = String(input.name || '').trim();
    // ponytail: exact-only; Contains on Text hits search chrome ("X - Search"). Upgrade: Window/Pane includes if real titles are prefixed.
    if (!target || name !== target)
        return false;
    return isActivationOutsideNameControl(input.controlType);
}
/**
 * Cheap activation evidence after Select / HID:
 * 1) non-Selected local UIA state change, or
 * 2) target name appears on a non-selection / non-query control in-process, or
 * 3) owning/fg window title contains target name, or
 * 4) window/fg title changed vs before.
 * Selected/Focus-only flips alone are never evidence.
 * Lone elementGone is NOT evidence (search/popup list close ≠ activate).
 */
export function activationEvidenceMatches(input) {
    if (input.localStateChanged)
        return true;
    // ponytail: gone-alone false; popup/search close looks like elementGone. Upgrade: require outsideName co-evidence if needed.
    if (input.targetNameOutsideSelection)
        return true;
    void input.elementGone;
    const target = String(input.targetName || '').trim();
    const after = String(input.afterTitle || '');
    const fg = String(input.foregroundTitle || '');
    const before = String(input.beforeTitle || '');
    if (target) {
        if (after.includes(target) || fg.includes(target))
            return true;
    }
    if (before && after && before !== after)
        return true;
    if (before && fg && before !== fg)
        return true;
    return false;
}
/**
 * Select/IsSelected alone is not "activated" for selection-like rows.
 * UIA path should force one HID fallback when activation evidence is missing.
 * Activatable success requires verify==='verified' — uncertain/resnapshot/empty ≠ success.
 */
export function shouldFallbackClickAfterUia(result, isActivatable) {
    if (!isActivatable)
        return !result.ok;
    if (result.reason === 'needs_fallback_click')
        return true;
    if (result.verify === 'needs_fallback_click' || result.verify === 'state_not_changed')
        return true;
    if (!result.ok)
        return true;
    if (result.verify !== 'verified')
        return true;
    return false;
}
/** Treat Select without activation evidence as non-success. */
export function interpretActivatableSelectVerify(input) {
    if (input.activatedAfter) {
        return { ok: true, verify: 'verified', reason: '' };
    }
    // selected ≠ activated
    return {
        ok: false,
        verify: 'state_not_changed',
        reason: 'needs_fallback_click',
    };
}
/**
 * Final HID probe for activatable rows: still no evidence → hard fail
 * (not another needs_fallback_click loop).
 */
export function interpretActivatableHidVerify(input) {
    if (input.activatedAfter) {
        return { ok: true, verify: 'verified', reason: '' };
    }
    return {
        ok: false,
        verify: 'state_not_changed',
        reason: 'activation_unconfirmed',
    };
}
/** One short HID path: escalate left-single → double for activatable rows. */
export function resolveHidClickTypeForActivatable(input) {
    if (input.isActivatable && input.button === 'left' && input.clickType === 'single') {
        return 'double';
    }
    return input.clickType;
}
const SELF_OCCLUDE_RE = /shineai|claude\s*code|cursor|visual studio code/i;
export function classifyForegroundResult(probe) {
    if (!probe.targetHwnd) {
        return { ok: false, reason: 'focus_failed:window_not_found' };
    }
    if (probe.iconic) {
        return { ok: false, reason: 'focus_failed:minimized' };
    }
    if (!probe.visible) {
        return { ok: false, reason: 'focus_failed:not_visible' };
    }
    if (probe.foregroundHwnd === probe.targetHwnd) {
        return { ok: true, reason: '' };
    }
    const fgTitle = String(probe.foregroundTitle || '');
    if (SELF_OCCLUDE_RE.test(fgTitle)) {
        return { ok: false, reason: 'target_occluded' };
    }
    return { ok: false, reason: 'focus_failed:not_foreground' };
}
export function resolveFocusShowAction(input) {
    if (input.iconic || input.visible === false)
        return 'restore';
    return 'none';
}
/**
 * Pick screenshot capture mode. Explicit region / allScreens / monitor win.
 * Optional follow* only applies when caller did not pin region/monitor/allScreens.
 * Missing follow target → caller falls back to primary (same as legacy monitor=0).
 */
export function resolveScreenshotCaptureMode(input) {
    if (input.hasExplicitRegion)
        return 'explicit';
    if (input.allScreens)
        return 'allScreens';
    if (input.monitorExplicit)
        return 'monitor';
    const title = String(input.followWindowTitle || '').trim();
    const handle = input.followHandle;
    const pid = input.followProcessId;
    if (input.followForeground === true ||
        (handle != null && Number.isFinite(handle) && handle !== 0) ||
        title.length > 0 ||
        (pid != null && Number.isFinite(pid) && pid !== 0)) {
        return 'followWindow';
    }
    return 'primary';
}
function isValidScreenBounds(s) {
    return Boolean(s &&
        Number.isFinite(s.x) &&
        Number.isFinite(s.y) &&
        Number.isFinite(s.width) &&
        Number.isFinite(s.height) &&
        s.width > 0 &&
        s.height > 0);
}
/**
 * Choose follow* capture bounds: windowRect → windowScreen → primary.
 * Pure: GetWindowRect / Screen.FromHandle results are injected by caller.
 * ponytail: ceiling = rect-first crop; upgrade to DWM thumb only if rect stays blank.
 */
export function resolveFollowWindowCaptureBounds(input) {
    if (isValidScreenBounds(input.windowRect)) {
        return { x: input.windowRect.x, y: input.windowRect.y, width: input.windowRect.width, height: input.windowRect.height };
    }
    if (isValidScreenBounds(input.windowScreen)) {
        return { x: input.windowScreen.x, y: input.windowScreen.y, width: input.windowScreen.width, height: input.windowScreen.height };
    }
    return { ...input.primaryScreen };
}
/** Alias: same priority as resolveFollowWindowCaptureBounds (window → screen → primary). */
export function resolveFollowTargetCaptureBounds(input) {
    return resolveFollowWindowCaptureBounds(input);
}
/**
 * After iconic SW_RESTORE, force a cheap client/frame repaint before SetForeground.
 * Visible non-iconic windows must not get ShowWindow(5); repaint is restore-only.
 */
export function shouldRepaintAfterFocusShow(action) {
    return action === 'restore';
}
/** Cheap downsample unique-color ceiling for "整窗灰" / DWM placeholder detection. */
export const NEAR_MONO_MAX_UNIQUE = 4;
/** Luma variance ceiling (0–255 scale); solid gray ≈ 0. */
export const NEAR_MONO_MAX_LUMINANCE_VARIANCE = 8;
/**
 * Follow-path "near gray" after tray/hide restore: uniq still above near-mono
 * (smoke ≈149) but palette+variance stay suspiciously low.
 */
export const SUSPICIOUS_BLANK_MAX_UNIQUE = 256;
export const SUSPICIOUS_BLANK_MAX_LUMINANCE_VARIANCE = 200;
/**
 * Near-monochrome / blank capture heuristic.
 * uniq≤N OR (when provided) luma variance≤threshold → blank.
 */
export function isNearMonochromeCapture(stats, opts) {
    const maxUnique = opts?.maxUnique ?? NEAR_MONO_MAX_UNIQUE;
    const maxVar = opts?.maxLuminanceVariance ?? NEAR_MONO_MAX_LUMINANCE_VARIANCE;
    if (!Number.isFinite(stats.uniqueColors) || stats.uniqueColors < 0)
        return false;
    if (stats.uniqueColors <= maxUnique)
        return true;
    if (stats.luminanceVariance != null &&
        Number.isFinite(stats.luminanceVariance) &&
        stats.luminanceVariance <= maxVar) {
        return true;
    }
    return false;
}
/**
 * Follow* only: near-mono OR (low uniq ∧ low variance) → try PrintWindow.
 * Keeps solid wallpapers on non-follow paths out of scope (caller gates allowPwFallback).
 * ponytail: ceiling = one extra band for post-restore gray; tighten if UI false-triggers.
 */
export function isSuspiciousBlankCapture(stats) {
    if (isNearMonochromeCapture(stats))
        return true;
    if (!Number.isFinite(stats.uniqueColors) || stats.uniqueColors < 0)
        return false;
    if (stats.uniqueColors > SUSPICIOUS_BLANK_MAX_UNIQUE)
        return false;
    if (stats.luminanceVariance == null ||
        !Number.isFinite(stats.luminanceVariance)) {
        return false;
    }
    return stats.luminanceVariance <= SUSPICIOUS_BLANK_MAX_LUMINANCE_VARIANCE;
}
export function hasResolvableCaptureHwnd(hwnd) {
    return hwnd != null && Number.isFinite(hwnd) && hwnd !== 0;
}
/**
 * PrintWindow(PW_RENDERFULLCONTENT) only when the GDI screen grab looks blank
 * AND the caller already resolved a target HWND (follow* / fg).
 */
export function shouldPrintWindowFallback(input) {
    return input.isNearBlank && hasResolvableCaptureHwnd(input.targetHwnd);
}
/**
 * Screenshot blank-path state machine:
 * blank+hwnd → try PrintWindow once; still blank → capture_blank signal;
 * blank without hwnd → capture_blank (do not silently annotate as success).
 */
export function resolveCaptureBlankDecision(input) {
    const hasHwnd = hasResolvableCaptureHwnd(input.targetHwnd);
    if (!input.printWindowTried) {
        if (!input.isNearBlank)
            return 'ok';
        if (hasHwnd)
            return 'try_printwindow';
        return 'capture_blank';
    }
    // After PrintWindow: only the post-fallback blank flag matters.
    if (input.stillBlankAfterPrintWindow)
        return 'capture_blank';
    return 'ok';
}
