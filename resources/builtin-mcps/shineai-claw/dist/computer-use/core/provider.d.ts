import type { ActionResult, AppState, AppTarget, CapabilityReport, ComputerUseAction, ComputerUsePlatform, ComputerUseProviderKind, ElementNode, ElementSelector, ElementSource } from '../types.js';
export interface ComputerUseContext {
    requestId?: string;
    timeoutMs?: number;
    signal?: AbortSignal;
    metadata?: Record<string, unknown>;
}
export interface ReadStateOptions extends ComputerUseContext {
    includeTree?: boolean;
    includeWindows?: boolean;
    background?: boolean;
}
export interface GetTreeOptions extends ComputerUseContext {
    maxDepth?: number;
    maxNodes?: number;
    background?: boolean;
}
export interface FindElementOptions extends ComputerUseContext {
    maxDepth?: number;
    includeHidden?: boolean;
    background?: boolean;
}
export interface InvokeElementOptions extends ComputerUseContext {
    action?: ComputerUseAction;
}
export interface SetValueOptions extends ComputerUseContext {
    append?: boolean;
    clearExisting?: boolean;
}
export interface SelectMenuOptions extends ComputerUseContext {
    verify?: boolean;
}
/**
 * Shared contract for every Universal Computer Use provider.
 *
 * Providers may be backed by Browser DOM/CDP, Windows UIA/Win32/IAccessible,
 * macOS AX/JXA/AppleScript, app-specific bridges, Vision/OCR snapshots, or HID.
 * Existing screenshot/OCR/HID code can be exposed through this interface without
 * changing current MCP tools.
 */
export interface ComputerUseProvider {
    readonly id: string;
    readonly kind: ComputerUseProviderKind;
    readonly platform: ComputerUsePlatform;
    readonly displayName?: string;
    readonly priority?: number;
    readonly source?: ElementSource[];
    listApps(context?: ComputerUseContext): Promise<AppState[]>;
    getAppState(target: AppTarget, options?: ReadStateOptions): Promise<AppState>;
    getAppTree(target: AppTarget, options?: GetTreeOptions): Promise<ElementNode>;
    findElement(selector: ElementSelector, options?: FindElementOptions): Promise<ElementNode | null>;
    invokeElement(element: ElementNode, action?: ComputerUseAction, options?: InvokeElementOptions): Promise<ActionResult>;
    setValue(element: ElementNode, value: string | number | boolean | null, options?: SetValueOptions): Promise<ActionResult>;
    selectMenu(target: AppTarget | undefined, menuPath: string[], options?: SelectMenuOptions): Promise<ActionResult>;
    getCapabilities(target?: AppTarget, context?: ComputerUseContext): Promise<CapabilityReport>;
}
export declare function providerLabel(provider: Pick<ComputerUseProvider, 'id' | 'kind'>): string;
