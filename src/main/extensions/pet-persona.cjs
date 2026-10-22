'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const SCHEME = 'shineai-pet';
const ID = /^[a-f0-9]{32}\.(png|gif)$/;
const species = new Set(['cat_black', 'cat_orange', 'dog_shiba', 'fox', 'owl', 'robot']);
let runtime;

function inspectImage(bytes, extension) {
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw Error('形象图片需要在 10 MB 以内');
  let width, height;
  if (extension === '.png' && bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.subarray(12, 16).toString() === 'IHDR') {
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20);
  } else if (extension === '.gif' && bytes.length >= 14 && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString()) && bytes.at(-1) === 0x3b) {
    width = bytes.readUInt16LE(6); height = bytes.readUInt16LE(8);
  } else throw Error('请选择有效的 PNG 或 GIF 图片');
  if (!width || !height || width > 4096 || height > 4096 || width * height > 16000000) throw Error('图片尺寸需要在 4096×4096 以内');
  return { width, height };
}
function normalizePatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw Error('人格配置无效');
  const out = {};
  if ('name' in patch) { if (typeof patch.name !== 'string' || !patch.name.trim() || patch.name.trim().length > 20) throw Error('名称需要为 1–20 个字符'); out.name = patch.name.trim(); }
  if ('avatarType' in patch) { if (!['cat', 'dog', 'fox', 'owl', 'robot', 'custom'].includes(patch.avatarType)) throw Error('形象类型无效'); out.avatarType = patch.avatarType; }
  if ('personality' in patch) { if (!['formal', 'casual', 'cute'].includes(patch.personality)) throw Error('性格风格无效'); out.personality = patch.personality; }
  if ('petSpecies' in patch) { if (!species.has(patch.petSpecies)) throw Error('内置形象无效'); out.petSpecies = patch.petSpecies; }
  if ('customAvatarId' in patch) { if (patch.customAvatarId !== null && (typeof patch.customAvatarId !== 'string' || !ID.test(patch.customAvatarId))) throw Error('自定义形象标识无效'); out.customAvatarId = patch.customAvatarId; }
  return out;
}
function readPersona(service) { if (runtime) runtime.service = service; return service.getPersona(); }
async function decodePoster(bytes, extension, nativeImage, sender) {
  // Electron nativeImage decodes PNG but does not reliably support GIF.
  // Use Chromium's image decoder in the existing sandboxed importing window.
  if (extension !== '.gif') return nativeImage.createFromBuffer(bytes);
  const source = 'data:image/gif;base64,' + bytes.toString('base64');
  const poster = await sender.executeJavaScript(`(async () => {
    const image = new Image(); image.src = ${JSON.stringify(source)};
    let timer;
    try {
      await Promise.race([image.decode(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('GIF 解码超时')), 15000); })]);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      return canvas.toDataURL('image/png').split(',')[1];
    } finally { clearTimeout(timer); image.src = ''; }
  })()`);
  if (typeof poster !== 'string' || poster.length > 90 * 1024 * 1024) throw Error('GIF 图片无法解码');
  return nativeImage.createFromBuffer(Buffer.from(poster, 'base64'));
}
async function savePersona(service, patch) {
  if (!runtime) throw Error('自定义形象服务尚未就绪');
  runtime.service = service;
  const next = { ...service.getPersona(), ...normalizePatch(patch) };
  if (next.avatarType === 'custom') { if (!next.customAvatarId) throw Error('请先导入自定义形象'); await runtime.metadata(next.customAvatarId); }
  service.setPersona(normalizePatch(patch));
  const persona = service.getPersona();
  for (const window of runtime.BrowserWindow.getAllWindows()) if (!window.isDestroyed()) window.webContents.send('dev:pet:persona-changed', persona);
  return { success: true, persona };
}
function registerPetPersona({ app, ipcMain, protocol, dialog, BrowserWindow, nativeImage, config }) {
  const directory = path.join(config.userData, 'pet-images');
  const ready = fs.mkdir(directory, { recursive: true });
  protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
  const metadata = async id => {
    if (typeof id !== 'string' || !ID.test(id)) throw Error('自定义形象标识无效');
    await ready;
    const file = path.join(directory, id), stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 10 * 1024 * 1024) throw Error('形象文件不可用');
    const record = JSON.parse(await fs.readFile(file + '.json', 'utf8'));
    return { id, name: String(record.name).slice(0, 255), type: id.endsWith('.gif') ? 'image/gif' : 'image/png', url: `${SCHEME}://avatar/${id}`, size: stat.size, width: record.width, height: record.height };
  };
  runtime = { metadata, BrowserWindow, service: null };
  const respond = handler => async (...args) => { try { await ready; return { success: true, ...await handler(...args) }; } catch (error) { return { success: false, error: error.code === 'ENOENT' ? '形象文件已丢失，请重新导入' : error.message }; } };
  ipcMain.handle('dev:pet:import', respond(async event => {
    const selection = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), { title: '选择小光形象', properties: ['openFile'], filters: [{ name: 'PNG 图片或 GIF 动画', extensions: ['png', 'gif'] }] });
    if (selection.canceled || !selection.filePaths.length) return { canceled: true };
    const selected = selection.filePaths[0], extension = path.extname(selected).toLowerCase();
    if (!['.png', '.gif'].includes(extension)) throw Error('仅支持 PNG 和 GIF');
    const handle = await fs.open(selected, 'r'); let file;
    try {
      const stat = await handle.stat(); if (!stat.isFile() || stat.size > 10 * 1024 * 1024) throw Error('形象图片需要在 10 MB 以内');
      const bytes = await handle.readFile(), dimensions = inspectImage(bytes, extension);
      // Decode before retaining a file. This also provides a safe static frame
      // for reduced-motion preferences without modifying the original GIF.
      const decoded = await decodePoster(bytes, extension, nativeImage, event.sender);
      if (decoded.isEmpty()) throw Error('图片无法解码，请选择其他 PNG 或 GIF');
      const id = crypto.randomBytes(16).toString('hex') + extension; file = path.join(directory, id);
      await fs.writeFile(file, bytes, { flag: 'wx' });
      await fs.writeFile(file + '.poster.png', decoded.toPNG());
      await fs.writeFile(file + '.json', JSON.stringify({ name: path.basename(selected), ...dimensions }));
      return { media: await metadata(id) };
    } catch (error) { if (file) for (const suffix of ['', '.json', '.poster.png']) await fs.rm(file + suffix, { force: true }); throw error; }
    finally { await handle.close(); }
  }));
  ipcMain.handle('dev:pet:discard', respond(async (_event, id) => {
    if (!runtime.service || runtime.service.getPersona().customAvatarId === id) throw Error('已保存的形象不能丢弃');
    await metadata(id);
    for (const suffix of ['', '.json', '.poster.png']) await fs.rm(path.join(directory, id) + suffix, { force: true });
    return {};
  }));
  app.whenReady().then(() => protocol.handle(SCHEME, async request => {
    try {
      const url = new URL(request.url), poster = url.pathname.endsWith('.poster.png');
      const id = url.pathname.slice(1, poster ? -11 : undefined);
      if (url.hostname !== 'avatar' || url.search || !['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 404 });
      const media = await metadata(id), file = path.join(directory, id + (poster ? '.poster.png' : ''));
      const stat = await fs.lstat(file); if (!stat.isFile() || stat.isSymbolicLink()) return new Response(null, { status: 404 });
      return new Response(request.method === 'HEAD' ? null : await fs.readFile(file), { headers: { 'Content-Type': poster ? 'image/png' : media.type, 'Content-Length': String(stat.size), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=31536000, immutable' } });
    } catch { return new Response(null, { status: 404 }); }
  })).catch(error => console.error('[Pet] Image protocol failed', error.message));
}
module.exports = { inspectImage, normalizePatch, registerPetPersona, savePersona, readPersona };
