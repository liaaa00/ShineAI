import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const official=JSON.parse(fs.readFileSync(path.join(root,'package.official.json'),'utf8'));
const packages={};
for(const name of Object.keys(official.dependencies)){
  const file=path.join(root,'node_modules',name,'package.json');
  packages[name]=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')).version:null;
}
const lock=JSON.parse(fs.readFileSync(path.join(root,'dependencies.lock.json'),'utf8'));
lock.packages=packages;
lock.absentPublishedDeclarations=Object.keys(packages).filter(name=>packages[name]===null);
lock.note='Published frontend packages may be bundled into renderer assets rather than installed as runtime packages. Restore the exact snapshot with npm run restore:dependencies; do not replace native binaries with npm install.';
fs.writeFileSync(path.join(root,'dependencies.lock.json'),JSON.stringify(lock,null,2)+'\n');
console.log(JSON.stringify({declared:Object.keys(packages).length,present:Object.values(packages).filter(Boolean).length,absent:lock.absentPublishedDeclarations},null,2));
