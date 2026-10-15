import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPostMergeSmokeRegistry, runPostMergeCoreSmokeHarness } from '../core/post-merge-smoke.js';
import { ComputerUseRuntime } from '../core/runtime.js';
function assertCapabilityShape(report) {
    assert.equal(typeof report.providerId, 'string');
    assert.equal(typeof report.providerKind, 'string');
    assert.equal(typeof report.platform, 'string');
    assert.equal(typeof report.backgroundRead, 'boolean');
    assert.equal(typeof report.backgroundInvoke, 'boolean');
    assert.equal(typeof report.backgroundType, 'boolean');
    assert.equal(typeof report.requiresForeground, 'boolean');
    assert.equal(typeof report.visionFallbackNeeded, 'boolean');
    assert.ok(Array.isArray(report.supportedActions));
    assert.ok(report.supportedActions.length > 0);
    assert.ok(Array.isArray(report.verificationSupport));
    assert.ok(report.verificationSupport.length > 0);
}
function assertCanonicalActionReport(report) {
    assert.equal(report.ok, true);
    assert.equal(report.status, 'success');
    assert.equal(report.phase, 'execute');
    assert.equal(report.providerId, 'stub-browser-cdp');
    assert.equal(report.providerKind, 'browser');
    assert.ok(report.result);
    assert.equal(report.result?.ok, true);
    assert.equal(report.result?.providerId, 'stub-browser-cdp');
    assert.equal(report.result?.providerKind, 'browser');
    assert.equal(report.result?.actionType, 'click');
    assert.ok(report.result?.targetElement);
    assert.ok(report.result?.verification);
    assert.equal(report.result?.verification?.ok, true);
    assert.equal(report.result?.verification?.mode, 'visible-state');
    assert.ok(report.verification);
    assert.equal(report.verification?.ok, true);
    assert.ok(Array.isArray(report.route));
    assert.ok(report.route.length >= 1);
    assert.ok(Array.isArray(report.capabilities));
    assert.ok(report.capabilities.length >= 1);
    assert.equal(report.fallbackSuggested, false);
}
describe('post-merge core smoke harness', () => {
    it('composes stub browser/windows/macos/app-bridge/fallback providers in runtime priority order', async () => {
        const registry = createPostMergeSmokeRegistry();
        const candidates = await registry.route({
            type: 'click',
            target: {
                app: { appId: 'smoke-app' },
                role: 'button',
                label: 'Submit',
            },
        });
        assert.deepStrictEqual(candidates.map((candidate) => candidate.provider.id), [
            'stub-browser-cdp',
            'stub-windows-uia',
            'stub-macos-ax',
            'stub-app-bridge',
            'stub-vision-ocr',
            'stub-hid',
        ]);
        assert.deepStrictEqual(candidates.map((candidate) => candidate.provider.kind), [
            'browser',
            'os-accessibility',
            'os-accessibility',
            'app-bridge',
            'vision-ocr',
            'hid',
        ]);
    });
    it('returns complete canonical capability, action result, and verification reports', async () => {
        const harness = await runPostMergeCoreSmokeHarness({ includeFailingBrowserScenario: false });
        assert.equal(harness.capabilityReport.ok, true);
        assert.equal(harness.capabilityReport.phase, 'capability');
        assert.equal(harness.capabilityReport.capabilities.length, 6);
        for (const report of harness.capabilityReport.capabilities) {
            assertCapabilityShape(report);
        }
        assert.equal(harness.routeReport.ok, true);
        assert.equal(harness.routeReport.providerId, 'stub-browser-cdp');
        assert.equal(harness.routeReport.route[0]?.providerId, 'stub-browser-cdp');
        assert.equal(harness.routeReport.route[1]?.providerId, 'stub-windows-uia');
        assert.equal(harness.routeReport.route[2]?.providerId, 'stub-macos-ax');
        assertCanonicalActionReport(harness.actionReport);
    });
    it('returns canonical fallback recommendation when post-action verification fails', async () => {
        const harness = await runPostMergeCoreSmokeHarness({ includeFailingBrowserScenario: true });
        const fallbackReport = harness.fallbackReport;
        assert.ok(fallbackReport);
        assert.equal(fallbackReport.ok, false);
        assert.equal(fallbackReport.status, 'failure');
        assert.equal(fallbackReport.phase, 'verify');
        assert.equal(fallbackReport.providerId, 'stub-browser-cdp-fails-verify');
        assert.equal(fallbackReport.error?.code, 'verification_failed');
        assert.equal(fallbackReport.fallbackSuggested, true);
        assert.deepStrictEqual(fallbackReport.fallbackProviders, ['stub-vision-ocr', 'stub-hid']);
        assert.ok(fallbackReport.result);
        assert.equal(fallbackReport.result?.ok, false);
        assert.equal(fallbackReport.result?.fallbackSuggested, true);
        assert.ok(fallbackReport.result?.fallbackReason);
        assert.ok(fallbackReport.verification);
        assert.equal(fallbackReport.verification?.ok, false);
        assert.equal(fallbackReport.verification?.mode, 'visible-state');
    });
    it('can be driven through ComputerUseRuntime without touching existing MCP tools', async () => {
        const runtime = new ComputerUseRuntime(createPostMergeSmokeRegistry());
        const report = await runtime.executeAction({
            type: 'setValue',
            target: {
                app: { appId: 'smoke-app' },
                role: 'textbox',
                label: 'Search',
            },
            value: 'shineai smoke',
        });
        assert.equal(report.ok, true);
        assert.equal(report.providerId, 'stub-browser-cdp');
        assert.equal(report.result?.actionType, 'setValue');
        assert.equal(report.verification?.mode, 'compare');
        assert.equal(report.verification?.ok, true);
    });
});
