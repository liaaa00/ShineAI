import type { BrowserAction, BrowserActionVerification, BrowserSelector } from './types.js';
export declare function buildDomSnapshotExpression(selector: BrowserSelector | undefined, maxElements: number): string;
export declare function buildFindElementExpression(selector: BrowserSelector): string;
export declare function buildActionExpression(action: BrowserAction): string;
export declare function buildElementStateExpression(selector?: BrowserSelector, verification?: BrowserActionVerification): string;
