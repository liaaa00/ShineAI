import type { BrowserAction, BrowserActionResult, BrowserCapabilityReport, BrowserCloseTabResult, BrowserComputerUseProvider, BrowserConnectionOptions, BrowserDomSnapshot, BrowserElement, BrowserOpenTabResult, BrowserPageTextResult, BrowserScreenshotOptions, BrowserScreenshotResult, BrowserSelector, BrowserTarget, BrowserTargetQuery, BrowserWaitForPageOptions, BrowserWaitForPageResult, BrowserWindow } from './types.js';
export declare class BrowserDomCdpProvider implements BrowserComputerUseProvider {
    private readonly http;
    private readonly defaultTimeoutMs;
    private ensurePromise;
    constructor(options?: BrowserConnectionOptions);
    listTargets(): Promise<BrowserTarget[]>;
    listWindows(): Promise<BrowserWindow[]>;
    readDomSnapshot(selector?: BrowserSelector, maxElements?: number, target?: BrowserTargetQuery): Promise<BrowserDomSnapshot>;
    findElement(selector: BrowserSelector, target?: BrowserTargetQuery): Promise<BrowserElement | null>;
    executeAction(action: BrowserAction, target?: BrowserTargetQuery): Promise<BrowserActionResult>;
    captureScreenshot(options?: BrowserScreenshotOptions, target?: BrowserTargetQuery): Promise<BrowserScreenshotResult>;
    getCapabilityReport(): Promise<BrowserCapabilityReport>;
    getAppState(target?: BrowserTargetQuery): Promise<BrowserDomSnapshot>;
    getAppTree(target?: BrowserTargetQuery): Promise<BrowserDomSnapshot>;
    invokeElement(selectorOrElement: BrowserSelector | BrowserElement, action?: Partial<BrowserAction>, target?: BrowserTargetQuery): Promise<BrowserActionResult>;
    setValue(selectorOrElement: BrowserSelector | BrowserElement, value: string, target?: BrowserTargetQuery): Promise<BrowserActionResult>;
    getCapabilities(): Promise<BrowserCapabilityReport>;
    waitForPage(options?: BrowserWaitForPageOptions, target?: BrowserTargetQuery): Promise<BrowserWaitForPageResult>;
    getPageText(target?: BrowserTargetQuery, maxChars?: number): Promise<BrowserPageTextResult>;
    openTab(url?: string): Promise<BrowserOpenTabResult>;
    closeTab(target?: BrowserTargetQuery): Promise<BrowserCloseTabResult>;
    private navigateUrl;
    private pageNavigate;
    private reloadPage;
    private navigateHistory;
    private waitForTargetLoad;
    private safeReadyState;
    private safePageText;
    private ensureReady;
    private waitForPageTargets;
    private normalizeAction;
    private resolveTarget;
    private pageUrlTitle;
    private evaluate;
    private withTargetMetadata;
    private safeElementState;
    private verifyAction;
    private defaultVerification;
    private toFailure;
    private fallbackForFailure;
}
/**
 * 判定 target 是否属于 ShineAI 自身窗口（主界面/任务控制/会话聊天等）。
 * 这些窗口统一加载 …/out/renderer/*.html#<hash>；一旦被当成浏览器 target 操作，
 * 整个软件界面就会被 Page.navigate 等导航走或打白。门面已在 /json/list 过滤，
 * 这里再兜一层，避免指向未过滤的 CDP 端点时误伤。
 */
export declare function isAppOwnTargetUrl(url: string): boolean;
export declare function looksLikeUrl(value: string): boolean;
