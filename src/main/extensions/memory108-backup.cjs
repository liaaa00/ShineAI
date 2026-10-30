'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Snapshot existing bytes before a new runtime can read/maintain the store.
// No memory is promoted, rewritten, or removed by this operation.
function ensureMemoryBackup(directory) {
  const root = path.resolve(directory);
  const memory = path.join(root, 'memory');
  const marker = path.join(root, '.memory108-upgrade.json');
  if (fs.existsSync(marker)) {
    if (!fs.lstatSync(marker).isFile() || fs.lstatSync(marker).isSymbolicLink()) throw Error('Invalid memory upgrade marker');
    return JSON.parse(fs.readFileSync(marker, 'utf8'));
  }
  if (!fs.existsSync(memory)) return null;
  if (fs.lstatSync(root).isSymbolicLink() || fs.lstatSync(memory).isSymbolicLink()) throw Error('Linked memory directory cannot be backed up');
  const backups = path.join(root, 'backups');
  if (fs.existsSync(backups) && (fs.lstatSync(backups).isSymbolicLink() || !fs.lstatSync(backups).isDirectory())) throw Error('Invalid memory backup directory');
  fs.mkdirSync(backups, { recursive: true });
  const snapshot = path.join(backups, 'before-memory108-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'));
  fs.mkdirSync(snapshot);
  const files = [];
  function copy(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const source = path.join(from, entry.name), target = path.join(to, entry.name);
      if (entry.isSymbolicLink()) throw Error('Linked memory file cannot be backed up');
      if (entry.isDirectory()) copy(source, target);
      else if (entry.isFile()) {
        fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
        const bytes = fs.readFileSync(target);
        files.push({ path: path.relative(snapshot, target).split(path.sep).join('/'), bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
      } else throw Error('Unsupported memory file type');
    }
  }
  copy(memory, path.join(snapshot, 'memory'));
  const record = { version: '1.0.8', createdAt: new Date().toISOString(), backup: snapshot, files };
  fs.writeFileSync(path.join(snapshot, 'snapshot.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  try { fs.writeFileSync(marker, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  return record;
}
module.exports = { ensureMemoryBackup };
