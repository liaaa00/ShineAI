// Patch only chat image parsing, reading and the session-copy extension.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {patchChatImagesMain,patchChatImagesPreload,patchChatImagesRenderer} from './patch-chat-images.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.argv[2])throw Error('Pass the independent application installation directory');
const install=path.resolve(process.argv[2]),appRoot=path.join(install,'resources/app'),output=path.join(appRoot,'out');
if(JSON.parse(fs.readFileSync(path.join(appRoot,'package.json'),'utf8')).name!=='shineai-dev')throw Error('Refusing to change an unknown application');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const inputs=new Map([
 ['main/index.js',Buffer.from(patchChatImagesMain(fs.readFileSync(path.join(output,'main/index.js'),'utf8')))],
 ['preload/index.js',Buffer.from(patchChatImagesPreload(fs.readFileSync(path.join(output,'preload/index.js'),'utf8')))],
 ['renderer/assets/index-0LVJEr5c.js',Buffer.from(patchChatImagesRenderer(fs.readFileSync(path.join(output,'renderer/assets/index-0LVJEr5c.js'),'utf8')))],
 ...['main/extensions/chat-image-cache.cjs','renderer/assets/dev-chat-images.mjs'].map(name=>[name,fs.readFileSync(path.join(root,'out',name))])
]);
const changes=[];
for(const [relative,bytes]of inputs){
 const target=path.resolve(output,relative);
 if(!target.startsWith(output+path.sep))throw Error('Path outside installation');
 for(let p=target;p.startsWith(install);p=path.dirname(p))if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Linked installation path');
 const before=fs.existsSync(target)?fs.readFileSync(target):null;
 if(!before?.equals(bytes))changes.push({relative,target,bytes,before});
}
const backup=path.join(root,'artifacts/installed-chat-images-'+Date.now());fs.mkdirSync(backup,{recursive:true});
for(const {relative,before}of changes)if(before){const file=path.join(backup,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,before);}
const report={install,backup,status:'prepared',files:changes.map(c=>({path:c.relative,before:c.before?hash(c.before):null,after:hash(c.bytes)}))};
const record=()=>fs.writeFileSync(path.join(backup,'report.json'),JSON.stringify(report,null,2)+'\n');record();
try{
 for(const {target,bytes}of changes){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);if(hash(fs.readFileSync(target))!==hash(bytes))throw Error('Installed content mismatch');}
 report.status='updated';record();
}catch(error){
 for(const {target,before}of changes)if(before)fs.writeFileSync(target,before);else fs.rmSync(target,{force:true});
 report.status='rolled-back';record();throw error;
}
console.log(JSON.stringify(report,null,2));
