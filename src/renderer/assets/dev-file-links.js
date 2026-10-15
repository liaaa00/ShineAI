// Keep file links on the validated file-manager bridge. Links only reveal
// existing items; they never launch documents, scripts or executables.
export async function revealChatFileLocation({ path, resolve, context, notify, bridge = window.shineAI }) {
  try {
    const target = await resolve(path);
    if (!target?.path) throw new Error('无法确定文件路径，请检查会话工作目录。');
    const result = await bridge.fileManager.showInFolder(target.path, context);
    if (!result?.success) throw new Error(result?.error || '无法打开文件所在位置。');
    return result;
  } catch (error) {
    notify(error.message || '无法打开文件所在位置。', 'error');
    return { success: false, error: error.message };
  }
}
