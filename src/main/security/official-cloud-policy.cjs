'use strict';
const { removed } = require('../extensions/removed-cloud-services.cjs');
const ownedDomains = Object.freeze(['spectraidev.cloud', 'spectraidev.com', 'claudeops.wbdao.cn']);
const prefixes = ['payment:', 'balance:', 'checkin:', 'org:', 'chat:', 'relay:', 'relay-template:', 'feedback:', 'meeting:', 'screenshare:', 'community:', 'telemetry:', 'update:'];
// Public registries download capabilities for local use; they are independent of hosted accounts.
const exactChannels = new Set(['session:share', 'session:share-html:publish', 'session:share-html:revoke', 'recorder:cloud-pull', 'wecom:test-relay-connection']);
const localAuthChannels = new Set(['auth:get-user', 'auth:get-plan', 'auth:logout', 'auth:refresh-user', 'auth:get-saved-credentials']);
function isOfficialUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ownedDomains.some(domain => host === domain || host.endsWith('.' + domain));
  } catch { return false; }
}
function isRemovedChannel(channel) {
  return (channel.startsWith('auth:') && !localAuthChannels.has(channel)) || prefixes.some(prefix => channel.startsWith(prefix)) || exactChannels.has(channel);
}
function localResponse(channel) {
  if (['auth:get-telemetry-enabled', 'auth:set-telemetry-enabled', 'telemetry:get-enabled', 'telemetry:set-enabled'].includes(channel)) return { success: true, enabled: false, syncMode: 'local' };
  if (channel === 'org:get-features') return { success: true, features: { organization: false, org: false }, enabled: false };
  if (channel === 'relay:get-status') return { connected: false, enabled: false, status: 'disabled' };
  if (channel === 'relay:get-config') return { enabled: false };
  if (channel === 'relay:list-devices' || channel === 'relay-template:get-all' || channel === 'relay-template:get-all-admin') return [];
  if (channel === 'meeting:get-state') return { connectionState: 'disconnected', room: null, participants: [], enabled: false };
  if (channel === 'meeting:get-gateway-port') return null;
  if (channel === 'update:get-state') return { status: 'idle', enabled: false, isForcedUpgrade: false, message: '本地开发版通过工程代码更新' };
  return removed();
}
function installCloudIpcPolicy(ipcMain) {
  const handle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (channel, handler) => handle(channel, async (event, ...args) => {
    if (isRemovedChannel(channel)) return localResponse(channel);
    if (channel === 'provider:get-all') return (await handler(event, ...args)).filter(provider => provider.id !== 'claudeops-builtin');
    if (channel === 'provider:get' && args[0] === 'claudeops-builtin') return null;
    if (['provider:update', 'provider:delete'].includes(channel) && args[0] === 'claudeops-builtin') return removed();
    if (['provider:create', 'provider:test', 'session:create'].includes(channel) && (args[0]?.id === 'claudeops-builtin' || args[0]?.providerId === 'claudeops-builtin')) return removed();
    return handler(event, ...args);
  });
}
function blockedError() { const error = new Error('Official cloud services were removed from this local edition'); error.code = 'OFFICIAL_CLOUD_REMOVED'; return error; }
function requestUrl(args, protocol) {
  const input = args[0];
  if (typeof input === 'string' || input instanceof URL) return String(input);
  if (input && typeof input === 'object') return `${input.protocol || protocol}//${input.hostname || input.host || 'localhost'}${input.path || '/'}`;
  return '';
}
function installCloudNetworkPolicy(app) {
  const fetch = globalThis.fetch;
  globalThis.fetch = async (input, ...rest) => {
    if (isOfficialUrl(typeof input === 'string' || input instanceof URL ? input : input?.url)) throw blockedError();
    const response = await fetch(input, ...rest);
    if (isOfficialUrl(response.url)) throw blockedError();
    return response;
  };
  for (const protocol of ['http:', 'https:']) {
    const client = require(protocol.slice(0, -1));
    for (const name of ['request', 'get']) {
      const original = client[name];
      client[name] = function (...args) { if (isOfficialUrl(requestUrl(args, protocol))) throw blockedError(); return original.apply(this, args); };
    }
  }
  app.on('session-created', session => {
    const register = session.webRequest.onBeforeRequest.bind(session.webRequest);
    const wrap = listener => (details, callback) => isOfficialUrl(details.url) ? callback({ cancel: true }) : listener ? listener(details, callback) : callback({});
    // Compose future browser handlers with this policy so they cannot replace it.
    session.webRequest.onBeforeRequest = (...args) => {
      const listener = args.at(-1);
      return args.length > 1 ? register(args[0], wrap(listener)) : register(wrap(listener));
    };
    register(wrap(null));
  });
}
module.exports = { ownedDomains, isOfficialUrl, isRemovedChannel, localResponse, installCloudIpcPolicy, installCloudNetworkPolicy };
