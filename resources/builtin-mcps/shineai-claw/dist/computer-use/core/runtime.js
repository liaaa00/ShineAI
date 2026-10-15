import { defaultProviderRegistry } from '../registry.js';
import { ComputerUseActionSchema, } from '../types.js';
import { actionFailureResult, canonicalFailure, canonicalSuccess, fallbackProviderIds, routeToReportSteps } from './report.js';
import { appTargetFromAction, selectorFromAction, verifyAction } from './verification.js';
import { TraceRecorder } from './trace.js';
import { writeTrace } from './trace-storage.js';
import crypto from 'node:crypto';
function syntheticElement(id, source = 'unknown') {
    return {
        id,
        source,
        role: 'virtual-target',
        isEnabled: true,
        isVisible: true,
        isActionable: true,
    };
}
function defaultVerificationFor(action) {
    if (action.verify)
        return action.verify;
    if (action.type === 'setValue') {
        return {
            mode: 'compare',
            expectation: {
                selector: action.target,
                value: action.value,
                exists: true,
            },
            timeoutMs: 2_000,
            retries: 1,
        };
    }
    if (action.type === 'typeText' && action.target) {
        return {
            mode: 'compare',
            expectation: {
                selector: action.target,
                text: action.text,
                exists: true,
            },
            timeoutMs: 2_000,
            retries: 1,
        };
    }
    if ('target' in action && action.target) {
        return {
            mode: 'visible-state',
            expectation: {
                selector: action.target,
                exists: true,
                visible: true,
            },
            timeoutMs: 2_000,
            retries: 1,
        };
    }
    if (action.type === 'selectMenu' && action.app) {
        return { mode: 'read', timeoutMs: 2_000, retries: 0 };
    }
    return { mode: 'none', timeoutMs: 2_000, retries: 0 };
}
function isVerificationSupported(candidate, request) {
    return request.mode === 'none' || candidate.capability.verificationSupport.includes(request.mode);
}
function actionTarget(action, optionsTarget) {
    return optionsTarget ?? appTargetFromAction(action);
}
async function dispatchAction(provider, action, element) {
    switch (action.type) {
        case 'readState': {
            const target = action.app ?? element?.nativeRef?.appTarget;
            if (!target) {
                return {
                    result: actionFailureResult({
                        action,
                        providerId: provider.id,
                        providerKind: provider.kind,
                        code: 'missing_app_target',
                        message: 'readState requires an app target.',
                    }),
                };
            }
            const state = await provider.getAppState(target, { includeTree: true, includeWindows: true, background: true });
            return {
                state,
                result: {
                    ok: true,
                    actionId: action.id,
                    actionType: 'readState',
                    providerId: provider.id,
                    providerKind: provider.kind,
                    method: 'getAppState',
                    changed: false,
                    data: { appId: state.appId },
                    warnings: [],
                },
            };
        }
        case 'setValue': {
            if (!element) {
                return {
                    result: actionFailureResult({
                        action,
                        providerId: provider.id,
                        providerKind: provider.kind,
                        code: 'element_not_found',
                        message: 'setValue requires a resolved element.',
                        fallbackSuggested: true,
                    }),
                };
            }
            return { result: await provider.setValue(element, action.value, { append: action.append }) };
        }
        case 'typeText': {
            if (element) {
                return { result: await provider.setValue(element, action.text, { clearExisting: action.clearExisting }) };
            }
            return { result: await provider.invokeElement(syntheticElement('focused-element', 'hid'), action) };
        }
        case 'selectMenu':
            return { result: await provider.selectMenu(action.app, action.menuPath) };
        case 'hotkey':
            return { result: await provider.invokeElement(syntheticElement('system-hotkey', 'hid'), action) };
        case 'scroll':
            return { result: await provider.invokeElement(element ?? syntheticElement('scroll-target', 'hid'), action) };
        case 'invoke':
        case 'click':
        case 'focus':
        case 'select': {
            if (!element) {
                return {
                    result: actionFailureResult({
                        action,
                        providerId: provider.id,
                        providerKind: provider.kind,
                        code: 'element_not_found',
                        message: `${action.type} requires a resolved element.`,
                        fallbackSuggested: true,
                    }),
                };
            }
            return { result: await provider.invokeElement(element, action) };
        }
    }
}
export class ComputerUseRuntime {
    registry;
    constructor(registry = defaultProviderRegistry) {
        this.registry = registry;
    }
    canonicalReport(report) {
        return report;
    }
    async capabilityReport(target) {
        const capabilities = await this.registry.capabilityReport(target);
        return canonicalSuccess({
            phase: 'capability',
            target,
            capabilities,
            warnings: capabilities.length === 0 ? ['No computer-use providers are registered.'] : [],
        });
    }
    async route(actionInput, options = {}) {
        const action = ComputerUseActionSchema.parse(actionInput);
        const candidates = await this.registry.route(action, options);
        const route = routeToReportSteps(candidates);
        if (candidates.length === 0) {
            return canonicalFailure({
                phase: 'route',
                action,
                target: actionTarget(action, options.target),
                code: 'no_provider_available',
                message: `No provider can handle action ${action.type}.`,
                route,
                fallbackSuggested: true,
                fallbackProviders: [],
            });
        }
        return canonicalSuccess({
            phase: 'route',
            providerId: candidates[0].provider.id,
            providerKind: candidates[0].provider.kind,
            action,
            target: actionTarget(action, options.target),
            route,
            capabilities: candidates.map((candidate) => candidate.capability),
        });
    }
    async readState(target, options = {}) {
        const action = { type: 'readState', app: target };
        const candidates = await this.registry.route(action, {
            ...options,
            target,
            requireBackground: options.background ?? options.requireBackground,
        });
        const route = routeToReportSteps(candidates);
        for (const candidate of candidates) {
            try {
                const state = await candidate.provider.getAppState(target, {
                    includeTree: options.includeTree ?? true,
                    includeWindows: options.includeWindows ?? true,
                    background: options.background ?? true,
                });
                return canonicalSuccess({
                    phase: 'read',
                    providerId: candidate.provider.id,
                    providerKind: candidate.provider.kind,
                    target,
                    state,
                    route,
                    capabilities: candidates.map((item) => item.capability),
                });
            }
            catch {
                // Try next provider in priority order; final failure is reported below.
            }
        }
        return canonicalFailure({
            phase: 'read',
            action,
            target,
            code: 'read_state_failed',
            message: 'All routed providers failed to read app state.',
            route,
            fallbackSuggested: true,
            fallbackProviders: fallbackProviderIds(candidates),
            capabilities: candidates.map((candidate) => candidate.capability),
        });
    }
    async executeAction(actionInput, options = {}) {
        const action = ComputerUseActionSchema.parse(actionInput);
        // --- Trace setup (pre-route) ---
        const tracingEnabled = options.enableTrace === true || options.recorder != null;
        const recorder = tracingEnabled
            ? (options.recorder ?? new TraceRecorder(crypto.randomUUID()))
            : null;
        let capturedTrace = null;
        try {
            // pre-route hook
            try {
                recorder?.recordPreRoute();
            }
            catch { /* trace errors never block */ }
            const candidates = await this.registry.route(action, options);
            const route = routeToReportSteps(candidates);
            const fallbackIds = fallbackProviderIds(candidates);
            const capabilities = candidates.map((candidate) => candidate.capability);
            const warnings = [];
            if (candidates.length === 0) {
                const report = canonicalFailure({
                    phase: 'route',
                    action,
                    target: actionTarget(action, options.target),
                    code: 'no_provider_available',
                    message: `No provider can handle action ${action.type}.`,
                    route,
                    fallbackSuggested: true,
                    fallbackProviders: fallbackIds,
                });
                try {
                    if (recorder) {
                        capturedTrace = recorder.finalize({ ok: false, phase: 'route', error: 'no_provider_available' });
                        await writeTrace(capturedTrace);
                    }
                }
                catch { /* trace errors never block */ }
                return report;
            }
            for (const candidate of candidates) {
                const provider = candidate.provider;
                const selector = selectorFromAction(action);
                let element;
                const providerInfo = {
                    id: provider.id,
                    kind: provider.kind,
                    priority: candidate.capability.priority,
                    fallback: candidate.fallback,
                };
                try {
                    if (selector) {
                        // pre-find hook
                        try {
                            recorder?.recordPreFind(providerInfo, true);
                        }
                        catch { /* trace errors never block */ }
                        element = await provider.findElement(selector, { background: !candidate.capability.requiresForeground }) ?? undefined;
                        // post-find hook
                        try {
                            recorder?.recordPostFind(providerInfo, element != null, element ? {
                                id: element.id,
                                role: element.role,
                                name: element.name,
                                bounds: element.bounds,
                                source: element.source,
                                confidence: element.confidence,
                            } : undefined);
                        }
                        catch { /* trace errors never block */ }
                        if (!element) {
                            warnings.push(`${provider.id}: selector was not found before ${action.type}.`);
                            if (options.continueOnProviderFailure ?? true)
                                continue;
                        }
                    }
                    // pre-dispatch hook
                    try {
                        recorder?.recordPreDispatch(providerInfo, element ? {
                            id: element.id,
                            role: element.role,
                            name: element.name,
                            bounds: element.bounds,
                            source: element.source,
                        } : undefined);
                    }
                    catch { /* trace errors never block */ }
                    const outcome = await dispatchAction(provider, action, element);
                    const result = {
                        ...outcome.result,
                        providerId: outcome.result.providerId ?? provider.id,
                        providerKind: outcome.result.providerKind ?? provider.kind,
                        usedFallback: candidate.fallback || outcome.result.usedFallback,
                        fallbackSuggested: outcome.result.fallbackSuggested ?? false,
                        warnings: [...(outcome.result.warnings ?? []), ...warnings],
                    };
                    // post-dispatch hook
                    try {
                        recorder?.recordPostDispatch(providerInfo, {
                            ok: result.ok,
                            method: result.method,
                            changed: result.changed,
                            error: result.error?.message,
                            usedFallback: result.usedFallback ?? false,
                            foregroundRequired: candidate.capability.requiresForeground,
                        });
                    }
                    catch { /* trace errors never block */ }
                    if (!result.ok) {
                        warnings.push(`${provider.id}: ${result.error?.message ?? 'action failed'}`);
                        if (options.continueOnProviderFailure ?? true)
                            continue;
                        const report = canonicalFailure({
                            phase: 'execute',
                            providerId: provider.id,
                            providerKind: provider.kind,
                            action,
                            target: actionTarget(action, options.target),
                            result,
                            capabilities,
                            route,
                            fallbackSuggested: true,
                            fallbackProviders: fallbackIds,
                            code: result.error?.code ?? 'action_failed',
                            message: result.error?.message ?? `Provider ${provider.id} failed action ${action.type}.`,
                            warnings,
                        });
                        try {
                            if (recorder) {
                                capturedTrace = recorder.finalize({ ok: false, phase: 'execute', providerId: provider.id, error: result.error?.code });
                                await writeTrace(capturedTrace);
                            }
                        }
                        catch { /* trace errors never block */ }
                        return report;
                    }
                    const verificationRequest = options.verify ?? defaultVerificationFor(action);
                    if (!isVerificationSupported(candidate, verificationRequest)) {
                        const failedResult = {
                            ...result,
                            ok: false,
                            fallbackSuggested: true,
                            fallbackReason: `Provider ${provider.id} does not support ${verificationRequest.mode} verification.`,
                        };
                        const report = canonicalFailure({
                            phase: 'verify',
                            providerId: provider.id,
                            providerKind: provider.kind,
                            action,
                            target: actionTarget(action, options.target),
                            result: failedResult,
                            capabilities,
                            route,
                            fallbackSuggested: true,
                            fallbackProviders: fallbackIds,
                            code: 'verification_not_supported',
                            message: failedResult.fallbackReason,
                            warnings,
                        });
                        try {
                            if (recorder) {
                                capturedTrace = recorder.finalize({ ok: false, phase: 'verify', providerId: provider.id, error: 'verification_not_supported' });
                                await writeTrace(capturedTrace);
                            }
                        }
                        catch { /* trace errors never block */ }
                        return report;
                    }
                    const verification = await verifyAction({
                        provider,
                        action,
                        request: verificationRequest,
                        targetElement: result.targetElement ?? element,
                    });
                    // post-verify hook
                    try {
                        recorder?.recordPostVerify(providerInfo, {
                            ok: verification.ok,
                            mode: verification.mode,
                            message: verification.message,
                        });
                    }
                    catch { /* trace errors never block */ }
                    if (!verification.ok) {
                        const failedResult = {
                            ...result,
                            ok: false,
                            verification,
                            fallbackSuggested: true,
                            fallbackReason: verification.message ?? 'Post-action verification failed.',
                        };
                        const report = canonicalFailure({
                            phase: 'verify',
                            providerId: provider.id,
                            providerKind: provider.kind,
                            action,
                            target: actionTarget(action, options.target),
                            result: failedResult,
                            state: outcome.state,
                            capabilities,
                            verification,
                            route,
                            fallbackSuggested: true,
                            fallbackProviders: fallbackIds,
                            code: 'verification_failed',
                            message: verification.message ?? 'Post-action verification failed.',
                            warnings,
                        });
                        try {
                            if (recorder) {
                                capturedTrace = recorder.finalize({ ok: false, phase: 'verify', providerId: provider.id, error: 'verification_failed' });
                                await writeTrace(capturedTrace);
                            }
                        }
                        catch { /* trace errors never block */ }
                        return report;
                    }
                    const report = canonicalSuccess({
                        phase: 'execute',
                        providerId: provider.id,
                        providerKind: provider.kind,
                        action,
                        target: actionTarget(action, options.target),
                        result: { ...result, verification },
                        state: outcome.state,
                        verification,
                        capabilities,
                        route,
                        warnings,
                    });
                    try {
                        if (recorder) {
                            capturedTrace = recorder.finalize({ ok: true, phase: 'execute', providerId: provider.id });
                            await writeTrace(capturedTrace);
                        }
                    }
                    catch { /* trace errors never block */ }
                    return report;
                }
                catch (error) {
                    warnings.push(`${provider.id}: ${error instanceof Error ? error.message : String(error)}`);
                    if (!(options.continueOnProviderFailure ?? true)) {
                        const report = canonicalFailure({
                            phase: 'execute',
                            providerId: provider.id,
                            providerKind: provider.kind,
                            action,
                            target: actionTarget(action, options.target),
                            capabilities,
                            route,
                            fallbackSuggested: true,
                            fallbackProviders: fallbackIds,
                            code: 'provider_exception',
                            message: error instanceof Error ? error.message : String(error),
                            warnings,
                        });
                        try {
                            if (recorder) {
                                capturedTrace = recorder.finalize({ ok: false, phase: 'execute', providerId: provider.id, error: 'provider_exception' });
                                await writeTrace(capturedTrace);
                            }
                        }
                        catch { /* trace errors never block */ }
                        return report;
                    }
                }
            }
            const report = canonicalFailure({
                phase: 'execute',
                action,
                target: actionTarget(action, options.target),
                capabilities,
                route,
                fallbackSuggested: true,
                fallbackProviders: fallbackIds,
                code: 'all_providers_failed',
                message: `All routed providers failed action ${action.type}.`,
                warnings,
            });
            try {
                if (recorder) {
                    capturedTrace = recorder.finalize({ ok: false, phase: 'execute', error: 'all_providers_failed' });
                    await writeTrace(capturedTrace);
                }
            }
            catch { /* trace errors never block */ }
            return report;
        }
        catch (outerError) {
            // If something above threw unexpectedly (outside provider loop), finalize trace and rethrow.
            try {
                if (recorder && !capturedTrace) {
                    const trace = recorder.finalize({ ok: false, phase: 'execute', error: outerError instanceof Error ? outerError.message : String(outerError) });
                    await writeTrace(trace);
                }
            }
            catch { /* trace errors never block */ }
            throw outerError;
        }
    }
}
export const defaultComputerUseRuntime = new ComputerUseRuntime(defaultProviderRegistry);
