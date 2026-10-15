import { ProviderRegistry } from '../registry.js';
import type { CanonicalReport, ComputerUseActionInput } from '../types.js';
import type { ComputerUseProvider } from './provider.js';
import { ComputerUseRuntime } from './runtime.js';
export interface PostMergeProviderSlots {
    browser?: ComputerUseProvider;
    windowsAccessibility?: ComputerUseProvider;
    macosAccessibility?: ComputerUseProvider;
    appBridge?: ComputerUseProvider;
    visionFallback?: ComputerUseProvider;
    hidFallback?: ComputerUseProvider;
}
export interface CoreSmokeHarnessOptions {
    providers?: PostMergeProviderSlots;
    action?: ComputerUseActionInput;
    includeFailingBrowserScenario?: boolean;
}
export interface CoreSmokeHarnessResult {
    registry: ProviderRegistry;
    runtime: ComputerUseRuntime;
    capabilityReport: CanonicalReport;
    routeReport: CanonicalReport;
    actionReport: CanonicalReport;
    fallbackReport?: CanonicalReport;
}
export declare function createPostMergeSmokeRegistry(slots?: PostMergeProviderSlots): ProviderRegistry;
export declare function createFailingBrowserSmokeRegistry(slots?: Omit<PostMergeProviderSlots, 'browser'>): ProviderRegistry;
/**
 * Runs the core-only post-merge smoke path with stubs by default.
 *
 * Concrete providers accepted from Windows/macOS/Browser agents can be supplied
 * through `providers`; when omitted, deterministic stub providers verify the
 * Registry/Runtime integration without touching real desktop state or MCP tools.
 */
export declare function runPostMergeCoreSmokeHarness(options?: CoreSmokeHarnessOptions): Promise<CoreSmokeHarnessResult>;
export declare const postMergeSmokeAction: ComputerUseActionInput;
