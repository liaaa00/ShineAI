import { ComputerUseActionSchema, actionToCapability, isFallbackProviderKind, } from './types.js';
export const PROVIDER_KIND_PRIORITY = {
    browser: 500,
    'os-accessibility': 400,
    'app-bridge': 300,
    'vision-ocr': 200,
    hid: 100,
    mock: 0,
};
function getActionTarget(action) {
    if ('target' in action && action.target?.app) {
        return action.target.app;
    }
    return action.app;
}
function supportsBackground(capability, action) {
    if (action.type === 'readState') {
        return capability.backgroundRead;
    }
    if (action.type === 'setValue' || action.type === 'typeText') {
        return capability.backgroundType;
    }
    return capability.backgroundInvoke;
}
function describeCandidate(capability, fallback) {
    const mode = fallback ? 'fallback' : 'primary';
    const bg = capability.requiresForeground ? 'foreground-required' : 'background-capable';
    return `${mode}:${capability.providerKind}:${bg}`;
}
export class ProviderRegistry {
    providers = new Map();
    register(provider) {
        if (this.providers.has(provider.id)) {
            throw new Error(`Computer use provider already registered: ${provider.id}`);
        }
        this.providers.set(provider.id, provider);
    }
    unregister(providerId) {
        return this.providers.delete(providerId);
    }
    get(providerId) {
        return this.providers.get(providerId);
    }
    list() {
        return Array.from(this.providers.values()).sort((a, b) => this.effectivePriority(b) - this.effectivePriority(a));
    }
    listFallbackProviders() {
        return this.list().filter((provider) => isFallbackProviderKind(provider.kind));
    }
    async capabilityReport(target) {
        const reports = await Promise.all(this.list().map(async (provider) => provider.getCapabilities(target)));
        return reports.sort((a, b) => b.priority - a.priority);
    }
    async route(actionInput, options = {}) {
        const action = ComputerUseActionSchema.parse(actionInput);
        const target = options.target ?? getActionTarget(action);
        const allowFallback = options.allowFallback ?? true;
        const actionKind = actionToCapability(action);
        const preferred = new Set(options.preferredProviderIds ?? []);
        const includeProviderIds = options.includeProviderIds ? new Set(options.includeProviderIds) : null;
        const excludeProviderIds = new Set(options.excludeProviderIds ?? []);
        const includeKinds = options.includeKinds ? new Set(options.includeKinds) : null;
        const excludeKinds = new Set(options.excludeKinds ?? []);
        const candidates = [];
        for (const provider of this.list()) {
            if (includeProviderIds && !includeProviderIds.has(provider.id))
                continue;
            if (excludeProviderIds.has(provider.id))
                continue;
            if (includeKinds && !includeKinds.has(provider.kind))
                continue;
            if (excludeKinds.has(provider.kind))
                continue;
            const fallback = isFallbackProviderKind(provider.kind);
            if (fallback && !allowFallback)
                continue;
            const capability = await provider.getCapabilities(target);
            if (!capability.supportedActions.includes(actionKind))
                continue;
            if (options.requireBackground && !supportsBackground(capability, action))
                continue;
            const preferredBoost = preferred.has(provider.id) ? 10_000 : 0;
            const priority = this.effectivePriority(provider, capability) + preferredBoost;
            candidates.push({
                provider,
                capability,
                priority,
                fallback,
                reason: describeCandidate(capability, fallback),
            });
        }
        return candidates.sort((a, b) => b.priority - a.priority);
    }
    effectivePriority(provider, capability) {
        const kindPriority = PROVIDER_KIND_PRIORITY[provider.kind];
        const explicit = capability?.priority ?? provider.priority ?? 0;
        return kindPriority + explicit;
    }
}
export const defaultProviderRegistry = new ProviderRegistry();
