'use strict';
// Bounded local allowlist: never retain headers, URLs, prompts or attachments.
const records = new Map();
const levels = new Set(['none','minimal','low','medium','high','xhigh','max','ultra']);
function safeName(value) { return typeof value === 'string' && /^[a-zA-Z0-9_.:/@+-]{1,160}$/.test(value) && !/^(sk-|Bearer)/i.test(value) ? value : '未知'; }
function effort(value) { return levels.has(value) ? value : null; }
function save(id, patch) {
  if (typeof id !== 'string' || !id || id.length > 200) return;
  records.delete(id);
  records.set(id, { ...patch, recordedAt: new Date().toISOString() });
  while (records.size > 100) records.delete(records.keys().next().value);
}
function recordAdapter(session, adapter) {
  const c = session.config || {}, p = session.provider || {};
  let selected;
  try { selected = adapter.getReasoningEffort?.(session.id); } catch {}
  save(session.id, { stage:'adapter', adapter:safeName(p.adapterType), model:safeName(c.model || p.defaultModel), configuredEffort:effort(typeof adapter.getReasoningEffort==='function'?selected:c.reasoningEffort || p.reasoningEffort), permissionMode:['full_auto','balanced','manual'].includes(c.permissionMode)?c.permissionMode:null, parameters:null, toolCount:null });
}
function wireSummary(body, protocol) {
  const parameters = {};
  if (effort(body.reasoning_effort)) parameters.reasoning_effort = body.reasoning_effort;
  if (effort(body.reasoning?.effort)) parameters['reasoning.effort'] = body.reasoning.effort;
  if (effort(body.output_config?.effort)) parameters['output_config.effort'] = body.output_config.effort;
  if (['enabled','disabled','adaptive'].includes(body.thinking?.type)) parameters['thinking.type'] = body.thinking.type;
  if (Number.isSafeInteger(body.thinking?.budget_tokens) && body.thinking.budget_tokens > 0) parameters['thinking.budget_tokens'] = body.thinking.budget_tokens;
  return { stage:'outbound', protocol, model:safeName(body.model), parameters, toolCount:Array.isArray(body.tools)?body.tools.length:0 };
}
async function observeRequest(id, url, options, send) {
  let summary;
  let inputAttempt=[];
  try {
    const pathname=new URL(url).pathname;
    const protocol=/\/chat\/completions$/.test(pathname)?'Chat Completions':/\/responses$/.test(pathname)?'Responses':/\/messages$/.test(pathname)?'Anthropic Messages':null;
    if(protocol&&typeof options?.body==='string'&&options.body.length<8*1024*1024) {
      const body=JSON.parse(options.body);
      summary=wireSummary(body,protocol);
      inputAttempt=require('./running-input.cjs').beginRequest(id,body);
      save(id,{...records.get(id),...summary});
    }
  } catch {}
  try {
    const response=await send();
    if(response.status>=400)require('./running-input.cjs').requestFailed(id,inputAttempt);
    if(summary)save(id,{...records.get(id),httpStatus:response.status});
    return response;
  } catch(error) {
    require('./running-input.cjs').requestFailed(id,inputAttempt);
    if(summary)save(id,{...records.get(id),failure:/abort|timeout/i.test(error?.name)?'timeout-or-cancelled':'network'});
    throw error;
  }
}
function installFetchObserver(host = globalThis) {
  const fetch = host.fetch;
  if (typeof fetch !== 'function') return;
  host.fetch = async function(input, options) {
    let id, summary;
    try {
      const headers = new Headers(options?.headers);
      id = headers.get('x-session-id') || headers.get('session_id');
      const pathname = new URL(typeof input === 'string' ? input : input.url).pathname;
      const protocol = /\/chat\/completions$/.test(pathname)?'Chat Completions':/\/responses$/.test(pathname)?'Responses':/\/messages$/.test(pathname)?'Anthropic Messages':null;
      if (id && protocol && typeof options?.body === 'string' && options.body.length < 8*1024*1024) {
        summary = wireSummary(JSON.parse(options.body), protocol);
        save(id, { ...records.get(id), ...summary });
      }
    } catch {}
    try {
      const response = await fetch.apply(this, arguments);
      if (summary) save(id, { ...records.get(id), httpStatus:response.status });
      return response;
    } catch (error) {
      if (summary) save(id, { ...records.get(id), failure:/abort|timeout/i.test(error?.name)?'timeout-or-cancelled':'network' });
      throw error;
    }
  };
}
function get(id) {
  if (typeof id !== 'string' || id.length > 200) throw new Error('Invalid session id');
  return records.has(id) ? structuredClone(records.get(id)) : null;
}
function register(ipcMain) { ipcMain.handle('dev:request-summary', (_event,id) => get(id)); }
module.exports = { register, recordAdapter, wireSummary, observeRequest, installFetchObserver, get };
