import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INLINE_JXA = String.raw `
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[key] = next
      i += 1
    } else {
      out[key] = true
    }
  }
  return out
}

function appProcess(systemEvents, processName) {
  const matches = systemEvents.applicationProcesses.whose({ name: processName })()
  if (!matches.length) throw new Error('process not found: ' + processName)
  return matches[0]
}

function clickMenuPath(processName, menuPath) {
  const systemEvents = Application('System Events')
  const proc = appProcess(systemEvents, processName)
  proc.frontmost = true
  delay(0.15)

  if (menuPath.length < 2) throw new Error('menuPath must include top-level menu and item')
  let current = proc.menuBars[0].menuBarItems.byName(menuPath[0]).menus[0]
  for (let i = 1; i < menuPath.length; i += 1) {
    const item = current.menuItems.byName(menuPath[i])
    if (i === menuPath.length - 1) {
      item.click()
      return { clicked: menuPath }
    }
    current = item.menus[0]
  }
  return { clicked: menuPath }
}

function run(argv) {
  const args = parseArgs(argv)
  if (args.op === 'selectMenu') {
    const menuPath = JSON.parse(args.menuPath || '[]')
    return JSON.stringify({ ok: true, data: clickMenuPath(args.processName, menuPath) })
  }
  return JSON.stringify({ ok: false, error: 'unsupported inline op: ' + args.op })
}
`;
function scriptPath() {
    return join(__dirname, '..', '..', '..', 'scripts', 'macos-ax-smoke.jxa');
}
function parseJSONResult(stdout, stderr) {
    const trimmed = stdout.trim();
    if (!trimmed) {
        return { ok: false, error: 'osascript returned no stdout', stderr };
    }
    try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed.ok === 'boolean')
            return { ...parsed, stderr };
        return { ok: true, data: parsed, stderr };
    }
    catch (error) {
        return {
            ok: false,
            error: `Invalid JSON from osascript: ${error instanceof Error ? error.message : String(error)}`,
            stderr,
        };
    }
}
export async function runJXA(args, timeoutMs = 10_000) {
    if (process.platform !== 'darwin') {
        return { ok: false, error: 'JXA adapter is only supported on macOS.' };
    }
    const path = scriptPath();
    const osascriptArgs = existsSync(path)
        ? ['-l', 'JavaScript', path, ...args]
        : ['-l', 'JavaScript', '-e', INLINE_JXA, ...args];
    return new Promise(resolve => {
        const child = execFile('osascript', osascriptArgs, { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                resolve({ ok: false, error: error.message, stderr });
                return;
            }
            resolve(parseJSONResult(stdout, stderr));
        });
        child.stdin?.end();
    });
}
export async function selectMenuWithJXA(processName, menuPath) {
    return runJXA([
        '--op',
        'selectMenu',
        '--processName',
        processName,
        '--menuPath',
        JSON.stringify(menuPath),
    ]);
}
export function readJXASmokeScript() {
    const path = scriptPath();
    if (existsSync(path))
        return readFileSync(path, 'utf8');
    return INLINE_JXA;
}
