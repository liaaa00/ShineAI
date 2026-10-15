import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { parse } = createRequire(path.join(root, '.runtime/package.json'))('acorn');
const marker = '/* development: responsive local checks and screenshot shortcuts */';
const processHelper = 'require("./extensions/async-process.cjs")';
function walk(node, callback, parent) {
  if (!node || typeof node !== 'object') return;
  if (node.type) callback(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'start' || key === 'end') continue;
    if (Array.isArray(value)) value.forEach(child => walk(child, callback, node));
    else if (value && typeof value === 'object') walk(value, callback, node);
  }
}
const property = node => node?.property?.value || node?.property?.name;
export function patchLocalResponsiveness(source) {
  if (source.includes(marker)) return source;
  const ast = parse(source, { ecmaVersion: 'latest' });
  const edits = [];
  const replace = (node, text) => edits.push({ start: node.start, end: node.end, text });
  const insert = (position, text) => edits.push({ start: position, end: position, text });
  const functions = Object.fromEntries(ast.body.filter(node => node.type === 'FunctionDeclaration').map(node => [node.id.name, node]));
  if (!functions.A3 || !functions.BI) throw new Error('Unknown local shortcut or proxy layout');
  replace(functions.A3.body, `{k3();b3=require("./extensions/screenshot-shortcuts.cjs").registerScreenshotShortcuts({globalShortcut:r.globalShortcut,bindings:p3,onFull:()=>o3?o3.startScreenshot():v3("full",a02),onWindow:()=>v3("window",a02),onBindingsChanged:bindings=>uYt?.updateAppSetting("keybindings",bindings)});}`);
  replace(functions.BI.body, '{return require("./extensions/provider-proxy.cjs").environmentProxy(process.env);}');
  const claude = ast.body.find(node => node.type === 'ClassDeclaration' && node.id?.name === 'xJe');
  const proxy = claude?.body.body.find(node => (node.key.value || node.key.name) === 'getProxyEnv');
  if (!proxy) throw new Error('Unknown Claude proxy layout');
  replace(proxy.value.body, '{return require("./extensions/provider-proxy.cjs").proxyEnvironment(this.database);}');
  const defaults = ast.body.find(node => node.type === 'VariableDeclaration' && node.declarations.some(item => item.id.name === 'l3'))?.declarations.find(item => item.id.name === 'l3').init;
  if (!defaults) throw new Error('Unknown shortcut defaults layout');
  for (const prop of defaults.properties) {
    if (['screenshotFull', 'screenshotWindow'].includes(prop.key.value || prop.key.name)) replace(prop.value, `require("./extensions/screenshot-shortcuts.cjs").defaults.${prop.key.value || prop.key.name}`);
  }
  // Return the actual bindings after registration has resolved a collision.
  walk(ast, node => {
    if (node.type !== 'CallExpression' || node.arguments[0]?.value !== 'shortcut:save-keybindings') return;
    const handler = node.arguments[1];
    walk(handler, child => {
      if (child.type === 'Property' && (child.key.value || child.key.name) === 'data' && child.value.type === 'Identifier' && child.value.name === 'a0c') replace(child.value, '{...p3}');
    });
  });
  // Convert the existing check call chain, preserving its result schema and cache.
  const audit = ast.body.find(node => node.type === 'ClassDeclaration' && node.id?.name === 'c6');
  if (!audit) throw new Error('Unknown environment checks layout');
  const changed = new Set(['runExecutable', 'resolveCommand']);
  const methods = audit.body.body.filter(node => node.type === 'MethodDefinition');
  let expanded;
  do {
    expanded = false;
    for (const method of methods) {
      const name = method.key.value || method.key.name;
      if (method.value.async || changed.has(name)) continue;
      walk(method.value.body, node => {
        if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.object.type === 'ThisExpression' && changed.has(property(node.callee))) {
          changed.add(name); expanded = true;
        }
      });
    }
  } while (expanded);
  for (const method of methods) {
    const name = method.key.value || method.key.name;
    if (changed.has(name) && !method.value.async) insert(method.start, 'async ');
    walk(method.value.body, node => {
      if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') return;
      if (node.callee.object.type === 'ThisExpression' && changed.has(property(node.callee))) {
        insert(node.start, '(await '); insert(node.end, ')');
      } else if (property(node.callee) === 'spawnSync') {
        replace(node.callee, processHelper + '.spawnResult');
        insert(node.start, '(await '); insert(node.end, ')');
      }
    });
  }
  // The startup environment reader already lives inside an async ready handler.
  let startup;
  walk(ast, node => {
    if (node.type === 'CallExpression' && node.callee.type === 'FunctionExpression' && source.slice(node.callee.body.start, node.callee.body.start + 32).includes('const hLY=')) startup = node;
  });
  if (!startup) throw new Error('Unknown shell environment bootstrap layout');
  // Rebuild from original spans instead of relying on balanced textual replacements.
  const original = source.slice(startup.start, startup.end);
  const wrapped = '(' + original + ')';
  const shellAst = parse(wrapped, { ecmaVersion: 'latest' });
  const shellEdits = [];
  const shellEdit = (start, end, text) => shellEdits.push({ start: start - 1, end: end - 1, text });
  walk(shellAst, node => {
    if (node.type === 'FunctionExpression' && ['hLY', 'hLZ', 'hM0'].some(tag => wrapped.slice(node.body.start, node.body.start + 32).includes('const ' + tag + '='))) {
      shellEdit(node.start, node.start, 'async ');
      if (!wrapped.slice(node.body.start, node.body.start + 32).includes('const hLY=')) shellEdit(node.start - 1, node.start - 1, 'await ');
    }
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && ['execFileSync', 'execSync'].includes(property(node.callee))) {
      const name = property(node.callee);
      shellEdit(node.start, node.start, '(await ');
      shellEdit(node.end, node.end, ')');
      shellEdit(node.callee.start, node.callee.end, processHelper + '.execFileOutput');
      if (name === 'execSync') {
        // The only execSync here is the fallback PATH query.
        shellEdit(node.arguments[0].start, node.arguments[0].end, '"cmd.exe",["/d","/s","/c","echo %PATH%"]');
      }
    }
  });
  let shell = original;
  for (const edit of shellEdits.sort((a, b) => b.start - a.start || b.end - a.end)) shell = shell.slice(0, edit.start) + edit.text + shell.slice(edit.end);
  replace(startup, '(await (' + shell + '))');
  for (const edit of edits.sort((a, b) => b.start - a.start || b.end - a.end)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  parse(source, { ecmaVersion: 'latest' });
  return source + '\n' + marker + '\n';
}

export function patchRuntimePorts(source) {
  const portMarker = '/* development: asynchronous runtime port discovery */';
  if (source.includes(portMarker)) return source;
  const ast = parse(source, { ecmaVersion: 'latest' });
  const edits = [];
  const functions = new Set();
  const makeAsync = node => {
    if (!node.async && !functions.has(node)) {
      functions.add(node);
      edits.push({ start: node.start, end: node.start, text: 'async ' });
    }
  };
  let count = 0;
  function visit(node, ancestors = []) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === '$E') {
      const enclosing = ancestors.filter(item => ['FunctionExpression', 'ArrowFunctionExpression', 'FunctionDeclaration'].includes(item.type));
      const nearest = enclosing.at(-1);
      if (source.slice(nearest?.body.start, nearest?.body.start + 35).includes('const aC3=')) return; // Chromium port selection must precede app.ready.
      if (!nearest?.async) {
        const tag = source.slice(nearest.body.start, nearest.body.start + 35);
        if (!tag.includes('const aC6=') && !tag.includes('const aC7=')) throw new Error('Unknown synchronous runtime port caller');
        makeAsync(nearest);
        const immediate = ancestors.find(item => item.type === 'CallExpression' && item.callee === nearest);
        if (!immediate) throw new Error('Unknown runtime port IIFE');
        edits.push({ start: immediate.start, end: immediate.start, text: '(await (' });
        edits.push({ start: immediate.end, end: immediate.end, text: '))' });
        makeAsync(enclosing.at(-2));
      }
      edits.push({ start: node.start, end: node.end, text: '(await require("./extensions/port-discovery.cjs").scanPorts())' });
      count++;
    }
    const next = node.type ? [...ancestors, node] : ancestors;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(child => visit(child, next));
      else if (value && typeof value === 'object') visit(value, next);
    }
  }
  visit(ast);
  if (count !== 3) throw new Error('Unknown runtime port scan count: ' + count);
  for (const edit of edits.sort((a, b) => b.start - a.start || b.end - a.end)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  parse(source, { ecmaVersion: 'latest' });
  return source + '\n' + portMarker + '\n';
}
