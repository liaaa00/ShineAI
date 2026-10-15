import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WindowsComputerUseProvider } from './provider.js';
import { findElementsInTree, inferElementCapability, mapUiaTree } from './uia-mapper.js';
const fixtureTree = [{
        Name: 'Sample Window',
        AutomationId: 'root-window',
        ClassName: 'SampleWnd',
        ControlType: 'ControlType.Window',
        ProcessId: 4242,
        NativeWindowHandle: 100,
        BoundingRectangle: { X: 10, Y: 20, Width: 800, Height: 600 },
        IsEnabled: true,
        IsOffscreen: false,
        IsKeyboardFocusable: true,
        HasKeyboardFocus: false,
        Patterns: [],
        Children: [{
                Name: 'Save',
                AutomationId: 'saveButton',
                ClassName: 'Button',
                ControlType: 'ControlType.Button',
                ProcessId: 4242,
                NativeWindowHandle: 101,
                BoundingRectangle: { X: 30, Y: 40, Width: 100, Height: 32 },
                IsEnabled: true,
                IsOffscreen: false,
                IsKeyboardFocusable: true,
                HasKeyboardFocus: false,
                Patterns: ['Invoke'],
                Children: [],
            }, {
                Name: 'Title',
                AutomationId: 'titleEdit',
                ClassName: 'Edit',
                ControlType: 'ControlType.Edit',
                ProcessId: 4242,
                NativeWindowHandle: 102,
                BoundingRectangle: { X: 30, Y: 88, Width: 300, Height: 32 },
                IsEnabled: true,
                IsOffscreen: false,
                IsKeyboardFocusable: true,
                HasKeyboardFocus: true,
                Patterns: ['Value'],
                Value: 'Draft',
                Children: [],
            }],
    }];
describe('Windows UIA mapper smoke test', () => {
    it('maps raw UIA tree into canonical ElementNode fields', () => {
        const tree = mapUiaTree(fixtureTree, '100');
        assert.equal(tree.length, 1);
        assert.equal(tree[0].provider, 'windows-uia-win32');
        assert.equal(tree[0].role, 'Window');
        assert.equal(tree[0].bounds?.width, 800);
        assert.equal(tree[0].children.length, 2);
        const saveButton = tree[0].children[0];
        assert.equal(saveButton.automationId, 'saveButton');
        assert.equal(saveButton.controlType, 'Button');
        assert.deepEqual(saveButton.path, [0, 0]);
        assert.equal(saveButton.capabilities.backgroundInvoke, true);
        assert.equal(saveButton.capabilities.requiresForeground, false);
        assert.ok(saveButton.supportedActions.includes('invoke'));
        assert.ok(saveButton.supportedActions.includes('click'));
        const titleEdit = tree[0].children[1];
        assert.equal(titleEdit.value, 'Draft');
        assert.equal(titleEdit.capabilities.backgroundType, true);
        assert.ok(titleEdit.supportedActions.includes('setValue'));
    });
    it('finds elements by serializable selectors', () => {
        const tree = mapUiaTree(fixtureTree, '100');
        assert.equal(findElementsInTree(tree, { automationId: 'saveButton' })[0]?.name, 'Save');
        assert.equal(findElementsInTree(tree, { name: 'Title', controlType: 'Edit' })[0]?.automationId, 'titleEdit');
        assert.equal(findElementsInTree(tree, { path: '0/1' })[0]?.automationId, 'titleEdit');
        assert.equal(findElementsInTree(tree, { containsText: 'dra' })[0]?.automationId, 'titleEdit');
        assert.equal(findElementsInTree(tree, { bounds: { x: 30, y: 40, width: 100, height: 32 } })[0]?.automationId, 'saveButton');
    });
    it('marks OCR/unknown controls as foreground or vision fallback instead of pretending success', () => {
        const capability = inferElementCapability({ source: 'ocr', controlType: 'Text', patterns: [], isEnabled: true });
        assert.equal(capability.backgroundInvoke, false);
        assert.equal(capability.requiresForeground, true);
        assert.equal(capability.visionFallbackNeeded, true);
        assert.ok(capability.unsupportedReasons.includes('vision_fallback_needed'));
    });
    it('reports provider action capabilities with foreground-only hotkey explicitly marked', () => {
        const provider = new WindowsComputerUseProvider();
        const report = provider.getCapabilityReport();
        const hotkey = report.actionMatrix.find(item => item.action === 'hotkey');
        assert.ok(hotkey);
        assert.equal(hotkey.background, false);
        assert.equal(hotkey.requiresForeground, true);
        assert.equal(report.provider, 'windows-uia-win32');
    });
});
