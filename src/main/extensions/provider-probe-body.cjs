'use strict';
const { readBytes } = require('./market-download.cjs');

async function readProbeBody(response, protocol, requestedModel, timeoutMs = 10000) {
  // Reuse the bounded reader with the response already obtained. Model probes
  // never retry a POST, including when the provider returns HTTP 200 with an error.
  let data;
  try {
    const bytes = await readBytes(response, AbortSignal.timeout(Math.max(1,timeoutMs)), 1024*1024);
    data = JSON.parse(bytes.toString('utf8'));
  } catch(error) {
    if (/timeout|abort/i.test(error.name)) throw Object.assign(new Error('服务商响应正文超时'),{name:'AbortError'});
    throw new Error('服务商未返回有效的模型响应，请检查 API 地址和协议');
  }
  if (data.error || data.type === 'error' || ['failed', 'cancelled'].includes(data.status)) {
    const message = typeof data.error === 'string' ? data.error : data.error?.message;
    throw new Error(typeof message === 'string' ? message : '服务商返回了模型错误');
  }
  const valid = protocol === 'chat' ? Array.isArray(data.choices) && data.choices.some(choice => choice && (typeof choice.message?.content === 'string' || typeof choice.message?.reasoning_content === 'string' || Array.isArray(choice.message?.tool_calls)))
    : protocol === 'claude' ? data.type === 'message' && Array.isArray(data.content) && data.content.some(block => ['text','thinking','tool_use','redacted_thinking'].includes(block?.type))
    : protocol === 'gemini' ? Array.isArray(data.candidates) && data.candidates.some(candidate => candidate.content?.parts?.length)
    : Array.isArray(data.output) && data.output.some(item => item?.type === 'message' || item?.type === 'reasoning' || item?.type === 'function_call');
  if (!valid) throw new Error('服务商返回 HTTP 200，但没有有效的模型输出');
  return typeof data.model === 'string' && data.model.trim() ? data.model.trim() : requestedModel;
}
module.exports = { readProbeBody };
