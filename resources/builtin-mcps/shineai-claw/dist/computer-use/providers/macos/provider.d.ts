import type { OpName, OpParams, OpResult } from '../../../helpers/ipc/protocol.js';
import type { MacOSActionResult, MacOSAppDescriptor, MacOSAXSelector, MacOSAXTreeSnapshot, MacOSCapabilityReport, MacOSComputerAction, MacOSElementNode, MacOSProviderResult, MacOSReadTreeOptions, MacOSWindowDescriptor } from './types.js';
interface DaemonLike {
    call<O extends OpName>(op: O, params: OpParams<O>, timeoutMs?: number): Promise<OpResult<O>>;
}
interface MacOSAccessibilityProviderOptions {
    client?: DaemonLike;
    platform?: NodeJS.Platform;
    defaultTimeoutMs?: number;
}
interface ResolvedElementTarget {
    snapshot: MacOSAXTreeSnapshot;
    element: MacOSElementNode;
}
export declare class MacOSAccessibilityProvider {
    readonly id = "macos-ax";
    readonly platform: NodeJS.Platform;
    private readonly injectedClient?;
    private readonly defaultTimeoutMs;
    constructor(options?: MacOSAccessibilityProviderOptions);
    isSupported(): boolean;
    getCapabilityReport(): Promise<MacOSCapabilityReport>;
    listApps(): Promise<MacOSProviderResult<MacOSAppDescriptor[]>>;
    listWindows(selector?: MacOSAXSelector): Promise<MacOSProviderResult<MacOSWindowDescriptor[]>>;
    readTree(selector?: MacOSAXSelector, options?: MacOSReadTreeOptions): Promise<MacOSProviderResult<MacOSAXTreeSnapshot>>;
    findElement(selector: MacOSAXSelector, options?: MacOSReadTreeOptions): Promise<MacOSProviderResult<ResolvedElementTarget | null>>;
    executeAction(action: MacOSComputerAction): Promise<MacOSProviderResult<MacOSActionResult>>;
    private executeFocus;
    private executePress;
    private executeType;
    private executeMenu;
    private verifyElementAction;
    private verifyWindowState;
    private resolveElementForAction;
    private resolveTarget;
    private resolveApp;
    private listAppsRaw;
    private mapWindow;
    private mapTreeSnapshot;
    private client;
    private unsupported;
    private failure;
    private actionFailure;
}
export declare function createMacOSAccessibilityProvider(options?: MacOSAccessibilityProviderOptions): MacOSAccessibilityProvider;
export {};
