import { ProviderRegistry } from '../registry.js';
import { ComputerUseRuntime } from './runtime.js';
import { createStubComputerUseProvider } from './stub-provider.js';
const smokeAction = {
    type: 'click',
    target: {
        app: { appId: 'smoke-app' },
        role: 'button',
        label: 'Submit',
    },
};
function hiddenAfterInvokeElement(providerId) {
    return {
        id: `${providerId}-submit-hidden`,
        providerId,
        source: 'dom',
        role: 'button',
        label: 'Submit',
        name: 'Submit',
        text: 'Submit',
        bounds: { x: 100, y: 200, width: 120, height: 36 },
        isEnabled: true,
        isVisible: false,
        isActionable: true,
        supportedActions: ['click', 'invoke'],
    };
}
export function createPostMergeSmokeRegistry(slots = {}) {
    const registry = new ProviderRegistry();
    registry.register(slots.browser ?? createStubComputerUseProvider({
        id: 'stub-browser-cdp',
        kind: 'browser',
        platform: 'browser',
        displayName: 'Stub Browser DOM/CDP Provider',
        priority: 10,
        permissions: ['remote-debugging-port-or-playwright-session'],
    }));
    registry.register(slots.windowsAccessibility ?? createStubComputerUseProvider({
        id: 'stub-windows-uia',
        kind: 'os-accessibility',
        platform: 'windows',
        displayName: 'Stub Windows UIA/Win32 Provider',
        source: ['uia', 'win32', 'iaccessible'],
        priority: 7,
        permissions: ['uiaccess-or-desktop-session'],
    }));
    registry.register(slots.macosAccessibility ?? createStubComputerUseProvider({
        id: 'stub-macos-ax',
        kind: 'os-accessibility',
        platform: 'macos',
        displayName: 'Stub macOS AX Provider',
        source: ['ax', 'applescript', 'jxa'],
        priority: 6,
        permissions: ['accessibility', 'screen-recording'],
    }));
    registry.register(slots.appBridge ?? createStubComputerUseProvider({
        id: 'stub-app-bridge',
        kind: 'app-bridge',
        platform: 'cross-platform',
        displayName: 'Stub App-specific Bridge Provider',
        priority: 3,
    }));
    registry.register(slots.visionFallback ?? createStubComputerUseProvider({
        id: 'stub-vision-ocr',
        kind: 'vision-ocr',
        platform: 'cross-platform',
        displayName: 'Stub Vision/OCR Fallback Provider',
        priority: 2,
        supportedActions: ['readState', 'invoke', 'click'],
        verificationSupport: ['none', 'visible-state'],
    }));
    registry.register(slots.hidFallback ?? createStubComputerUseProvider({
        id: 'stub-hid',
        kind: 'hid',
        platform: 'cross-platform',
        displayName: 'Stub HID Fallback Provider',
        priority: 1,
        supportedActions: ['click', 'typeText', 'hotkey', 'scroll'],
        verificationSupport: ['none'],
        requiresForeground: true,
    }));
    return registry;
}
export function createFailingBrowserSmokeRegistry(slots = {}) {
    return createPostMergeSmokeRegistry({
        ...slots,
        browser: createStubComputerUseProvider({
            id: 'stub-browser-cdp-fails-verify',
            kind: 'browser',
            platform: 'browser',
            displayName: 'Stub Browser Provider with failing verification',
            priority: 10,
            afterInvokeElement: hiddenAfterInvokeElement('stub-browser-cdp-fails-verify'),
        }),
    });
}
/**
 * Runs the core-only post-merge smoke path with stubs by default.
 *
 * Concrete providers accepted from Windows/macOS/Browser agents can be supplied
 * through `providers`; when omitted, deterministic stub providers verify the
 * Registry/Runtime integration without touching real desktop state or MCP tools.
 */
export async function runPostMergeCoreSmokeHarness(options = {}) {
    const registry = createPostMergeSmokeRegistry(options.providers);
    const runtime = new ComputerUseRuntime(registry);
    const action = options.action ?? smokeAction;
    const capabilityReport = await runtime.capabilityReport({ appId: 'smoke-app' });
    const routeReport = await runtime.route(action);
    const actionReport = await runtime.executeAction(action);
    let fallbackReport;
    if (options.includeFailingBrowserScenario ?? true) {
        const failingRuntime = new ComputerUseRuntime(createFailingBrowserSmokeRegistry({
            windowsAccessibility: options.providers?.windowsAccessibility,
            macosAccessibility: options.providers?.macosAccessibility,
            appBridge: options.providers?.appBridge,
            visionFallback: options.providers?.visionFallback,
            hidFallback: options.providers?.hidFallback,
        }));
        fallbackReport = await failingRuntime.executeAction(action);
    }
    return {
        registry,
        runtime,
        capabilityReport,
        routeReport,
        actionReport,
        fallbackReport,
    };
}
export const postMergeSmokeAction = smokeAction;
