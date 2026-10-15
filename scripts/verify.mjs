import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'artifacts/build-manifest.json'),'utf8'));
for (const entry of manifest.files) {
  const source=fs.readFileSync(path.join(root,'src',entry.path));
  const output=fs.readFileSync(path.join(root,'out',entry.path));
  if(!source.equals(output)||crypto.createHash('sha256').update(output).digest('hex')!==entry.sha256)throw new Error('Build mismatch: '+entry.path);
}
const html=fs.readFileSync(path.join(root,'out/renderer/index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g))if(!fs.existsSync(path.resolve(root,'out/renderer',match[1])))throw new Error('Missing renderer asset');
const syntaxFiles=['out/main/bootstrap.cjs','out/main/index.js','out/main/runtime/config.cjs','out/main/security/ipc-policy.cjs','out/main/extensions/appearance.cjs','out/preload/index.js','out/renderer/assets/dev-appearance.js','out/renderer/assets/dev-material.js','out/renderer/assets/dev-occlusion.js','out/renderer/assets/index-0LVJEr5c.js','out/renderer/assets/index-DKmSc9lP.js'];
syntaxFiles.push('out/main/extensions/reveal-local-path.cjs','out/renderer/assets/dev-file-links.js');
for(const file of syntaxFiles){const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr);}
const required=['better-sqlite3','node-pty','i18next','@anthropic-ai/claude-agent-sdk','@openai/codex','@google/gemini-cli'];
for(const name of required)if(!fs.existsSync(path.join(root,'node_modules',name,'package.json')))throw new Error('Missing required runtime dependency: '+name);
const main=fs.readFileSync(path.join(root,'src/main/index.js'),'utf8');
if(main.includes('"http://127.0.0.1:19210/auth/oauth/callback"'))throw new Error('Official OAuth port leaked into development runtime');
const report={version:'1.0.6',outputFiles:manifest.files.length,outputMatchesSource:true,syntaxFiles,requiredRuntimePackages:required,buildFingerprint:manifest.fingerprint,scope:'Build integrity and entrypoint checks; real UI evidence is in smoke-report.json'};
fs.writeFileSync(path.join(root,'artifacts/verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
