'use strict';
const crypto = require('node:crypto');
const VERSION = 1;
const MAX_FRAME = 512 * 1024;
class RemoteError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
function check(condition, code = 'INVALID_REQUEST', status = 400) { if (!condition) throw new RemoteError(code, status); }
function text(value, max = 128) { return typeof value === 'string' && value.length > 0 && value.length <= max; }
function id(value) { return text(value, 128) && !['__proto__', 'constructor', 'prototype'].includes(value) && /^[a-zA-Z0-9_-]+$/.test(value); }
function serverUrl(value) {
  let url; try { url = new URL(value); } catch { throw new RemoteError('INVALID_SERVER_URL'); }
  check(['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/', 'INVALID_SERVER_URL');
  check(url.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'HTTPS_REQUIRED');
  return url.origin;
}
function fingerprint(command) {
  return crypto.createHash('sha256').update(JSON.stringify([command.type, command.sessionId || '', command.text || ''])).digest('hex');
}
function validateCommand(value, now = Date.now()) {
  check(value && value.version === VERSION && id(value.id), 'INVALID_COMMAND');
  check(['sessions.list', 'session.read', 'session.message', 'session.stop'].includes(value.type), 'UNSUPPORTED_COMMAND');
  check(Number.isSafeInteger(value.expiresAt) && value.expiresAt > now && value.expiresAt <= now + 60000, 'COMMAND_EXPIRED');
  if (value.type !== 'sessions.list') check(id(value.sessionId), 'INVALID_SESSION');
  if (value.type === 'session.message') check(text(value.text, 16000) && value.text.trim().length > 0, 'EMPTY_MESSAGE');
  return { version: VERSION, id: value.id, type: value.type, expiresAt: value.expiresAt,
    ...(value.type !== 'sessions.list' ? { sessionId: value.sessionId } : {}),
    ...(value.type === 'session.message' ? { text: value.text } : {}) };
}
function plainMessages(messages) {
  // Share conversation text only. Tool arguments, provider config and local paths
  // in configuration objects never cross this boundary.
  return (Array.isArray(messages) ? messages : []).slice(-60).flatMap(message => {
    if (!['user', 'assistant', 'system'].includes(message.role)) return [];
    const content = typeof message.content === 'string' ? message.content :
      (Array.isArray(message.content) ? message.content.filter(b => b?.type === 'text' && typeof b.text === 'string').map(b => b.text).join('\n') : '');
    return [{ id: String(message.id || '').slice(0, 128), role: message.role, text: content.slice(-4000), timestamp: String(message.timestamp || '').slice(0, 40) }];
  }).filter(m => m.text).slice(-30);
}
module.exports = { VERSION, MAX_FRAME, RemoteError, check, text, id, serverUrl, fingerprint, validateCommand, plainMessages };
