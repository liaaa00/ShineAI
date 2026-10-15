import { type MacOSAccessibilityProvider } from './provider.js';
import { type MacOSCoreProviderOptions, type MacOSProviderContractSource } from './contract-adapter.js';
import type { MacOSCoreProviderContract } from './schema.js';
export interface MacOSCoreBridgeOptions extends Omit<MacOSCoreProviderOptions, 'provider'> {
    provider?: MacOSProviderContractSource;
    localProvider?: MacOSAccessibilityProvider;
}
export declare function createMacOSCoreBridge(options?: MacOSCoreBridgeOptions): MacOSCoreProviderContract;
export declare function createMacOSLocalProviderForBridge(): MacOSAccessibilityProvider;
