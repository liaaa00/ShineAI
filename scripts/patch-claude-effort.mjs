import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { parse } = createRequire(path.join(root, '.runtime/package.json'))('acorn');
const helper = 'require("./extensions/claude-effort.cjs")';
const marker = '/* development: Claude effort forwarding */';
export function patchClaudeEffort(source) {
  if (source.includes(marker)) return source;
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  const adapter = ast.body.find(node => node.type === 'ClassDeclaration' && node.id?.name === 'xJe');
  if (!adapter) throw new Error('Unknown Claude SDK adapter layout');
  const method = name => {
    const found = adapter.body.body.find(node => (node.key.value || node.key.name) === name);
    if (!found) throw new Error('Unknown Claude adapter method: ' + name);
    return found.value;
  };
  const build = method('buildQueryOptions');
  const result = build.body.body.at(-1);
  if (result.type !== 'ReturnStatement' || !result.argument) throw new Error('Unknown Claude options return layout');
  const setter = method('setReasoningEffort');
  const getter = method('getReasoningEffort');
  const send = method('sendMessageInternal');
  const edits = [
    { start: result.argument.start, end: result.argument.end, text: `${helper}.configureQueryOptions(this,a02,a03,(${source.slice(result.argument.start, result.argument.end)}))` },
    { start: setter.body.start, end: setter.body.end, text: `{${helper}.setSessionEffort(this,a02,a03);}` },
    { start: getter.body.start, end: getter.body.end, text: `{return ${helper}.selectedEffort(this,a02,this.sessionConfigs.get(a02)||{});}` },
    { start: send.body.start + 1, end: send.body.start + 1, text: `await ${helper}.synchronizeBeforeInput(this,a02);` },
  ];
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  return source + '\n' + marker + '\n';
}
