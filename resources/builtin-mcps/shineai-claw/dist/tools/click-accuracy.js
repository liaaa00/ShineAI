/**
 * Pure helpers for OCR→UIA neighborhood anchoring and click-point preference.
 * Kept side-effect free for unit tests (no PersistentShell / UIA).
 */
/** Floor for OCR→UIA neighbor distance (px). */
export const OCR_UIA_NEIGHBOR_MIN_PX = 24;
/** Neighbor radius = max(MIN, min(edge) * RATIO). */
export const OCR_UIA_NEIGHBOR_EDGE_RATIO = 0.3;
/** max(24, min(w,h) * 0.3) */
export function ocrUiaNeighborThreshold(w, h) {
    const edge = Math.min(Math.max(0, w), Math.max(0, h));
    return Math.max(OCR_UIA_NEIGHBOR_MIN_PX, edge * OCR_UIA_NEIGHBOR_EDGE_RATIO);
}
/** Euclidean distance from point to axis-aligned rect (0 if inside). */
export function distancePointToRect(cx, cy, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - nx;
    const dy = cy - ny;
    return Math.sqrt(dx * dx + dy * dy);
}
export function pointInRect(cx, cy, rect) {
    return cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
}
/**
 * Prefer actionable UIA whose bounds contain the OCR centre;
 * else nearest candidate within max(24, min(edge)*0.3).
 */
export function findOcrUiaAnchor(ocrCx, ocrCy, candidates) {
    let nearest = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const cand of candidates) {
        if (pointInRect(ocrCx, ocrCy, cand))
            return cand;
        const dist = distancePointToRect(ocrCx, ocrCy, cand);
        const thresh = ocrUiaNeighborThreshold(cand.w, cand.h);
        if (dist <= thresh && dist < bestDist) {
            bestDist = dist;
            nearest = cand;
        }
    }
    return nearest;
}
export function parseAnnotatedSource(raw) {
    if (raw === 'OCR')
        return 'OCR';
    if (raw === 'OCR_UIA')
        return 'OCR_UIA';
    return 'UIA';
}
/** OCR_UIA is natively actionable (anchored UIA); pure OCR text is not. */
export function isUiaElementCandidate(element) {
    if (!element)
        return false;
    if (element.source === 'OCR' || (element.controlType || '').startsWith('OCR'))
        return false;
    if (element.source === 'OCR_UIA') {
        return Boolean(element.name || element.automationId || element.className || (element.patterns && element.patterns.length > 0));
    }
    return Boolean(element.name || element.automationId || element.className);
}
/** Prefer GetClickablePoint when ok; fall back to rect centre. */
export function preferClickablePoint(clickable, rectCenter) {
    if (clickable &&
        clickable.ok !== false &&
        Number.isFinite(clickable.x) &&
        Number.isFinite(clickable.y)) {
        return { x: clickable.x, y: clickable.y };
    }
    return { x: rectCenter.x, y: rectCenter.y };
}
/** Network / "search the web" chrome — demote when same label also exists locally. */
const NETWORK_SEARCH_CHROME_RE = /搜索网络|搜一搜|search[\s_-]*the[\s_-]*web|web[\s_-]*results?|search[\s_-]*network|search[\s_-]*web|online[\s_-]*search|web[\s_-]*search/i;
/** Generic session/chat-list cues — boost local conversation-like rows. */
const SESSIONISH_RE = /session|chat|conversation|contact|msglist|chatlist|会话|联系人|最常使用|recent\s*chats?|frequent/i;
/**
 * Soft bias when the same label appears under local chat/session lists and
 * network "search the web" chrome. Positive → prefer; negative → demote; 0 = neutral.
 * Generic name/class/aid regex only — no WeChat AutomationId allowlists.
 */
export function scoreSearchAmbiguity(el) {
    if (!el)
        return 0;
    const name = el.name || '';
    const className = el.className || '';
    const automationId = el.automationId || '';
    const hay = `${name}\n${className}\n${automationId}`;
    let score = 0;
    if (NETWORK_SEARCH_CHROME_RE.test(hay))
        score -= 35;
    // Class/Aid session cues beat name-only (section titles may say "最近聊天")
    if (SESSIONISH_RE.test(className) || SESSIONISH_RE.test(automationId))
        score += 25;
    else if (SESSIONISH_RE.test(name))
        score += 12;
    return score;
}
/** Comparator for same-name ambiguity: local/session-ish before network-search chrome. */
export function preferLocalSessionOverNetworkSearch(a, b) {
    return scoreSearchAmbiguity(b) - scoreSearchAmbiguity(a);
}
/**
 * PowerShell one-liner for an atomic absolute move+click (Win32.SendMouse).
 * Replaces the old `SetCursorPos + Start-Sleep + mouse_event` sequence:
 * a single SendInput round-trip is faster and lands more reliably under DPI scaling
 * and multi-monitor virtual-desktop layouts.
 */
export function formatSendMouseCommand(x, y, flagCsv) {
    return `[Win32]::SendMouse(${Math.round(x)}, ${Math.round(y)}, '${flagCsv}')`;
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
export function clampCropRect(cx, cy, half, vs) {
    const full = Math.max(1, Math.round(half * 2));
    const w = Math.min(full, Math.max(1, Math.round(vs.width)));
    const h = Math.min(full, Math.max(1, Math.round(vs.height)));
    const right = vs.left + vs.width;
    const bottom = vs.top + vs.height;
    let x = Math.round(cx - half);
    let y = Math.round(cy - half);
    x = Math.max(vs.left, Math.min(x, right - w));
    y = Math.max(vs.top, Math.min(y, bottom - h));
    return { x, y, w, h, crossX: Math.round(cx - x), crossY: Math.round(cy - y) };
}
/**
 * True when `expectText` is found (case-insensitive substring) in any of the
 * supplied names (hit element Name + ancestor Names). Empty/blank expectText
 * means "no expectation" → returns true (never blocks the click).
 */
export function matchesExpectText(names, expectText) {
    const needle = (expectText || '').trim().toLowerCase();
    if (!needle)
        return true;
    return names.some((n) => (n || '').toLowerCase().includes(needle));
}
/**
 * JS mirror of Win32.Normalize (PersistentShell C#): map a virtual-desktop pixel into the
 * 0..65535 absolute space SendInput expects. Divisor is (span - 1) so 65535 maps to the last
 * addressable pixel — the MOUSEEVENTF_VIRTUALDESK convention. Keep in sync with the C# copy.
 */
export function normalizeAbsCoord(value, origin, span) {
    if (span <= 1)
        return 0;
    const v = Math.trunc(((value - origin) * 65535) / (span - 1));
    return Math.max(0, Math.min(65535, v));
}
