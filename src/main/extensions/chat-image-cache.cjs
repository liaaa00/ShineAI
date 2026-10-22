'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

// Matches the existing file-manager image read limit; no new upload/read limit.
const imageBytes = 0xa00000;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const key = value => process.platform === 'win32' ? path.normalize(value).toLowerCase() : path.normalize(value);
const absent = error => ['ENOENT', 'ENOTDIR'].includes(error?.code);

async function canonicalMissing(input) {
  let parent = input;
  const suffix = [];
  for (;;) {
    try { return path.join(await fs.realpath(parent), ...suffix); }
    catch (error) {
      if (!absent(error) || path.dirname(parent) === parent) throw error;
      suffix.unshift(path.basename(parent)); parent = path.dirname(parent);
    }
  }
}

async function cacheFile(userData, sessionId, input, create) {
  let directory = userData;
  for (const name of ['chat-images', hash(sessionId)]) {
    directory = path.join(directory, name);
    if (create) await fs.mkdir(directory, { recursive: true });
    const stat = await fs.lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('Linked image cache directory');
  }
  const file = path.join(directory, hash(key(input)) + '.json');
  try { if (!(await fs.lstat(file)).isFile() || (await fs.lstat(file)).isSymbolicLink()) throw Error('Invalid image cache file'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return file;
}

function wrapReadFile(guard, app, readOriginal) {
  return async (event, payload) => {
    const result = await readOriginal(event, payload);
    if (payload?.cacheChatImage !== true || payload.includeImageData !== true) return result;
    const input = payload.path, context = payload.context, sessionId = context?.sessionId;
    if (typeof input !== 'string' || !path.isAbsolute(input) || typeof sessionId !== 'string' || !sessionId || !guard.readSession(sessionId)) return result;
    const userData = app.getPath('userData');
    if (result?.kind === 'image' && result.dataUrl) {
      try {
        const real = await fs.realpath(input);
        // Store only bytes returned by the existing validated native reader.
        const bytes = Buffer.from(result.dataUrl.slice(result.dataUrl.indexOf(',') + 1), 'base64');
        if (bytes.length > imageBytes || bytes.length !== result.size) return result;
        const file = await cacheFile(userData, sessionId, input, true);
        const record = { version: 1, source: key(input), canonical: key(real), digest: hash(result.dataUrl), image: result };
        const temporary = file + '.' + crypto.randomUUID() + '.tmp';
        try { await fs.writeFile(temporary, JSON.stringify(record), { flag: 'wx', mode: 0o600 }); await fs.rename(temporary, file); }
        finally { await fs.rm(temporary, { force: true }); }
      } catch (error) { console.warn('[ChatImage] Could not save session copy:', error.code || error.message); }
      return result;
    }
    try {
      // Cache never replaces an existing (or changed) file or bypasses current
      // session permissions, blacklists, or a redirected junction/symlink.
      try { await fs.stat(input); return result; } catch (error) { if (!absent(error)) return result; }
      const real = await canonicalMissing(input);
      if (guard.checkBlacklist(input) || guard.checkBlacklist(real) || !guard.validate(input, 'read', context).allowed || !guard.validate(real, 'read', context).allowed) return result;
      const file = await cacheFile(userData, sessionId, input, false);
      if ((await fs.stat(file)).size > Math.ceil(imageBytes * 4 / 3) + 4096) return result;
      const record = JSON.parse(await fs.readFile(file, 'utf8'));
      const image = record.image;
      if (record.version !== 1 || record.source !== key(input) || record.canonical !== key(real) || image?.kind !== 'image' || typeof image.dataUrl !== 'string' || !/^data:image\/[\w.+-]+;base64,/.test(image.dataUrl) || hash(image.dataUrl) !== record.digest) return result;
      return { ...image, fromCache: true };
    } catch { return result; }
  };
}

async function removeSessionCopies(userData, sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return;
  const base = path.resolve(userData, 'chat-images'), directory = path.join(base, hash(sessionId));
  // Only this exact hashed child of the application's cache is a delete target.
  if (path.dirname(directory) !== base) throw Error('Invalid session image directory');
  for (const target of [base, directory]) {
    try { const stat = await fs.lstat(target); if (!stat.isDirectory() || stat.isSymbolicLink()) return; }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
  }
  await fs.rm(directory, { recursive: true, force: true });
}

module.exports = { wrapReadFile, removeSessionCopies };
