import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function patchWebappTestingMain(source) {
  const anchor = 'static["buildRuntimeSection"](a02,a03){';
  const replacement = anchor + 'const webappRuntime=require("./extensions/webapp-testing-runtime.cjs").runtimeSection(a02,a03);if(webappRuntime!==null)return webappRuntime;';
  if (source.includes(replacement)) return source;
  if (source.split(anchor).length !== 2) throw new Error('Skill runtime expansion layout changed');
  return source.replace(anchor, replacement);
}

export function patchWebappTestingFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const target = path.join(root, 'src/main/index.js');
  fs.writeFileSync(target, patchWebappTestingMain(fs.readFileSync(target, 'utf8')));
}
