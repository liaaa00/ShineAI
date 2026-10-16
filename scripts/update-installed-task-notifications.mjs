// Apply the task notification click fix to an independent desktop build, preserving its profile.
// Preserve its runtime, profile routing, credentials, dependencies and branding.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {patchTaskNotificationsMain, patchTaskNotificationsPreload} from './patch-task-notifications.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Pass the independent application installation directory');
const install = path.resolve(process.argv[2]);
const appRoot = path.join(install, 'resources/app');
const metadata = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
if (!['shineai-dev', 'spectrai-dev'].includes(metadata.name)) throw new Error('Refusing to modify an official or unknown application');
const output = path.join(appRoot, 'out');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inputs = new Map([
  ['main/index.js', Buffer.from(patchTaskNotificationsMain(fs.readFileSync(path.join(output, 'main/index.js'), 'utf8')))],
  ['preload/index.js', Buffer.from(patchTaskNotificationsPreload(fs.readFileSync(path.join(output, 'preload/index.js'), 'utf8')))],
  ['main/extensions/task-notifications.cjs', fs.readFileSync(path.join(root, 'out/main/extensions/task-notifications.cjs'))]
]);
const changes = [];
for (const [relative, bytes] of inputs) {
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep)) throw new Error('Path outside application output');
  for (let p = target; p.startsWith(install); p = path.dirname(p)) {
    if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) throw new Error('Linked installation path');
  }
  const before = fs.existsSync(target) ? fs.readFileSync(target) : null;
  if (!before?.equals(bytes)) changes.push({relative,target,bytes,before});
}
const backup = path.join(root, 'artifacts/installed-task-notifications-' + Date.now());
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
