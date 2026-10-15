import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { brandSource } from './brand-source.mjs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, '.runtime/package.json'));
const { parse } = require('acorn');
const walk = require('acorn-walk');
const original = fs.readFileSync(path.join(root, 'archive/official-1.0.6/src/main/index.js'), 'utf8');
const ast = parse(original, { ecmaVersion: 'latest', sourceType: 'script' });
const decoder = ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'a01');
const array = ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'a00');
const rotation = ast.body.find(n => n.type === 'ExpressionStatement' && original.slice(n.start, n.end).startsWith('(function'));
if (!decoder || !array || !rotation) throw new Error('Unknown upstream decoder layout');
const context = vm.createContext({});
vm.runInContext(original.slice(decoder.start, decoder.end) + '\n' + original.slice(array.start, array.end) + '\nconst a7z = a01;\n' + original.slice(rotation.start, rotation.end), context, { timeout: 30000 });
const aliases = new Set(['a01', 'a7z']);
let changed;
do {
  changed = false;
  walk.simple(ast, { VariableDeclarator(n) {
    if (n.id.type === 'Identifier' && n.init?.type === 'Identifier' && aliases.has(n.init.name) && !aliases.has(n.id.name)) { aliases.add(n.id.name); changed = true; }
  } });
} while (changed);
let replacements = [];
walk.simple(ast, { CallExpression(n) {
  if (n.callee.type === 'Identifier' && aliases.has(n.callee.name) && n.arguments.length === 1 && n.arguments[0].type === 'Literal' && typeof n.arguments[0].value === 'number') {
    const value = context.a01(n.arguments[0].value);
    if (typeof value !== 'string') throw new Error('Unexpected decoded value');
    replacements.push({ start: n.start, end: n.end, value: JSON.stringify(value) });
  }
} });
function replace(source, edits) {
  edits.sort((a,b) => a.start - b.start);
  let offset = 0; const chunks = [];
  for (const edit of edits) {
    if (edit.start < offset) continue;
    chunks.push(source.slice(offset, edit.start), edit.value); offset = edit.end;
  }
  chunks.push(source.slice(offset)); return chunks.join('');
}
let decoded = replace(original, replacements);
const decodedCount = replacements.length;
const normalized = parse(decoded, { ecmaVersion: 'latest', sourceType: 'script' });
const cache = new WeakMap();
function stringValue(n) {
  if (cache.has(n)) return cache.get(n);
  let value;
  if (n.type === 'Literal' && typeof n.value === 'string') value = n.value;
  if (n.type === 'BinaryExpression' && n.operator === '+') {
    const left = stringValue(n.left), right = stringValue(n.right);
    if (left !== undefined && right !== undefined) value = left + right;
  }
  cache.set(n, value); return value;
}
replacements = [];
walk.simple(normalized, { BinaryExpression(n) {
  const value = stringValue(n);
  if (value !== undefined) replacements.push({start:n.start,end:n.end,value:JSON.stringify(value)});
} });
// Prefer the outer concatenation when its children also have replacements.
replacements.sort((a,b) => a.start - b.start || b.end - a.end);
decoded = replace(decoded, replacements);
parse(decoded, { ecmaVersion: 'latest', sourceType: 'script' });
fs.writeFileSync(path.join(root, 'src/main/index.js'), brandSource(decoded));
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/decode-report.json'), JSON.stringify({ decoderCalls: decodedCount, aliases: aliases.size, literalConcatenations: replacements.length, scope: 'Static string decoding only; original control flow and names retained' }, null, 2) + '\n');
console.log('Decoded main-process strings:', decodedCount);
