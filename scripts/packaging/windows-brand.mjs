import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
export async function brandWindowsExecutable(root,executable,version) {
  const editor=path.join(root,'.runtime/packaging/rcedit-x64.exe');
  if(!fs.existsSync(editor))throw Error('Missing rcedit 2.0.0; see docs/INSTALLER.md');
  // Pin the tool, rather than executing a binary merely because its name matches.
  const digest=crypto.createHash('sha256').update(fs.readFileSync(editor)).digest('hex');
  const expected=fs.readFileSync(path.join(root,'scripts/packaging/rcedit.sha256'),'utf8').trim();
  if(digest!==expected)throw Error('Windows resource editor hash mismatch');
  const args=[executable,'--set-icon',path.join(root,'resources/icon.ico'),
    '--set-version-string','ProductName','ShineAI',
    '--set-version-string','FileDescription','ShineAI',
    '--set-version-string','InternalName','ShineAI',
    '--set-version-string','OriginalFilename','ShineAI.exe',
    '--set-version-string','CompanyName','ShineAI',
    '--set-version-string','LegalCopyright','ShineAI contributors; upstream and third-party notices apply',
    '--set-file-version',version,'--set-product-version',version];
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const identity=crypto.createHash('sha256').update(JSON.stringify(args)+hash(path.join(root,'resources/icon.ico'))+digest).digest('hex');
  const record=path.join(root,'artifacts/windows-brand-cache.json');
  try{const cached=JSON.parse(fs.readFileSync(record,'utf8'));if(cached.identity===identity&&cached.executableHash===hash(executable))return;}catch{}
  await run(editor,args,{windowsHide:true});
  fs.writeFileSync(record,JSON.stringify({identity,executableHash:hash(executable)},null,2)+'\n');
}
