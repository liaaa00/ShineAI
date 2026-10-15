import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tools = path.join(root, '.runtime/packaging');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'scripts/packaging/nsis-tool.json'), 'utf8'));
const archive = path.join(tools, 'nsis-latest.zip');
if (!fs.existsSync(archive)) {
  fs.mkdirSync(tools, { recursive: true });
  execFileSync('curl.exe', ['--location', '--fail', '--connect-timeout', '15', '--max-time', '60', '--output', archive, lock.url], { windowsHide: true, stdio: 'inherit' });
}
if (crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex') !== lock.sha256) throw new Error('NSIS compiler download checksum mismatch');
const requireTool = createRequire(path.join(tools, 'package.json'));
execFileSync(requireTool('7zip-bin').path7za, ['x', archive, '-o' + path.join(tools, 'nsis-modern'), '-y'], { windowsHide: true, stdio: 'ignore' });
console.log(`Restored verified NSIS ${lock.version}`);
