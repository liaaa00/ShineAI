/**
 * macOS platform helper — calls the pre-compiled Swift helper binary.
 * Equivalent of PersistentShell.ts for Windows.
 */
import { execFileSync, execFile } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DaemonLifecycle } from './DaemonLifecycle.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Swift helper binary path — look for compiled binary, fall back to swift run
const HELPER_PATHS = [
    join(__dirname, '..', 'bin', 'darwin', 'shineai-claw-helper'),
    join(__dirname, '..', '..', 'src', 'swift-helper', '.build', 'release', 'shineai-claw-helper'),
    join(__dirname, '..', '..', 'src', 'swift-helper', '.build', 'debug', 'shineai-claw-helper'),
];
function findHelper() {
    for (const p of HELPER_PATHS) {
        if (existsSync(p))
            return p;
    }
    return 'swift-run-fallback';
}
let helperPath = null;
function getHelperPath() {
    if (!helperPath) {
        helperPath = findHelper();
    }
    return helperPath;
}
function findDaemonHelperBinary() {
    for (const p of HELPER_PATHS) {
        if (existsSync(p))
            return p;
    }
    return HELPER_PATHS[0];
}
let daemonLifecycle = null;
export let daemonClient = null;
export async function getDaemonClient() {
    if (daemonClient) {
        return daemonClient;
    }
    if (!daemonLifecycle) {
        daemonLifecycle = new DaemonLifecycle({
            helperBinary: findDaemonHelperBinary(),
        });
    }
    daemonClient = await daemonLifecycle.ensure();
    return daemonClient;
}
/**
 * Call the Swift helper with a command and arguments.
 * Returns parsed JSON result.
 */
export function callHelper(command, args = {}) {
    const hp = getHelperPath();
    const flatArgs = Object.entries(args)
        .filter(([_, v]) => v !== undefined && v !== null)
        .flatMap(([k, v]) => [`--${k}`, String(v)]);
    try {
        let result;
        if (hp === 'swift-run-fallback') {
            const packageDir = join(__dirname, '..', '..', 'src', 'swift-helper');
            result = execFileSync('swift', ['run', 'shineai-claw-helper', command, ...flatArgs], {
                encoding: 'utf-8',
                timeout: 30000,
                cwd: packageDir,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        }
        else {
            result = execFileSync(hp, [command, ...flatArgs], {
                encoding: 'utf-8',
                timeout: 30000,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        }
        return { success: true, data: JSON.parse(result.trim()) };
    }
    catch (err) {
        const stderr = err.stderr?.toString() || '';
        const stdout = err.stdout?.toString() || '';
        return { success: false, error: stderr || stdout || err.message };
    }
}
/**
 * Async version of callHelper for non-blocking operations.
 */
export function callHelperAsync(command, args = {}) {
    return new Promise((resolve) => {
        const hp = getHelperPath();
        const flatArgs = Object.entries(args)
            .filter(([_, v]) => v !== undefined && v !== null)
            .flatMap(([k, v]) => [`--${k}`, String(v)]);
        const execFn = hp === 'swift-run-fallback'
            ? {
                cmd: 'swift',
                cmdArgs: ['run', 'shineai-claw-helper', command, ...flatArgs],
                cwd: join(__dirname, '..', '..', 'src', 'swift-helper'),
            }
            : { cmd: hp, cmdArgs: [command, ...flatArgs], cwd: undefined };
        execFile(execFn.cmd, execFn.cmdArgs, {
            encoding: 'utf-8',
            timeout: 30000,
            cwd: execFn.cwd,
        }, (err, stdout, stderr) => {
            if (err) {
                resolve({ success: false, error: stderr || stdout || err.message });
            }
            else {
                try {
                    resolve({ success: true, data: JSON.parse(stdout.trim()) });
                }
                catch {
                    resolve({ success: false, error: `Invalid JSON: ${stdout}` });
                }
            }
        });
    });
}
// Convenience functions for common operations
// TODO(T9): replace execFileSync calls with daemonClient.call()
export const darwin = {
    screenshot(options) {
        const args = {};
        if (options?.region)
            args.region = options.region;
        if (options?.windowId)
            args['window-id'] = options.windowId;
        if (options?.output)
            args.output = options.output;
        if (options?.maxWidth)
            args['max-width'] = options.maxWidth;
        return callHelper('screenshot', args);
    },
    mouseMove(x, y) {
        return callHelper('mouse-move', { x, y });
    },
    mouseClick(x, y, button = 'left', count = 1) {
        return callHelper('mouse-click', { x, y, button, count });
    },
    mouseScroll(deltaY, deltaX = 0) {
        return callHelper('mouse-scroll', { 'delta-y': deltaY, 'delta-x': deltaX });
    },
    keyType(text) {
        return callHelper('key-type', { text });
    },
    keyPress(key, modifiers) {
        const args = { key };
        if (modifiers)
            args.modifiers = modifiers;
        return callHelper('key-press', args);
    },
    keyHotkey(keys) {
        return callHelper('key-hotkey', { keys });
    },
    axTree(pid, depth = 5) {
        return callHelper('ax-tree', { pid, depth });
    },
    axElementAt(x, y) {
        return callHelper('ax-element-at', { x, y });
    },
    ocr(imagePath, languages = 'en-US') {
        return callHelper('ocr', { image: imagePath, languages });
    },
    windowsList() {
        return callHelper('windows', {});
    },
    windowFocus(pid, title) {
        const args = { pid };
        if (title)
            args.title = title;
        return callHelper('window-focus', args);
    },
    windowClose(pid, title) {
        const args = { pid };
        if (title)
            args.title = title;
        return callHelper('window-close', args);
    },
    screenInfo() {
        return callHelper('screen-info', {});
    },
    checkPermissions() {
        return callHelper('permissions', {});
    },
    axPress(pid, title, role) {
        const args = { pid };
        if (title)
            args.title = title;
        if (role)
            args.role = role;
        return callHelper('ax-press', args);
    },
    axSetValue(pid, value, title, role) {
        const args = { pid, value };
        if (title)
            args.title = title;
        if (role)
            args.role = role;
        return callHelper('ax-set-value', args);
    },
    axFocusElement(pid, title, role) {
        const args = { pid };
        if (title)
            args.title = title;
        if (role)
            args.role = role;
        return callHelper('ax-focus', args);
    },
    axActions(pid, title, role) {
        const args = { pid };
        if (title)
            args.title = title;
        if (role)
            args.role = role;
        return callHelper('ax-actions', args);
    },
};
