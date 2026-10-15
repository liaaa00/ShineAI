import type { ComputerUseContext, ComputerUseProvider, FindElementOptions, GetTreeOptions, InvokeElementOptions, ReadStateOptions, SelectMenuOptions, SetValueOptions } from './provider.js';
import { type ActionResult, type AppState, type AppTarget, type CapabilityReport, type ComputerUseAction, type ComputerUsePlatform, type ElementNode, type ElementSelector, type ElementSource } from '../types.js';
export interface LegacyFallbackAdapterCallbacks {
    listApps?: (context?: ComputerUseContext) => Promise<AppState[]>;
    getAppState?: (target: AppTarget, options?: ReadStateOptions) => Promise<AppState>;
    getAppTree?: (target: AppTarget, options?: GetTreeOptions) => Promise<ElementNode>;
    findElement?: (selector: ElementSelector, options?: FindElementOptions) => Promise<ElementNode | null>;
    invokeElement?: (element: ElementNode, action?: ComputerUseAction, options?: InvokeElementOptions) => Promise<ActionResult>;
    setValue?: (element: ElementNode, value: string | number | boolean | null, options?: SetValueOptions) => Promise<ActionResult>;
    selectMenu?: (target: AppTarget | undefined, menuPath: string[], options?: SelectMenuOptions) => Promise<ActionResult>;
    getCapabilities?: (target?: AppTarget, context?: ComputerUseContext) => Promise<Partial<CapabilityReport>>;
}
export interface LegacyFallbackAdapterConfig extends LegacyFallbackAdapterCallbacks {
    id: string;
    displayName?: string;
    platform: ComputerUsePlatform;
    kind: 'vision-ocr' | 'hid';
    source: ElementSource[];
    priority?: number;
}
/**
 * Wraps existing screenshot/OCR/HID implementations in the new provider contract.
 *
 * This is intentionally an extension point: Agent B/C/D can bind current Claw
 * desktop-tools, Swift daemon detectElements/click/type, or Windows PowerShell
 * OCR/HID callbacks without changing the public MCP tool interface.
 */
export declare function createLegacyFallbackProvider(config: LegacyFallbackAdapterConfig): ComputerUseProvider;
