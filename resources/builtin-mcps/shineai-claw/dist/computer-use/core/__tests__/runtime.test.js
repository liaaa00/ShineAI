import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderRegistry } from '../../registry.js';
import { CapabilityReportSchema, } from '../../types.js';
import { ComputerUseRuntime } from '../runtime.js';
const baseElement = {
    id: 'submit-button',
    source: 'dom',
    role: 'button',
    label: 'Submit',
    isEnabled: true,
    isVisible: true,
    isActionable: true,
    supportedActions: ['click', 'invoke'],
};
function appState(providerId, kind, platform = 'browser') {
    return {
        appId: 'app-1',
        providerId,
        providerKind: kind,
        platform,
        name: 'Test App',
        isRunning: true,
        windows: [],
        capturedAt: Date.now(),
    };
}
function capability(args) {
    return CapabilityReportSchema.parse({
        providerId: args.id,
        providerKind: args.kind,
        platform: args.platform ?? 'browser',
        source: args.kind === 'browser' ? ['dom', 'cdp'] : args.kind === 'os-accessibility' ? ['uia', 'ax'] : [args.kind === 'hid' ? 'hid' : 'vision'],
        priority: args.priority ?? 0,
        backgroundRead: args.kind !== 'hid',
        backgroundInvoke: args.kind === 'browser' || args.kind === 'os-accessibility' || args.kind === 'app-bridge',
        backgroundType: args.kind === 'browser' || args.kind === 'os-accessibility' || args.kind === 'app-bridge',
        requiresForeground: args.kind === 'hid',
        visionFallbackNeeded: args.kind === 'vision-ocr' || args.kind === 'hid',
        supportedActions: args.actions ?? ['readState', 'click', 'invoke', 'setValue', 'typeText'],
        verificationSupport: args.verification ?? ['none', 'read', 'compare', 'visible-state', 'dom-tree'],
        supportsElementTree: args.kind !== 'hid',
        supportsSelectorLookup: args.kind !== 'hid',
        supportsWindowState: args.kind !== 'hid',
        permissions: [],
        limitations: [],
        confidence: args.kind === 'hid' ? 0.4 : 0.95,
    });
}
function provider(args) {
    const cap = capability(args);
    return {
        id: args.id,
        kind: args.kind,
        platform: args.platform ?? 'browser',
        priority: args.priority,
        source: cap.source,
        listApps: async () => [appState(args.id, args.kind, args.platform)],
        getAppState: async () => appState(args.id, args.kind, args.platform),
        getAppTree: async () => ({ ...baseElement, providerId: args.id }),
        findElement: args.findElement ?? (async () => ({ ...baseElement, providerId: args.id })),
        invokeElement: args.invokeElement ?? (async (element, action) => ({
            ok: true,
            actionId: action?.id,
            actionType: action?.type ?? 'invoke',
            providerId: args.id,
            providerKind: args.kind,
            method: `${args.kind}.invoke`,
            targetElement: element,
            changed: true,
            warnings: [],
        })),
        setValue: async (element, value) => ({
            ok: true,
            actionType: 'setValue',
            providerId: args.id,
            providerKind: args.kind,
            method: `${args.kind}.setValue`,
            targetElement: { ...element, value },
            changed: true,
            warnings: [],
        }),
        selectMenu: async () => ({
            ok: true,
            actionType: 'selectMenu',
            providerId: args.id,
            providerKind: args.kind,
            method: `${args.kind}.selectMenu`,
            changed: true,
            warnings: [],
        }),
        getCapabilities: async () => cap,
    };
}
describe('ComputerUseRuntime provider routing', () => {
    it('orders providers by Browser > OS Accessibility > App Bridge > Vision/OCR > HID', async () => {
        const registry = new ProviderRegistry();
        registry.register(provider({ id: 'hid', kind: 'hid', actions: ['click'] }));
        registry.register(provider({ id: 'vision', kind: 'vision-ocr', actions: ['click'] }));
        registry.register(provider({ id: 'bridge', kind: 'app-bridge', actions: ['click'] }));
        registry.register(provider({ id: 'uia', kind: 'os-accessibility', actions: ['click'] }));
        registry.register(provider({ id: 'browser', kind: 'browser', actions: ['click'] }));
        const candidates = await registry.route({
            type: 'click',
            target: { role: 'button', label: 'Submit', app: { appId: 'app-1' } },
        });
        assert.deepStrictEqual(candidates.map((candidate) => candidate.provider.id), [
            'browser',
            'uia',
            'bridge',
            'vision',
            'hid',
        ]);
    });
    it('executes semantic action and verifies the post-action visible state', async () => {
        const registry = new ProviderRegistry();
        registry.register(provider({ id: 'browser', kind: 'browser', actions: ['click'] }));
        const runtime = new ComputerUseRuntime(registry);
        const report = await runtime.executeAction({
            type: 'click',
            target: { role: 'button', label: 'Submit', app: { appId: 'app-1' } },
        });
        assert.equal(report.ok, true);
        assert.equal(report.providerId, 'browser');
        assert.equal(report.result?.ok, true);
        assert.equal(report.verification?.ok, true);
        assert.equal(report.verification?.mode, 'visible-state');
    });
    it('returns canonical verification failure with fallback hints', async () => {
        let invoked = false;
        const registry = new ProviderRegistry();
        registry.register(provider({
            id: 'browser',
            kind: 'browser',
            actions: ['click'],
            findElement: async () => ({
                ...baseElement,
                providerId: 'browser',
                isVisible: !invoked,
            }),
            invokeElement: async (element, action) => {
                invoked = true;
                return {
                    ok: true,
                    actionId: action?.id,
                    actionType: action?.type ?? 'click',
                    providerId: 'browser',
                    providerKind: 'browser',
                    method: 'dom.click',
                    targetElement: element,
                    changed: true,
                    warnings: [],
                };
            },
        }));
        registry.register(provider({ id: 'vision', kind: 'vision-ocr', actions: ['click'], verification: ['visible-state'] }));
        registry.register(provider({ id: 'hid', kind: 'hid', actions: ['click'], verification: ['none'] }));
        const runtime = new ComputerUseRuntime(registry);
        const report = await runtime.executeAction({
            type: 'click',
            target: { role: 'button', label: 'Submit', app: { appId: 'app-1' } },
        });
        assert.equal(report.ok, false);
        assert.equal(report.phase, 'verify');
        assert.equal(report.error?.code, 'verification_failed');
        assert.equal(report.fallbackSuggested, true);
        assert.deepStrictEqual(report.fallbackProviders, ['vision', 'hid']);
    });
});
