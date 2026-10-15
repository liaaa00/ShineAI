import * as path from 'path';
/**
 * Security policy engine for validating commands, process operations, and file paths.
 */
export class PolicyEngine {
    /** Commands/keywords that are never allowed */
    static BLOCKED_COMMANDS = [
        'format',
        'del /s',
        'rd /s',
        'rmdir /s',
        'reg delete',
        'bcdedit',
        'diskpart',
        'cipher /w',
        'sfc /scannow',
        'shutdown',
        'restart-computer',
        'stop-computer',
        'clear-disk',
        'remove-item -recurse -force c:',
        'remove-item -recurse -force "c:',
        'invoke-expression',
        'invoke-webrequest',
        'set-executionpolicy',
        'start-process.*-verb runas',
    ];
    /** Dangerous macOS commands/keywords that are never allowed */
    static BLOCKED_COMMANDS_DARWIN = [
        'rm -rf /',
        'rm -rf ~',
        'mkfs',
        'dd if=',
        'diskutil eraseDisk',
        'diskutil eraseVolume',
        'csrutil disable',
        'nvram boot-args',
        'launchctl unload',
        'killall WindowServer',
        'killall loginwindow',
        'killall Finder',
        'defaults delete',
        'sudo rm',
    ];
    /** Patterns that indicate shell injection attempts */
    static INJECTION_PATTERNS = [
        /[;&|`]/, // shell metacharacters (not $ since used in PS variables)
        /\$\(/, // command substitution
        />\s*\\\\\.\\/, // device redirection
        /invoke-expression/i,
        /iex\s/i,
        /set-executionpolicy/i,
    ];
    /** System processes that must never be killed */
    static PROTECTED_PROCESSES = [
        'csrss',
        'winlogon',
        'services',
        'lsass',
        'svchost',
        'system',
        'smss',
        'wininit',
        'dwm',
        'conhost',
        'ntoskrnl',
        'system idle process',
        'explorer',
        'spoolsv',
        'wuauserv',
    ];
    /** macOS processes that must never be killed */
    static PROTECTED_PROCESSES_DARWIN = [
        'kernel_task',
        'launchd',
        'WindowServer',
        'loginwindow',
        'mds',
        'mds_stores',
        'opendirectoryd',
        'coreaudiod',
        'bluetoothd',
        'fseventsd',
        'notifyd',
        'diskarbitrationd',
        'configd',
        'securityd',
    ];
    /** Directories that should not be written to or deleted from */
    static PROTECTED_PATHS = [
        'C:\\Windows',
        'C:\\Program Files',
        'C:\\Program Files (x86)',
        'C:\\$Recycle.Bin',
        'C:\\System Volume Information',
        'C:\\ProgramData\\Microsoft',
    ];
    /** macOS directories that should not be written to or deleted from */
    static PROTECTED_PATHS_DARWIN = [
        '/System',
        '/usr/bin',
        '/usr/sbin',
        '/usr/lib',
        '/Library/Apple',
        '/private/var/db',
    ];
    static getBlockedCommands() {
        switch (process.platform) {
            case 'darwin':
                return this.BLOCKED_COMMANDS_DARWIN;
            case 'win32':
                return this.BLOCKED_COMMANDS;
            default:
                return [...this.BLOCKED_COMMANDS, ...this.BLOCKED_COMMANDS_DARWIN];
        }
    }
    static getProtectedProcesses() {
        switch (process.platform) {
            case 'darwin':
                return this.PROTECTED_PROCESSES_DARWIN;
            case 'win32':
                return this.PROTECTED_PROCESSES;
            default:
                return [...this.PROTECTED_PROCESSES, ...this.PROTECTED_PROCESSES_DARWIN];
        }
    }
    static getProtectedPaths() {
        switch (process.platform) {
            case 'darwin':
                return this.PROTECTED_PATHS_DARWIN;
            case 'win32':
                return this.PROTECTED_PATHS;
            default:
                return [...this.PROTECTED_PATHS, ...this.PROTECTED_PATHS_DARWIN];
        }
    }
    /**
     * Validate a shell command before execution.
     */
    static validateCommand(command) {
        if (!command || command.trim().length === 0) {
            return { allowed: false, reason: 'Empty command' };
        }
        const lower = command.toLowerCase().trim();
        for (const blocked of this.getBlockedCommands()) {
            if (lower.includes(blocked.toLowerCase())) {
                return { allowed: false, reason: `Blocked command pattern: ${blocked}` };
            }
        }
        // Check injection patterns
        for (const pattern of this.INJECTION_PATTERNS) {
            if (pattern.test(command)) {
                return { allowed: false, reason: `Suspicious pattern detected: ${pattern.source}` };
            }
        }
        return { allowed: true };
    }
    /**
     * Validate a PowerShell script before execution.
     */
    static validatePowerShellScript(script) {
        if (!script || script.trim().length === 0) {
            return { allowed: false, reason: 'Empty script' };
        }
        const lower = script.toLowerCase().trim();
        for (const blocked of this.getBlockedCommands()) {
            if (lower.includes(blocked.toLowerCase())) {
                return { allowed: false, reason: `Blocked command pattern: ${blocked}` };
            }
        }
        return { allowed: true };
    }
    /**
     * Validate whether a process can be killed.
     */
    static validateProcessKill(name) {
        if (!name || name.trim().length === 0) {
            return { allowed: false, reason: 'Empty process name' };
        }
        const lower = name.toLowerCase().trim();
        for (const protected_ of this.getProtectedProcesses()) {
            const protectedLower = protected_.toLowerCase();
            if (lower === protectedLower || lower === `${protectedLower}.exe`) {
                return { allowed: false, reason: `Protected system process: ${name}` };
            }
        }
        return { allowed: true };
    }
    /**
     * Validate a file path for read/write/delete operations.
     */
    static validateFilePath(filePath, operation = 'read') {
        if (!filePath || filePath.trim().length === 0) {
            return { allowed: false, reason: 'Empty file path' };
        }
        // Normalize path first to prevent traversal
        const normalized = path.resolve(filePath);
        // For write/delete, check protected paths
        if (operation !== 'read') {
            const normalizedLower = normalized.toLowerCase();
            for (const protectedPath of this.getProtectedPaths()) {
                const normalizedProtectedPath = path.resolve(protectedPath);
                const protectedLower = normalizedProtectedPath.toLowerCase();
                if (normalizedLower === protectedLower ||
                    normalizedLower.startsWith(`${protectedLower}${path.sep}`)) {
                    return {
                        allowed: false,
                        reason: `Cannot ${operation} in protected directory: ${protectedPath}`,
                    };
                }
            }
        }
        return { allowed: true };
    }
    /**
     * Sanitize a numeric value for safe embedding in scripts.
     * Ensures only valid integers/floats pass through.
     */
    static sanitizeNumber(value, defaultVal = 0) {
        if (typeof value === 'number' && isFinite(value)) {
            return value;
        }
        const parsed = Number(value);
        if (isFinite(parsed)) {
            return parsed;
        }
        return defaultVal;
    }
    /**
     * Sanitize a string for safe embedding in PowerShell single-quoted strings.
     * Escapes single quotes and removes dangerous characters.
     */
    static sanitizeForPowerShell(value) {
        // Remove null bytes and control characters
        const cleaned = value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
        // Escape single quotes for PowerShell single-quoted strings
        return cleaned.replace(/'/g, "''");
    }
}
