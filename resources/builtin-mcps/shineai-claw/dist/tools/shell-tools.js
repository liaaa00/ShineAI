import { exec } from 'child_process';
import { registerTool } from './registry.js';
import { runPowerShell } from '../helpers/PowerShellRunner.js';
import { PolicyEngine } from '../security/PolicyEngine.js';
const DEFAULT_TIMEOUT = 30000;
function textResult(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
function errorResult(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}
export function registerShellTools() {
    registerTool('shell_execute', process.platform === 'darwin'
        ? '执行 Shell 命令（bash），返回 stdout/stderr/exitCode'
        : '执行 Shell 命令（cmd.exe），返回 stdout/stderr/exitCode', {
        type: 'object',
        properties: {
            command: { type: 'string', description: '要执行的命令' },
            cwd: { type: 'string', description: '工作目录（可选）' },
            timeout: { type: 'number', description: '超时时间（毫秒），默认 30000' },
        },
        required: ['command'],
    }, async (args) => {
        const command = args.command;
        const cwd = args.cwd || undefined;
        const timeout = args.timeout || DEFAULT_TIMEOUT;
        const validation = PolicyEngine.validateCommand(command);
        if (!validation.allowed) {
            return errorResult(`Command blocked: ${validation.reason}`);
        }
        return new Promise((resolve) => {
            exec(command, {
                cwd,
                timeout,
                maxBuffer: 10 * 1024 * 1024,
                windowsHide: true,
                ...(process.platform === 'darwin' ? { shell: '/bin/bash' } : {}),
            }, (error, stdout, stderr) => {
                if (error && 'killed' in error && error.killed) {
                    resolve(errorResult(`Command timed out after ${timeout}ms`));
                    return;
                }
                resolve(textResult({
                    stdout: stdout ?? '',
                    stderr: stderr ?? '',
                    exitCode: error ? error.code ?? 1 : 0,
                }));
            });
        });
    }, { title: 'Shell Execute', readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true });
    if (process.platform === 'win32') {
        registerTool('shell_powershell', '执行 PowerShell 脚本，返回 stdout/stderr/exitCode', {
            type: 'object',
            properties: {
                script: { type: 'string', description: 'PowerShell 脚本内容' },
                cwd: { type: 'string', description: '工作目录（可选）' },
                timeout: { type: 'number', description: '超时时间（毫秒），默认 30000' },
            },
            required: ['script'],
        }, async (args) => {
            const script = args.script;
            const cwd = args.cwd || undefined;
            const timeout = args.timeout || DEFAULT_TIMEOUT;
            const validation = PolicyEngine.validatePowerShellScript(script);
            if (!validation.allowed) {
                return errorResult(`Script blocked: ${validation.reason}`);
            }
            const fullScript = cwd ? `Set-Location '${cwd.replace(/'/g, "''")}'; ${script}` : script;
            try {
                const result = await runPowerShell(fullScript, timeout);
                return textResult({
                    stdout: result.stdout,
                    stderr: result.stderr,
                    exitCode: result.exitCode,
                });
            }
            catch (err) {
                return errorResult(err instanceof Error ? err.message : String(err));
            }
        }, { title: 'Shell PowerShell', readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true });
    }
    if (process.platform === 'darwin') {
        registerTool('shell_osascript', '执行 AppleScript 脚本，返回结果', {
            type: 'object',
            properties: {
                script: { type: 'string', description: 'AppleScript 脚本内容' },
                timeout: { type: 'number', description: '超时时间（毫秒），默认 30000' },
            },
            required: ['script'],
        }, async (args) => {
            const script = args.script;
            const timeout = args.timeout || DEFAULT_TIMEOUT;
            return new Promise((resolve) => {
                exec(`osascript -e ${JSON.stringify(script)}`, { timeout, maxBuffer: 10 * 1024 * 1024, shell: '/bin/bash' }, (error, stdout, stderr) => {
                    if (error && 'killed' in error && error.killed) {
                        resolve(errorResult(`Script timed out after ${timeout}ms`));
                        return;
                    }
                    resolve(textResult({
                        stdout: stdout ?? '',
                        stderr: stderr ?? '',
                        exitCode: error ? error.code ?? 1 : 0,
                    }));
                });
            });
        }, { title: 'AppleScript Execute', readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true });
    }
}
