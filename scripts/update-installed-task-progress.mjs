// Change only the progress UI and default language policy in the independent
// installation. Prepare every transformation before modifying installed files.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { patchTaskProgressMain, patchTaskProgressRenderer, patchTaskProgressHtml } from './patch-task-progress.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw Error('Pass the independent application installation directory');
const install = path.resolve(process.argv[2]), appRoot = path.join(install, 'resources/app'), output = path.join(appRoot, 'out');
if (JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8')).name !== 'shineai-dev') throw Error('Unknown installation');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inputs = new Map([
  ...[['main/index.js', patchTaskProgressMain], ['renderer/assets/index-0LVJEr5c.js', patchTaskProgressRenderer], ['renderer/index.html', patchTaskProgressHtml]].map(([name, patch]) => [name, Buffer.from(patch(fs.readFileSync(path.join(output, name), 'utf8')))]),
  ...['renderer/assets/dev-task-progress.mjs', 'renderer/assets/dev-task-progress.css'].map(name => [name, fs.readFileSync(path.join(root, 'out', name))])
]);
if(process.argv.includes('--include-queue'))for(const name of ['main/extensions/running-input.cjs','renderer/assets/dev-send-preview.mjs','renderer/assets/dev-running-input.mjs'])inputs.set(name,fs.readFileSync(path.join(root,'out',name)));
const changes = [];
for (const [relative, bytes] of inputs) {
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep)) throw Error('Path outside installation');
  for (let parent = target; parent.startsWith(install); parent = path.dirname(parent)) if (fs.existsSync(parent) && fs.lstatSync(parent).isSymbolicLink()) throw Error('Linked installation path');
  const before = fs.existsSync(target) ? fs.readFileSync(target) : null;
  if (!before?.equals(bytes)) changes.push({ relative, target, bytes, before });
}
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({ install, prepared: true, files: changes.map(c => c.relative) }, null, 2));
} else {
  const backup = path.join(root, 'artifacts', 'installed-task-progress-' + Date.now()); fs.mkdirSync(backup, { recursive: true });
  for (const { relative, before } of changes) if (before) { const file = path.join(backup, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, before); }
  const report = { install, backup, status: 'prepared', restartRequired: true, files: changes.map(c => ({ path: c.relative, before: c.before ? hash(c.before) : null, after: hash(c.bytes) })) };
  const record = () => fs.writeFileSync(path.join(backup, 'report.json'), JSON.stringify(report, null, 2) + '\n'); record();
  try {
    for (const { target, bytes } of changes) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); if (hash(fs.readFileSync(target)) !== hash(bytes)) throw Error('Installed content mismatch'); }
    report.status = 'updated'; record();
  } catch (error) {
    for (const { target, before } of changes) if (before) fs.writeFileSync(target, before); else fs.rmSync(target, { force: true });
    report.status = 'rolled-back'; record(); throw error;
  }
  console.log(JSON.stringify(report, null, 2));
}
