'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { DeviceAgent } = require('./remote/device-agent.cjs');
const { RemoteError, check, text, id, serverUrl, plainMessages } = require('../../shared/remote/protocol.cjs');
let runtime, controller;
function attachRuntime(value) { runtime = value; }
function publicSession(session) {
  return { id: session.id, name: String(session.name || session.config?.name || '未命名会话').slice(0, 160), status: String(session.status || 'unknown').slice(0, 40), workspace: session.config?.workspaceId ? String(session.config.workspaceId).slice(0, 128) : null };
}
function createAdapter(getRuntime, getAccess) {
  const manager = () => { const value = getRuntime()?.sessionManagerV2; check(value, 'DESKTOP_NOT_READY', 503); return value; };
  const shared = sessionId => {
    const access = getAccess(); check(access.enabled, 'REMOTE_DISABLED', 409);
    check(access.sessionIds.includes(sessionId), 'NOT_SHARED', 403);
    const session = manager().getSession(sessionId); check(session, 'SESSION_NOT_FOUND', 404); return session;
  };
  return async command => {
    check(getAccess().enabled, 'REMOTE_DISABLED', 409);
    if (command.type === 'sessions.list') return { sessions: manager().getAllSessions().filter(s => getAccess().sessionIds.includes(s.id)).slice(0, 200).map(publicSession) };
    const session = shared(command.sessionId);
    if (command.type === 'session.read') {
      const persisted = getRuntime().database.getConversationMessagesPaged(command.sessionId, { limit: 30 });
      const messages = new Map();
      for (const m of [...(persisted.messages || []), ...(manager().getConversation(command.sessionId) || []).slice(-30)]) if (m.id) messages.set(m.id, m);
      shared(command.sessionId);
      return { session: publicSession(session), messages: plainMessages([...messages.values()].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))) };
    }
    if (command.type === 'session.message') {
      const dispatch = await manager().sendMessage(command.sessionId, command.text);
      return { accepted: true, dispatch: typeof dispatch === 'string' ? dispatch.slice(0, 40) : 'accepted' };
    }
    if (command.type === 'session.stop') { await manager().abortSession(command.sessionId); return { stopped: true }; }
    throw new RemoteError('UNSUPPORTED_COMMAND');
  };
}
function registerRemote({ app, ipcMain, config, safeStorage }) {
  const root = path.join(config.userData, 'remote'), file = path.join(root, 'device.json');
  let state = { version: 1, serverUrl: '', deviceId: '', name: os.hostname().slice(0, 80), encryptedToken: '', enabled: false, sessionIds: [] };
  let agent, connection = 'disabled', error = '', busy = false;
  if (fs.existsSync(file)) try {
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    check(saved.version === 1 && typeof saved.enabled === 'boolean' && Array.isArray(saved.sessionIds) && saved.sessionIds.length <= 200 && saved.sessionIds.every(id) && typeof saved.encryptedToken === 'string' && typeof saved.deviceId === 'string', 'INVALID_REMOTE_CONFIG');
    state = { ...state, ...saved };
  } catch { error = 'REMOTE_CONFIG_INVALID'; }
  const save = () => { fs.mkdirSync(root, { recursive: true, mode: 0o700 }); const temporary = file + '.' + crypto.randomBytes(8).toString('hex') + '.tmp'; try { fs.writeFileSync(temporary, JSON.stringify(state), { mode: 0o600 }); fs.renameSync(temporary, file); } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); } };
  const token = () => { check(safeStorage.isEncryptionAvailable(), 'SYSTEM_ENCRYPTION_UNAVAILABLE'); return safeStorage.decryptString(Buffer.from(state.encryptedToken, 'base64')); };
  const snapshot = () => ({ serverUrl: state.serverUrl, deviceId: state.deviceId, name: state.name, enabled: state.enabled, sessionIds: [...state.sessionIds], connection, error,
    sessions: (runtime?.sessionManagerV2?.getAllSessions() || []).slice(0, 300).map(publicSession) });
  const stop = () => { const previous = agent; agent = undefined; previous?.stop(); connection = 'disabled'; };
  const start = () => {
    stop(); error = ''; if (!state.enabled || !state.encryptedToken) return;
    try {
      agent = new DeviceAgent({ url: state.serverUrl, token: token(), journalFile: path.join(root, `receipts-${state.deviceId}.json`), execute: createAdapter(() => runtime, () => state), onState: value => {
        connection = value;
        if (value === 'revoked') {
          state.enabled = false; state.deviceId = ''; state.encryptedToken = '';
          try { save(); } catch { error = 'REMOTE_CONFIG_SAVE_FAILED'; }
        }
      } }); agent.start();
    } catch { state.enabled = false; error = 'REMOTE_START_FAILED'; try { save(); } catch { error = 'REMOTE_CONFIG_SAVE_FAILED'; } }
  };
  const api = async (url, route, data, accessToken) => {
    const response = await fetch(url + route, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}) }, body: JSON.stringify(data) });
    let result; try { result = await response.json(); } catch { throw new RemoteError('INVALID_SERVER_RESPONSE'); }
    check(response.ok, result.error || 'SERVER_UNAVAILABLE', response.status); return result;
  };
  const perform = handler => async (_event, input) => {
    if (busy) return { success: false, error: 'SETTINGS_BUSY' };
    busy = true;
    try { return { success: true, ...await handler(input) }; }
    catch (caught) { return { success: false, error: caught instanceof RemoteError ? caught.code : 'REMOTE_OPERATION_FAILED' }; }
    finally { busy = false; }
  };
  ipcMain.handle('dev:remote:get', () => ({ success: true, ...snapshot() }));
  ipcMain.handle('dev:remote:pair', perform(async input => {
    check(!state.deviceId, 'ALREADY_PAIRED', 409);
    check(input && text(input.code, 16) && text(input.name, 80) && input.name.trim().length > 0);
    check(safeStorage.isEncryptionAvailable(), 'SYSTEM_ENCRYPTION_UNAVAILABLE');
    const url = serverUrl(input.serverUrl);
    const result = await api(url, '/api/device/pair', { code: input.code, name: input.name });
    check(id(result.deviceId) && typeof result.deviceToken === 'string' && /^[A-Za-z0-9_-]{43}$/.test(result.deviceToken), 'INVALID_SERVER_RESPONSE');
    state = { ...state, serverUrl: url, name: input.name.trim(), deviceId: result.deviceId, encryptedToken: safeStorage.encryptString(result.deviceToken).toString('base64'), enabled: false, sessionIds: [] };
    save(); return snapshot();
  }));
  ipcMain.handle('dev:remote:access', perform(async input => {
    check(state.deviceId, 'PAIR_FIRST'); check(input && typeof input.enabled === 'boolean' && Array.isArray(input.sessionIds) && input.sessionIds.length <= 200 && input.sessionIds.every(id));
    const available = new Set((runtime?.sessionManagerV2?.getAllSessions() || []).map(s => s.id));
    check(input.sessionIds.every(value => available.has(value)), 'SESSION_NOT_FOUND');
    stop(); state = { ...state, enabled: input.enabled, sessionIds: [...new Set(input.sessionIds)] }; save(); start(); return snapshot();
  }));
  ipcMain.handle('dev:remote:disconnect', perform(async () => { stop(); state.enabled = false; save(); return snapshot(); }));
  ipcMain.handle('dev:remote:forget', perform(async () => {
    stop(); state.enabled = false; save();
    let warning;
    if (state.encryptedToken) try { await api(state.serverUrl, '/api/device/unpair', {}, token()); } catch { warning = 'SERVER_REVOCATION_UNCONFIRMED'; }
    state.deviceId = ''; state.encryptedToken = ''; state.sessionIds = []; save(); return { ...snapshot(), warning };
  }));
  app.whenReady().then(start).catch(() => { error = 'REMOTE_START_FAILED'; });
  app.on('before-quit', stop);
  controller = { snapshot, stop };
  return controller;
}
module.exports = { registerRemote, attachRuntime, createAdapter, publicSession };
