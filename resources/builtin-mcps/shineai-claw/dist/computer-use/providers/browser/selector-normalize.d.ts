import type { BrowserSelector } from './types.js';
/** Agent 常传 {type,value}/{kind,value}；内部只认扁平 css|xpath|text|... */
export declare function normalizeBrowserSelector(input?: BrowserSelector | Record<string, unknown> | null): BrowserSelector | undefined;
export declare function hasSpecificLocatorIntent(input?: BrowserSelector | Record<string, unknown> | null): boolean;
export declare function hasResolvedLocatorFields(selector?: BrowserSelector | Record<string, unknown> | null): boolean;
