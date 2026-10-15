import { type ActionKind, type ActionResult, type AppState, type AppTarget, type CapabilityReport, type ComputerUsePlatform, type ComputerUseProviderKind, type ElementNode, type ElementSelector, type ElementSource, type VerificationMode } from '../types.js';
import type { ComputerUseContext, ComputerUseProvider, FindElementOptions, GetTreeOptions, InvokeElementOptions, ReadStateOptions, SelectMenuOptions, SetValueOptions } from './provider.js';
export interface StubComputerUseProviderOptions {
    id: string;
    kind: ComputerUseProviderKind;
    platform: ComputerUsePlatform;
    displayName?: string;
    source?: ElementSource[];
    priority?: number;
    supportedActions?: ActionKind[];
    verificationSupport?: VerificationMode[];
    backgroundRead?: boolean;
    backgroundInvoke?: boolean;
    backgroundType?: boolean;
    requiresForeground?: boolean;
    visionFallbackNeeded?: boolean;
    supportsElementTree?: boolean;
    supportsSelectorLookup?: boolean;
    supportsWindowState?: boolean;
    permissions?: string[];
    limitations?: string[];
    confidence?: number;
    appName?: string;
    element?: ElementNode;
    afterInvokeElement?: ElementNode | null;
    failInvoke?: boolean;
    capabilityOverrides?: Partial<CapabilityReport>;
    onListApps?: (context?: ComputerUseContext) => Promise<AppState[]>;
    onGetAppState?: (target: AppTarget, options?: ReadStateOptions) => Promise<AppState>;
    onGetAppTree?: (target: AppTarget, options?: GetTreeOptions) => Promise<ElementNode>;
    onFindElement?: (selector: ElementSelector, options?: FindElementOptions) => Promise<ElementNode | null>;
    onInvokeElement?: (element: ElementNode, action?: Parameters<ComputerUseProvider['invokeElement']>[1], options?: InvokeElementOptions) => Promise<ActionResult>;
    onSetValue?: (element: ElementNode, value: string | number | boolean | null, options?: SetValueOptions) => Promise<ActionResult>;
    onSelectMenu?: (target: AppTarget | undefined, menuPath: string[], options?: SelectMenuOptions) => Promise<ActionResult>;
}
/**
 * Creates a deterministic provider for registry composition examples and smoke tests.
 *
 * This helper deliberately lives in core and does not import any real Windows,
 * macOS, Browser, screenshot/OCR, or HID provider implementation. Post-merge
 * harnesses can swap each stub with the accepted concrete provider while keeping
 * the same registry/runtime assertions.
 */
export declare function createStubComputerUseProvider(options: StubComputerUseProviderOptions): ComputerUseProvider;
