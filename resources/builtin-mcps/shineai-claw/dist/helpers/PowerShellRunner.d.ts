/**
 * PowerShellRunner — delegates to PersistentShell for fast execution.
 * Kept as a thin wrapper for backward compatibility with shell-tools and file-tools.
 */
import { ShellResult } from './PersistentShell.js';
export type { ShellResult as PowerShellResult };
export declare function runPowerShell(script: string, timeout?: number): Promise<ShellResult>;
