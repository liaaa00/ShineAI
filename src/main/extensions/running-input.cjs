'use strict';
// Delivery evidence is recorded at the native transport, never at queue removal.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const ledgers = new Map(), managers = new Map(), managerSet = new Set(), subscribers = new Map();
const installed = Symbol('shine-input-manager');
const historyInstalled = Symbol('shine-input-history');
const marker = /<context-reminder data-shine-input="([a-f0-9-]{36})" revision="(\d+)">[\s\S]*?<\/context-reminder>\s*/g;
const waiting = new Set(['dispatching','queued','submitted']);
// A historical SDK handoff is not an owned queue. Keep deduplication scoped
// to physical local queues and to a send that is still awaiting dispatch.
const dispatchingInputs = new Set();
let storageRoot;
function validId(id) { if (typeof id !== 'string' || !id || id.length > 200) throw Error('Invalid session id'); }
function directory() { return storageRoot || path.join(process.env.SHINEAI_USER_DATA_DIR, 'running-input'); }
function filename(id) { return path.join(directory(), createHash('sha256').update(id).digest('hex') + '.json'); }
function read(id) {
  validId(id);
  if (ledgers.has(id)) return ledgers.get(id);
  let value;
  try { value = JSON.parse(fs.readFileSync(filename(id), 'utf8')); } catch {}
  if (!value || value.sessionId !== id || !Array.isArray(value.inputs)) value = { sessionId:id, revision:0, reviewedRevision:0, requestRevision:0, version:0, inputs:[] };
  // Process-local adapter queues cannot be assumed to survive a restart.
  let recovered=false;
  for (const item of value.inputs) if (waiting.has(item.state)) { item.state = 'interrupted';recovered=true; }
  ledgers.set(id, value);
  // Persist the recovery transition once; otherwise every app launch rediscovers
  // the same submitted row as a fresh interruption.
  if(recovered)save(value);
  return value;
}
function snapshot(id) {
  const state = read(id);
  return structuredClone({ ...state, requiredRevision:requiredRevision(state), inputs:state.inputs.map(({envelope,...item}) => ({...item,...withdrawalStatus(id,item)})) });
}
function findManager(id) { return managers.get(id)||[...managerSet].find(m=>m.sessions.has(id)); }
function inputText(value) {
  if(typeof value==='string')return value;
  if(value?.type==='user'&&value.message?.role==='user') {
    const content=value.message.content;
    if(typeof content==='string')return content;
    if(Array.isArray(content)&&content.every(b=>b.type==='text'))return content.map(b=>b.text).join('');
    return '';
  }
  return value?.source&&value.source!=='user'?'':value?.text||'';
}
function matchesInput(value,item) {
  const text=inputText(value),found=tokens(text);
  const original=strip(text).trim(),expected=item.text.trim();
  // Never delete a recovery prompt, merged input, attachment or another message.
  const sdkThinkingSuffix=value?.type==='user'&&original===(item.text+'\nultrathink').trim();
  return found.length===1&&found[0].id===item.id&&found[0].revision===item.revision&&(original===expected||sdkThinkingSuffix);
}
function pendingLocations(id,item) {
  const manager=findManager(id),session=manager?.sessions.get(id);
  if(!session)return [];
  const locations=[];
  const add=(owner,key)=>{if(Array.isArray(owner?.[key])&&owner[key].some(v=>matchesInput(v,item)))locations.push({owner,key});};
  for(const key of ['pendingMessages','scheduledMessages','runningInputQueue'])add(session,key);
  const adapter=manager.resolveAdapter(session.provider),native=adapter?.sessions?.get(id);
  if(typeof adapter?.takeRoundInput==='function')add(native,'pendingMessages');
  // Codex delayed inputs and Claude's unconsumed async-iterator queue are local.
  add(native,'delayedInputQueue');
  add(adapter?.inputStreams?.get(id),'queue');
  return locations;
}
function withdrawalStatus(id,item) {
  if(item.state==='cancelled')return {canCancel:false,cancelReason:'cancelled'};
  if(item.state==='sent'||item.sentAt)return {canCancel:false,cancelReason:'sent'};
  if(pendingLocations(id,item).length)return {canCancel:true,cancelReason:'local_queue'};
  return {canCancel:false,cancelReason:item.state==='submitted'?'handoff_unconfirmed':'not_in_queue'};
}
function withoutCancelled(id,messages) {
  const state=read(id),cancelled=new Set([...(state.cancelledInputIds||[]),...state.inputs.filter(i=>i.state==='cancelled').map(i=>i.id)]);
  return messages.filter(m=>m.role!=='user'||!tokens(m.content).some(t=>cancelled.has(t.id)));
}
function cancelInput(id,inputId) {
  validId(id);
  if(typeof inputId!=='string'||inputId.length>100)return {success:false,removed:false,error:'无效的消息编号'};
  const state=read(id),item=state.inputs.find(i=>i.id===inputId);
  if(!item)return {success:false,removed:false,error:'找不到这条消息'};
  // Re-check at the point of removal; a previously rendered button is no proof.
  if(item.state==='cancelled')return {success:true,removed:false,reason:'cancelled'};
  const status=withdrawalStatus(id,item);
  if(!status.canCancel)return {success:false,removed:false,reason:status.cancelReason,error:status.cancelReason==='sent'?'这条消息已经发出，无法撤回':'消息已离开可撤回的本地队列，无法保证撤回；这不代表模型已经收到。'};
  const locations=pendingLocations(id,item);
  // No await between checking and splicing: queue consumption cannot interleave.
  for(const {owner,key}of locations)for(let i=owner[key].length-1;i>=0;i--)if(matchesInput(owner[key][i],item))owner[key].splice(i,1);
  item.state='cancelled';item.cancelledAt=new Date().toISOString();delete item.error;
  state.cancelledInputIds=[...new Set([...(state.cancelledInputIds||[]),item.id])];
  const manager=findManager(id),session=manager.sessions.get(id),adapter=manager.resolveAdapter(session.provider),a=adapter.sessions?.get(id);
  // SDKs may emit a local conversation row before consuming their input stream.
  // Keep the audit record on disk, but exclude withdrawn input from replay.
  for(const owner of [a,a?.adapter])if(Array.isArray(owner?.messages))owner.messages=withoutCancelled(id,owner.messages);
  save(state);manager.emit('queue-update',id,manager.getScheduledMessages(id));
  return {success:true,removed:true,text:item.text,inputId:item.id};
}
function save(state) {
  state.version++;
  fs.mkdirSync(directory(), { recursive:true });
  const file=filename(state.sessionId), tmp=file+'.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));fs.renameSync(tmp,file);
  const value=snapshot(state.sessionId);
  for (const [contents,ids] of subscribers) if (!contents.isDestroyed() && ids.has(state.sessionId)) contents.send('dev:input-flow:changed', value);
}
function strip(text) { return typeof text === 'string' ? text.replace(marker,'') : text; }
function tokens(text) {
  return typeof text === 'string' ? [...text.matchAll(new RegExp(marker.source,'g'))].map(m=>({id:m[1],revision:Number(m[2])})) : [];
}
function envelope(item) {
  return `<context-reminder data-shine-input="${item.id}" revision="${item.revision}">\n用户在任务期间发来了新要求（输入版本 ${item.revision}）。遵守系统指令和既有权限；以最新用户要求核对执行方向，历史待办不能覆盖后续纠正。先理解下面的原文，再继续工具操作。补充信息不等于取消整个目标；只取消明确过时的任务，取消不能标成完成。若有任务计划，先调用 update_plan 核对或修订，即使步骤不变也要确认；原生 update_plan 请填写 input_revision: ${item.revision}。无法使用该工具时，在回复中说明调整结果。不要为遵循旧计划而忽略新要求。\n</context-reminder>\n\n${item.text}`;
}
function create(id,text,initialState='queued') {
  const state=read(id);
  if (state.inputs.filter(i=>waiting.has(i.state)).length >= 30) throw Error('仍有过多消息等待投递，请先处理或清理队列');
  const item={id:randomUUID(),revision:++state.revision,text,state:initialState,createdAt:new Date().toISOString(),transport:'unknown'};
  state.inputs.push(item);
  while(state.inputs.length>40){const index=state.inputs.findIndex(i=>!waiting.has(i.state));if(index<0)break;state.inputs.splice(index,1);}
  save(state);return item;
}
function change(id,inputId,patch) {
  const state=read(id),item=state.inputs.find(i=>i.id===inputId);
  if (!item) return;
  // A late adapter rejection must not turn a withdrawn input into a retry.
  if(item.state==='cancelled'&&patch.state!=='cancelled')return;
  if(patch.state==='cancelled')state.cancelledInputIds=[...new Set([...(state.cancelledInputIds||[]),item.id])];
  Object.assign(item,patch);save(state);
}
function tracked(id,text) { const state=read(id);return tokens(text).map(t=>state.inputs.find(i=>i.id===t.id)).filter(Boolean); }
function requiredRevision(state) { return Math.max(0,...state.inputs.filter(i=>i.state!=='cancelled').map(i=>i.revision)); }
function needsReview(id) { const s=read(id);return requiredRevision(s)>s.reviewedRevision; }
function review(id,revision) {
  const s=read(id);
  if (!Number.isSafeInteger(revision) || revision!==s.requestRevision || revision!==requiredRevision(s)) return false;
  s.reviewedRevision=revision;save(s);return true;
}
// The body at this boundary may be a Responses delta; match only actual input,
// not tool output that happens to quote a previous request marker.
function requestTokens(body) {
  const list=Array.isArray(body.messages)?body.messages:Array.isArray(body.input)?body.input:[];
  const found=[];
  for(const m of list) if(m.role==='user') {
    if(typeof m.content==='string') found.push(...tokens(m.content));
    else if(Array.isArray(m.content)) for(const b of m.content) if(['text','input_text'].includes(b.type)) found.push(...tokens(b.text));
  }
  return found;
}
function beginRequest(id,body) {
  if(!id)return[];
  const found=requestTokens(body);if(!found.length)return[];
  const state=read(id),attempt=[];
  for(const token of found){
    const item=state.inputs.find(i=>i.id===token.id&&i.revision===token.revision);
    if(!item)continue;
    state.requestRevision=Math.max(state.requestRevision,item.revision);
    if(['dispatching','queued','submitted','failed','interrupted'].includes(item.state)) {
      item.state='sent';item.transport='native-api';item.sentAt=new Date().toISOString();delete item.error;attempt.push(item.id);
    }
  }
  if(found.length)save(state);
  return attempt;
}
function requestFailed(id,attempt) { for(const inputId of attempt) change(id,inputId,{state:'failed',error:'请求发送失败；可在确认当前会话状态后重试'}); }
function installAdapter(adapter) {
  if(!adapter||adapter.__shineInputAdapter)return;
  adapter.__shineInputAdapter=true;
  const send=adapter.sendMessage;
  if(typeof send!=='function')return;
  const native=typeof adapter.takeRoundInput==='function';
  adapter.sendMessage=async function(id,text,options){
    const items=tracked(id,text);
    for(const item of items)if(item.state!=='sent')change(id,item.id,{state:'submitted',transport:native?'native-api':'sdk'});
    try{return await send.call(this,id,text,options);}
    catch(error){for(const item of items)if(item.state!=='sent')change(id,item.id,{state:'failed',error:'适配器投递失败，可重试'});throw error;}
  };
}
function installManager(manager) {
  if(manager[installed])return;
  manager[installed]=true;
  managerSet.add(manager);
  const conversation=manager.getConversation;
  if(conversation)manager.getConversation=function(id,...args){return withoutCancelled(id,conversation.call(this,id,...args));};
  const database=manager.database;
  if(database&&!database[historyInstalled]&&typeof database.getConversationMessages==='function'){
    database[historyInstalled]=true;
    const get=database.getConversationMessages;
    database.getConversationMessages=function(id,...args){return withoutCancelled(id,get.call(this,id,...args));};
  }
  const resolve=manager.resolveAdapter,send=manager.sendMessage,queued=manager.getScheduledMessages;
  manager.resolveAdapter=function(...args){const adapter=resolve.apply(this,args);installAdapter(adapter);return adapter;};
  manager.getScheduledMessages=function(...args){return queued.apply(this,args).map(m=>({...m,text:strip(m.text),displayText:strip(m.displayText)}));};
  manager.sendMessage=async function(id,text,options){
    managers.set(id,this);
    if(tokens(text).length)return send.call(this,id,text,options);
    const session=this.sessions.get(id),source=options?.source||'user';
    const hasPlan=session?.latestTodos?.items?.some(i=>!['completed','cancelled'].includes(i.status));
    if(source!=='user'||!session||text.startsWith('/')||(!hasPlan&&!['running','starting'].includes(session.status)))return send.call(this,id,text,options);
    const state=read(id),duplicate=state.inputs.find(i=>waiting.has(i.state)&&i.text===text&&(dispatchingInputs.has(i.id)||withdrawalStatus(id,i).canCancel));
    if(duplicate)return {dispatched:false,scheduled:true,strategy:'enqueue_while_running',reason:'session_running_input_queue',inputId:duplicate.id};
    // An unfinished plan requires review, but does not make an idle turn busy.
    // Preparing hooks/snapshots is a direct send until the scheduler says otherwise.
    const item=create(id,text,['running','starting'].includes(session.status)?'queued':'dispatching');
    dispatchingInputs.add(item.id);
    try {
      const result=await send.call(this,id,envelope(item),options);
      if(result&&!result.dispatched&&!result.scheduled)change(id,item.id,{state:'failed',error:'消息未进入执行队列'});
      else if(result?.scheduled&&item.state==='dispatching')change(id,item.id,{state:'queued'});
      return {...result,inputId:item.id};
    } catch(error){change(id,item.id,{state:'failed',error:'消息投递失败，可重试'});throw error;}
    finally{dispatchingInputs.delete(item.id);}
  };
  const complete=manager.maybeCompleteSessionTodosOnAgentCompletion;
  manager.maybeCompleteSessionTodosOnAgentCompletion=function(id){
    // A child-agent completion is not evidence that this revised plan is done.
    if(!read(id).inputs.length&&!this.sessions.get(id)?.latestTodos?.items?.some(i=>i.status==='cancelled'))return complete.call(this,id);
  };
  const sanitizeResult=result=>result&&typeof result==='object'?{...result,...result.message?{message:{...result.message,text:strip(result.message.text)}}:{}}:result;
  const remove=manager.removeScheduledMessage;
  if(remove)manager.removeScheduledMessage=function(id,queuedId){
    const session=this.sessions.get(id),text=this.findRealQueuedMessage(session,queuedId)?.message?.text;
    const items=tracked(id,text);
    if(items.length===1){const result=cancelInput(id,items[0].id);return {...result,messages:this.getScheduledMessages(id)};}
    const result=remove.call(this,id,queuedId);
    if(result.removed)for(const item of tracked(id,text))change(id,item.id,{state:'cancelled'});
    return sanitizeResult(result);
  };
  const edit=manager.updateScheduledMessage;
  if(edit)manager.updateScheduledMessage=function(id,queuedId,text){
    const old=this.findRealQueuedMessage(this.sessions.get(id),queuedId)?.message;
    if(!old||!tokens(old.text).length||!text?.trim())return edit.call(this,id,queuedId,text);
    const oldItems=tracked(id,old.text),item=create(id,text),result=edit.call(this,id,queuedId,envelope(item));
    if(result.updated)for(const previous of oldItems)change(id,previous.id,{state:'cancelled'});
    else change(id,item.id,{state:'cancelled'});
    return sanitizeResult(result);
  };
  // Cancellation retains the local input instead of silently replaying it later.
  function removePending(id,state){
    const ids=new Set(state.inputs.filter(i=>waiting.has(i.state)).map(i=>i.id));
    const keep=value=>!tokens(typeof value==='string'?value:value?.text).some(t=>ids.has(t.id));
    const session=manager.sessions.get(id);
    for(const key of ['pendingMessages','scheduledMessages','runningInputQueue'])if(Array.isArray(session?.[key]))session[key]=session[key].filter(keep);
    if(session){const a=manager.resolveAdapter(session.provider).sessions?.get(id);for(const key of ['pendingMessages','delayedInputQueue'])if(Array.isArray(a?.[key]))a[key]=a[key].filter(keep);}
  }
  const clear=manager.clearScheduledMessages;
  if(clear)manager.clearScheduledMessages=function(id){
    const state=read(id);
    for(const item of state.inputs)if(withdrawalStatus(id,item).canCancel)cancelInput(id,item.id);
    // Handed-off SDK input is not withdrawn by clearing the manager queue.
    return clear.call(this,id);
  };
  const abort=manager.abortSession;
  manager.abortSession=async function(id){
    const state=read(id);removePending(id,state);
    for(const item of state.inputs)if(waiting.has(item.state))item.state='interrupted';
    save(state);
    this.emit('queue-update',id,this.getScheduledMessages(id));
    return abort.call(this,id);
  };
}
function register(ipcMain) {
  ipcMain.handle('dev:input-flow:cancel',(_event,id,inputId)=>cancelInput(id,inputId));
  ipcMain.handle('dev:input-flow:resolve',(_event,id,inputId,action)=>{
    validId(id);
    if(!['restore','dismiss'].includes(action))return {success:false,error:'无效的处理方式'};
    const state=read(id),item=state.inputs.find(i=>i.id===inputId);
    if(!item||!['submitted','interrupted'].includes(item.state))return {success:false,error:'这条消息已处理或不需要恢复'};
    if(withdrawalStatus(id,item).canCancel)return {success:false,error:'这条消息仍在本地队列，请使用撤回，避免重复发送'};
    const text=action==='restore'?item.text:undefined;
    item.state=action==='restore'?'restored':'dismissed';item.resolvedAt=new Date().toISOString();
    save(state);
    return {success:true,...text!==undefined?{text,inputId:item.id}:{}};
  });
  ipcMain.handle('dev:input-flow:get',(event,id)=>{
    validId(id);
    if(!subscribers.has(event.sender)){subscribers.set(event.sender,new Set());event.sender.once('destroyed',()=>subscribers.delete(event.sender));}
    const ids=subscribers.get(event.sender);if(ids.size>=128)ids.clear();ids.add(id);
    return snapshot(id);
  });
  ipcMain.handle('dev:input-flow:retry',async(_event,id,inputId)=>{
    validId(id);
    const state=read(id),item=state.inputs.find(i=>i.id===inputId);
    if(!item||!['failed','interrupted'].includes(item.state))return {success:false,error:'这条消息当前不需要重试'};
    const manager=managers.get(id)||[...managerSet].find(m=>m.sessions.has(id));
    if(!manager)return {success:false,error:'请先恢复此会话再重试'};
    const adapter=manager.resolveAdapter(manager.sessions.get(id).provider),session=adapter.sessions?.get(id);
    const loopState=session?.agentLoop?.getState();
    if(loopState&&!['idle','turn_complete','error','aborted'].includes(loopState))return {success:false,error:'模型仍在处理或自动重试，请稍后再试'};
    if(session?.agentLoop&&session.contextManager){
      const messages=session.contextManager.getMessages(),users=messages.filter(m=>m.role==='user');
      const alreadyInContext=users.some(m=>tokens(m.content).some(t=>t.id===inputId));
      if(alreadyInContext){
        if(!tokens(users.at(-1)?.content).some(t=>t.id===inputId))return {success:false,error:'此后已有新的对话，请直接说明最新要求，避免重复执行旧消息'};
        item.state='submitted';delete item.error;save(state);
        session.status='running';adapter.emit('status-change',id,'running');
        session.agentLoop.retryLastTurn().catch(()=>change(id,item.id,{state:'failed',error:'重试失败，请检查网络状态'}));
        return {success:true};
      }
    }
    // A failure may leave an envelope in a native queue. Remove that exact
    // envelope before explicit retry; never remove another user's message.
    if(Array.isArray(session?.pendingMessages))session.pendingMessages=session.pendingMessages.filter(t=>!tokens(t).some(t=>t.id===inputId));
    item.state='queued';delete item.error;save(state);
    try {await manager.sendMessage(id,envelope(item),{source:'user'});return {success:true};}
    catch {change(id,item.id,{state:'failed',error:'重试失败，请检查会话或网络状态'});return {success:false,error:'重试失败，请检查会话或网络状态'};}
  });
}
module.exports={installManager,register,strip,tokens,needsReview,review,beginRequest,requestFailed,snapshot,cancelInput,
  // Isolated state tests use a temporary profile, never the live profile.
  configureForTest(root){storageRoot=root;ledgers.clear();managers.clear();managerSet.clear();subscribers.clear();dispatchingInputs.clear();}};
