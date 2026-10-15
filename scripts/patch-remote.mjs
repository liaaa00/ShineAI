import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, '.runtime/package.json'));
const { parse } = require('acorn'), walk = require('acorn-walk');
export function patchRemote(source) {
  if (source.includes('/* ShineAI self-hosted remote adapter */')) return source;
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'script' }); let target;
  walk.ancestor(ast, { CallExpression(node, ancestors) {
    if (node.arguments[0]?.value !== 'session:get-all' || node.callee?.property?.value !== 'handle') return;
    target = ancestors.findLast(n => n.type === 'FunctionDeclaration');
  } });
  if (!target || target.params[0]?.type !== 'Identifier') throw new Error('Upstream session registration changed');
  const at = target.body.start + 1;
  return source.slice(0, at) + `/* ShineAI self-hosted remote adapter */require("./extensions/remote-bridge.cjs").attachRuntime(${target.params[0].name});` + source.slice(at);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(root, 'src/main/index.js'); fs.writeFileSync(file, patchRemote(fs.readFileSync(file, 'utf8')));
}
