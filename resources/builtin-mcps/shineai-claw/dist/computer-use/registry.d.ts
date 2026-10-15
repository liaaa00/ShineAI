import type { ComputerUseProvider } from './core/provider.js';
import { type AppTarget, type CapabilityReport, type ComputerUseActionInput, type ComputerUseProviderKind } from './types.js';
export declare const PROVIDER_KIND_PRIORITY: Record<ComputerUseProviderKind, number>;
export interface ProviderRouteCandidate {
    provider: ComputerUseProvider;
    capability: CapabilityReport;
    priority: number;
    fallback: boolean;
    reason: string;
}
export interface ProviderRouteOptions {
    target?: AppTarget;
    preferredProviderIds?: string[];
    includeProviderIds?: string[];
    excludeProviderIds?: string[];
    includeKinds?: ComputerUseProviderKind[];
    excludeKinds?: ComputerUseProviderKind[];
    allowFallback?: boolean;
    requireBackground?: boolean;
}
export declare class ProviderRegistry {
    private readonly providers;
    register(provider: ComputerUseProvider): void;
    unregister(providerId: string): boolean;
    get(providerId: string): ComputerUseProvider | undefined;
    list(): ComputerUseProvider[];
    listFallbackProviders(): ComputerUseProvider[];
    capabilityReport(target?: AppTarget): Promise<CapabilityReport[]>;
    route(actionInput: ComputerUseActionInput, options?: ProviderRouteOptions): Promise<ProviderRouteCandidate[]>;
    private effectivePriority;
}
export declare const defaultProviderRegistry: ProviderRegistry;
