// File reads stay on the existing validated file-tab store. Never launch a
// document or executable through the operating system when a chat file is clicked.
export async function openChatFile({ path, line, col, resolve, files, revealDirectory, notify }) {
  try {
    const target = await resolve(path);
    if (!target?.path) throw new Error('无法确定文件路径，请检查会话工作目录。');
    // file URLs use forward slashes; project indexes on Windows use backslashes.
    // Give both entry points the same tab identity so edits survive another click.
    const filePath = /^(?:[A-Za-z]:[/\\]|\\\\)/.test(target.path)
      ? target.path.replaceAll('/', '\\') : target.path;
    if (target.kind === 'directory' || /[/\\]$/.test(path)) {
      const result = await revealDirectory(filePath);
      if (!result?.success) throw new Error(result?.error || '无法打开文件夹。');
    } else if (Number.isInteger(line) && line > 0) {
      await files.openFileAtLine(filePath, line, Number.isInteger(col) && col > 0 ? col : 1);
    } else {
      await files.openFileInTab(filePath);
    }
    return { success: true, path: filePath };
  } catch (error) {
    const message = error?.message || '无法在侧边栏打开文件。';
    notify(message, 'error');
    return { success: false, error: message };
  }
}
