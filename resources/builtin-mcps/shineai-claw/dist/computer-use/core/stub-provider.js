import { CapabilityReportSchema } from '../types.js';
function defaultSources(kind) {
    switch (kind) {
        case 'browser':
            return ['dom', 'cdp'];
        case 'os-accessibility':
            return ['uia', 'ax'];
        case 'app-bridge':
            return ['app-bridge'];
        case 'vision-ocr':
            return ['vision', 'ocr', 'snapshot'];
        case 'hid':
            return ['hid'];
        case 'mock':
            return ['unknown'];
    }
}
function defaultActions(kind) {
    if (kind === 'hid') {
        return ['click', 'typeText', 'hotkey', 'scroll'];
    }
    if (kind === 'vision-ocr') {
        return ['readState', 'click', 'invoke'];
    }
    return ['readState', 'invoke', 'click', 'setValue', 'typeText', 'select', 'selectMenu', 'focus'];
}
function defaultVerification(kind) {
    if (kind === 'hid')
        return ['none'];
    if (kind === 'vision-ocr')
        return ['none', 'visible-state'];
    return ['none', 'read', 'compare', 'visible-state', 'dom-tree'];
}
function defaultElement(providerId, kind) {
    return {
        id: `${providerId}-submit`,
        providerId,
        source: defaultSources(kind)[0] ?? 'unknown',
        role: 'button',
        label: 'Submit',
        name: 'Submit',
        text: 'Submit',
        bounds: { x: 100, y: 200, width: 120, height: 36 },
        isEnabled: true,
        isVisible: true,
        isActionable: true,
        supportedActions: ['click', 'invoke'],
        selectorHints: [{ role: 'button', label: 'Submit' }],
    };
}
function defaultState(options, root) {
    return {
        appId: `${options.id}-app`,
        providerId: options.id,
        providerKind: options.kind,
        platform: options.platform,
        name: options.appName ?? `${options.displayName ?? options.id} Demo App`,
        isRunning: true,
        isActive: options.requiresForeground === true,
        windows: [
            {
                id: `${options.id}-window`,
                appId: `${options.id}-app`,
                title: `${options.displayName ?? options.id} Window`,
                bounds: { x: 0, y: 0, width: 1280, height: 800 },
                isFocused: options.requiresForeground === true,
                isFrontmost: options.requiresForeground === true,
                isMinimized: false,
            },
        ],
        root,
        capturedAt: Date.now(),
    };
}
function defaultCapability(options) {
    const kind = options.kind;
    return CapabilityReportSchema.parse({
        providerId: options.id,
        providerKind: kind,
        platform: options.platform,
        source: options.source ?? defaultSources(kind),
        priority: options.priority ?? 0,
        backgroundRead: options.backgroundRead ?? kind !== 'hid',
        backgroundInvoke: options.backgroundInvoke ?? (kind === 'browser' || kind === 'os-accessibility' || kind === 'app-bridge'),
        backgroundType: options.backgroundType ?? (kind === 'browser' || kind === 'os-accessibility' || kind === 'app-bridge'),
        requiresForeground: options.requiresForeground ?? (kind === 'hid'),
        visionFallbackNeeded: options.visionFallbackNeeded ?? (kind === 'vision-ocr' || kind === 'hid'),
        supportedActions: options.supportedActions ?? defaultActions(kind),
        verificationSupport: options.verificationSupport ?? defaultVerification(kind),
        supportsElementTree: options.supportsElementTree ?? kind !== 'hid',
        supportsSelectorLookup: options.supportsSelectorLookup ?? kind !== 'hid',
        supportsWindowState: options.supportsWindowState ?? kind !== 'hid',
        permissions: options.permissions ?? [],
        limitations: options.limitations ?? [],
        confidence: options.confidence ?? (kind === 'hid' ? 0.45 : kind === 'vision-ocr' ? 0.65 : 0.95),
        ...options.capabilityOverrides,
    });
}
/**
 * Creates a deterministic provider for registry composition examples and smoke tests.
 *
 * This helper deliberately lives in core and does not import any real Windows,
 * macOS, Browser, screenshot/OCR, or HID provider implementation. Post-merge
 * harnesses can swap each stub with the accepted concrete provider while keeping
 * the same registry/runtime assertions.
 */
export function createStubComputerUseProvider(options) {
    const elementBeforeInvoke = options.element ?? defaultElement(options.id, options.kind);
    let currentElement = elementBeforeInvoke;
    let invoked = false;
    return {
        id: options.id,
        kind: options.kind,
        platform: options.platform,
        displayName: options.displayName,
        priority: options.priority,
        source: options.source ?? defaultSources(options.kind),
        listApps(context) {
            return options.onListApps?.(context) ?? Promise.resolve([defaultState(options, currentElement)]);
        },
        getAppState(target, readOptions) {
            return options.onGetAppState?.(target, readOptions) ?? Promise.resolve(defaultState(options, currentElement));
        },
        getAppTree(target, treeOptions) {
            return options.onGetAppTree?.(target, treeOptions) ?? Promise.resolve(currentElement);
        },
        findElement(selector, findOptions) {
            if (options.onFindElement)
                return options.onFindElement(selector, findOptions);
            if (invoked && 'afterInvokeElement' in options)
                return Promise.resolve(options.afterInvokeElement ?? null);
            return Promise.resolve(currentElement);
        },
        invokeElement(element, action, invokeOptions) {
            if (options.onInvokeElement)
                return options.onInvokeElement(element, action, invokeOptions);
            invoked = true;
            if (options.failInvoke) {
                return Promise.resolve({
                    ok: false,
                    actionId: action?.id,
                    actionType: action?.type ?? 'invoke',
                    providerId: options.id,
                    providerKind: options.kind,
                    fallbackSuggested: true,
                    fallbackReason: 'Stub provider was configured to fail invokeElement.',
                    error: {
                        code: 'stub_invoke_failed',
                        message: 'Stub provider was configured to fail invokeElement.',
                    },
                    warnings: [],
                });
            }
            return Promise.resolve({
                ok: true,
                actionId: action?.id,
                actionType: action?.type ?? 'invoke',
                providerId: options.id,
                providerKind: options.kind,
                method: `${options.kind}.stubInvoke`,
                targetElement: element,
                changed: true,
                requiresForeground: options.requiresForeground,
                usedForeground: options.requiresForeground,
                usedFallback: options.kind === 'vision-ocr' || options.kind === 'hid',
                warnings: [],
            });
        },
        setValue(element, value, setValueOptions) {
            if (options.onSetValue)
                return options.onSetValue(element, value, setValueOptions);
            invoked = true;
            currentElement = { ...element, value, text: typeof value === 'string' ? value : element.text };
            return Promise.resolve({
                ok: true,
                actionType: 'setValue',
                providerId: options.id,
                providerKind: options.kind,
                method: `${options.kind}.stubSetValue`,
                targetElement: currentElement,
                changed: true,
                warnings: [],
            });
        },
        selectMenu(target, menuPath, selectMenuOptions) {
            if (options.onSelectMenu)
                return options.onSelectMenu(target, menuPath, selectMenuOptions);
            invoked = true;
            return Promise.resolve({
                ok: true,
                actionType: 'selectMenu',
                providerId: options.id,
                providerKind: options.kind,
                method: `${options.kind}.stubSelectMenu`,
                changed: true,
                data: { menuPath },
                warnings: [],
            });
        },
        getCapabilities(target, context) {
            void target;
            void context;
            return Promise.resolve(defaultCapability(options));
        },
    };
}
