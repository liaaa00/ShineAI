// Copy only runtime resources from a complete offline backup, never profiles.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandTree, refreshWebPrecache } from './brand-source.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Usage: node scripts/restore-local-resources.mjs <complete-backup>');
const backup = fs.realpathSync(process.argv[2]);
if (backup === fs.realpathSync(root)) throw new Error('Choose an external complete backup');
const relative = ['resources/git-bash', 'resources/runtime', 'resources/tools', 'resources/voice', 'resources/builtin-mcps/shineai-claw/node_modules'];
const oldClaw = Buffer.from('c3BlY3RyYWktY2xhdw==', 'base64').toString();
const inputs = relative.map(name => {
  let source = path.join(backup, name);
  if (!fs.existsSync(source) && name.includes('shineai-claw')) source = path.join(backup, name.replace('shineai-claw', oldClaw));
  if (!fs.statSync(source).isDirectory()) throw new Error('Missing backup resource: ' + name);
  return { source, target: path.join(root, name) };
});
for (const { source, target } of inputs) {
  if (!fs.realpathSync(source).startsWith(backup + path.sep)) throw new Error('Linked backup resource');
  fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: false, filter: (file, destination) => {
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Linked resource input');
    for (let at = destination; at !== root; at = path.dirname(at)) {
      if (!at.startsWith(root + path.sep)) throw new Error('Unsafe resource target');
      if (fs.existsSync(at) && fs.lstatSync(at).isSymbolicLink()) throw new Error('Linked resource target');
    }
    return true;
  } });
}
brandTree(path.join(root, 'resources'));
refreshWebPrecache(path.join(root, 'resources/web-client'));
console.log('Restored offline resources; existing files and all user profiles were preserved.');
