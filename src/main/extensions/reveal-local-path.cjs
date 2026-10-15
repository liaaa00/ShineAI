'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');

// Called only after the existing file-manager read policy permits the path.
// Never execute the referenced file or fall back to a different directory.
async function revealLocalPath(filePath, shell) {
  try {
    if (typeof filePath !== 'string' || !filePath.trim() || filePath.includes('\0') || !path.isAbsolute(filePath)) {
      return { success: false, error: '无法定位文件：请提供完整路径，或在会话中设置工作目录。' };
    }
    const target = path.normalize(filePath);
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      const error = await shell.openPath(target);
      if (error) return { success: false, error };
    } else if (stat.isFile()) {
      shell.showItemInFolder(target);
    } else {
      return { success: false, error: '该路径不是普通文件或文件夹。' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code === 'ENOENT' || error.code === 'ENOTDIR'
      ? '文件或文件夹不存在，可能尚未生成、已移动，或只是回复中的示例路径。'
      : error.code === 'EACCES' || error.code === 'EPERM' ? '没有权限打开该文件夹。' : error.message };
  }
}
module.exports = { revealLocalPath };
