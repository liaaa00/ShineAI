// Apply only the workbench layout fix to an older independent desktop build.
// Preserve its runtime, profile routing, credentials, dependencies and branding.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {patchWorkbenchSource, patchWorkbenchHtml} from './patch-workbench.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Pass the independent application installation directory');
const install = path.resolve(process.argv[2]);
const appRoot = path.join(install, 'resources/app');
const metadata = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
if (!['shineai-dev', 'spectrai-dev'].includes(metadata.name)) throw new Error('Refusing to modify an official or unknown application');
const renderer = path.join(appRoot, 'out/renderer');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inputs = new Map([
  ['assets/index-DKmSc9lP.js', Buffer.from(patchWorkbenchSource(fs.readFileSync(path.join(renderer, 'assets/index-DKmSc9lP.js'), 'utf8')))],
  ['index.html', Buffer.from(patchWorkbenchHtml(fs.readFileSync(path.join(renderer, 'index.html'), 'utf8')))],
  ...['dev-workbench.js', 'dev-workbench.css'].map(name => ['assets/' + name, fs.readFileSync(path.join(root, 'out/renderer/assets', name))])
]);
const changes = [];
for (const [relative, bytes] of inputs) {
  const target = path.resolve(renderer, relative);
  if (!target.startsWith(renderer + path.sep)) throw new Error('Path outside renderer');
  for (let p = target; p.startsWith(install); p = path.dirname(p)) {
    if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) throw new Error('Linked installation path');
  }
  const before = fs.existsSync(target) ? fs.readFileSync(target) : null;
  if (!before?.equals(bytes)) changes.push({relative,target,bytes,before});
}
const backup = path.join(root, 'artifacts/installed-workbench-' + Date.now());
fs.mkdirSync(backup, {recursive:true});
for (const {relative,before} of changes) if (before) {
  const target = path.join(backup, relative);
  fs.mkdirSync(path.dirname(target), {recursive:true});fs.writeFileSync(target,before);
}
const report = {install,backup,status:'prepared',files:changes.map(c=>({path:c.relative,before:c.before?hash(c.before):null,after:hash(c.bytes)}))};
const record = () => fs.writeFileSync(path.join(backup,'report.json'),JSON.stringify(report,null,2)+'\n');
record();
try {
  for (const {target,bytes} of changes) {fs.writeFileSync(target,bytes);if(hash(fs.readFileSync(target))!==hash(bytes))throw new Error('Installed content mismatch');}
  report.status='updated';record();
} catch(error) {
  for(const {target,before} of changes)if(before)fs.writeFileSync(target,before);else fs.rmSync(target,{force:true});
  report.status='rolled-back';record();throw error;
}
console.log(JSON.stringify(report,null,2));
