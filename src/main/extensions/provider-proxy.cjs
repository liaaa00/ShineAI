'use strict';

function environmentProxy(env = process.env) {
  const value = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || env.ALL_PROXY || env.all_proxy;
  if (!value) return null;
  return String(value).split(/\r?\n/).map(line => line.trim()).find(line => /^(https?|socks5?):\/\//i.test(line)) || value;
}

function proxyEnvironment(database) {
  let settings;
  try { settings = database?.getAppSettings(); } catch { return {}; }
  if (!settings?.proxyType || settings.proxyType === 'none' || !settings.proxyHost || !settings.proxyPort) return {};
  const protocol = settings.proxyType === 'socks5' ? 'socks5' : 'http';
  const user = settings.proxyUsername;
  const password = settings.proxyPassword;
  const auth = user ? encodeURIComponent(user) + (password ? ':' + encodeURIComponent(password) : '') + '@' : '';
  const address = `${protocol}://${auth}${settings.proxyHost}:${settings.proxyPort}`;
  return { HTTPS_PROXY: address, HTTP_PROXY: address, ALL_PROXY: address };
}

module.exports = { environmentProxy, proxyEnvironment };
