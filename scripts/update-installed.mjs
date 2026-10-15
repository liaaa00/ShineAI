import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Close the development application before running. Only generated application
// output is replaced; runtime dependencies and user profiles are untouched.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const install=path.resolve(process.argv[2] || 'E:/AI/ShineAI');
const appRoot=path.join(install,'resources/app');
if (JSON.parse(fs.readFileSync(path.join(appRoot,'package.json'),'utf8')).name !== 'shineai-dev') throw new Error('Target is not the independent development edition');
if (!fs.existsSync(path.join(install,'ShineAI.exe'))) throw new Error('Development executable missing');
const output=path.join(appRoot,'out');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/build-manifest.json'),'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const backup=path.join(root,'artifacts','installed-update-'+Date.now());
const changes=[];
for (const entry of manifest.files) {
  const local=path.resolve(root,'out',entry.path),target=path.resolve(output,entry.path);
  if (!target.startsWith(output+path.sep) || !local.startsWith(path.join(root,'out')+path.sep)) throw new Error('Invalid manifest path');
  for (let parent=path.dirname(target);parent.startsWith(install);parent=path.dirname(parent)) {
    if (fs.existsSync(parent) && fs.lstatSync(parent).isSymbolicLink()) throw new Error('Linked installation path');
  }
  const bytes=fs.readFileSync(local);
  if (hash(bytes) !== entry.sha256) throw new Error('Stale build: '+entry.path);
  if (fs.existsSync(target) && !fs.lstatSync(target).isFile()) throw new Error('Unexpected installed file type');
  const before=fs.existsSync(target)?hash(fs.readFileSync(target)):null;
  if (before !== entry.sha256) changes.push({path:entry.path,before,after:entry.sha256,local,target});
}
fs.mkdirSync(backup,{recursive:true});
const report={date:new Date().toISOString(),install,buildFingerprint:manifest.fingerprint,files:changes.map(({path,before,after})=>({path,before,after})),status:'prepared'};
const record=()=>fs.writeFileSync(path.join(backup,'report.json'),JSON.stringify(report,null,2)+'\n');
for (const entry of changes) if (entry.before) {
  const file=path.join(backup,'out',entry.path);fs.mkdirSync(path.dirname(file),{recursive:true});fs.copyFileSync(entry.target,file);
}
record();
try {
  for (const entry of changes) {
    fs.mkdirSync(path.dirname(entry.target),{recursive:true});
    fs.copyFileSync(entry.local,entry.target);
    if (hash(fs.readFileSync(entry.target)) !== entry.after) throw new Error('Installed hash mismatch: '+entry.path);
  }
  report.status='updated';record();
} catch(error) {
  for (const entry of changes) {
    if (entry.before) fs.copyFileSync(path.join(backup,'out',entry.path),entry.target);
    else fs.rmSync(entry.target,{force:true});
  }
  report.status='rolled-back';record();throw error;
}
console.log(JSON.stringify({updatedFiles:changes.length,backup,buildFingerprint:manifest.fingerprint},null,2));
