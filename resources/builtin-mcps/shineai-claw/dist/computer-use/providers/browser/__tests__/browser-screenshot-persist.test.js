import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { persistBrowserScreenshot } from '../tools.js';
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const JPEG_1X1 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJoA/9k=';
function screenshotResult(overrides = {}) {
    return {
        ok: true,
        provider: 'browser',
        method: 'cdp-page',
        url: 'https://fixture.local/form',
        title: 'Fixture Form',
        targetId: 'page_1',
        mimeType: 'image/png',
        byteLength: Buffer.from(PNG_1X1, 'base64').byteLength,
        requiresForeground: false,
        data: PNG_1X1,
        ...overrides,
    };
}
test('persistBrowserScreenshot writes PNG to savePath and returns desktop-style text', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'shineai-browser-ss-'));
    const savePath = join(dir, 'nested', 'page.png');
    try {
        const persisted = await persistBrowserScreenshot(screenshotResult(), savePath);
        const bytes = await readFile(persisted.path);
        assert.equal(persisted.path, savePath);
        assert.equal(persisted.meta.path, savePath);
        assert.equal(persisted.meta.savePath, savePath);
        assert.equal(bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
        assert.match(persisted.text, /^Screenshot saved: /);
        assert.equal(persisted.text.includes(savePath), true);
        assert.match(persisted.text, /Capture: url=https:\/\/fixture.local\/form title=Fixture Form method=cdp-page byteLength=\d+ requiresForeground=false/);
        assert.match(persisted.text, /NEXT: The image is attached to this result/);
    }
    finally {
        await rm(dir, { recursive: true, force: true });
    }
});
test('persistBrowserScreenshot writes JPEG to temp when savePath omitted', async () => {
    const frozen = new Date(2026, 2, 27, 16, 5, 9, 42);
    const expectedName = 'shineai_browser_ss_20260327_160509_042.jpg';
    const expectedPath = join(tmpdir(), expectedName);
    try {
        const persisted = await persistBrowserScreenshot(screenshotResult({
            mimeType: 'image/jpeg',
            byteLength: Buffer.from(JPEG_1X1, 'base64').byteLength,
            data: JPEG_1X1,
        }), undefined, frozen);
        const bytes = await readFile(persisted.path);
        assert.equal(persisted.path, expectedPath);
        assert.equal(bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xd8])), true);
        assert.equal(persisted.text.includes(`Screenshot saved: ${expectedPath}`), true);
        assert.equal(persisted.meta.path, expectedPath);
        assert.equal(persisted.meta.savePath, expectedPath);
    }
    finally {
        await rm(expectedPath, { force: true });
    }
});
