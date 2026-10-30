import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function patchChatImagesMain(source) {
  const deletion = '["deleteSession"](a02){', next = '["snapshotSessionRow"](a02){';
  const deletionStart = source.indexOf(deletion), deletionEnd = source.indexOf(next, deletionStart);
  if (deletionStart < 0 || deletionEnd < deletionStart) throw Error('Session deletion layout changed');
  const method = source.slice(deletionStart, deletionEnd);
  if (!method.includes('removeSessionCopies')) source = source.slice(0, deletionEnd - 1) + 'void require("./extensions/chat-image-cache.cjs").removeSessionCopies(r["app"].getPath("userData"),a02).catch(error=>console.warn("[ChatImage] Could not remove session copies:",error.message));}' + source.slice(deletionEnd);
  const channel = '"file-manager:read-file",';
  const start = source.indexOf(channel + 'async');
  if (source.includes(channel + 'require("./extensions/chat-image-cache.cjs").wrapReadFile(')) return source;
  const end = source.indexOf('),r["ipcMain"]["handle"](', start);
  if (start < 0 || end < start) throw Error('Image file reader layout changed');
  return source.slice(0, start) + channel + 'require("./extensions/chat-image-cache.cjs").wrapReadFile(a04,r["app"],' + source.slice(start + channel.length, end) + ')' + source.slice(end);
}

export function patchChatImagesPreload(source) {
  const anchor = 'chatFiles: { prepare:';
  if (source.includes('chatFiles: { readImage:')) return source;
  if (!source.includes(anchor)) throw Error('Chat file preload layout changed');
  return source.replace(anchor, 'chatFiles: { readImage: (path, context) => electron.ipcRenderer.invoke("file-manager:read-file", { path, context, includeImageData: true, cacheChatImage: true }), prepare:');
}

export function patchChatImagesRenderer(source) {
  source = source.replace(/\r\n/g, '\n');
  if (!source.includes('import { extractChatImagePaths, chatImageError }')) source = 'import { extractChatImagePaths, chatImageError } from "./dev-chat-images.mjs";\n' + source;
  const start = source.indexOf('function unwrapStandaloneCandidate('), end = source.indexOf('function extractImageTags(', start);
  if (start >= 0 && end > start) source = source.slice(0, start) + 'function extractStandaloneImagePaths(raw, seen2) {\n  return extractChatImagePaths(raw, fromMarkdown, seen2).map(path => ({ path, name: getFileName$7(path) }));\n}\n' + source.slice(end);
  const before = 'await window.shineAI.fileManager.readFile(path2, sessionId ? { sessionId } : void 0, true)';
  source = source.replace(before, 'await window.development.chatFiles.readImage(path2, sessionId ? { sessionId } : void 0)');
  source = source.replace('    t2("chatImage.loadFailed"),\n    alt || t2("chatImage.imageFallback")', '    chatImageError(result2.error, !instance.language?.startsWith("en")) + "：",\n    alt || t2("chatImage.imageFallback")');
  if (!source.includes('import { createChatImagePresentation }')) source = 'import { createChatImagePresentation } from "./dev-chat-image-layout.mjs";\n' + source;
  const presentation = 'const { ImageCard: ChatImageCard, MarkdownImage: ChatMarkdownImage } = createChatImagePresentation(reactExports, ChatImage, ChatImagePreview, { useSessionId: () => useSessionStore(s => s.selectedSessionId), localPath: localChatImagePath, isEnglish: () => instance.language?.startsWith("en") });\n';
  source = source.replace(/^const \{ ImageCard: ChatImageCard, MarkdownImage: ChatMarkdownImage \} = createChatImagePresentation\([^\n]+\);\n/m, presentation);
  if (!source.includes(presentation)) source = source.replace('let depth = 0;', presentation + 'let depth = 0;');
  source = source.replace('jsxRuntimeExports.jsx(ChatImage, { ...props })', 'jsxRuntimeExports.jsx(ChatMarkdownImage, { ...props })');
  const gridStart = source.indexOf('function getImageGridClass(count) {');
  const gridEnd = source.indexOf('\nconst ImageThumbnail =', gridStart);
  if (gridStart < 0 || gridEnd < gridStart) throw Error('Chat image grid layout changed');
  source = source.slice(0, gridStart) + 'function getImageGridClass(count) {\n  return "shine-chat-image-grid" + (count > 1 ? " is-multiple" : "");\n}' + source.slice(gridEnd);
  source = source.replace('  const thumbnailHeightClass = isSingle ? "h-48 [@container(min-width:640px)]:h-56" : "h-32";\n', '');
  const thumbStart = source.indexOf('const ImageThumbnail =');
  const thumbEnd = source.indexOf('\nconst MessageBubble$1 =', thumbStart);
  let thumbnail = source.slice(thumbStart, thumbEnd);
  const cardStart = thumbnail.indexOf('    /* @__PURE__ */ jsxRuntimeExports.jsxs(\n      "button",');
  const cardEnd = thumbnail.indexOf('    /* @__PURE__ */ jsxRuntimeExports.jsx(\n      ContextMenu$2,', cardStart);
  if (!thumbnail.includes('jsxRuntimeExports.jsx(ChatImageCard,')) {
    if (cardStart < 0 || cardEnd < cardStart) throw Error('Chat image thumbnail layout changed');
    thumbnail = thumbnail.slice(0, cardStart) + '    jsxRuntimeExports.jsx(ChatImageCard, { src, name: name2, isSingle, onPreview: () => onPreview(src, path2), onContextMenu: handleContextMenu, feedback: copyFeedback, english: instance.language?.startsWith("en") }),\n' + thumbnail.slice(cardEnd);
    source = source.slice(0, thumbStart) + thumbnail + source.slice(thumbEnd);
  }
  const body = '              ref: bubbleBodyRef,\n';
  const sizing = '              style: imagePaths.length > 0 || /!\\[/.test(plainTextContent) ? { width: "100%", minWidth: 0 } : void 0,\n';
  if (!source.includes(sizing)) source = source.replace(body, body + sizing);
  return source;
}

export function patchChatImagesHtml(source) {
  if (!source.includes('./assets/dev-chat-images.css')) source = source.replace('</head>', '  <link rel="stylesheet" href="./assets/dev-chat-images.css">\n  </head>');
  return source;
}

export function patchChatImagesFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const [file, patch] of [['main/index.js', patchChatImagesMain], ['preload/index.js', patchChatImagesPreload], ['renderer/assets/index-0LVJEr5c.js', patchChatImagesRenderer], ['renderer/index.html', patchChatImagesHtml]]) {
    const target = path.join(root, 'src', file); fs.writeFileSync(target, patch(fs.readFileSync(target, 'utf8')));
  }
}
