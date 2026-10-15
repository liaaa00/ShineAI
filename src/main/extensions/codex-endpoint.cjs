'use strict';

// Codex uses an OpenAI-compatible API base, not a complete endpoint URL.
// Only infer /v1 for a bare origin; preserve explicit gateway paths.
function normalizeCodexBaseUrl(value) {
  const base = typeof value === 'string' ? value.trim() : '';
  const origin = /^(https?:\/\/[^/?#]+)\/*$/i.exec(base);
  return origin ? `${origin[1]}/v1` : base.replace(/\/+$/, '');
}

class CodexProbeError extends Error {
  constructor(message) {
    super(message);
    this.code = 'CODEX_PROBE_FAILED';
  }
}

// HTTP 200 can carry a gateway error. Wait for actual output or a completed
// Responses object, while keeping the entire probe within its original deadline.
async function readCodexProbeResponse(response, fallbackModel, timeoutMs = 40000) {
  if (!response.body?.getReader) throw new CodexProbeError('Responses API returned no readable response body.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', bytes = 0, model = fallbackModel;
  const inspect = (value, event = '') => {
    if (!value || typeof value !== 'object') throw new CodexProbeError('Responses API returned an invalid response.');
    const result = value.response || value;
    const type = value.type || event;
    if (value.error || result.error || type === 'error' || type === 'response.failed' || result.status === 'failed') {
      throw new CodexProbeError(String(value.error?.message || result.error?.message || value.message || 'Responses API reported a model error.').slice(0, 1000));
    }
    if (typeof result.model === 'string' && result.model.trim()) model = result.model.trim();
    if (/^response\.(output_text|reasoning_text|reasoning_summary_text|function_call_arguments)\.delta$/.test(type) && typeof value.delta === 'string' && value.delta.length) return true;
    const isResponse = result.object === 'response' || type.startsWith('response.');
    return isResponse && (result.status === 'completed' ||
      result.status === 'incomplete' && Number(result.usage?.output_tokens) > 0);
  };
  const parse = (text) => {
    try { return JSON.parse(text); }
    catch { throw new CodexProbeError('Responses API returned invalid JSON.'); }
  };
  const streaming = /text\/event-stream/i.test(response.headers.get('content-type') || '');
  let timer;
  const expired = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('Responses API body timed out.');
      error.name = 'AbortError';
      reject(error);
    }, Math.max(1, timeoutMs));
  });
  const read = async () => {
    while (true) {
      const { done, value } = await reader.read();
      bytes += value?.byteLength || 0;
      if (bytes > 256 * 1024) throw new CodexProbeError('Responses API probe exceeded its response limit.');
      buffer += decoder.decode(value, { stream: !done });
      if (streaming) {
        // Support CRLF and events split across network chunks.
        let boundary;
        while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
          const frame = buffer.slice(0, boundary.index);
          buffer = buffer.slice(boundary.index + boundary[0].length);
          const lines = frame.split(/\r?\n/);
          const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
          const event = lines.find(line => line.startsWith('event:'))?.slice(6).trim();
          if (data && data !== '[DONE]' && inspect(parse(data), event)) return model;
        }
      } else if (done && inspect(parse(buffer))) return model;
      if (done) throw new CodexProbeError('Responses API ended before returning model output.');
    }
  };
  try { return await Promise.race([read(), expired]); }
  finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

module.exports = { normalizeCodexBaseUrl, readCodexProbeResponse };
