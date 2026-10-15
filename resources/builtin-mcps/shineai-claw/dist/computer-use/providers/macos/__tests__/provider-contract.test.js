import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMacOSCoreProvider, registerMacOSCoreProvider } from '../contract-adapter.js';
import { MACOS_AX_CORE_PROVIDER_ID } from '../schema.js';
const buttonNode = {
    provider: 'macos-ax',
    id: 'ax_2',
    role: 'AXButton',
    subrole: null,
    label: 'Save',
    title: 'Save',
    value: null,
    description: 'Save document',
    identifier: 'save-button',
    keyboardShortcut: '⌘S',
    bounds: { x: 720, y: 24, width: 64, height: 28 },
    enabled: true,
    actionable: true,
    parentId: 'ax_1',
    path: [0, 2],
    selector: { pid: 4242, AXIdentifier: 'save-button', AXRole: 'AXButton' },
    children: [],
};
const textNode = {
    provider: 'macos-ax',
    id: 'ax_3',
    role: 'AXTextArea',
    subrole: null,
    label: 'Body',
    title: null,
    value: 'old',
    description: null,
    identifier: 'body-text',
    keyboardShortcut: null,
    bounds: { x: 40, y: 80, width: 720, height: 480 },
    enabled: true,
    actionable: true,
    parentId: 'ax_1',
    path: [0, 3],
    selector: { pid: 4242, AXIdentifier: 'body-text', AXRole: 'AXTextArea' },
    children: [],
};
const rootNode = {
    provider: 'macos-ax',
    id: 'ax_1',
    role: 'AXWindow',
    subrole: null,
    label: 'Draft',
    title: 'Draft',
    value: null,
    description: null,
    identifier: 'main-window',
    keyboardShortcut: null,
    bounds: { x: 10, y: 20, width: 800, height: 600 },
    enabled: true,
    actionable: false,
    parentId: null,
    path: [0],
    selector: { pid: 4242, AXIdentifier: 'main-window', AXRole: 'AXWindow' },
    children: [buttonNode, textNode],
};
class FakeMacOSProviderSource {
    invokeCount = 0;
    setValueCount = 0;
    selectMenuCount = 0;
    async getCapabilityReport() {
        return {
            provider: 'macos-ax',
            platform: 'win32',
            supported: true,
            backgroundRead: true,
            backgroundInvoke: true,
            backgroundType: true,
            requiresForeground: false,
            visionFallbackNeeded: false,
            permissionsRequired: [
                {
                    name: 'Accessibility',
                    required: true,
                    status: 'granted',
                    requiredFor: ['AX tree', 'AXPress', 'AXSetValue'],
                    notes: 'fake granted for contract test',
                },
                {
                    name: 'Screen Recording',
                    required: false,
                    status: 'missing',
                    requiredFor: ['vision fallback', 'verification screenshot'],
                    notes: 'fake missing to prove degraded fallback shape is visible',
                },
                {
                    name: 'Automation',
                    required: false,
                    status: 'unknown',
                    requiredFor: ['JXA selectMenu'],
                    notes: 'not preflightable in Windows contract test',
                },
            ],
            operations: {
                listApps: { supported: true, backgroundCapable: true, requiresForeground: false, fallback: 'none', notes: 'fake' },
                listWindows: { supported: true, backgroundCapable: true, requiresForeground: false, fallback: 'none', notes: 'fake' },
                readTree: { supported: true, backgroundCapable: true, requiresForeground: false, fallback: 'vision', notes: 'fake' },
                findElement: { supported: true, backgroundCapable: true, requiresForeground: false, fallback: 'vision', notes: 'fake' },
                focus: { supported: true, backgroundCapable: false, requiresForeground: true, fallback: 'hid', notes: 'fake' },
                press: { supported: true, backgroundCapable: true, requiresForeground: false, fallback: 'hid', notes: 'fake' },
                setValue: { supported: true, backgroundCapable: true, requiresForeground: false, fallback: 'hid', notes: 'fake' },
                selectMenu: { supported: true, backgroundCapable: false, requiresForeground: true, fallback: 'jxa', notes: 'fake' },
                visionFallback: { supported: true, backgroundCapable: false, requiresForeground: true, fallback: 'vision', notes: 'fake' },
            },
        };
    }
    async listApps() {
        return ok([
            { provider: 'macos-ax', pid: 4242, bundleId: 'com.example.TextEditLike', processName: 'TextEditLike', isActive: true },
        ]);
    }
    async listWindows(_selector = {}) {
        return ok([
            {
                provider: 'macos-ax',
                windowId: 1001,
                pid: 4242,
                title: 'Draft',
                bounds: { x: 10, y: 20, width: 800, height: 600 },
                isMinimized: false,
                isFrontmost: true,
            },
        ]);
    }
    async readTree() {
        return ok({
            provider: 'macos-ax',
            snapshotId: 'snap_fake_1',
            app: { pid: 4242, bundleId: 'com.example.TextEditLike', processName: 'TextEditLike' },
            window: { title: 'Draft', bounds: { x: 10, y: 20, width: 800, height: 600 }, windowId: 1001 },
            screenshotPath: '/tmp/fake.png',
            annotatedPath: '/tmp/fake.annotated.png',
            warnings: ['fake_bridge'],
            elements: [rootNode],
            flatElements: [rootNode, buttonNode, textNode],
        });
    }
    async findElement(selector) {
        const identifier = selector.AXIdentifier ?? selector.identifier;
        if (identifier === 'save-button')
            return ok({ snapshot: (await this.readTree()).data, element: buttonNode });
        if (identifier === 'body-text')
            return ok({ snapshot: (await this.readTree()).data, element: textNode });
        return ok(null);
    }
    async executeAction(action) {
        if (action.name === 'invoke') {
            this.invokeCount += 1;
            return ok(actionResult({ action: 'invoke', method: 'daemon.axPress', target: buttonNode }));
        }
        if (action.name === 'setValue') {
            this.setValueCount += 1;
            return ok(actionResult({ action: 'setValue', method: 'daemon.axSetValue', target: textNode, observed: { value: action.value } }));
        }
        if (action.name === 'selectMenu') {
            this.selectMenuCount += 1;
            return ok(actionResult({ action: 'selectMenu', method: 'jxa.systemEventsMenu', requiresForeground: true, visionFallbackNeeded: false, raw: { path: action.menuPath } }));
        }
        return ok(actionResult({ action: action.name, method: 'unsupported', ok: false }));
    }
}
function ok(data) {
    return { ok: true, platform: 'win32', data, warnings: [] };
}
function actionResult(input) {
    return {
        provider: 'macos-ax',
        ok: input.ok ?? true,
        action: input.action,
        method: input.method,
        requiresForeground: input.requiresForeground ?? false,
        visionFallbackNeeded: input.visionFallbackNeeded ?? false,
        warnings: [],
        verification: {
            status: input.ok === false ? 'failure' : 'success',
            strategy: input.action === 'setValue' ? 'ax-value' : 'ax-tree',
            checks: ['fake action accepted', 'fake state verification accepted'],
            observed: input.observed,
        },
        target: input.target,
        raw: input.raw,
    };
}
function createRegistryHarness() {
    const providers = new Map();
    return {
        register(provider) {
            assert.equal(provider.id, MACOS_AX_CORE_PROVIDER_ID);
            assert.equal(typeof provider.getCapabilities, 'function');
            assert.equal(typeof provider.getAppState, 'function');
            assert.equal(typeof provider.getAppTree, 'function');
            assert.equal(typeof provider.invokeElement, 'function');
            providers.set(provider.id, provider);
        },
        get(id) {
            return providers.get(id);
        },
    };
}
describe('MacOSCoreProviderAdapter contract', () => {
    it('can be registered by ProviderRegistry-like composition and reports capability shape', async () => {
        const provider = createMacOSCoreProvider({ provider: new FakeMacOSProviderSource() });
        const registry = createRegistryHarness();
        registerMacOSCoreProvider(registry, provider);
        const resolved = registry.get(MACOS_AX_CORE_PROVIDER_ID);
        assert.ok(resolved);
        const caps = await resolved.getCapabilities();
        assert.equal(caps.providerId, MACOS_AX_CORE_PROVIDER_ID);
        assert.equal(caps.operations.getAppTree.verification, 'ax-tree');
        assert.equal(caps.operations.invokeElement.fallback, 'hid');
        assert.equal(caps.operations.selectMenu.requiresForeground, true);
        assert.equal(caps.permissions.find(p => p.name === 'Automation')?.state, 'unknown');
    });
    it('maps provider-local apps/windows/tree to Core state and ElementNode schema', async () => {
        const provider = createMacOSCoreProvider({ provider: new FakeMacOSProviderSource() });
        const apps = await provider.listApps();
        assert.deepEqual(apps[0], {
            providerId: 'macos-ax',
            pid: 4242,
            bundleId: 'com.example.TextEditLike',
            name: 'TextEditLike',
            isActive: true,
        });
        const state = await provider.getAppState({ processName: 'TextEditLike' });
        assert.equal(state.blocked, false);
        assert.equal(state.activeWindow?.title, 'Draft');
        const tree = await provider.getAppTree({ pid: 4242 });
        assert.equal(tree.providerId, 'macos-ax');
        assert.equal(tree.snapshotId, 'snap_fake_1');
        assert.equal(tree.elements[0].children.length, 2);
        assert.equal(tree.flatElements.find(e => e.identifier === 'save-button')?.role, 'button');
        assert.equal(tree.flatElements.find(e => e.identifier === 'save-button')?.nativeRole, 'AXButton');
    });
    it('maps findElement/invokeElement/setValue/selectMenu with verification and fallback reports', async () => {
        const source = new FakeMacOSProviderSource();
        const provider = createMacOSCoreProvider({ provider: source });
        const found = await provider.findElement({ AXIdentifier: 'save-button' });
        assert.equal(found?.name, 'Save');
        const invoked = await provider.invokeElement({ AXIdentifier: 'save-button' });
        assert.equal(invoked.status, 'success');
        assert.equal(invoked.method, 'daemon.axPress');
        assert.equal(invoked.verification.ok, true);
        assert.equal(invoked.fallback.used, false);
        const set = await provider.setValue({ AXIdentifier: 'body-text' }, 'hello');
        assert.equal(set.status, 'success');
        assert.equal(set.method, 'daemon.axSetValue');
        assert.equal(set.verification.strategy, 'state-read');
        assert.deepEqual(set.verification.observed, { value: 'hello' });
        const menu = await provider.selectMenu({ processName: 'TextEditLike', path: ['File', 'Save'] });
        assert.equal(menu.status, 'success');
        assert.equal(menu.method, 'jxa.systemEventsMenu');
        assert.equal(menu.fallback.used, true);
        assert.equal(menu.fallback.kind, 'jxa');
        assert.equal(menu.fallback.requiresForeground, true);
        assert.equal(source.invokeCount, 1);
        assert.equal(source.setValueCount, 1);
        assert.equal(source.selectMenuCount, 1);
    });
});
