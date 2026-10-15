/**
 * PowerShellRunner — delegates to PersistentShell for fast execution.
 * Kept as a thin wrapper for backward compatibility with shell-tools and file-tools.
 */
import { shell } from './PersistentShell.js';
export async function runPowerShell(script, timeout = 30000) {
    return shell.exec(script, timeout);
}
