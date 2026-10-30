'use strict';

const fs = require('node:fs/promises');
function normalizeCookie(c) {
  if (!c || typeof c.name !== 'string' || !c.name || typeof c.value !== 'string' || /[\x00-\x20;=]/.test(c.name)) return null;
  const domain = String(c.domain || '').trim();
  if (!/^\.?[a-z\d.-]+$/i.test(domain) || domain.includes('..')) return null;
  const secure = !!c.secure,
    host = domain.replace(/^\./, ''),
    cookiePath = typeof c.path === 'string' && c.path.startsWith('/') ? c.path : '/';
  const out = {
    url: (secure ? 'https' : 'http') + '://' + host + cookiePath,
    name: c.name,
    value: c.value,
    path: cookiePath,
    secure,
    httpOnly: !!c.httpOnly
  };
  if (c.hostOnly !== true) out.domain = domain;
  const expires = Number(c.expirationDate ?? c.expires);
  if (Number.isFinite(expires) && expires > 0) {
    if (expires <= Date.now() / 1000) return null;
    out.expirationDate = expires;
  }
  const sameSite = String(c.sameSite || '').toLowerCase();
  if (['strict', 'lax', 'no_restriction'].includes(sameSite)) out.sameSite = sameSite;
  if (c.name.startsWith('__Secure-') && !secure) return null;
  if (c.name.startsWith('__Host-')) {
    if (!secure || cookiePath !== '/') return null;
    delete out.domain;
  }
  return out;
}
function parseCookies(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > 5 * 1024 * 1024) throw Error('Cookie 文件过大，请只导出需要的网站。');
  const trimmed = text.trim();
  if (!trimmed) throw Error('文件为空。');
  let rows = [];
  if (/^[\[{]/.test(trimmed)) {
    let data;
    try {
      data = JSON.parse(trimmed);
    } catch {
      throw Error('Cookie JSON 格式无效。');
    }
    rows = Array.isArray(data) ? data : data.cookies;
    if (!Array.isArray(rows)) throw Error('JSON 中没有 Cookie 数组。');
  } else for (let line of trimmed.split(/\r?\n/)) {
    let httpOnly = false;
    if (line.startsWith('#HttpOnly_')) {
      line = line.slice(10);
      httpOnly = true;
    } else if (line.trim().startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 7) continue;
    rows.push({
      domain: parts[0],
      hostOnly: parts[1].toUpperCase() !== 'TRUE',
      path: parts[2],
      secure: parts[3].toUpperCase() === 'TRUE',
      expirationDate: Number(parts[4]),
      name: parts[5],
      value: parts.slice(6).join('\t'),
      httpOnly
    });
  }
  if (rows.length > 5000) throw Error('Cookie 数量过多，请只导出需要的网站。');
  const cookies = rows.map(normalizeCookie).filter(Boolean);
  if (!cookies.length) throw Error('没有可导入的有效 Cookie；文件可能已过期。');
  return {
    cookies,
    skipped: rows.length - cookies.length
  };
}
async function importCookies(electron, event, options = {}) {
  const scope = options?.scope ?? 'shared';
  if (!['shared', 'web-llm'].includes(scope)) throw Error('请选择导入目标。');
  const owner = electron.BrowserWindow.fromWebContents(event.sender),
    call = (method, args) => owner ? electron.dialog[method](owner, args) : electron.dialog[method](args);
  const file = await call('showOpenDialog', {
    title: '导入浏览器登录状态',
    properties: ['openFile'],
    filters: [{
      name: 'Cookie 文件',
      extensions: ['json', 'txt']
    }]
  });
  if (file.canceled) return {
    ok: false,
    canceled: true
  };
  const stat = await fs.stat(file.filePaths[0]);
  if (!stat.isFile() || stat.size > 5 * 1024 * 1024) throw Error('请选择小于 5 MB 的 Cookie 文件。');
  const {
    cookies,
    skipped
  } = parseCookies(await fs.readFile(file.filePaths[0], 'utf8'));
  const domains = [...new Set(cookies.map(c => new URL(c.url).hostname))];
  const answer = await call('showMessageBox', {
    type: 'question',
    title: '确认导入登录状态',
    message: `将 ${cookies.length} 条 Cookie 导入${scope === 'shared' ? '普通内置浏览器' : '网页大模型浏览器'}？`,
    detail: '涉及网站：' + domains.slice(0, 20).join('、') + '\n\n登录状态仅保存在本机。会话隔离的其他浏览器不会自动获得这些登录状态。',
    buttons: ['导入', '取消'],
    defaultId: 1,
    cancelId: 1,
    noLink: true
  });
  if (answer.response !== 0) return {
    ok: false,
    canceled: true
  };
  const target = electron.session.fromPartition(scope === 'shared' ? 'persist:browser' : 'persist:browser:session:web-llm-settings');
  let imported = 0;
  for (const cookie of cookies) try {
    await target.cookies.set(cookie);
    imported++;
  } catch {}
  await target.cookies.flushStore();
  return {
    ok: imported > 0,
    parsed: cookies.length,
    imported,
    skipped: skipped + cookies.length - imported,
    ...(imported ? {} : {
      error: '浏览器拒绝了这些 Cookie，请重新导出。'
    })
  };
}
module.exports = {
  normalizeCookie,
  parseCookies,
  importCookies
};
