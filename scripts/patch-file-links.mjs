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
  source=once(source,
    '  const hint2 = resolvePathWithSession(filePath);\n  return resolveLocalPathHint(hint2, getSessionBase());',
    String.raw`  // Absolute paths identify an exact item; never substitute a same-named project file.
  if (/^[A-Za-z]:[/\\]/.test(filePath) || filePath.startsWith("/") || filePath.startsWith("\\\\")) return { path: filePath, kind: "file" };
  const hint2 = resolvePathWithSession(filePath);
  return resolveLocalPathHint(hint2, getSessionBase());`);
  source=once(source, 'const FilePathLink = ({ display, filePath, line: line2, col }) => {', `async function revealChatLocation(filePath) {
  const sessionId = useSessionStore.getState().selectedSessionId;
  return revealChatFileLocation({
    path: filePath,
    resolve: resolveChatFilePath,
    context: sessionId ? { sessionId } : void 0,
    notify: (message, kind) => useUIStore.getState().showToast(message, kind)
  });
}
const FilePathLink = ({ display, filePath, line: line2, col }) => {`);
  if (!source.includes('import { revealChatFileLocation }')) source='import { revealChatFileLocation } from "./dev-file-links.js";\n'+source;
  const start=source.indexOf('const FilePathLink = '),end=source.indexOf('FilePathLink.displayName',start);
  let component=source.slice(start,end);
  const a=component.indexOf('  const handleClick = '), b=component.indexOf('  const resolved = ',a);
  if (a<0 || b<a) throw new Error('FilePathLink click layout changed');
  component=component.slice(0,a)+`  const handleClick = reactExports.useCallback(() => revealChatLocation(filePath), [filePath]);
`+component.slice(b);
  component=component.replace('title: isPreview ? t2("markdown.filePathPreviewTitle", { path: resolved }) : t2("markdown.filePathOpenTitle", { path: resolved }),', 'title: `在文件夹中显示：${resolved}`,');
  source=source.slice(0,start)+component+source.slice(end);
  // Markdown links and inline file chips share the same behavior. Retain the
  // existing URI parser so web links, anchors and rejected schemes stay intact.
  const anchorStart=source.indexOf('  a({ href, children: children2, className, onClick, rel, ...rest }) {',source.indexOf('const createMarkdownComponents ='));
  const anchorEnd=source.indexOf('  table({ node:',anchorStart);
  let anchor=source.slice(anchorStart,anchorEnd);
  const blockStart=anchor.indexOf('      const st2 = '),blockEnd=anchor.indexOf('      if (decision === "prevent")',blockStart);
  if (!anchor.includes('      const reveal = path2 => { void revealChatLocation(path2); };')) {
    if (blockStart<0 || blockEnd<blockStart) throw new Error('Markdown anchor click layout changed');
    anchor=anchor.slice(0,blockStart)+`      const reveal = path2 => { void revealChatLocation(path2); };
      const decision = handleMarkdownLinkClick({
        href,
        cwd: getSessionBase(),
        modifier: isPrimaryModifierPressed(event2) || event2.button === 1,
        openers: { openFileInTab: reveal, openHtmlPreview: reveal, openPath: reveal, openExternal: openExternalLink }
      });
`+anchor.slice(blockEnd);
  }
  anchor=anchor.replace('        href,\n        ...rest,','        href,\n        title: resolveMarkdownHref(href, getSessionBase()).kind === "local" ? "在文件夹中显示" : void 0,\n        ...rest,');
  source=source.slice(0,anchorStart)+anchor+source.slice(anchorEnd);
  return source;
}
