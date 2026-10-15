'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocket } = require('ws');
const { VERSION, MAX_FRAME, RemoteError, check, validateCommand, fingerprint, serverUrl } = require('../../../shared/remote/protocol.cjs');

class DeviceAgent {
  constructor({ url, token, journalFile, execute, onState = () => {}, reconnectMs = 2000 }) {
    this.url = serverUrl(url); this.token = token; this.execute = execute;
    this.journalFile = journalFile; this.onState = onState; this.reconnectMs = reconnectMs;
    this.running = false; this.socket = null; this.pending = new Map();
    this.journal = fs.existsSync(journalFile) ? JSON.parse(fs.readFileSync(journalFile, 'utf8')) : {};
  }
  saveJournal() {
    fs.mkdirSync(path.dirname(this.journalFile), { recursive: true, mode: 0o700 });
    const file = this.journalFile + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
    let descriptor;
    try {
      descriptor = fs.openSync(file, 'w', 0o600);
      fs.writeFileSync(descriptor, JSON.stringify(this.journal)); fs.fsyncSync(descriptor); fs.closeSync(descriptor); descriptor = undefined;
      fs.renameSync(file, this.journalFile);
    } finally { if (descriptor !== undefined) fs.closeSync(descriptor); if (fs.existsSync(file)) fs.unlinkSync(file); }
  }
  async dispatch(input) {
    const command = validateCommand(input); check(this.running, 'REMOTE_DISABLED', 409);
    const mutation = ['session.message', 'session.stop'].includes(command.type);
    if (!mutation) return this.execute(command);
    const hash = fingerprint(command), previous = this.journal[command.id];
    if (previous) {
      check(previous.hash === hash, 'COMMAND_ID_CONFLICT', 409);
      if (this.pending.has(command.id)) return this.pending.get(command.id);
      if (previous.state !== 'finished') throw new RemoteError('COMMAND_OUTCOME_UNKNOWN', 409);
      if (previous.error) throw new RemoteError(previous.error, 409);
      return previous.result;
    }
    for (const [key, value] of Object.entries(this.journal)) if (value.createdAt < Date.now() - 24 * 3600000) delete this.journal[key];
    check(Object.keys(this.journal).length < 4000, 'DEVICE_BUSY', 429);
    // Persist before entering the application. After a crash an accepted command
    // has an unknown outcome and is never silently executed a second time.
    this.journal[command.id] = { hash, state: 'accepted', createdAt: Date.now() }; this.saveJournal();
    const pending = Promise.resolve().then(async () => {
      check(this.running, 'REMOTE_DISABLED', 409); validateCommand(command);
      let result, error;
      try { result = await this.execute(command); } catch (caught) { error = caught instanceof RemoteError ? caught.code : 'DESKTOP_ERROR'; }
      const record = this.journal[command.id];
      record.state = 'finished'; if (error) record.error = error; else record.result = result;
      this.saveJournal();
      if (error) throw new RemoteError(error, 409);
      return result;
    }).finally(() => this.pending.delete(command.id));
    this.pending.set(command.id, pending); return pending;
  }
  start() { if (this.running) return; this.running = true; this.connect(); }
  stop() {
    this.running = false; clearTimeout(this.retry); clearInterval(this.watchdog);
    const ws = this.socket; this.socket = null;
    if (ws) { ws.removeAllListeners('close'); ws.terminate(); }
    this.onState('disabled');
  }
  connect() {
    if (!this.running) return;
    this.onState('connecting');
    const ws = new WebSocket(this.url.replace(/^http/, 'ws') + '/device', { headers: { Authorization: 'Bearer ' + this.token }, maxPayload: MAX_FRAME, perMessageDeflate: false, handshakeTimeout: 10000, followRedirects: false });
    this.socket = ws; let lastPing = Date.now();
    ws.on('open', () => {
      if (!this.running) return ws.terminate();
      this.onState('online');
      this.watchdog = setInterval(() => { if (Date.now() - lastPing > 60000) ws.terminate(); }, 10000); this.watchdog.unref();
    });
    ws.on('ping', () => { lastPing = Date.now(); });
    ws.on('unexpected-response', (_request, response) => {
      if (!this.running || this.socket !== ws) { response.resume(); ws.terminate(); return; }
      const unauthorized = response.statusCode === 401;
      response.resume(); ws.terminate();
      if (unauthorized) { this.running = false; this.onState('revoked'); }
    });
    ws.on('error', () => {});
    ws.on('message', async data => {
      if (!this.running || this.socket !== ws) return;
      let frame; try { frame = JSON.parse(data.toString()); } catch { ws.close(1008, 'Invalid frame'); return; }
      if (frame.kind !== 'command') return ws.close(1008, 'Invalid frame');
      const command = frame.command;
      const send = result => { if (this.running && this.socket === ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ version: VERSION, id: command?.id, ...result })); };
      try {
        validateCommand(command); send({ kind: 'ack' });
        const result = await this.dispatch(command); send({ kind: 'result', ok: true, result });
      } catch (error) { send({ kind: 'result', ok: false, error: error instanceof RemoteError ? error.code : 'DESKTOP_ERROR' }); }
    });
    ws.on('close', code => {
      clearInterval(this.watchdog);
      if (this.socket === ws) this.socket = null;
      if (code === 4003) { this.running = false; this.onState('revoked'); }
      if (!this.running) return;
      this.onState('offline');
      this.retry = setTimeout(() => this.connect(), this.reconnectMs); this.retry.unref();
    });
  }
}
module.exports = { DeviceAgent };
