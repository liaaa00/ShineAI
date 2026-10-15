function once(source, before, after) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) throw new Error('File link patch layout changed: '+before.slice(0,80));
  return source.replace(before, after);
}
export function patchFileLinksMain(source) {
  return once(source,
    'const a0a=fe["normalize"](a07);return r["shell"]["showItemInFolder"](a0a),{\'success\':!0x0};',
    'return require("./extensions/reveal-local-path.cjs").revealLocalPath(a07,r["shell"]);');
}
export function patchFileLinksRenderer(source) {
  source=source.replace(/\r\n/g,'\n');
  const resolverStart = source.indexOf('async function resolveChatFilePath(filePath) {');
  const resolverEnd = source.indexOf('\n}', resolverStart) + 2;
  if (resolverStart < 0 || resolverEnd < resolverStart) throw new Error('Chat path resolver layout changed');
  source = source.slice(0, resolverStart) + String.raw`async function resolveChatFilePath(filePath) {
  // Absolute paths identify an exact item; never substitute a same-named file.
  if (/^[A-Za-z]:[/\\]/.test(filePath) || filePath.startsWith("/") || filePath.startsWith("\\\\")) {
    const base = getSessionBase();
    const key = normalizePathKey(filePath), baseKey = normalizePathKey(base);
    if (baseKey && (key === baseKey || key.startsWith(baseKey + "/"))) {
      const index = await loadIndex(base), relative = toRelativeOfBase(filePath, base);
      if (!relative || index && [...index.byRelativePath.keys()].some(p => p.startsWith(relative + "/"))) return { path: filePath, kind: "directory" };
    }
    return { path: filePath, kind: "file" };
  }
  const hint2 = resolvePathWithSession(filePath);
  return resolveLocalPathHint(hint2, getSessionBase());
}` + source.slice(resolverEnd);
  // Replace bounded components so both the upstream and previously patched
  // renderer converge on the same implementation; repeated runs are identical.
  const start = source.indexOf('const FilePathLink = ');
  const end = source.indexOf('FilePathLink.displayName', start);
  if (start < 0 || end < start) throw new Error('FilePathLink layout changed');
  const oldHelper = source.indexOf('async function revealChatLocation(');
  const newHelper = source.indexOf('async function openChatLocation(');
  const helperStart = oldHelper >= 0 ? oldHelper : newHelper >= 0 ? newHelper : start;
  source = source.slice(0, helperStart) + `async function openChatLocation(filePath, line, col, directory = false) {
  const sessionId = useSessionStore.getState().selectedSessionId;
  return openChatFile({
    path: filePath, line, col,
    resolve: async path => { const target = await resolveChatFilePath(path); return directory ? { ...target, kind: "directory" } : target; },
    files: useFileManagerStore.getState(),
    revealDirectory: path => window.shineAI.fileManager.showInFolder(path, sessionId ? { sessionId } : void 0),
    notify: (message, kind) => useUIStore.getState().showToast(message, kind)
  });
}
const FilePathLink = ({ display, filePath, line: line2, col }) => {
  const handleClick = reactExports.useCallback(() => openChatLocation(filePath, line2, col), [filePath, line2, col]);
  const resolved = resolvePathWithSession(filePath);
  return jsxRuntimeExports.jsx("button", {
    type: "button",
    onClick: handleClick,
    title: \`在侧边栏打开：\${resolved}\`,
    className: "markdown-filepath-link markdown-inline-code cursor-pointer text-accent-blue hover:text-accent-blue/80 hover:underline",
    children: display
  });
};
` + source.slice(end);
  source = source.replace('import { revealChatFileLocation } from "./dev-file-links.js";\n', '');
  if (!source.includes('import { openChatFile }')) source = 'import { openChatFile } from "./dev-file-links.js";\n' + source;
  // Retain URI parsing, safe external-link handling and blocked schemes.
  const anchorStart = source.indexOf('  a({ href, children: children2, className, onClick, rel, ...rest }) {', source.indexOf('const createMarkdownComponents ='));
  const anchorEnd = source.indexOf('  table({ node:', anchorStart);
  if (anchorStart < 0 || anchorEnd < anchorStart) throw new Error('Markdown anchor layout changed');
  let anchor = source.slice(anchorStart, anchorEnd);
  const blockStart = ['      const st2 = ', '      const reveal = ', '      const openLocal = '].map(token => anchor.indexOf(token)).filter(i => i >= 0).sort((a,b) => a-b)[0];
  const blockEnd = anchor.indexOf('      if (decision === "prevent")', blockStart);
  if (blockStart == null || blockEnd < blockStart) throw new Error('Markdown anchor click layout changed');
  anchor = anchor.slice(0, blockStart) + `      const openLocal = (path, line, col) => { void openChatLocation(path, line, col, /[/\\\\]$/.test(href || "")); };
      const decision = handleMarkdownLinkClick({
        href,
        cwd: getSessionBase(),
        modifier: false,
        openers: { openFileInTab: openLocal, openHtmlPreview: openLocal, openPath: openLocal, openExternal: openExternalLink }
      });
` + anchor.slice(blockEnd);
  anchor = anchor.replace('        title: resolveMarkdownHref(href, getSessionBase()).kind === "local" ? "在文件夹中显示" : void 0,\n', '');
  if (!anchor.includes('title: resolveMarkdownHref')) anchor = anchor.replace('        href,\n        ...rest,', '        href,\n        title: resolveMarkdownHref(href, getSessionBase()).kind === "local" ? "在侧边栏打开文件；文件夹在资源管理器中打开" : void 0,\n        ...rest,');
  return source.slice(0, anchorStart) + anchor + source.slice(anchorEnd);
}
