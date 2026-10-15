import { createMacOSAccessibilityProvider } from './provider.js';
import { createMacOSCoreProvider } from './contract-adapter.js';
export function createMacOSCoreBridge(options = {}) {
    const provider = options.provider ?? options.localProvider ?? createMacOSAccessibilityProvider();
    return createMacOSCoreProvider({ provider, readOptions: options.readOptions });
}
export function createMacOSLocalProviderForBridge() {
    return createMacOSAccessibilityProvider();
}
