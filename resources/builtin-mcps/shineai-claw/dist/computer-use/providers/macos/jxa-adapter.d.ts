export interface JXAResult<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string;
    stderr?: string;
}
export declare function runJXA<T = unknown>(args: string[], timeoutMs?: number): Promise<JXAResult<T>>;
export declare function selectMenuWithJXA(processName: string, menuPath: string[]): Promise<JXAResult<{
    clicked: string[];
}>>;
export declare function readJXASmokeScript(): string;
