import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { embedAnnotatedScreenshot, imageContentFromFile } from '../SoMRenderer.js';
const ONE_PIXEL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nXHcAAAAASUVORK5CYII=';
describe('SoMRenderer', () => {
    let tempDir = '';
    let rawPath = '';
    let annotatedPath = '';
    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'som-renderer-'));
        rawPath = path.join(tempDir, 'raw.png');
        annotatedPath = path.join(tempDir, 'annotated.png');
        const buffer = Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64');
        await fs.writeFile(rawPath, buffer);
        await fs.writeFile(annotatedPath, buffer);
    });
    afterEach(async () => {
        if (tempDir) {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('reads image file into MCP image content', async () => {
        const content = await imageContentFromFile(rawPath);
        assert.strictEqual(content.type, 'image');
        assert.strictEqual(content.mimeType, 'image/png');
        assert.ok(content.data.length > 0);
    });
    it('embeds annotated screenshot as [text, image, text]', async () => {
        const blocks = await embedAnnotatedScreenshot({
            rawPath,
            annotatedPath,
            snapshotId: 'snap_001',
            applicationName: 'Preview',
            windowTitle: 'Demo Window',
            warnings: ['ax_partial'],
            uiElements: [
                { id: 'elem_3', role: 'AXButton', label: 'OK', is_actionable: true },
                { id: 'elem_4', role: 'AXStaticText', label: 'Read only', is_actionable: false },
            ],
        });
        assert.strictEqual(blocks.length, 3);
        assert.deepStrictEqual(blocks.map((item) => item.type), ['text', 'image', 'text']);
        const summary = blocks[0];
        assert.strictEqual(summary.type, 'text');
        assert.match(summary.text, /snapshot_id: snap_001/);
        assert.match(summary.text, /application: Preview/);
        assert.match(summary.text, /window: Demo Window/);
        const image = blocks[1];
        assert.strictEqual(image.type, 'image');
        assert.strictEqual(image.mimeType, 'image/png');
        assert.ok(image.data.length > 0);
        const elements = blocks[2];
        assert.strictEqual(elements.type, 'text');
        assert.match(elements.text, /Actionable elements:/);
        assert.match(elements.text, /\[elem_3\] AXButton "OK"/);
        assert.doesNotMatch(elements.text, /elem_4/);
    });
    it('throws friendly error when image file does not exist', async () => {
        const missing = path.join(tempDir, 'missing.png');
        await assert.rejects(async () => {
            await imageContentFromFile(missing);
        }, /Image file not found or unreadable/);
        await assert.rejects(async () => {
            await embedAnnotatedScreenshot({
                rawPath: missing,
                annotatedPath: path.join(tempDir, 'missing-annotated.png'),
                snapshotId: 'snap_missing',
                uiElements: [],
            });
        }, /Image file not found or unreadable/);
    });
});
