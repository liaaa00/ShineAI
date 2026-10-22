// Transfer only redistributable application dependencies, never profiles or archives.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tool = createRequire(path.join(root, '.runtime/packaging/package.json'));
const files = [];
for (const relative of ['node_modules', 'resources/builtin-mcps/shineai-claw/node_modules']) {
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw Error('Linked release dependency: ' + full);
      if (entry.isDirectory()) walk(full);
      else {
        if (/^(?:\.env(?:\..*)?|\.npmrc)$/i.test(entry.name)) continue;
        files.push(path.relative(root, full).replaceAll('\\', '/'));
      }
    }
  };
  walk(path.join(root, relative));
}
const output = path.join(root, 'artifacts/release-input');
fs.mkdirSync(output, { recursive: true });
const archive = path.join(output, 'runtime-dependencies.zip');
fs.rmSync(archive, { force: true });
const list = path.join(output, 'files.txt');
fs.writeFileSync(list, files.map(f => '"' + f + '"').join('\n'));
const result = spawnSync(tool('7zip-bin').path7za, ['a', '-tzip', '-mx=3', '-bd', '-scsUTF-8', archive, '@' + list], { cwd: root, stdio: 'inherit', windowsHide: true });
if (result.status !== 0) throw Error('Dependency archive failed');
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
fs.writeFileSync(archive + '.sha256', sha256 + '  runtime-dependencies.zip\n');
console.log(JSON.stringify({ archive, sha256, files: files.length, bytes: fs.statSync(archive).size }));
