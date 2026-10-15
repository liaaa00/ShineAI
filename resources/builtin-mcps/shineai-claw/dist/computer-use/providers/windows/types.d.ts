export declare const WINDOWS_PROVIDER_ID: "windows-uia-win32";
export type WindowsProviderId = typeof WINDOWS_PROVIDER_ID;
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface AppRef {
    platform: 'windows';
    processId: number;
    name?: string;
    executablePath?: string;
    windowTitle?: string;
}
export interface WindowRef {
    platform: 'windows';
    windowId: string;
    handle: number;
    processId: number;
    title: string;
    bounds: Bounds;
    isVisible: boolean;
}
export type WindowsElementSource = 'uia' | 'win32' | 'iaccessible' | 'ocr' | 'hid' | 'unknown';
export type WindowsActionKind = 'invoke' | 'click' | 'clickFallback' | 'setValue' | 'type' | 'select' | 'focus' | 'hotkey' | 'toggle' | 'expandCollapse';
export interface ElementCapability {
    backgroundRead: boolean;
    backgroundInvoke: boolean;
    backgroundType: boolean;
    requiresForeground: boolean;
    visionFallbackNeeded: boolean;
    supportedActions: WindowsActionKind[];
    unsupportedReasons: string[];
}
export interface ElementNode {
    id: string;
    provider: WindowsProviderId;
    source: WindowsElementSource;
    role: string;
    controlType: string;
    name?: string;
    label?: string;
    text?: string;
    value?: string;
    automationId?: string;
    className?: string;
    frameworkId?: string;
    helpText?: string;
    processId?: number;
    nativeWindowHandle?: number;
    windowId?: string;
    bounds?: Bounds;
    path: number[];
    depth: number;
    index: number;
    isEnabled?: boolean;
    isOffscreen?: boolean;
    isFocusable?: boolean;
    hasKeyboardFocus?: boolean;
    isSelected?: boolean;
    toggleState?: string;
    expandCollapseState?: string;
    patterns: string[];
    supportedActions: WindowsActionKind[];
    capabilities: ElementCapability;
    children: ElementNode[];
    raw?: Record<string, unknown>;
}
export interface ElementSelector {
    id?: string;
    automationId?: string;
    name?: string;
    text?: string;
    role?: string;
    controlType?: string;
    className?: string;
    frameworkId?: string;
    processId?: number;
    windowId?: string;
    app?: string;
    path?: number[] | string;
    bounds?: Partial<Bounds>;
    containsText?: string;
    exact?: boolean;
    maxDepth?: number;
}
export interface ReadTreeOptions {
    processId?: number;
    windowId?: string | number;
    depth?: number;
    maxDepth?: number;
    maxNodes?: number;
}
export type ElementTreeResult = ElementNode[] & {
    nodes: ElementNode[];
    warnings?: string[];
};
export interface FindElementOptions extends ReadTreeOptions {
    selector: ElementSelector;
}
export interface AppStateOptions extends ReadTreeOptions {
    includeTree?: boolean;
}
export interface AppState {
    provider: WindowsProviderId;
    platform: 'windows';
    apps: AppRef[];
    windows: WindowRef[];
    tree?: ElementNode[];
    capabilityReport: CapabilityReport;
}
export interface CapabilityActionEntry {
    action: WindowsActionKind;
    background: boolean;
    requiresForeground: boolean;
    primaryMechanism: string;
    fallbackMechanisms: string[];
    unsupportedReason?: string;
}
export interface CapabilityReport {
    provider: WindowsProviderId;
    platform: 'windows';
    available?: boolean;
    backgroundRead: boolean;
    backgroundInvoke: boolean;
    backgroundType: boolean;
    requiresForeground: boolean;
    visionFallbackNeeded: boolean;
    supportsUia: boolean;
    supportsWin32Semantic: boolean;
    supportsIAccessibleWake: boolean;
    supportsHidFallback: boolean;
    actionMatrix: CapabilityActionEntry[];
    limitations: string[];
    generatedAt: string;
}
export type FailureCode = 'unsupported' | 'requires_foreground' | 'vision_fallback_needed' | 'capability' | 'not_found' | 'invalid_selector' | 'execution_failed' | 'verification_failed';
export interface CanonicalFailure {
    code: FailureCode;
    reason: string;
    capability?: Partial<ElementCapability>;
    fallbackSuggested?: WindowsActionKind | 'vision' | 'hid' | 'foreground';
}
export interface VerificationResult {
    attempted: boolean;
    passed: boolean;
    method: string;
    reason?: string;
    selected?: boolean;
    expectedValue?: string;
    actualValue?: string;
    before?: ElementNode;
    after?: ElementNode;
}
export interface ActionResult {
    ok: boolean;
    action: WindowsActionKind;
    method?: string;
    message?: string;
    element?: ElementNode;
    target?: ElementNode;
    verification?: VerificationResult;
    capabilityReport?: CapabilityReport;
    failure?: CanonicalFailure;
    raw?: unknown;
}
export interface ExecuteActionOptions {
    selector?: ElementSelector;
    element?: ElementNode;
    action: WindowsActionKind;
    value?: string;
    text?: string;
    keys?: string[];
    allowFallback?: boolean;
    requireBackground?: boolean;
    verify?: boolean;
    treeOptions?: ReadTreeOptions;
}
