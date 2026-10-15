import { CapabilityReportSchema, } from '../types.js';
function unsupportedResult(provider, actionType, message) {
    return {
        ok: false,
        actionType,
        providerId: provider.id,
        providerKind: provider.kind,
        fallbackSuggested: provider.kind !== 'hid',
        fallbackReason: message,
        error: {
            code: 'unsupported_fallback_operation',
            message,
        },
        warnings: [],
    };
}
function unsupported(method) {
    return new Error(`Fallback adapter does not implement ${method}.`);
}
/**
 * Wraps existing screenshot/OCR/HID implementations in the new provider contract.
 *
 * This is intentionally an extension point: Agent B/C/D can bind current Claw
 * desktop-tools, Swift daemon detectElements/click/type, or Windows PowerShell
 * OCR/HID callbacks without changing the public MCP tool interface.
 */
export function createLegacyFallbackProvider(config) {
    return {
        id: config.id,
        kind: config.kind,
        platform: config.platform,
        displayName: config.displayName,
        priority: config.priority,
        source: config.source,
        listApps(context) {
            return config.listApps?.(context) ?? Promise.resolve([]);
        },
        getAppState(target, options) {
            return config.getAppState?.(target, options) ?? Promise.reject(unsupported('getAppState'));
        },
        getAppTree(target, options) {
            return config.getAppTree?.(target, options) ?? Promise.reject(unsupported('getAppTree'));
        },
        findElement(selector, options) {
            return config.findElement?.(selector, options) ?? Promise.resolve(null);
        },
        invokeElement(element, action, options) {
            return config.invokeElement?.(element, action, options)
                ?? Promise.resolve(unsupportedResult(config, action?.type ?? 'invoke', 'invokeElement is not implemented by this fallback adapter.'));
        },
        setValue(element, value, options) {
            return config.setValue?.(element, value, options)
                ?? Promise.resolve(unsupportedResult(config, 'setValue', 'setValue is not implemented by this fallback adapter.'));
        },
        selectMenu(target, menuPath, options) {
            return config.selectMenu?.(target, menuPath, options)
                ?? Promise.resolve(unsupportedResult(config, 'selectMenu', `selectMenu(${menuPath.join(' > ')}) is not implemented by this fallback adapter.`));
        },
        async getCapabilities(target, context) {
            const override = await config.getCapabilities?.(target, context);
            return CapabilityReportSchema.parse({
                providerId: config.id,
                providerKind: config.kind,
                platform: config.platform,
                source: config.source,
                priority: config.priority ?? 0,
                backgroundRead: false,
                backgroundInvoke: false,
                backgroundType: false,
                requiresForeground: true,
                visionFallbackNeeded: config.kind === 'hid',
                supportedActions: config.kind === 'hid' ? ['click', 'typeText', 'hotkey', 'scroll'] : ['readState', 'click', 'invoke'],
                verificationSupport: config.kind === 'vision-ocr' ? ['visible-state'] : ['none'],
                supportsElementTree: config.kind === 'vision-ocr',
                supportsSelectorLookup: config.kind === 'vision-ocr',
                supportsWindowState: false,
                permissions: config.kind === 'vision-ocr' ? ['screen-recording'] : ['accessibility-or-input-monitoring'],
                limitations: [
                    'Fallback provider is best-effort and should be used after semantic providers fail or require foreground.',
                ],
                confidence: config.kind === 'vision-ocr' ? 0.65 : 0.45,
                target,
                ...override,
            });
        },
    };
}
