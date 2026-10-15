import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'out');
// The only replaced directory is the generated output immediately below the project root.
if (path.dirname(output) !== root || path.basename(output) !== 'out' || fs.lstatSync(root).isSymbolicLink()) throw new Error('Invalid build root');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Refusing to replace linked output');
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(path.join(root, 'src'), output, { recursive: true });
const inventory = [];
function visit(directory) { for (const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) { const file=path.join(directory,entry.name); if(entry.isSymbolicLink())throw new Error('Linked source'); if(entry.isDirectory())visit(file); else inventory.push({path:path.relative(output,file).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}); } }
visit(output);
fs.mkdirSync(path.join(root, 'artifacts'), {recursive:true});
const fingerprint = crypto.createHash('sha256').update(JSON.stringify(inventory)).digest('hex');
fs.writeFileSync(path.join(root, 'artifacts/build-manifest.json'), JSON.stringify({ files:inventory, fingerprint },null,2)+'\n');
console.log(`Built ${inventory.length} files; SHA-256 ${fingerprint}`);
