import { type ActionResult, type AppRef, type AppState, type AppStateOptions, type CapabilityReport, type ElementNode, type ElementSelector, type ElementTreeResult, type ExecuteActionOptions, type FindElementOptions, type ReadTreeOptions, type WindowRef } from './types.js';
export declare class WindowsComputerUseProvider {
    readonly id: "windows-uia-win32";
    readonly platform: "windows";
    listApps(): Promise<AppRef[]>;
    listWindows(): Promise<WindowRef[]>;
    getAppState(options?: AppStateOptions): Promise<AppState>;
    readTree(options?: ReadTreeOptions): Promise<ElementTreeResult>;
    getAppTree(options?: ReadTreeOptions): Promise<ElementTreeResult>;
    findElement(input: FindElementOptions | ElementSelector): Promise<ElementNode | null>;
    invokeElement(selectorOrElement: ElementSelector | ElementNode, options?: Omit<ExecuteActionOptions, 'selector' | 'element' | 'action'>): Promise<ActionResult>;
    setValue(selectorOrElement: ElementSelector | ElementNode, value: string, options?: Omit<ExecuteActionOptions, 'selector' | 'element' | 'action' | 'value'>): Promise<ActionResult>;
    selectElement(selectorOrElement: ElementSelector | ElementNode, options?: Omit<ExecuteActionOptions, 'selector' | 'element' | 'action'>): Promise<ActionResult>;
    dispose(): void;
    getCapabilities(element?: ElementNode): CapabilityReport;
    getCapabilityReport(element?: ElementNode): CapabilityReport;
    executeAction(options: ExecuteActionOptions): Promise<ActionResult>;
    private resolveElement;
    private isActionSupported;
    private mustStrictlyVerify;
    private verifyAction;
    private executeHotkey;
    private toSendKeys;
    private executeElementAction;
    private buildReadTreeScript;
}
export declare const windowsComputerUseProvider: WindowsComputerUseProvider;
