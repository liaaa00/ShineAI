export type BrowserSelectorKind = 'css' | 'xpath' | 'text' | 'role' | 'aria-label' | 'testId' | 'bounds' | 'elementId';
export interface BrowserBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface BrowserConnectionOptions {
    host?: string;
    port?: number;
    browserURL?: string;
    defaultTimeoutMs?: number;
}
export interface BrowserTargetQuery {
    targetId?: string;
    webSocketDebuggerUrl?: string;
    urlIncludes?: string;
    titleIncludes?: string;
}
export interface BrowserTarget {
    targetId: string;
    type: string;
    url: string;
    title: string;
    webSocketDebuggerUrl?: string;
    browserContextId?: string;
    attached?: boolean;
}
export interface BrowserWindow {
    id: string;
    provider: 'browser';
    targetId: string;
    title: string;
    url: string;
    webSocketDebuggerUrl?: string;
}
export interface BrowserSelector {
    kind?: BrowserSelectorKind;
    /** Agent 常传 type/value；tools 层会归一到扁平 css|xpath|... */
    type?: string;
    value?: string | number | boolean | Partial<BrowserBounds>;
    css?: string;
    xpath?: string;
    text?: string;
    role?: string;
    ariaLabel?: string;
    'aria-label'?: string;
    testId?: string;
    testIdAttribute?: string;
    framePath?: string[];
    urlIncludes?: string;
    titleIncludes?: string;
    /** Agent 常把待打开 URL 塞进 selector；navigate 会读这个字段。 */
    url?: string;
    bounds?: Partial<BrowserBounds>;
    index?: number;
    visible?: boolean;
    elementId?: string;
    shineaiId?: string;
}
export interface BrowserDomMetadata {
    targetId: string;
    framePath: string[];
    cssPath?: string;
    xpath?: string;
    selector?: BrowserSelector;
    shineaiId?: string;
    tagName: string;
    inputType?: string;
    editable: boolean;
    clickable: boolean;
    source: 'dom' | 'cdp';
    score?: number;
}
export interface BrowserElement {
    id: string;
    provider: 'browser';
    role: string;
    label: string;
    text: string;
    value?: string;
    tagName: string;
    attributes: Record<string, string>;
    bounds: BrowserBounds;
    actionable: boolean;
    enabled: boolean;
    visible: boolean;
    checked?: boolean;
    selected?: boolean;
    focused?: boolean;
    metadata: BrowserDomMetadata;
}
export interface BrowserFrameInfo {
    path: string[];
    url: string;
    title?: string;
    accessible: boolean;
    reason?: string;
}
export interface BrowserDomSnapshot {
    provider: 'browser';
    target: BrowserTarget;
    url: string;
    title: string;
    timestamp: string;
    elements: BrowserElement[];
    frames: BrowserFrameInfo[];
    warnings: string[];
    capabilityHints: Pick<BrowserCapabilityReport, 'backgroundRead' | 'backgroundInvoke' | 'backgroundType' | 'requiresForeground' | 'visionFallbackNeeded'>;
}
export type BrowserActionType = 'click' | 'type' | 'setValue' | 'pressKey' | 'hotkey' | 'select' | 'scroll' | 'hover' | 'menu' | 'contextMenu' | 'upload' | 'navigate' | 'reload' | 'back' | 'forward';
export type BrowserScreenshotFormat = 'png' | 'jpeg';
export interface BrowserScreenshotOptions {
    format?: BrowserScreenshotFormat;
    /** JPEG quality 1-100. Ignored unless format=jpeg. */
    quality?: number;
    /** When true, CDP Page.captureScreenshot gets captureBeyondViewport: true. */
    fullPage?: boolean;
}
export interface BrowserScreenshotResult {
    ok: boolean;
    provider: 'browser';
    method: 'cdp-page';
    url: string;
    title: string;
    targetId: string;
    mimeType: 'image/png' | 'image/jpeg';
    byteLength: number;
    requiresForeground: false;
    data: string;
}
export interface BrowserWaitForPageOptions {
    urlIncludes?: string;
    titleIncludes?: string;
    textIncludes?: string;
    timeoutMs?: number;
}
export interface BrowserWaitForPageResult {
    ok: boolean;
    provider: 'browser';
    method: 'cdp-dom';
    url: string;
    title: string;
    targetId: string;
    readyState?: string;
    matched: boolean;
    elapsedMs: number;
    failure?: BrowserActionFailure;
    warnings: string[];
}
export interface BrowserPageTextResult {
    ok: boolean;
    provider: 'browser';
    url: string;
    title: string;
    targetId: string;
    text: string;
    truncated: boolean;
    charCount: number;
    failure?: BrowserActionFailure;
}
export interface BrowserOpenTabResult extends BrowserTarget {
    ok: boolean;
    method: 'cdp-dom';
    requiresForeground: false;
}
export interface BrowserCloseTabResult {
    ok: boolean;
    provider: 'browser';
    method: 'cdp-http';
    targetId: string;
    closed: boolean;
    failure?: BrowserActionFailure;
}
export type BrowserKeyModifier = 'Alt' | 'Control' | 'Meta' | 'Shift';
export interface BrowserActionVerification {
    value?: string;
    textIncludes?: string;
    checked?: boolean;
    selected?: boolean;
    focused?: boolean;
    urlIncludes?: string;
    mutation?: boolean;
    networkIdleMs?: number;
    timeoutMs?: number;
}
export interface BrowserAction {
    type: BrowserActionType;
    selector?: BrowserSelector;
    element?: BrowserElement;
    /** 打开网页用：navigate + url。不要去点地址栏。 */
    url?: string;
    text?: string;
    value?: string;
    key?: string;
    keys?: string[];
    modifiers?: BrowserKeyModifier[];
    optionValue?: string;
    files?: string[];
    scroll?: {
        x?: number;
        y?: number;
        deltaX?: number;
        deltaY?: number;
        block?: ScrollLogicalPosition;
        inline?: ScrollLogicalPosition;
    };
    verify?: BrowserActionVerification;
    timeoutMs?: number;
}
export interface BrowserElementState {
    url: string;
    title: string;
    text: string;
    value?: string;
    checked?: boolean;
    selected?: boolean;
    focused: boolean;
    enabled: boolean;
    visible: boolean;
    mutationHash: string;
}
export interface BrowserActionVerificationResult {
    ok: boolean;
    status: 'passed' | 'failed' | 'not_requested' | 'best_effort';
    checks: Array<{
        name: string;
        ok: boolean;
        expected?: unknown;
        actual?: unknown;
    }>;
    message?: string;
}
export interface BrowserFallbackSuggestion {
    provider: 'browser-cdp' | 'desktop-vision-hid' | 'windows-uia' | 'macos-ax' | 'playwright';
    action: string;
    reason: string;
}
export interface BrowserActionFailure {
    code: 'target_not_found' | 'element_not_found' | 'cdp_unavailable' | 'unsupported_action' | 'verification_failed' | 'permission_required' | 'cross_origin_frame' | 'internal_error';
    message: string;
    details?: Record<string, unknown>;
}
export interface BrowserActionResult {
    ok: boolean;
    provider: 'browser';
    action: BrowserActionType;
    method: 'dom' | 'cdp-input' | 'cdp-dom' | 'not-supported';
    target?: BrowserElement;
    before?: BrowserElementState;
    after?: BrowserElementState;
    verification?: BrowserActionVerificationResult;
    failure?: BrowserActionFailure;
    fallback?: BrowserFallbackSuggestion;
    warnings: string[];
    raw?: unknown;
}
export interface BrowserCapabilityReport {
    provider: 'browser-dom-cdp';
    status: 'available' | 'debug_port_unreachable' | 'no_page_targets' | 'limited';
    endpoint: {
        host: string;
        port: number;
        browserURL: string;
    };
    targetCount: number;
    backgroundRead: boolean;
    backgroundInvoke: boolean;
    backgroundType: boolean;
    requiresForeground: boolean;
    visionFallbackNeeded: boolean;
    selectorSupport: Array<'css' | 'xpath' | 'text' | 'role' | 'aria-label' | 'testId' | 'framePath' | 'url/title' | 'bounds'>;
    actions: Record<BrowserActionType | 'screenshot' | 'wait' | 'newTab' | 'closeTab', 'native' | 'thin' | 'fallback' | 'unsupported'>;
    limitations: {
        frames: string[];
        permissions: string[];
        userGesture: string[];
        upload: string[];
    };
    fallbackOrder: string[];
    notes: string[];
}
export interface BrowserComputerUseProvider {
    listTargets(): Promise<BrowserTarget[]>;
    listWindows(): Promise<BrowserWindow[]>;
    readDomSnapshot(selector?: BrowserSelector, maxElements?: number, target?: BrowserTargetQuery): Promise<BrowserDomSnapshot>;
    findElement(selector: BrowserSelector, target?: BrowserTargetQuery): Promise<BrowserElement | null>;
    executeAction(action: BrowserAction, target?: BrowserTargetQuery): Promise<BrowserActionResult>;
    captureScreenshot(options?: BrowserScreenshotOptions, target?: BrowserTargetQuery): Promise<BrowserScreenshotResult>;
    waitForPage(options?: BrowserWaitForPageOptions, target?: BrowserTargetQuery): Promise<BrowserWaitForPageResult>;
    getPageText(target?: BrowserTargetQuery, maxChars?: number): Promise<BrowserPageTextResult>;
    openTab(url?: string): Promise<BrowserOpenTabResult>;
    closeTab(target?: BrowserTargetQuery): Promise<BrowserCloseTabResult>;
    getCapabilityReport(): Promise<BrowserCapabilityReport>;
    getAppState(target?: BrowserTargetQuery): Promise<BrowserDomSnapshot>;
    getAppTree(target?: BrowserTargetQuery): Promise<BrowserDomSnapshot>;
    invokeElement(selectorOrElement: BrowserSelector | BrowserElement, action?: Partial<BrowserAction>, target?: BrowserTargetQuery): Promise<BrowserActionResult>;
    setValue(selectorOrElement: BrowserSelector | BrowserElement, value: string, target?: BrowserTargetQuery): Promise<BrowserActionResult>;
    getCapabilities(): Promise<BrowserCapabilityReport>;
}
