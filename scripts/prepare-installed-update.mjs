import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const staging=path.resolve(process.argv[2]||'');
const install=path.resolve(process.argv[3]||'E:/AI/ShineAI');
if(!staging.startsWith(path.join(root,'artifacts')+path.sep))throw Error('Staging directory must be inside artifacts');
const appRoot=path.join(install,'resources/app'),output=path.join(appRoot,'out');
if(JSON.parse(fs.readFileSync(path.join(appRoot,'package.json'),'utf8')).name!=='shineai-dev')throw Error('Unexpected installation identity');
if(!fs.existsSync(path.join(install,'ShineAI.exe')))throw Error('Installed executable missing');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/build-manifest.json'),'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
if(fs.existsSync(staging))throw Error('Staging directory already exists');
fs.mkdirSync(staging,{recursive:true});
const files=[];
for(const entry of manifest.files){
  const rel=entry.path.split('/');
  if(rel.some(part=>!part||part==='.'||part==='..'))throw Error('Invalid manifest path');
  const source=path.resolve(root,'out',...rel),target=path.resolve(output,...rel),payload=path.resolve(staging,'payload',...rel),backup=path.resolve(staging,'backup',...rel);
  if(!source.startsWith(path.join(root,'out')+path.sep)||!target.startsWith(output+path.sep))throw Error('Manifest escaped the output directory');
  for(let parent=path.dirname(target);parent.startsWith(install);parent=path.dirname(parent))if(fs.existsSync(parent)&&fs.lstatSync(parent).isSymbolicLink())throw Error('Linked installation path');
  const bytes=fs.readFileSync(source);if(hash(bytes)!==entry.sha256)throw Error('Build manifest mismatch: '+entry.path);
  if(fs.existsSync(target)&&!fs.lstatSync(target).isFile())throw Error('Unexpected installed file type');
  const before=fs.existsSync(target)?hash(fs.readFileSync(target)):null;
  if(before===entry.sha256)continue;
  fs.mkdirSync(path.dirname(payload),{recursive:true});fs.writeFileSync(payload,bytes);
  if(before!==null){fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(target,backup);}
  files.push({path:entry.path,before,after:entry.sha256});
}
const report={status:'prepared',install,createdAt:new Date().toISOString(),fingerprint:manifest.fingerprint,files,userDataModified:false};
fs.writeFileSync(path.join(staging,'report.json'),JSON.stringify(report,null,2)+'\n');
const watcher=path.resolve(root,'artifacts/pending-installed-update-1792767050142');
for(const name of ['wait-and-update.py','process-control.ps1'])fs.copyFileSync(path.join(watcher,name),path.join(staging,name));
fs.writeFileSync(path.join(root,'artifacts/pending-installed-update.json'),JSON.stringify({directory:staging,fingerprint:manifest.fingerprint,files:files.length},null,2)+'\n');
console.log(JSON.stringify({directory:staging,fingerprint:manifest.fingerprint,files:files.length},null,2));
