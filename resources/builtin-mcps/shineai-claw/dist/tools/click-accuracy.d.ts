/**
 * Pure helpers for OCR→UIA neighborhood anchoring and click-point preference.
 * Kept side-effect free for unit tests (no PersistentShell / UIA).
 */
/** Floor for OCR→UIA neighbor distance (px). */
export declare const OCR_UIA_NEIGHBOR_MIN_PX = 24;
/** Neighbor radius = max(MIN, min(edge) * RATIO). */
export declare const OCR_UIA_NEIGHBOR_EDGE_RATIO = 0.3;
export type AnnotatedSource = 'UIA' | 'OCR' | 'OCR_UIA';
export interface RectLike {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface OcrUiaCandidate extends RectLike {
    cx: number;
    cy: number;
}
/** max(24, min(w,h) * 0.3) */
export declare function ocrUiaNeighborThreshold(w: number, h: number): number;
/** Euclidean distance from point to axis-aligned rect (0 if inside). */
export declare function distancePointToRect(cx: number, cy: number, rect: RectLike): number;
export declare function pointInRect(cx: number, cy: number, rect: RectLike): boolean;
/**
 * Prefer actionable UIA whose bounds contain the OCR centre;
 * else nearest candidate within max(24, min(edge)*0.3).
 */
export declare function findOcrUiaAnchor<T extends OcrUiaCandidate>(ocrCx: number, ocrCy: number, candidates: readonly T[]): T | null;
export declare function parseAnnotatedSource(raw: string | undefined): AnnotatedSource;
/** OCR_UIA is natively actionable (anchored UIA); pure OCR text is not. */
export declare function isUiaElementCandidate(element: {
    name?: string;
    automationId?: string;
    className?: string;
    controlType?: string;
    source?: string;
    patterns?: string[];
} | null | undefined): boolean;
/** Prefer GetClickablePoint when ok; fall back to rect centre. */
export declare function preferClickablePoint(clickable: {
    x: number;
    y: number;
    ok?: boolean;
} | null | undefined, rectCenter: {
    x: number;
    y: number;
}): {
    x: number;
    y: number;
};
/** Soft UIA fields used by search-ambiguity ranking (no app-specific ID tables). */
export interface SearchAmbiguityFields {
    name?: string;
    className?: string;
    automationId?: string;
    controlType?: string;
}
/**
 * Soft bias when the same label appears under local chat/session lists and
 * network "search the web" chrome. Positive → prefer; negative → demote; 0 = neutral.
 * Generic name/class/aid regex only — no WeChat AutomationId allowlists.
 */
export declare function scoreSearchAmbiguity(el: SearchAmbiguityFields | null | undefined): number;
/** Comparator for same-name ambiguity: local/session-ish before network-search chrome. */
export declare function preferLocalSessionOverNetworkSearch(a: SearchAmbiguityFields, b: SearchAmbiguityFields): number;
/**
 * PowerShell one-liner for an atomic absolute move+click (Win32.SendMouse).
 * Replaces the old `SetCursorPos + Start-Sleep + mouse_event` sequence:
 * a single SendInput round-trip is faster and lands more reliably under DPI scaling
 * and multi-monitor virtual-desktop layouts.
 */
export declare function formatSendMouseCommand(x: number, y: number, flagCsv: string): string;
/** Virtual-desktop bounds (Left/Top may be negative for monitors above/left of primary). */
export interface VirtualScreenRect {
    left: number;
    top: number;
    width: number;
    height: number;
}
/** Clamped verify-crop rect plus crosshair position relative to the crop origin. */
export interface CropRect {
    x: number;
    y: number;
    w: number;
    h: number;
    crossX: number;
    crossY: number;
}
/**
 * Compute the verify-screenshot crop rect for a click at (cx,cy), clamped to the
 * virtual screen so we never read outside the desktop (which yields black/garbage)
 * and never draw the crosshair at the wrong offset.
 *
 * `half` is the half-size of the desired square (crop is 2*half on a side, shrunk
 * to fit if the virtual screen is smaller). Coordinates are physical pixels; the
 * PowerShell verify blocks replicate this exact logic against VirtualScreen.
 */
export declare function clampCropRect(cx: number, cy: number, half: number, vs: VirtualScreenRect): CropRect;
/**
 * True when `expectText` is found (case-insensitive substring) in any of the
 * supplied names (hit element Name + ancestor Names). Empty/blank expectText
 * means "no expectation" → returns true (never blocks the click).
 */
export declare function matchesExpectText(names: readonly (string | null | undefined)[], expectText: string | null | undefined): boolean;
/**
 * JS mirror of Win32.Normalize (PersistentShell C#): map a virtual-desktop pixel into the
 * 0..65535 absolute space SendInput expects. Divisor is (span - 1) so 65535 maps to the last
 * addressable pixel — the MOUSEEVENTF_VIRTUALDESK convention. Keep in sync with the C# copy.
 */
export declare function normalizeAbsCoord(value: number, origin: number, span: number): number;
