// A transport receipt means inclusion in a request, never model comprehension.
export function createInputFlowUI({React,jsx,language}) {
 const cache=new Map(),listeners=new Map();let unsubscribe;
 const zh=()=>language().startsWith('zh');
 function accept(value){if(!value?.sessionId)return;const old=cache.get(value.sessionId);if(old&&old.version>value.version)return;cache.delete(value.sessionId);cache.set(value.sessionId,value);while(cache.size>128)cache.delete(cache.keys().next().value);listeners.get(value.sessionId)?.forEach(fn=>fn(value));}
 function useInputFlow(sessionId){
  const [value,setValue]=React.useState(()=>cache.get(sessionId));
  React.useEffect(()=>{
   let live=true;setValue(cache.get(sessionId));
   if(!unsubscribe)unsubscribe=window.development?.inputFlow?.onChanged(accept);
   if(!listeners.has(sessionId))listeners.set(sessionId,new Set());
   const listener=v=>{if(live)setValue(v);};listeners.get(sessionId).add(listener);
   window.development?.inputFlow?.get(sessionId).then(v=>{if(live)accept(v);}).catch(()=>{});
   return()=>{live=false;listeners.get(sessionId)?.delete(listener);if(!listeners.get(sessionId)?.size)listeners.delete(sessionId);};
  },[sessionId]);return value?.sessionId===sessionId?value:undefined;
 }
 function InputFlowStatus({sessionId}){
  const state=useInputFlow(sessionId),[retrying,setRetrying]=React.useState(null),[error,setError]=React.useState('');
  const [,refresh]=React.useState(0);
  React.useEffect(()=>{setError('');setRetrying(null);},[sessionId]);
  const inputs=state?.inputs||[],active=inputs.filter(i=>!['sent','cancelled'].includes(i.state)),latest=inputs.at(-1);
  // Use the actual send time: routine plan updates, switching chats or reopening
  // the app must not replay an old success notice or extend its lifetime.
  const successUntil=latest?.state==='sent'?Date.parse(latest.sentAt)+3000:0;
  React.useEffect(()=>{
   const remaining=successUntil-Date.now();if(!(remaining>0))return;
   const timer=setTimeout(()=>refresh(n=>n+1),remaining);
   return()=>clearTimeout(timer);
  },[sessionId,latest?.id,successUntil]);
  const successVisible=!active.length&&successUntil>Date.now();
  if(!active.length&&!successVisible&&!error)return null;
  const rows=active.length?active.slice(-4):successVisible?[latest]:[];
  const labels=zh()?{dispatching:'正在发送',queued:'排队中',submitted:'等待投递确认',sent:'消息已送出',failed:'发送失败',interrupted:'投递中断，未自动重发',cancelled:'已撤回'}:{dispatching:'Sending',queued:'Queued',submitted:'Awaiting delivery confirmation',sent:'Message sent',failed:'Send failed',interrupted:'Interrupted; not resent automatically',cancelled:'Withdrawn'};
  const retry=async item=>{setRetrying(item.id);setError('');try{const r=await window.development.inputFlow.retry(sessionId,item.id);if(!r.success)setError(r.error);}catch{setError(zh()?'重试失败':'Retry failed');}finally{setRetrying(null);}};
  return jsx.jsxs('div',{'data-testid':'input-flow-status',className:'px-4 py-1 text-xs text-text-secondary',role:'status','aria-live':'polite',children:[
   ...rows.map(item=>jsx.jsxs('div',{'data-input-id':item.id,'data-input-state':item.state,className:'flex min-w-0 items-center gap-2 py-0.5',children:[
    jsx.jsx('span',{className:'shrink-0',children:labels[item.state]||item.state}),
    item.state!=='sent'&&jsx.jsx('span',{className:'min-w-0 flex-1 truncate text-text-muted',title:item.text,children:item.text.slice(0,100)}),
    ['failed','interrupted'].includes(item.state)&&jsx.jsx('button',{type:'button',disabled:retrying===item.id,onClick:()=>retry(item),className:'shrink-0 text-accent-blue disabled:opacity-50',children:zh()?'重试':'Retry'})
   ]},item.id)),
   rows.some(item=>item.transport==='sdk')&&jsx.jsx('div',{className:'text-text-muted',children:zh()?'此模型入口未提供实际请求确认，接收状态以服务返回为准。':'This adapter does not expose an outbound-request receipt.'}),
   active.some(i=>['queued','submitted'].includes(i.state))&&state.requiredRevision>state.reviewedRevision&&jsx.jsx('div',{'data-testid':'plan-review-hint',className:'text-text-muted',children:zh()?'有新要求，旧计划待核对；已开始的操作可能仍在执行。':'New input requires plan review; an operation already started may still be running.'}),
   error&&jsx.jsx('div',{role:'alert',children:error})
  ]});
 }
 return {InputFlowStatus,useInputFlow};
}
