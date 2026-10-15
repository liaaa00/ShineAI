'use strict';
const { randomBytes, timingSafeEqual } = require('node:crypto');
const tokens = Object.freeze({ localAuth: randomBytes(32).toString('base64url'), meeting: randomBytes(32).toString('base64url') });
function matches(value, expected) {
  if (typeof value !== 'string') return false;
  const left = Buffer.from(value), right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
function allowedOrigin(origin) {
  if (!origin || origin === 'null') return true;
  try { const url = new URL(origin); return ['http:','https:'].includes(url.protocol) && ['127.0.0.1','localhost','[::1]'].includes(url.hostname); } catch { return false; }
}
function protectHttp(kind, request, response) {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if (kind === 'localAuth' && url.pathname !== '/auth/token') return true;
  if (kind === 'meeting' && url.pathname === '/health' && request.method === 'GET') return true;
  const header = kind === 'meeting' ? 'x-shineai-meeting-capability' : 'x-shineai-local-capability';
  const origin = request.headers.origin;
  if (request.method === 'OPTIONS' && allowedOrigin(origin)) {
    if (origin) response.setHeader('Access-Control-Allow-Origin',origin);
    response.setHeader('Access-Control-Allow-Headers',header+', Content-Type');
    response.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    response.writeHead(204);response.end();return false;
  }
  if (!allowedOrigin(origin) || !matches(request.headers[header],tokens[kind])) {
    response.writeHead(403, {'Content-Type':'application/json'});response.end('{"error":"Local service access denied"}');return false;
  }
  return true;
}
function verifyMeetingSocket(info) {
  const url = new URL(info.req.url || '/', 'http://127.0.0.1');
  return url.pathname === '/meeting/events' && allowedOrigin(info.origin) && matches(info.req.headers['x-shineai-meeting-capability'] || url.searchParams.get('capability'),tokens.meeting);
}
function registerServiceAccess(ipcMain, config) {
  ipcMain.handle('dev:service-access',()=>({localAuth:{port:config.localAuthPort,capability:tokens.localAuth},meeting:{port:config.meetingPort,capability:tokens.meeting}}));
}
module.exports={matches,allowedOrigin,protectHttp,verifyMeetingSocket,registerServiceAccess};
