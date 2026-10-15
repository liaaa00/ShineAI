'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const secret = () => crypto.randomBytes(32).toString('base64url');
async function passwordKey(password, salt) { return (await scrypt(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })).toString('hex'); }
class Store {
  static async open(directory, username, password) {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const store = new Store(path.join(directory, 'state.json'));
    if (!store.state.account) {
      if (typeof username !== 'string' || !username.trim() || username.length > 80 || typeof password !== 'string' || password.length < 12 || password.length > 1024) throw new Error('Set SHINEAI_REMOTE_USER and a SHINEAI_REMOTE_PASSWORD of at least 12 characters for first startup.');
      const salt = secret();
      store.state.account = { username: username.trim(), salt, passwordHash: await passwordKey(password, salt) };
      store.save();
    }
    return store;
  }
  constructor(file) {
    this.file = file;
    this.state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { version: 1, account: null, sessions: [], devices: [] };
    if (this.state.version !== 1 || !Array.isArray(this.state.sessions) || !Array.isArray(this.state.devices)) throw new Error('Unsupported remote store');
  }
  save() {
    const temp = this.file + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
    try { fs.writeFileSync(temp, JSON.stringify(this.state), { mode: 0o600 }); fs.renameSync(temp, this.file); }
    finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
  }
  async login(username, password) {
    const account = this.state.account;
    const key = await passwordKey(password, account.salt);
    if (!crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(account.passwordHash, 'hex')) || username !== account.username) return null;
    const token = secret(), session = { hash: digest(token), csrf: secret(), expiresAt: Date.now() + 12 * 3600000 };
    this.state.sessions = this.state.sessions.filter(s => s.expiresAt > Date.now()).slice(-49);
    this.state.sessions.push(session); this.save();
    return { token, session };
  }
  session(token) { return token && this.state.sessions.find(s => s.hash === digest(token) && s.expiresAt > Date.now()); }
  device(token) { return token && this.state.devices.find(d => !d.revoked && d.tokenHash === digest(token)); }
}
module.exports = { Store, secret, digest, passwordKey };
