import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ensureDebugBrowser, findChromiumExecutable, resetEnsureDebugBrowserStateForTests, resolveAutoChromeUserDataDir, resolveCdpEndpoint, } from '../ensure-debug-browser.js';
afterEach(() => {
    resetEnsureDebugBrowserStateForTests();
});
test('resolveCdpEndpoint respects connection options and SHINEAI_BROWSER_CDP_* env', () => {
    assert.deepEqual(resolveCdpEndpoint({}, {}), { host: '127.0.0.1', port: 9222, browserURL: 'http://127.0.0.1:9222' });
    assert.deepEqual(resolveCdpEndpoint({}, { SHINEAI_BROWSER_CDP_HOST: '10.0.0.2', SHINEAI_BROWSER_CDP_PORT: '9333' }), { host: '10.0.0.2', port: 9333, browserURL: 'http://10.0.0.2:9333' });
    assert.deepEqual(resolveCdpEndpoint({ browserURL: 'http://192.168.1.8:9444' }, { SHINEAI_BROWSER_CDP_PORT: '9333' }), { host: '192.168.1.8', port: 9444, browserURL: 'http://192.168.1.8:9444' });
});
test('resolveAutoChromeUserDataDir uses stable per-OS profile paths', () => {
    assert.equal(resolveAutoChromeUserDataDir('win32', { LOCALAPPDATA: 'C:\\Users\\demo\\AppData\\Local' }, () => 'C:\\Users\\demo'), path.join('C:\\Users\\demo\\AppData\\Local', 'shineai', 'auto-chrome'));
    assert.equal(resolveAutoChromeUserDataDir('darwin', {}, () => '/Users/demo'), path.join('/Users/demo', '.shineai', 'auto-chrome'));
    assert.equal(resolveAutoChromeUserDataDir('linux', {}, () => '/home/demo'), path.join('/home/demo', '.shineai', 'auto-chrome'));
});
test('findChromiumExecutable prefers Chrome over Edge on Windows candidate list', () => {
    const found = findChromiumExecutable('win32', {
        LOCALAPPDATA: 'C:\\Users\\demo\\AppData\\Local',
        PROGRAMFILES: 'C:\\Program Files',
        'PROGRAMFILES(X86)': 'C:\\Program Files (x86)',
    }, (candidate) => /(?:Google\\Chrome\\Application\\chrome\.exe|Microsoft\\Edge\\Application\\msedge\.exe)$/i.test(candidate));
    assert.ok(found);
    assert.match(found, /chrome\.exe$/i);
});
test('ensureDebugBrowser returns alreadyRunning when /json/version is reachable', async () => {
    let spawnCount = 0;
    const result = await ensureDebugBrowser({ host: '127.0.0.1', port: 9222 }, {
        probeVersion: async () => ({ Browser: 'FakeChrome/1.0' }),
        probePageTargets: async () => 1,
        spawn: () => {
            spawnCount += 1;
            return fakeChild();
        },
    });
    assert.equal(result.alreadyRunning, true);
    assert.equal(result.spawned, false);
    assert.equal(spawnCount, 0);
});
test('ensureDebugBrowser polls /json for a page target after version is ready', async () => {
    let pageCalls = 0;
    const result = await ensureDebugBrowser({ host: '127.0.0.1', port: 9222, readyTimeoutMs: 1_000, pollIntervalMs: 1 }, {
        probeVersion: async () => ({ Browser: 'FakeChrome/1.0' }),
        probePageTargets: async () => {
            pageCalls += 1;
            return pageCalls >= 3 ? 1 : 0;
        },
        spawn: () => fakeChild(),
        sleep: async () => undefined,
        now: (() => {
            let tick = 0;
            return () => {
                tick += 1;
                return tick * 10;
            };
        })(),
    });
    assert.equal(result.alreadyRunning, true);
    assert.ok(pageCalls >= 3);
});
test('ensureDebugBrowser stays alreadyRunning even if /json never lists a page', async () => {
    const result = await ensureDebugBrowser({ host: '127.0.0.1', port: 9222, readyTimeoutMs: 40, pollIntervalMs: 1 }, {
        probeVersion: async () => ({ Browser: 'FakeChrome/1.0' }),
        probePageTargets: async () => 0,
        spawn: () => fakeChild(),
        sleep: async () => undefined,
        now: (() => {
            let tick = 0;
            return () => ++tick * 20;
        })(),
    });
    assert.equal(result.alreadyRunning, true);
    assert.equal(result.spawned, false);
});
test('ensureDebugBrowser spawns isolated Chrome/Edge when port is down, then waits for readiness', async () => {
    let probeCalls = 0;
    const spawnedArgs = [];
    let mkdirPath = '';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const result = await ensureDebugBrowser({ host: '127.0.0.1', port: 9222, readyTimeoutMs: 1_000, pollIntervalMs: 1 }, {
        platform: 'win32',
        env: {
            LOCALAPPDATA: 'C:\\Users\\demo\\AppData\\Local',
            PROGRAMFILES: 'C:\\Program Files',
            'PROGRAMFILES(X86)': 'C:\\Program Files (x86)',
        },
        existsSync: (candidate) => candidate === chromePath,
        mkdirSync: (dirPath) => {
            mkdirPath = dirPath;
        },
        spawn: (_command, args) => {
            spawnedArgs.splice(0, spawnedArgs.length, ...args);
            return fakeChild();
        },
        probeVersion: async () => {
            probeCalls += 1;
            if (probeCalls < 3)
                throw new Error('not ready');
            return { Browser: 'Chrome/1.0' };
        },
        probePageTargets: async () => 1,
        sleep: async () => undefined,
        now: (() => {
            let tick = 0;
            return () => {
                tick += 1;
                return tick * 10;
            };
        })(),
        homedir: () => 'C:\\Users\\demo',
    });
    assert.equal(result.spawned, true);
    assert.equal(result.alreadyRunning, false);
    assert.equal(result.browserPath, chromePath);
    assert.equal(mkdirPath, path.join('C:\\Users\\demo\\AppData\\Local', 'shineai', 'auto-chrome'));
    assert.ok(spawnedArgs.length > 0);
    assert.ok(spawnedArgs.includes('--remote-debugging-port=9222'));
    assert.ok(spawnedArgs.some((arg) => arg.startsWith('--user-data-dir=')));
    assert.ok(spawnedArgs.includes('--no-first-run'));
    assert.ok(spawnedArgs.includes('--no-default-browser-check'));
    assert.ok(spawnedArgs.includes('about:blank'));
});
test('ensureDebugBrowser dedupes in-flight ensure for the same endpoint', async () => {
    let spawnCount = 0;
    let probeCalls = 0;
    const deps = {
        platform: 'linux',
        env: {},
        existsSync: (candidate) => candidate === '/usr/bin/google-chrome',
        mkdirSync: () => undefined,
        spawn: () => {
            spawnCount += 1;
            return fakeChild();
        },
        probeVersion: async () => {
            probeCalls += 1;
            if (probeCalls <= 2)
                throw new Error('not ready');
            await new Promise((resolve) => setTimeout(resolve, 20));
            return { Browser: 'Chrome/1.0' };
        },
        probePageTargets: async () => 1,
        sleep: async () => undefined,
        now: (() => {
            let tick = 0;
            return () => ++tick * 5;
        })(),
        homedir: () => '/home/demo',
    };
    const [first, second] = await Promise.all([
        ensureDebugBrowser({ host: '127.0.0.1', port: 9555, readyTimeoutMs: 1_000, pollIntervalMs: 1 }, deps),
        ensureDebugBrowser({ host: '127.0.0.1', port: 9555, readyTimeoutMs: 1_000, pollIntervalMs: 1 }, deps),
    ]);
    assert.equal(spawnCount, 1);
    assert.equal(first.spawned, true);
    assert.equal(second.spawned, true);
});
test('ensureDebugBrowser throws a clear install hint when no Chrome/Edge/Chromium exists', async () => {
    await assert.rejects(() => ensureDebugBrowser({ host: '127.0.0.1', port: 9222 }, {
        platform: 'linux',
        env: {},
        existsSync: () => false,
        probeVersion: async () => {
            throw new Error('down');
        },
        probePageTargets: async () => 0,
    }), /请安装 Google Chrome 或 Microsoft Edge/);
});
function fakeChild() {
    return {
        unref() {
            return this;
        },
    };
}
