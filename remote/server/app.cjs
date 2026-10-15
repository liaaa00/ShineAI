'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocketServer, WebSocket } = require('ws');
const { Store, secret } = require('./store.cjs');
const { VERSION, MAX_FRAME, RemoteError, check, text, id, serverUrl, fingerprint, validateCommand } = require('../../src/shared/remote/protocol.cjs');

async function createRemoteServer({ directory, publicUrl, username, password, heartbeatMs = 15000 }) {
  const origin = serverUrl(publicUrl), secure = origin.startsWith('https:');
  const store = await Store.open(directory, username, password);
  const connections = new Map(), pairing = new Map(), commands = new Map(), limits = new Map();
  let activeLogins = 0;
  const webRoot = path.resolve(__dirname, '../web');
  function rate(request, scope, max, period = 300000) {
    const key = scope + ':' + request.socket.remoteAddress, now = Date.now();
    let entry = limits.get(key);
    if (!entry || entry.until < now) {
      if (limits.size > 1000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
      check(limits.size < 2000, 'RATE_LIMITED', 429);
      limits.set(key, entry = { count: 0, until: now + period });
    }
    check(++entry.count <= max, 'RATE_LIMITED', 429);
  }
  function bearer(request) { const m = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.authorization || ''); return m?.[1]; }
  function cookie(request) { return /(?:^|;\s*)shineai_session=([A-Za-z0-9_-]{43})(?:;|$)/.exec(request.headers.cookie || '')?.[1]; }
  function json(response, status, value, extra = {}) {
    const output = JSON.stringify(value);
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(output), 'Cache-Control': 'no-store', ...extra }); response.end(output);
  }
  async function body(request) {
    check(request.headers['content-type']?.split(';')[0] === 'application/json', 'JSON_REQUIRED', 415);
    const chunks = []; let size = 0;
    for await (const chunk of request) { size += chunk.length; check(size <= 64 * 1024, 'PAYLOAD_TOO_LARGE', 413); chunks.push(chunk); }
    let data; try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new RemoteError('INVALID_JSON'); }
    check(data && typeof data === 'object' && !Array.isArray(data)); return data;
  }
  function deviceForId(deviceId) { const device = store.state.devices.find(d => d.id === deviceId && !d.revoked); check(device, 'DEVICE_NOT_FOUND', 404); return device; }
  function isOnline(deviceId) { const ws = connections.get(deviceId); return Boolean(ws && ws.readyState === WebSocket.OPEN && Date.now() - ws.lastPong < heartbeatMs * 3); }
  function revoke(device) {
    device.revoked = true; store.save();
    connections.get(device.id)?.close(4003, 'Device revoked');
  }
  function rpc(deviceId, input) {
    const command = validateCommand(input), key = deviceId + ':' + command.id, hash = fingerprint(command);
    const existing = commands.get(key);
    if (existing) { check(existing.hash === hash, 'COMMAND_ID_CONFLICT', 409); return existing.promise; }
    check(isOnline(deviceId), 'DEVICE_OFFLINE', 409);
    let active = 0;
    for (const [k, v] of commands) {
      if (v.done && v.createdAt < Date.now() - 300000) commands.delete(k);
      else if (!v.done && v.deviceId === deviceId) active++;
    }
    check(commands.size < 2000 && active < 12, 'DEVICE_BUSY', 429);
    const socket = connections.get(deviceId);
    const record = { deviceId, socket, hash, createdAt: Date.now(), done: false };
    record.promise = new Promise((resolve, reject) => {
      record.finish = (error, result) => {
        if (record.done) return;
        record.done = true; clearTimeout(record.timer);
        error ? reject(error) : resolve(result);
      };
      record.timer = setTimeout(() => record.finish(new RemoteError('COMMAND_OUTCOME_UNKNOWN', 504)), command.expiresAt - Date.now());
      socket.send(JSON.stringify({ kind: 'command', command }), error => { if (error) record.finish(new RemoteError('DEVICE_OFFLINE', 409)); });
    });
    commands.set(key, record);
    return record.promise;
  }

  const server = http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const url = new URL(request.url, origin), method = request.method;
      check(url.origin === origin && !url.search, 'INVALID_REQUEST');
      const route = url.pathname;
      if (method === 'GET' && route === '/health') return json(response, 200, { ok: true, protocol: VERSION });
      if (method === 'GET' && !route.startsWith('/api/')) {
        const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'], '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'], '/icon.svg': ['icon.svg', 'image/svg+xml'] };
        const file = files[route]; check(file, 'NOT_FOUND', 404);
        const bytes = fs.readFileSync(path.join(webRoot, file[0]));
        response.writeHead(200, { 'Content-Type': file[1], 'Content-Length': bytes.length, 'Cache-Control': 'no-cache' }); return response.end(bytes);
      }
      const mutating = !['GET', 'HEAD'].includes(method);
      if (mutating && !route.startsWith('/api/device/')) check(request.headers.origin === origin, 'ORIGIN_REJECTED', 403);
      if (method === 'POST' && route === '/api/login') {
        rate(request, 'login', 10, 15 * 60000); const input = await body(request);
        check(text(input.username, 80) && text(input.password, 1024), 'INVALID_CREDENTIALS', 401);
        check(activeLogins < 4, 'RATE_LIMITED', 429); activeLogins++;
        let login; try { login = await store.login(input.username, input.password); } finally { activeLogins--; }
        check(login, 'INVALID_CREDENTIALS', 401);
        return json(response, 200, { username: store.state.account.username, csrf: login.session.csrf }, { 'Set-Cookie': `shineai_session=${login.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure ? '; Secure' : ''}` });
      }
      if (route.startsWith('/api/device/')) {
        if (method === 'POST' && route === '/api/device/pair') {
          rate(request, 'pair-attempt', 15); const input = await body(request);
          check(text(input.code, 16) && text(input.name, 80) && input.name.trim().length > 0, 'INVALID_REQUEST');
          const code = input.code.replace(/\s/g, '').toUpperCase(), ticket = pairing.get(code);
          check(ticket && ticket.expiresAt > Date.now(), 'PAIR_CODE_INVALID', 401);
          check(store.state.devices.filter(d => !d.revoked).length < 20, 'TOO_MANY_DEVICES', 409);
          pairing.delete(code);
          const token = secret(), { digest } = require('./store.cjs');
          const device = { id: crypto.randomUUID(), name: input.name.trim().slice(0, 80), tokenHash: digest(token), createdAt: Date.now(), revoked: false };
          store.state.devices.push(device); store.state.devices = store.state.devices.filter(d => !d.revoked).slice(-20); store.save();
          return json(response, 200, { deviceId: device.id, deviceToken: token });
        }
        const device = store.device(bearer(request)); check(device, 'DEVICE_UNAUTHORIZED', 401);
        if (method === 'POST' && route === '/api/device/unpair') { await body(request); revoke(device); return json(response, 200, { ok: true }); }
        throw new RemoteError('NOT_FOUND', 404);
      }
      const session = store.session(cookie(request)); check(session, 'LOGIN_REQUIRED', 401);
      if (mutating) check(request.headers['x-shineai-csrf'] === session.csrf, 'CSRF_REJECTED', 403);
      if (method === 'GET' && route === '/api/me') return json(response, 200, { username: store.state.account.username, csrf: session.csrf });
      if (method === 'POST' && route === '/api/logout') {
        store.state.sessions = store.state.sessions.filter(s => s !== session); store.save();
        return json(response, 200, { ok: true }, { 'Set-Cookie': `shineai_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? '; Secure' : ''}` });
      }
      if (method === 'POST' && route === '/api/pairing') {
        rate(request, 'pair-create', 10); await body(request);
        for (const [key, value] of pairing) if (value.expiresAt < Date.now()) pairing.delete(key);
        check(pairing.size < 20, 'RATE_LIMITED', 429);
        const code = crypto.randomBytes(5).toString('hex').toUpperCase(), expiresAt = Date.now() + 300000;
        pairing.set(code, { expiresAt }); return json(response, 200, { code, expiresAt });
      }
      if (method === 'GET' && route === '/api/devices') return json(response, 200, { devices: store.state.devices.filter(d => !d.revoked).map(d => ({ id: d.id, name: d.name, online: isOnline(d.id), createdAt: d.createdAt })) });
      const parts = route.split('/').filter(Boolean);
      check(parts[0] === 'api' && parts[1] === 'devices' && id(parts[2]), 'NOT_FOUND', 404);
      const device = deviceForId(parts[2]);
      if (parts.length === 3 && method === 'DELETE') { revoke(device); return json(response, 200, { ok: true }); }
      rate(request, 'commands', 240, 60000);
      check(parts[3] === 'sessions', 'NOT_FOUND', 404);
      let type, payload = {};
      if (method === 'GET' && parts.length === 4) type = 'sessions.list';
      else {
        check(id(parts[4]), 'INVALID_SESSION'); payload.sessionId = parts[4];
        if (method === 'GET' && parts.length === 5) type = 'session.read';
        else if (method === 'POST' && parts.length === 6 && ['messages', 'stop'].includes(parts[5])) {
          const input = await body(request); check(id(input.commandId), 'INVALID_COMMAND_ID');
          type = parts[5] === 'stop' ? 'session.stop' : 'session.message';
          payload.id = input.commandId;
          if (type === 'session.message') payload.text = input.text;
        } else throw new RemoteError('NOT_FOUND', 404);
      }
      const command = { version: VERSION, id: crypto.randomUUID(), ...payload, type, expiresAt: Date.now() + (method === 'GET' ? 10000 : 30000) };
      const result = await rpc(device.id, command);
      return json(response, 200, { commandId: command.id, result });
    } catch (error) {
      if (!response.headersSent && !response.destroyed) json(response, error instanceof RemoteError ? error.status : 500, { error: error instanceof RemoteError ? error.code : 'SERVER_ERROR' });
      else response.end();
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000; server.maxHeadersCount = 40;
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_FRAME, perMessageDeflate: false });
  server.on('upgrade', (request, socket, head) => {
    const device = store.device(bearer(request));
    if (request.url !== '/device' || !device || (request.headers.origin && request.headers.origin !== origin)) { socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); return; }
    wss.handleUpgrade(request, socket, head, ws => {
      const old = connections.get(device.id); connections.set(device.id, ws); old?.close(4001, 'Connection replaced');
      ws.lastPong = Date.now(); ws.on('pong', () => { ws.lastPong = Date.now(); });
      ws.on('error', () => {});
      ws.on('message', data => {
        let frame; try { frame = JSON.parse(data.toString()); } catch { ws.close(1008, 'Invalid frame'); return; }
        if (frame.version !== VERSION || !id(frame.id) || !['ack', 'result'].includes(frame.kind)) { ws.close(1008, 'Invalid frame'); return; }
        const record = commands.get(device.id + ':' + frame.id);
        if (!record || record.socket !== ws || record.done) return;
        if (frame.kind === 'ack') record.acknowledged = true;
        else if (frame.ok === true) record.finish(null, frame.result);
        else record.finish(new RemoteError(['NOT_SHARED', 'SESSION_NOT_FOUND', 'REMOTE_DISABLED', 'COMMAND_EXPIRED', 'COMMAND_ID_CONFLICT', 'COMMAND_OUTCOME_UNKNOWN', 'DEVICE_BUSY'].includes(frame.error) ? frame.error : 'DESKTOP_ERROR', 409));
      });
      ws.on('close', () => {
        if (connections.get(device.id) === ws) connections.delete(device.id);
        for (const record of commands.values()) if (record.socket === ws && !record.done) record.finish(new RemoteError(record.acknowledged ? 'COMMAND_OUTCOME_UNKNOWN' : 'DEVICE_OFFLINE', 409));
      });
    });
  });
  const heartbeat = setInterval(() => {
    for (const ws of connections.values()) if (Date.now() - ws.lastPong > heartbeatMs * 3) ws.terminate(); else ws.ping();
  }, heartbeatMs); heartbeat.unref();
  return {
    server, store,
    async close() {
      clearInterval(heartbeat);
      for (const record of commands.values()) if (!record.done) record.finish(new RemoteError('SERVER_STOPPED', 503));
      for (const ws of wss.clients) ws.terminate();
      await new Promise(resolve => wss.close(resolve));
      server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    },
  };
}
module.exports = { createRemoteServer };
