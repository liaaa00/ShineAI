const imageExtension = /\.(?:png|jpe?g|gif|webp|bmp|svg|ico|tiff?|avif)(?:[?#][^\s]*)?$/i;

function imagePath(value) {
  let path = value.trim();
  if (path.startsWith('<') && path.endsWith('>')) path = path.slice(1, -1);
  for (const [open, close] of [['"', '"'], ["'", "'"], ['“', '”'], ['‘', '’']]) {
    if (path.startsWith(open) && path.endsWith(close)) path = path.slice(1, -1);
  }
  if (!imageExtension.test(path) || /[`\r\n<>]/.test(path)) return null;
  if (!/^(?:https?:\/\/|file:\/\/|blob:|data:image\/|[A-Za-z]:[\\/]|\/(?!\/)|\\\\)/i.test(path)) return null;
  // Two drive prefixes cannot describe one file, even when prose ends in .png.
  if ((path.match(/[A-Za-z]:[\\/]/g) || []).length > 1) return null;
  return path;
}

// Use the same Markdown parser as the chat renderer: code spans are independent
// paths, while fenced examples and ordinary links do not become extra pictures.
export function extractChatImagePaths(raw, parseMarkdown, seen = new Set()) {
  const paths = [];
  const add = value => {
    const path = imagePath(value);
    if (path && !seen.has(path)) { seen.add(path); paths.push(path); }
  };
  const visit = node => {
    if (['code', 'html', 'link', 'linkReference', 'image', 'imageReference'].includes(node.type)) return;
    if (node.type === 'inlineCode') add(node.value);
    if (node.type === 'paragraph' && node.children.every(child => child.type === 'text')) {
      for (const line of node.children.map(child => child.value).join('').split('\n')) {
        const value = line.trim().replace(/^(?:图片|截图|image|screenshot|路径|path|文件|file)\s*(?:是|为)?\s*[:：]\s*/i, '');
        add(value);
      }
    }
    for (const child of node.children || []) visit(child);
  };
  visit(parseMarkdown(raw || ''));
  return paths;
}

export function chatImageError(error, chinese = true) {
  const detail = String(error || '');
  if (/ENOENT|ENOTDIR/.test(detail)) return chinese ? '图片文件不存在，且没有可用的会话副本' : 'Image file is missing and no saved session copy is available';
  return chinese ? '图片加载失败' : 'Failed to load image';
}
