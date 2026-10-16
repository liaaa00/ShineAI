import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function once(source, before, after) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) throw new Error('Workbench layout changed: ' + before.slice(0, 80));
  return source.replace(before, after);
}
export function patchWorkbenchSource(source) {
  source = source.replace(/\r\n/g, '\n');
  if (!source.includes('import { bindWorkbenchLayout }')) source = 'import { bindWorkbenchLayout } from "./dev-workbench.js";\n' + source;
  const start = source.indexOf('function readHintOpen() {');
  const end = source.indexOf('function writeHintDismissed', start);
  if (start < 0 || end < start) throw new Error('Workbench guide initialization changed');
  source = source.slice(0, start) + 'function readHintOpen() {\n  return false; // Detailed help opens on demand, never over the startup screen.\n}\n' + source.slice(end);
  source = once(source,
    '  const out = model.groups.map((g) => groupNode(g, model.summaries[g.id] ?? null, bands.get(g.id) ?? [], prev.get(g.id)));',
    '  const visibleGroups = model.nodes.length ? model.groups : model.groups.filter(g => g.kind === "user" || g.kind === "work");\n  const out = visibleGroups.map((g) => groupNode(g, model.summaries[g.id] ?? null, bands.get(g.id) ?? [], prev.get(g.id)));');
  source = once(source, '  const drawerWidth = useDrawerWidthStore((s) => s.width);\n  return',
    '  const drawerWidth = useDrawerWidthStore((s) => s.width);\n  reactExports.useEffect(() => bindWorkbenchLayout(stageRef.current, composerRef.current), []);\n  return');
  source = source.replace('!replay && /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasOnboarding, { nodes: model.nodes,', '!replay && (model.nodes.length > 0 || !model.groups.some(g => g.kind === "user" || g.kind === "work")) && /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasOnboarding, { nodes: model.nodes,');
  source = source.replace('            !replay && /* @__PURE__ */ jsxRuntimeExports.jsx(BackgroundModelHint, {}),\n', '');
  source = once(source,
    'className: "pointer-events-none absolute bottom-3 right-5 z-10 flex max-w-[30%] justify-end"',
    'className: "pointer-events-auto flex w-full justify-center"');
  source = once(source,
    'children: /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasComposer, { onPlaceNode, onCreateIdea, onIdeaDispatched, getDefaultSpawnAt: viewportCenter, replyTarget: drawerKindOf(openNode) === "session" ? openNode?.title : null })',
    '"data-canvas-composer": true, children: jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [!replay && jsxRuntimeExports.jsx(BackgroundModelHint, {}), jsxRuntimeExports.jsx(CanvasComposer, { onPlaceNode, onCreateIdea, onIdeaDispatched, getDefaultSpawnAt: viewportCenter, replyTarget: drawerKindOf(openNode) === "session" ? openNode?.title : null })] })');
  return source;
}
export function patchWorkbench() {
  const file = path.join(root, 'src/renderer/assets/index-DKmSc9lP.js');
  fs.writeFileSync(file, patchWorkbenchSource(fs.readFileSync(file, 'utf8')));
  const html = path.join(root, 'src/renderer/index.html');
  fs.writeFileSync(html, patchWorkbenchHtml(fs.readFileSync(html, 'utf8')));
}
export function patchWorkbenchHtml(source) {
  if (source.includes('dev-workbench.css')) return source;
  if (source.split('</head>').length !== 2) throw new Error('Renderer HTML changed');
  return source.replace('</head>', '<link rel="stylesheet" href="./assets/dev-workbench.css">\n  </head>');
}
