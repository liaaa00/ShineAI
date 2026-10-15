import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AUTO_SCALE_MAX_LONG_EDGE, AUTO_SCALE_MAX_PIXELS, computeAutoScale, getScreenshotMeta, normalizeScreenshotMetaKey, parseScreenshotMetaJson, setScreenshotMeta, siblingMetaJsonPath, } from '../screenshot-meta.js';
const sampleMeta = {
    captureX: 0,
    captureY: 0,
    captureW: 100,
    captureH: 80,
    imageW: 100,
    imageH: 80,
    elements: [
        {
            number: 1,
            name: 'OK',
            controlType: 'ControlType.Button',
            screenX: 10,
            screenY: 20,
            source: 'UIA',
        },
    ],
};
describe('normalizeScreenshotMetaKey', () => {
    it('maps slash variants of the same path to one key', () => {
        const a = normalizeScreenshotMetaKey('C:/Temp/shot.png');
        const b = normalizeScreenshotMetaKey('C:\\Temp\\shot.png');
        const c = normalizeScreenshotMetaKey('C:/Temp/../Temp/shot.png');
        assert.equal(a, b);
        assert.equal(a, c);
        if (process.platform === 'win32') {
            assert.equal(a, normalizeScreenshotMetaKey('c:/temp/SHOT.png'));
        }
    });
});
describe('setScreenshotMeta / getScreenshotMeta (memory)', () => {
    it('gets meta after set even when path slash form differs', () => {
        const map = new Map();
        setScreenshotMeta(map, 'C:\\Temp\\annot.png', sampleMeta);
        const hit = getScreenshotMeta(map, 'C:/Temp/annot.png', {
            existsSync: () => false,
            readFileSync: () => {
                throw new Error('should not read disk');
            },
        });
        assert.ok(hit);
        assert.equal(hit.elements?.[0]?.number, 1);
    });
});
describe('getScreenshotMeta hydrate', () => {
    it('hydrates from sibling .meta.json when map is empty', () => {
        const map = new Map();
        const shot = 'C:\\Temp\\hydrate-shot.png';
        const metaPath = siblingMetaJsonPath(shot);
        const payload = JSON.stringify({
            captureX: 1,
            captureY: 2,
            captureW: 3,
            captureH: 4,
            imageW: 5,
            imageH: 6,
            elements: [
                {
                    number: 7,
                    name: 'Send',
                    controlType: 'ControlType.Button',
                    screenX: 11,
                    screenY: 22,
                    source: 'UIA',
                },
            ],
        });
        const hit = getScreenshotMeta(map, shot, {
            existsSync: (p) => p === metaPath,
            readFileSync: (p) => {
                assert.equal(p, metaPath);
                return payload;
            },
        });
        assert.ok(hit);
        assert.equal(hit.captureX, 1);
        assert.equal(hit.elements?.[0]?.number, 7);
        // second call should hit memory without fs
        const again = getScreenshotMeta(map, 'C:/Temp/hydrate-shot.png', {
            existsSync: () => {
                throw new Error('should use memory');
            },
            readFileSync: () => {
                throw new Error('should use memory');
            },
        });
        assert.equal(again?.elements?.[0]?.name, 'Send');
    });
    it('returns null when meta file is missing', () => {
        const map = new Map();
        const hit = getScreenshotMeta(map, 'C:/Temp/missing.png', {
            existsSync: () => false,
            readFileSync: () => {
                throw new Error('should not read');
            },
        });
        assert.equal(hit, null);
    });
    it('returns null when meta has no elements', () => {
        const map = new Map();
        const hit = getScreenshotMeta(map, 'C:/Temp/empty-elements.png', {
            existsSync: () => true,
            readFileSync: () => JSON.stringify({
                captureX: 0,
                captureY: 0,
                captureW: 1,
                captureH: 1,
                imageW: 1,
                imageH: 1,
                elements: [],
            }),
        });
        assert.equal(hit, null);
    });
});
describe('parseScreenshotMetaJson', () => {
    it('rejects invalid json', () => {
        assert.equal(parseScreenshotMetaJson('{'), null);
    });
});
describe('computeAutoScale', () => {
    const within = (w, h) => {
        const r = computeAutoScale(w, h);
        assert.ok(Math.max(r.width, r.height) <= AUTO_SCALE_MAX_LONG_EDGE + 1, 'long edge within limit');
        assert.ok(r.width * r.height <= AUTO_SCALE_MAX_PIXELS * 1.01, 'pixel budget within limit');
        return r;
    };
    it('never upscales an already-small image', () => {
        const r = computeAutoScale(800, 600);
        assert.equal(r.scale, 1);
        assert.equal(r.width, 800);
        assert.equal(r.height, 600);
    });
    it('downscales 1920x1080 within the vision limits, keeping aspect ratio', () => {
        const r = within(1920, 1080);
        assert.ok(r.scale < 1);
        // pixel budget dominates here (sqrt(1.15M/2.07M) ≈ 0.745)
        assert.equal(r.width, Math.round(1920 * r.scale));
        assert.equal(r.height, Math.round(1080 * r.scale));
        const srcAspect = 1920 / 1080;
        assert.ok(Math.abs(r.width / r.height - srcAspect) < 0.01);
    });
    it('downscales 2560x1440 and 4K within limits', () => {
        within(2560, 1440);
        within(3840, 2160);
    });
    it('caps the long edge for extreme aspect ratios', () => {
        // very wide, low pixel count: long-edge cap must bind even if pixel budget would not
        const r = within(4000, 200);
        assert.ok(r.width <= AUTO_SCALE_MAX_LONG_EDGE + 1);
    });
    it('is defensive against non-positive / non-finite input', () => {
        assert.equal(computeAutoScale(0, 100).scale, 1);
        assert.equal(computeAutoScale(Number.NaN, 100).scale, 1);
    });
});
