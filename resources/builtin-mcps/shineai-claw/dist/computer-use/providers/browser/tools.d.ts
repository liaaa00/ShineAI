import type { BrowserScreenshotResult } from './types.js';
export declare function registerBrowserComputerUseTools(): void;
export declare function persistBrowserScreenshot(result: Pick<BrowserScreenshotResult, 'ok' | 'provider' | 'method' | 'url' | 'title' | 'targetId' | 'mimeType' | 'byteLength' | 'requiresForeground' | 'data'>, savePath?: string, now?: Date): Promise<{
    path: string;
    text: string;
    meta: Record<string, unknown>;
}>;
