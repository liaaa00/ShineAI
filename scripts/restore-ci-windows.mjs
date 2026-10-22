// Restore pinned dependencies from a verified installer and the stock Electron runtime.
// Application source always comes from checkout; never npm-install root dependencies.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.platform !== 'win32' || process.env.GITHUB_ACTIONS !== 'true') throw Error('Run only in Windows GitHub Actions');
const input = JSON.parse(fs.readFileSync(path.join(root, 'scripts/packaging/release-inputs.json'), 'utf8')).windowsBootstrap;
const tools = createRequire(path.join(root, '.runtime/packaging/package.json'));
const directory = path.join(root, 'artifacts/input');
const unpacked = path.join(root, 'artifacts/windows-bootstrap');
fs.mkdirSync(directory, { recursive: true });
if (fs.existsSync(unpacked) || fs.existsSync(path.join(root, 'node_modules')) || fs.existsSync(path.join(root, '.runtime/electron'))) throw Error('Bootstrap requires a clean runner checkout');
execFileSync('gh', ['release', 'download', input.release, '--pattern', input.asset, '--dir', directory], { stdio: 'inherit' });
const archive = path.join(directory, input.asset);
const hash = crypto.createHash('sha256');
for await (const bytes of fs.createReadStream(archive)) hash.update(bytes);
if (hash.digest('hex') !== input.sha256) throw Error('Windows bootstrap checksum mismatch');
execFileSync(tools('7zip-bin').path7za, ['x', archive, '-o' + unpacked, '-y', '-bd', '-bb0'], { stdio: 'inherit' });
const app = path.join(unpacked, 'resources/app');
if (JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).name !== 'shineai-dev') throw Error('Unexpected bootstrap application');
// Move only dependencies and ignored runtimes. Tracked public resources stay
// from checkout, so the bootstrap never replaces current source or branding.
for (const relative of ['node_modules', 'resources/git-bash', 'resources/runtime', 'resources/tools', 'resources/voice', 'resources/builtin-mcps/shineai-claw/node_modules']) {
  const target = path.join(root, relative);
  if (fs.existsSync(target)) throw Error('Refusing to overwrite checkout content: ' + relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.renameSync(path.join(app, relative), target);
}
// Packaged Electron omits default_app.asar and cannot launch the checkout.
// Restore the stock archive instead, using the existing pinned checksum and
// path validation shared with local runtime restoration.
fs.rmSync(unpacked, { recursive: true });
fs.rmSync(archive);
const runtimeArchive = path.join(root, '.runtime/electron-v44.5.1-win32-x64.zip');
execFileSync('curl.exe', ['--fail', '--location', '--retry', '3', '--output', runtimeArchive, 'https://github.com/electron/electron/releases/download/v44.5.1/electron-v44.5.1-win32-x64.zip'], { stdio: 'inherit' });
execFileSync('python', [path.join(root, 'scripts/restore-runtime.py')], { stdio: 'inherit' });
if (!fs.existsSync(path.join(root, '.runtime/electron/resources/default_app.asar'))) throw Error('Stock Electron bootstrap is missing');
fs.rmSync(runtimeArchive);
const editor = path.join(root, '.runtime/packaging/rcedit-x64.exe');
execFileSync('curl.exe', ['--fail', '--location', '--retry', '3', '--output', editor, 'https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe'], { stdio: 'inherit' });
const expected = fs.readFileSync(path.join(root, 'scripts/packaging/rcedit.sha256'), 'utf8').trim();
if (crypto.createHash('sha256').update(fs.readFileSync(editor)).digest('hex') !== expected) throw Error('rcedit checksum mismatch');
execFileSync(process.execPath, [path.join(root, 'scripts/packaging/restore-nsis.mjs')], { stdio: 'inherit' });
console.log('Restored verified Windows runtime, ABI 149 dependencies and packaging tools.');
