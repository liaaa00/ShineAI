import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function once(source, before, after) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) throw new Error('Editor patch layout changed: '+before.slice(0, 80));
  return source.replace(before, after);
}
export function patchEditorRuntime(source) {
  source = source.replace(/\r\n/g, '\n');
  source = once(source, 'vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs"', 'vs: new URL("../monaco/vs", import.meta.url).href');
  source = once(source,
    '    promise.then(function(val) {\n      return hasCanceled_ ? reject(CANCELATION_MESSAGE) : resolve(val);\n    });\n    promise["catch"](reject);',
    '    promise.then(function(val) {\n      return hasCanceled_ ? reject(CANCELATION_MESSAGE) : resolve(val);\n    }, reject);');
  source = once(source, '  __getMonacoInstance\n};\nvar le =', `  __getMonacoInstance,
  reset() {
    if (__getMonacoInstance()?.editor) return;
    window.require?.reset?.();
    setState({ isInitialized: false, monaco: null });
    wrapperPromise = new Promise((resolve, reject) => setState({ resolve, reject }));
  }
};
var le =`);
  const start = source.indexOf('let initPromise = null;');
  const existing = source.indexOf('const localEditorRuntime = createEditorRuntime(loader);');
  const end = source.indexOf('const MAX_PREFIX_CHARS =', start >= 0 ? start : existing);
  if ((start < 0 && existing < 0) || end < 0) throw new Error('Editor readiness layout changed');
  source = source.slice(0, start >= 0 ? start : existing) + `const localEditorRuntime = createEditorRuntime(loader);
function ensureMonacoReady(timeoutMs = 5000, onSlow) {
  return localEditorRuntime.ready(timeoutMs, onSlow);
}
` + source.slice(end);
  if (!source.includes('import { createEditorRuntime }')) source = 'import { createEditorRuntime } from "./dev-editor-runtime.js";\n' + source;
  source = once(source, '  const [fallbackMessage, setFallbackMessage] = reactExports.useState(null);', '  const [fallbackMessage, setFallbackMessage] = reactExports.useState(null);\n  const [editorLoadAttempt, setEditorLoadAttempt] = reactExports.useState(0);');
  source = once(source, '    ensureMonacoReady(MONACO_INIT_TIMEOUT_MS).then((monaco) => {', `    ensureMonacoReady(MONACO_INIT_TIMEOUT_MS, () => {
      if (cancelled) return;
      setRuntimeMode("fallback");
      setFallbackMessage("编辑器加载较慢，完成后会自动恢复。");
    }).then((monaco) => {`);
  source = once(source, 'tab2?.previewMode, needsMonaco, applyTheme2]);', 'tab2?.previewMode, needsMonaco, applyTheme2, editorLoadAttempt]);');
  source = once(source, 'children: fallbackMessage || t2("editor.initFailedFallback") })', `children: fallbackMessage || t2("editor.initFailedFallback") }),
          jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setEditorLoadAttempt(value => value + 1), className: "shrink-0 ml-2 text-accent-blue hover:underline", children: "重试编辑器" })`);
  source = once(source, '          fontSize: 13,\n          fontFamily:', '          readOnly: !tab2.isEditable,\n          fontSize: 13,\n          fontFamily:');
  return source;
}
export function patchEditorRuntimeFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const file = path.join(root, 'src/renderer/assets/index-0LVJEr5c.js');
  fs.writeFileSync(file, patchEditorRuntime(fs.readFileSync(file, 'utf8')));
}
