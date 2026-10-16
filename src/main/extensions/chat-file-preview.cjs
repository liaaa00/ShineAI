'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { revealLocalPath } = require('./reveal-local-path.cjs');
// Grants belong to this window and session, last until the window closes, and
// authorize only read-file. They never reach agent, write, terminal or tree APIs.
const grants = new WeakMap();
const key = value => process.platform === 'win32' ? path.normalize(value).toLowerCase() : path.normalize(value);
function inspect(guard, input) {
  if (typeof input !== 'string' || !path.isAbsolute(input) || input.includes('\0')) throw new Error('文件路径必须是本地绝对路径。');
  const blocked = guard.checkBlacklist(input);
  if (blocked) throw new Error(blocked);
  const real = fs.realpathSync(input);
  const realBlocked = guard.checkBlacklist(real);
  if (realBlocked) throw new Error(realBlocked);
  return { real, stat: fs.statSync(real) };
}
function scope(context, input) { return JSON.stringify([context?.sessionId || '', key(input)]); }
function validateRead(guard, event, input, context) {
  try {
    const ordinary = guard.validate(input, 'read', context);
    const { real, stat } = inspect(guard, input);
    const canonical = guard.validate(real, 'read', context);
    if (ordinary.allowed && canonical.allowed) return { allowed: true, path: real };
    if (stat.isFile() && grants.get(event.sender)?.get(scope(context, input)) === key(real)) {
      return { allowed: true, path: real, readOnly: true };
    }
    return ordinary.allowed ? canonical : ordinary;
  } catch (error) { return { allowed: false, error: error.message }; }
}
function registerChatFilePreview(guard, electron) {
  const { ipcMain, dialog, BrowserWindow, shell } = electron;
  ipcMain.handle('dev:chat-file:prepare', async (event, { path: input, context } = {}) => {
    try {
      if (typeof input === 'string' && guard.validate(input, 'read', context).allowed && !fs.existsSync(input)) {
        return { success: true, path: input, kind: 'file' };
      }
      const permission = validateRead(guard, event, input, context);
      if (permission.allowed) {
        return { success: true, path: input, kind: fs.statSync(permission.path).isDirectory() ? 'directory' : 'file', readOnly: !!permission.readOnly };
      }
      const { real, stat } = inspect(guard, input);
      if (!stat.isFile() && !stat.isDirectory()) throw new Error('该路径不是普通文件或文件夹。');
      const directory = stat.isDirectory();
      const options = {
        type: 'question', title: directory ? '打开文件夹' : '打开会话范围外的文件',
        message: directory ? '在资源管理器中打开这个文件夹？' : '允许只读预览这个文件？',
        detail: real + '\n\n' + (directory ? '仅打开文件夹位置，不改变会话权限。' : '仅允许当前窗口、当前会话读取这个文件，不授予 AI 修改文件或访问整个目录的权限。'),
        buttons: [directory ? '打开文件夹' : '只读打开', '取消'], defaultId: 0, cancelId: 1, noLink: true
      };
      const owner = BrowserWindow.fromWebContents(event.sender);
      const answer = await (owner ? dialog.showMessageBox(owner, options) : dialog.showMessageBox(options));
      if (answer.response !== 0 || event.sender.isDestroyed()) return { success: false, canceled: true };
      // Recheck after the dialog so a changed junction/link cannot inherit approval.
      const current = inspect(guard, input);
      if (key(current.real) !== key(real) || current.stat.isDirectory() !== directory) throw new Error('文件路径已发生变化，请重新点击。');
      if (directory) return { ...await revealLocalPath(real, shell), handled: true, kind: 'directory', path: input };
      let windowGrants = grants.get(event.sender);
      if (!windowGrants) grants.set(event.sender, windowGrants = new Map());
      windowGrants.set(scope(context, input), key(real));
      windowGrants.set(scope(context, real), key(real));
      return { success: true, path: input, kind: 'file', readOnly: true };
    } catch (error) { return { success: false, error: error.message }; }
  });
}
module.exports = { registerChatFilePreview, validateRead };
