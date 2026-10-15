'use strict';
const { setTimeout: delay } = require('node:timers/promises');

async function readBytes(response, signal, maxBytes) {
  if (!response.body?.getReader) throw Object.assign(new Error('下载内容为空'), {code:'MARKET_CONTENT_INVALID'});
  const reader = response.body.getReader();
  let rejectAbort;
  const aborted = new Promise((_,reject) => { rejectAbort = () => reject(signal.reason); });
  signal.addEventListener('abort', rejectAbort, {once:true});
  const chunks = []; let size = 0;
  try {
    signal.throwIfAborted();
    while (true) {
      const { done,value } = await Promise.race([reader.read(),aborted]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw Object.assign(new Error('下载文件过大'), {code:'MARKET_CONTENT_INVALID'});
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  } finally {
    signal.removeEventListener('abort',rejectAbort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function downloadError(error) {
  if (error?.code === 'MARKET_CONTENT_INVALID' || error?.code === 'MARKET_HTTP_ERROR') return error;
  const timeout = /timeout|abort/i.test(error?.name + ' ' + error?.message);
  const cause = error?.cause?.code || error?.code;
  const hint = ['ENOTFOUND', 'EAI_AGAIN'].includes(cause) ? '域名解析失败，请检查网络或代理' : cause === 'ECONNREFUSED' ? '连接被拒绝，请检查代理是否正在运行' : timeout ? '下载超时，请检查网络或代理后重试' : '下载连接中断，请检查网络或代理后重试';
  return Object.assign(new Error(hint), { code: 'MARKET_DOWNLOAD_FAILED', retryable: true });
}

async function downloadBytes(fetchFile, url, { signal, timeoutMs = 30000, maxBytes = 5 * 1024 * 1024, retries = 2, retryDelayMs = 300, onRetry = () => {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    let response;
    try {
      const attemptSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
      response = await fetchFile(url, { signal: attemptSignal });
      if (!response.ok) {
        const status = response.status;
        const message = status === 404 ? '技能文件不存在，请刷新市场后重试' : [401,403].includes(status) ? '下载被拒绝或触发访问限制，请稍后重试' : status === 429 ? '访问过于频繁，请稍后重试' : '下载失败：HTTP ' + status;
        throw Object.assign(new Error(message), { code: 'MARKET_HTTP_ERROR', status, retryable: status === 408 || status === 429 || status >= 500 });
      }
      if (Number(response.headers?.get('content-length')) > maxBytes) throw Object.assign(new Error('下载文件过大'), { code: 'MARKET_CONTENT_INVALID' });
      return await readBytes(response,attemptSignal,maxBytes);
    } catch (error) {
      signal?.throwIfAborted();
      const friendly = downloadError(error);
      if (!friendly.retryable || attempt >= retries) throw friendly;
      onRetry(attempt + 1, retries);
      await delay(Math.min(retryDelayMs * 2 ** attempt, 2000), undefined, { signal });
    } finally { if (response?.body && !response.body.locked) await response.body.cancel().catch(() => {}); }
  }
}

function requireSkillText(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('技能正文为空，未安装');
  if (/^\s*(?:<!doctype\s+html|<html\b|<head\b|<body\b)/i.test(text)) throw new Error('下载地址返回了网页，未获取到技能正文');
  return text;
}

module.exports = { downloadBytes, downloadError, requireSkillText, readBytes };
