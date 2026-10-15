import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clampCropRect, findOcrUiaAnchor, formatSendMouseCommand, isUiaElementCandidate, matchesExpectText, normalizeAbsCoord, ocrUiaNeighborThreshold, parseAnnotatedSource, preferClickablePoint, preferLocalSessionOverNetworkSearch, scoreSearchAmbiguity, } from '../click-accuracy.js';
describe('ocrUiaNeighborThreshold', () => {
    it('uses max(24, min(edge)*0.3)', () => {
        assert.equal(ocrUiaNeighborThreshold(100, 80), 24); // 0.3*80=24
        assert.equal(ocrUiaNeighborThreshold(200, 200), 60); // 0.3*200=60
        assert.equal(ocrUiaNeighborThreshold(10, 10), 24); // floor
    });
});
describe('findOcrUiaAnchor', () => {
    const cand = { x: 100, y: 100, w: 40, h: 20, cx: 120, cy: 110 };
    it('hits when OCR centre is inside bounds', () => {
        const hit = findOcrUiaAnchor(110, 105, [cand]);
        assert.equal(hit, cand);
    });
    it('hits when within neighbor distance', () => {
        // thresh = max(24, min(40,20)*0.3)=24; point 8px left of rect
        const hit = findOcrUiaAnchor(92, 110, [cand]);
        assert.equal(hit, cand);
    });
    it('misses when beyond neighbor distance', () => {
        const hit = findOcrUiaAnchor(50, 110, [cand]); // ~50px away
        assert.equal(hit, null);
    });
    it('prefers containing candidate over farther neighbor', () => {
        const far = { x: 200, y: 100, w: 40, h: 40, cx: 220, cy: 120 };
        const hit = findOcrUiaAnchor(110, 105, [far, cand]);
        assert.equal(hit, cand);
    });
});
describe('parseAnnotatedSource / isUiaElementCandidate', () => {
    it('parses OCR_UIA distinctly', () => {
        assert.equal(parseAnnotatedSource('OCR_UIA'), 'OCR_UIA');
        assert.equal(parseAnnotatedSource('OCR'), 'OCR');
        assert.equal(parseAnnotatedSource('UIA'), 'UIA');
    });
    it('treats OCR_UIA as UIA-clickable, pure OCR as not', () => {
        assert.equal(isUiaElementCandidate({
            name: 'Send',
            controlType: 'ControlType.Button',
            source: 'OCR_UIA',
            patterns: ['Invoke'],
        }), true);
        assert.equal(isUiaElementCandidate({
            name: 'Send',
            controlType: 'OCR.Text',
            source: 'OCR',
        }), false);
        assert.equal(isUiaElementCandidate({
            name: 'OK',
            controlType: 'ControlType.Button',
            source: 'UIA',
        }), true);
    });
});
describe('preferClickablePoint', () => {
    it('prefers GetClickablePoint when ok', () => {
        assert.deepEqual(preferClickablePoint({ x: 11, y: 22, ok: true }, { x: 100, y: 200 }), { x: 11, y: 22 });
        assert.deepEqual(preferClickablePoint({ x: 11, y: 22, ok: false }, { x: 100, y: 200 }), { x: 100, y: 200 });
    });
});
describe('scoreSearchAmbiguity / preferLocalSessionOverNetworkSearch (P3.15)', () => {
    it('ranks same-name local session above network search chrome', () => {
        const local = {
            name: '懵逼三人组',
            className: 'ChatSessionListItem',
            automationId: 'session_row_42',
            controlType: 'ControlType.ListItem',
        };
        const network = {
            name: '懵逼三人组',
            className: 'SearchResultRow',
            automationId: 'search_web_hit_1',
            controlType: 'ControlType.ListItem',
        };
        assert.ok(scoreSearchAmbiguity(local) > scoreSearchAmbiguity(network));
        assert.ok(preferLocalSessionOverNetworkSearch(local, network) < 0);
    });
    it('demotes labels that are themselves network-search chrome', () => {
        assert.ok(scoreSearchAmbiguity({ name: '搜索网络结果' }) < 0);
        assert.ok(scoreSearchAmbiguity({ name: '懵逼三人组 - 搜一搜' }) < 0);
        assert.ok(scoreSearchAmbiguity({ name: 'Search the web' }) < 0);
        assert.ok(scoreSearchAmbiguity({ automationId: 'search_network_panel' }) < 0);
    });
    it('leaves ordinary buttons near neutral', () => {
        assert.equal(scoreSearchAmbiguity({ name: 'OK', controlType: 'ControlType.Button' }), 0);
        assert.equal(scoreSearchAmbiguity({
            name: 'Save',
            className: 'Button',
            automationId: 'btnSave',
            controlType: 'ControlType.Button',
        }), 0);
    });
    it('works from generic class/name cues without WeChat-specific AutomationIds', () => {
        const local = { name: 'Team standup', className: 'ConversationCell' };
        const network = { name: 'Team standup', automationId: 'web_results_item' };
        assert.ok(scoreSearchAmbiguity(local) > 0);
        assert.ok(scoreSearchAmbiguity(network) < 0);
        assert.ok(scoreSearchAmbiguity(local) > scoreSearchAmbiguity(network));
    });
});
describe('clampCropRect', () => {
    const primary = { left: 0, top: 0, width: 1920, height: 1080 };
    it('centers the crop and crosshair when fully inside the primary screen', () => {
        const r = clampCropRect(500, 400, 150, primary);
        assert.deepEqual(r, { x: 350, y: 250, w: 300, h: 300, crossX: 150, crossY: 150 });
    });
    it('clamps the origin to 0 near the top-left corner (no negative read)', () => {
        const r = clampCropRect(50, 30, 150, primary);
        assert.equal(r.x, 0);
        assert.equal(r.y, 0);
        // crosshair tracks the actual origin, not the ideal center
        assert.equal(r.crossX, 50);
        assert.equal(r.crossY, 30);
    });
    it('clamps against the right/bottom edges', () => {
        const r = clampCropRect(1900, 1070, 150, primary);
        assert.equal(r.x, 1920 - 300);
        assert.equal(r.y, 1080 - 300);
        assert.equal(r.crossX, 1900 - (1920 - 300));
        assert.equal(r.crossY, 1070 - (1080 - 300));
    });
    it('handles a secondary monitor placed left/above with negative origin', () => {
        // Virtual screen spans a monitor to the left and above the primary.
        const vs = { left: -1920, top: -600, width: 3840, height: 1680 };
        const r = clampCropRect(-1800, -500, 150, vs);
        // ideal origin (-1950,-650) escapes left/top edges → clamped to vs.left/vs.top
        assert.equal(r.x, vs.left); // -1950 < -1920
        assert.equal(r.y, vs.top); //  -650 < -600
        assert.equal(r.crossX, -1800 - r.x);
        assert.equal(r.crossY, -500 - r.y);
        // crop must stay within virtual bounds
        assert.ok(r.x >= vs.left);
        assert.ok(r.y >= vs.top);
        assert.ok(r.x + r.w <= vs.left + vs.width);
        assert.ok(r.y + r.h <= vs.top + vs.height);
    });
    it('shrinks the crop to fit a virtual screen smaller than the requested size', () => {
        const tiny = { left: 0, top: 0, width: 200, height: 100 };
        const r = clampCropRect(100, 50, 150, tiny);
        assert.equal(r.w, 200);
        assert.equal(r.h, 100);
        assert.equal(r.x, 0);
        assert.equal(r.y, 0);
    });
});
describe('matchesExpectText', () => {
    it('returns true (no block) when expectText is empty/blank', () => {
        assert.equal(matchesExpectText(['whatever'], ''), true);
        assert.equal(matchesExpectText(['whatever'], '   '), true);
        assert.equal(matchesExpectText([], undefined), true);
    });
    it('matches case-insensitively as a substring across names/ancestors', () => {
        assert.equal(matchesExpectText(['Send Message', null], 'send'), true);
        assert.equal(matchesExpectText([null, undefined, 'Chat with 张三'], '张三'), true);
        assert.equal(matchesExpectText(['OK', 'Dialog Button'], 'button'), true);
    });
    it('returns false when no name contains expectText', () => {
        assert.equal(matchesExpectText(['Like', 'Comment', 'Share'], 'follow'), false);
        assert.equal(matchesExpectText([null, ''], 'anything'), false);
    });
});
describe('normalizeAbsCoord', () => {
    it('maps the last addressable pixel to exactly 65535 (span-1 divisor)', () => {
        // Single 1920-wide desktop at origin 0: pixel 1919 is the last one.
        assert.equal(normalizeAbsCoord(1919, 0, 1920), 65535);
        assert.equal(normalizeAbsCoord(0, 0, 1920), 0);
    });
    it('accounts for a negative virtual-desktop origin', () => {
        // Monitor to the left: origin -1920, span 3840, last pixel at x=1919.
        assert.equal(normalizeAbsCoord(-1920, -1920, 3840), 0);
        assert.equal(normalizeAbsCoord(1919, -1920, 3840), 65535);
    });
    it('clamps out-of-range values and guards degenerate spans', () => {
        assert.equal(normalizeAbsCoord(5000, 0, 1920), 65535);
        assert.equal(normalizeAbsCoord(-10, 0, 1920), 0);
        assert.equal(normalizeAbsCoord(100, 0, 1), 0);
        assert.equal(normalizeAbsCoord(100, 0, 0), 0);
    });
});
describe('formatSendMouseCommand', () => {
    it('emits a single absolute SendMouse call with rounded coords', () => {
        assert.equal(formatSendMouseCommand(100, 200, '0x0002;0x0004'), "[Win32]::SendMouse(100, 200, '0x0002;0x0004')");
    });
    it('rounds fractional coordinates and keeps double-click flag order', () => {
        assert.equal(formatSendMouseCommand(10.4, 20.6, '0x0002;0x0004;0x0002;0x0004'), "[Win32]::SendMouse(10, 21, '0x0002;0x0004;0x0002;0x0004')");
    });
});
