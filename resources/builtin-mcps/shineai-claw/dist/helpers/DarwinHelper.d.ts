import { DaemonClient } from './DaemonClient.js';
export declare let daemonClient: DaemonClient | null;
export declare function getDaemonClient(): Promise<DaemonClient>;
export interface DarwinResult {
    success: boolean;
    data?: any;
    error?: string;
}
/**
 * Call the Swift helper with a command and arguments.
 * Returns parsed JSON result.
 */
export declare function callHelper(command: string, args?: Record<string, string | number | boolean>): DarwinResult;
/**
 * Async version of callHelper for non-blocking operations.
 */
export declare function callHelperAsync(command: string, args?: Record<string, string | number | boolean>): Promise<DarwinResult>;
export declare const darwin: {
    screenshot(options?: {
        region?: string;
        windowId?: number;
        output?: string;
        maxWidth?: number;
    }): DarwinResult;
    mouseMove(x: number, y: number): DarwinResult;
    mouseClick(x: number, y: number, button?: string, count?: number): DarwinResult;
    mouseScroll(deltaY: number, deltaX?: number): DarwinResult;
    keyType(text: string): DarwinResult;
    keyPress(key: string, modifiers?: string): DarwinResult;
    keyHotkey(keys: string): DarwinResult;
    axTree(pid: number, depth?: number): DarwinResult;
    axElementAt(x: number, y: number): DarwinResult;
    ocr(imagePath: string, languages?: string): DarwinResult;
    windowsList(): DarwinResult;
    windowFocus(pid: number, title?: string): DarwinResult;
    windowClose(pid: number, title?: string): DarwinResult;
    screenInfo(): DarwinResult;
    checkPermissions(): DarwinResult;
    axPress(pid: number, title?: string, role?: string): DarwinResult;
    axSetValue(pid: number, value: string, title?: string, role?: string): DarwinResult;
    axFocusElement(pid: number, title?: string, role?: string): DarwinResult;
    axActions(pid: number, title?: string, role?: string): DarwinResult;
};
