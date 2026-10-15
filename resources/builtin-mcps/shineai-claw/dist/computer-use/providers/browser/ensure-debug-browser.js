import { spawn as nodeSpawn } from 'node:child_process';
import { existsSync as nodeExistsSync, mkdirSync as nodeMkdirSync } from 'node:fs';
import http from 'node:http';
import { homedir } from 'node:os';
import path from 'node:path';
import { URL } from 'node:url';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 9222;
const DEFAULT_READY_TIMEOUT_MS = 15_000;
const DEFAULT_POLL_INTERVAL_MS = 250;
const BROWSER_MISSING_MESSAGE = '请安装 Google Chrome 或 Microsoft Edge。';
const inflightByEndpoint = new Map();
export function resolveCdpEndpoint(options = {}, env = process.env) {
    const parsed = options.browserURL ? new URL(options.browserURL) : null;
    const host = options.host ?? parsed?.hostname ?? env.SHINEAI_BROWSER_CDP_HOST ?? DEFAULT_HOST;
    const port = options.port ??
        (parsed?.port ? Number(parsed.port) : Number(env.SHINEAI_BROWSER_CDP_PORT ?? DEFAULT_PORT));
    const browserURL = options.browserURL ?? `http://${host}:${port}`;
    return { host, port, browserURL };
}
export function resolveAutoChromeUserDataDir(platform = process.platform, env = process.env, resolveHomedir = homedir) {
    if (platform === 'win32') {
        const localAppData = env.LOCALAPPDATA || path.join(resolveHomedir(), 'AppData', 'Local');
        return path.join(localAppData, 'shineai', 'auto-chrome');
    }
    return path.join(resolveHomedir(), '.shineai', 'auto-chrome');
}
export function findChromiumExecutable(platform = process.platform, env = process.env, existsSync = nodeExistsSync) {
    for (const candidate of browserCandidates(platform, env)) {
        if (existsSync(candidate))
            return candidate;
    }
    return null;
}
export async function ensureDebugBrowser(options = {}, deps = {}) {
    const env = deps.env ?? process.env;
    const endpoint = resolveCdpEndpoint(options, env);
    const key = `${endpoint.host}:${endpoint.port}`;
    const existing = inflightByEndpoint.get(key);
    if (existing)
        return await existing;
    const task = runEnsure(endpoint, options, deps).finally(() => {
        if (inflightByEndpoint.get(key) === task) {
            inflightByEndpoint.delete(key);
        }
    });
    inflightByEndpoint.set(key, task);
    return await task;
}
/** ponytail: test helper only — clears in-flight map between cases. */
export function resetEnsureDebugBrowserStateForTests() {
    inflightByEndpoint.clear();
}
async function runEnsure(endpoint, options, deps) {
    const env = deps.env ?? process.env;
    const platform = deps.platform ?? process.platform;
    const existsSync = deps.existsSync ?? nodeExistsSync;
    const mkdirSync = deps.mkdirSync ?? nodeMkdirSync;
    const spawn = deps.spawn ?? nodeSpawn;
    const probeVersion = deps.probeVersion ?? defaultProbeVersion;
    const probePageTargets = deps.probePageTargets ?? defaultProbePageTargets;
    const sleep = deps.sleep ?? defaultSleep;
    const now = deps.now ?? Date.now;
    const resolveHomedir = deps.homedir ?? homedir;
    const readyTimeoutMs = options.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    if (await isDebugPortReady(endpoint.browserURL, probeVersion)) {
        // ponytail: already-running Chrome is version-ready; only short-poll pages so /json/new can still run.
        await waitForPageTargetSoft(endpoint.browserURL, probePageTargets, sleep, now, now() + Math.min(readyTimeoutMs, 1_000), pollIntervalMs);
        return {
            ...endpoint,
            alreadyRunning: true,
            spawned: false,
        };
    }
    const browserPath = findChromiumExecutable(platform, env, existsSync);
    if (!browserPath) {
        throw new Error(BROWSER_MISSING_MESSAGE);
    }
    const userDataDir = resolveAutoChromeUserDataDir(platform, env, resolveHomedir);
    mkdirSync(userDataDir, { recursive: true });
    const args = [
        `--remote-debugging-port=${endpoint.port}`,
        `--user-data-dir=${userDataDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        'about:blank',
    ];
    // Never kill/restart the user's everyday Chrome — spawn an isolated profile only.
    const child = spawn(browserPath, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env,
    });
    child.unref?.();
    const deadline = now() + readyTimeoutMs;
    while (now() < deadline) {
        if (await isDebugPortReady(endpoint.browserURL, probeVersion)) {
            await waitForPageTargetSoft(endpoint.browserURL, probePageTargets, sleep, now, deadline, pollIntervalMs);
            return {
                ...endpoint,
                alreadyRunning: false,
                spawned: true,
                browserPath,
                userDataDir,
            };
        }
        await sleep(pollIntervalMs);
    }
    throw new Error(`CDP debug port ${endpoint.host}:${endpoint.port} did not become ready within ${readyTimeoutMs}ms after launching ${browserPath}.`);
}
async function isDebugPortReady(browserURL, probeVersion) {
    try {
        await probeVersion(browserURL, 1_000);
        return true;
    }
    catch {
        return false;
    }
}
/** ponytail: version-up is enough to return; missing page targets still allow /json/new later. */
async function waitForPageTargetSoft(browserURL, probePageTargets, sleep, now, deadline, pollIntervalMs) {
    while (now() < deadline) {
        try {
            const count = await probePageTargets(browserURL, 1_000);
            if (count > 0)
                return;
        }
        catch {
            // /json can lag behind /json/version while Chrome is still creating the first tab
        }
        if (now() >= deadline)
            return;
        await sleep(pollIntervalMs);
    }
}
function defaultProbeVersion(browserURL, timeoutMs = 1_000) {
    const url = new URL('/json/version', browserURL);
    return new Promise((resolve, reject) => {
        const request = http.get(url, {
            timeout: timeoutMs,
            headers: { accept: 'application/json' },
        }, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`CDP /json/version returned ${response.statusCode}`));
                    return;
                }
                try {
                    resolve(JSON.parse(body));
                }
                catch (error) {
                    reject(error);
                }
            });
        });
        request.on('timeout', () => {
            request.destroy(new Error(`Timed out probing ${url.href}`));
        });
        request.on('error', (error) => {
            reject(error);
        });
    });
}
function defaultProbePageTargets(browserURL, timeoutMs = 1_000) {
    const url = new URL('/json', browserURL);
    return new Promise((resolve, reject) => {
        const request = http.get(url, {
            timeout: timeoutMs,
            headers: { accept: 'application/json' },
        }, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`CDP /json returned ${response.statusCode}`));
                    return;
                }
                try {
                    const payload = JSON.parse(body);
                    const count = Array.isArray(payload) ? payload.filter((item) => String(item.type ?? '') === 'page').length : 0;
                    resolve(count);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
        request.on('timeout', () => {
            request.destroy(new Error(`Timed out probing ${url.href}`));
        });
        request.on('error', (error) => {
            reject(error);
        });
    });
}
function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function browserCandidates(platform, env) {
    if (platform === 'win32') {
        const localAppData = env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local');
        const programFiles = env.PROGRAMFILES || 'C:\\Program Files';
        const programFilesX86 = env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
        return [
            path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
            path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
            path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
            path.join(programFiles, 'Chromium', 'Application', 'chrome.exe'),
            path.join(localAppData, 'Chromium', 'Application', 'chrome.exe'),
        ];
    }
    if (platform === 'darwin') {
        return [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        ];
    }
    return [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/usr/bin/microsoft-edge',
        '/usr/bin/microsoft-edge-stable',
        '/usr/local/bin/google-chrome',
        '/usr/local/bin/chromium',
    ];
}
