import type { MacOSActionResult, MacOSAppDescriptor, MacOSAXSelector, MacOSAXTreeSnapshot, MacOSCapabilityReport, MacOSElementNode, MacOSProviderResult, MacOSReadTreeOptions, MacOSWindowDescriptor } from './types.js';
import { type MacOSCoreActionResult, type MacOSCoreAppDescriptor, type MacOSCoreAppState, type MacOSCoreAppTree, type MacOSCoreCapabilityReport, type MacOSCoreElementNode, type MacOSCoreMenuSelectionRequest, type MacOSCoreProviderContract } from './schema.js';
export interface MacOSProviderContractSource {
    getCapabilityReport(): Promise<MacOSCapabilityReport>;
    listApps(): Promise<MacOSProviderResult<MacOSAppDescriptor[]>>;
    listWindows(selector?: MacOSAXSelector): Promise<MacOSProviderResult<MacOSWindowDescriptor[]>>;
    readTree(selector?: MacOSAXSelector, options?: MacOSReadTreeOptions): Promise<MacOSProviderResult<MacOSAXTreeSnapshot>>;
    findElement(selector: MacOSAXSelector, options?: MacOSReadTreeOptions): Promise<MacOSProviderResult<{
        snapshot: MacOSAXTreeSnapshot;
        element: MacOSElementNode;
    } | null>>;
    executeAction(action: {
        name: 'focus' | 'press' | 'invoke' | 'setValue' | 'type' | 'select' | 'selectMenu' | 'menu';
        selector?: MacOSAXSelector;
        text?: string;
        value?: string;
        clearExisting?: boolean;
        menuPath?: string[];
        pid?: number;
        bundleId?: string;
        processName?: string;
        verify?: boolean;
    }): Promise<MacOSProviderResult<MacOSActionResult>>;
}
export interface MacOSCoreProviderOptions {
    provider?: MacOSProviderContractSource;
    readOptions?: MacOSReadTreeOptions;
}
export declare class MacOSCoreProviderAdapter implements MacOSCoreProviderContract {
    readonly id: "macos-ax";
    private readonly provider;
    private readonly readOptions;
    constructor(options?: MacOSCoreProviderOptions);
    getCapabilities(): Promise<MacOSCoreCapabilityReport>;
    listApps(): Promise<MacOSCoreAppDescriptor[]>;
    getAppState(selector?: MacOSAXSelector): Promise<MacOSCoreAppState>;
    getAppTree(selector?: MacOSAXSelector): Promise<MacOSCoreAppTree>;
    findElement(selector: MacOSAXSelector): Promise<MacOSCoreElementNode | null>;
    invokeElement(selector: MacOSAXSelector): Promise<MacOSCoreActionResult>;
    setValue(selector: MacOSAXSelector, value: string, options?: {
        clearExisting?: boolean;
    }): Promise<MacOSCoreActionResult>;
    selectMenu(request: MacOSCoreMenuSelectionRequest): Promise<MacOSCoreActionResult>;
}
export declare function createMacOSCoreProvider(options?: MacOSCoreProviderOptions): MacOSCoreProviderAdapter;
export declare function registerMacOSCoreProvider(registry: {
    register(provider: MacOSCoreProviderContract): void;
}, provider?: MacOSCoreProviderContract): MacOSCoreProviderContract;
