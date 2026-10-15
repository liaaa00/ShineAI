import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fingerprints=[];
for(let i=0;i<2;i++){
  const result=spawnSync(process.execPath,[path.join(root,'scripts/build.mjs')],{cwd:root,encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr);
  fingerprints.push(JSON.parse(fs.readFileSync(path.join(root,'artifacts/build-manifest.json'),'utf8')).fingerprint);
}
if(fingerprints[0]!==fingerprints[1])throw new Error('Builds are not reproducible');
fs.writeFileSync(path.join(root,'artifacts/reproducibility.json'),JSON.stringify({matching:true,fingerprint:fingerprints[0]},null,2)+'\n');
console.log('Two builds match: '+fingerprints[0]);
