import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scaleCoordinates, selectScalingTarget } from '../DPIHelper.js';
describe('DPIHelper scaling target selection', () => {
    it('selects FWXGA for 1920x1080 (16:9)', () => {
        const target = selectScalingTarget(1920, 1080);
        assert.deepStrictEqual(target, { name: 'FWXGA', width: 1366, height: 768 });
    });
    it('selects XGA for 1024x768 (4:3) with scale=1', () => {
        const target = selectScalingTarget(1024, 768);
        assert.deepStrictEqual(target, { name: 'XGA', width: 1024, height: 768 });
        const computer = scaleCoordinates('computer', 512, 384, 1024, 768);
        assert.strictEqual(computer.scale, 1);
        assert.strictEqual(computer.x, 512);
        assert.strictEqual(computer.y, 384);
        const api = scaleCoordinates('api', 512, 384, 1024, 768);
        assert.strictEqual(api.scale, 1);
        assert.strictEqual(api.x, 512);
        assert.strictEqual(api.y, 384);
    });
    it('returns null target for 800x600', () => {
        const target = selectScalingTarget(800, 600);
        assert.strictEqual(target, null);
        const result = scaleCoordinates('computer', 400, 300, 800, 600);
        assert.strictEqual(result.scale, 1);
        assert.strictEqual(result.target, null);
        assert.strictEqual(result.x, 400);
        assert.strictEqual(result.y, 300);
    });
});
describe('DPIHelper scaleCoordinates directions', () => {
    it('converts between real and AI coordinates for 1920x1080', () => {
        const toComputer = scaleCoordinates('computer', 960, 540, 1920, 1080);
        assert.strictEqual(toComputer.x, 683);
        assert.strictEqual(toComputer.y, 384);
        assert.ok(Math.abs(toComputer.scale - 1366 / 1920) < 1e-9);
        const toApi = scaleCoordinates('api', 683, 384, 1920, 1080);
        assert.strictEqual(toApi.x, 960);
        assert.strictEqual(toApi.y, 540);
    });
    it('converts between real and AI coordinates for 3840x2160', () => {
        const toComputer = scaleCoordinates('computer', 1920, 1080, 3840, 2160);
        assert.strictEqual(toComputer.x, 683);
        assert.strictEqual(toComputer.y, 384);
        assert.ok(Math.abs(toComputer.scale - 1366 / 3840) < 1e-9);
        const toApi = scaleCoordinates('api', 683, 384, 3840, 2160);
        assert.strictEqual(toApi.x, 1920);
        assert.ok(Math.abs(toApi.y - 1080) <= 1);
    });
    it('round-trips coordinates within ±1 px', () => {
        const cases = [
            { screenWidth: 1920, screenHeight: 1080, x: 1782, y: 970 },
            { screenWidth: 3840, screenHeight: 2160, x: 3017, y: 1553 },
            { screenWidth: 1024, screenHeight: 768, x: 880, y: 612 },
            { screenWidth: 800, screenHeight: 600, x: 511, y: 377 },
        ];
        for (const sample of cases) {
            const ai = scaleCoordinates('computer', sample.x, sample.y, sample.screenWidth, sample.screenHeight);
            const real = scaleCoordinates('api', ai.x, ai.y, sample.screenWidth, sample.screenHeight);
            assert.ok(Math.abs(real.x - sample.x) <= 1, `x mismatch for ${sample.screenWidth}x${sample.screenHeight}`);
            assert.ok(Math.abs(real.y - sample.y) <= 1, `y mismatch for ${sample.screenWidth}x${sample.screenHeight}`);
        }
    });
});
