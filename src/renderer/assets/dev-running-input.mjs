// A transport receipt means inclusion in a request, never model comprehension.
export function pruneWithdrawnNotices(entries,inputs=[]) {
 const ids=new Set(inputs.filter(i=>i.state==='cancelled').map(i=>i.id));
 const next=entries.filter(entry=>!ids.has(entry.inputId));
 return next.length===entries.length?entries:next;
}
export function visibleInputFlowItems(inputs=[]) {
 // SDK submission records remain in the ledger for recovery, but leave the
 // queue UI as soon as they are no longer owned by a cancellable local queue.
 return inputs.filter(i=>['queued','dispatching','failed','interrupted'].includes(i.state)||(i.state==='submitted'&&i.canCancel)).slice(-4);
}
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
 function InputFlowStatus({sessionId,onRestore}){
  const state=useInputFlow(sessionId),[retrying,setRetrying]=React.useState(null),[error,setError]=React.useState(''),[cancelling,setCancelling]=React.useState(null),[notice,setNotice]=React.useState('');
  const current=React.useRef(sessionId);current.current=sessionId;
  React.useEffect(()=>()=>{current.current=null;},[]);
  React.useEffect(()=>{setError('');setRetrying(null);setCancelling(null);setNotice('');},[sessionId]);
  React.useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
  const inputs=state?.inputs||[],rows=visibleInputFlowItems(inputs);
  // Queue ownership changes without a ledger revision when an SDK consumes an
  // iterator, or is briefly unknown before sendMessage enqueues it. Refresh
  // hidden submissions too; UI visibility must not stop queue discovery.
  // The main process still re-checks ownership on click.
  React.useEffect(()=>{
   if(!inputs.some(i=>['queued','submitted','dispatching'].includes(i.state)))return;
   const timer=setInterval(()=>window.development?.inputFlow?.get(sessionId).then(accept).catch(()=>{}),1000);
   return()=>clearInterval(timer);
  },[sessionId,inputs.some(i=>['queued','submitted','dispatching'].includes(i.state))]);
  if(!rows.length&&!error&&!notice)return null;
  const labels=zh()?{dispatching:'正在发送',queued:'排队中',submitted:'本地排队中',failed:'发送失败',interrupted:'上次关闭时未确认送达'}:{dispatching:'Sending',queued:'Queued',submitted:'Queued locally',failed:'Send failed',interrupted:'Delivery unconfirmed when app closed'};
  const retry=async item=>{setRetrying(item.id);setError('');try{const r=await window.development.inputFlow.retry(sessionId,item.id);if(!r.success)setError(r.error);}catch{setError(zh()?'重试失败':'Retry failed');}finally{setRetrying(null);}};
  const cancel=async item=>{
   const target=sessionId;setCancelling(item.id);setError('');setNotice('');
   try{
    const result=await window.development.inputFlow.cancel(target,item.id);
    if(current.current!==target)return;
    if(result.success&&result.removed){onRestore?.(result.text,item.id);setNotice(zh()?'已撤回，内容已恢复到输入框':'Withdrawn; text restored to the composer');}
    else setError(result.error||(zh()?'这条消息已撤回':'This message was already withdrawn'));
    accept(await window.development.inputFlow.get(target));
   }catch{if(current.current===target)setError(zh()?'撤回失败，请检查消息状态':'Withdrawal failed; check message status');}
   finally{if(current.current===target)setCancelling(null);}
  };
  const resolve=async(item,action)=>{
   const target=sessionId;setCancelling(item.id);setError('');setNotice('');
   try{
    const result=await window.development.inputFlow.resolve(target,item.id,action);
    if(current.current!==target)return;
    if(!result.success){setError(result.error|| (zh()?'处理失败':'Could not resolve message'));return;}
    if(action==='restore'){onRestore?.(result.text,item.id);setNotice(zh()?'已放回输入框；再次发送可能造成重复':'Restored to composer; sending again may duplicate it');}
    accept(await window.development.inputFlow.get(target));
   }catch{if(current.current===target)setError(zh()?'处理失败，请检查消息状态':'Could not resolve message');}
   finally{if(current.current===target)setCancelling(null);}
  };
  const interruptedRows=rows.filter(item=>item.state==='interrupted');
  const activeRows=rows.filter(item=>item.state!=='interrupted');
  const renderRow=item=>jsx.jsxs('div',{'data-input-id':item.id,'data-input-state':item.state,className:'flex min-w-0 items-center gap-2 py-0.5',children:[
    jsx.jsx('span',{className:'shrink-0',children:labels[item.state]||item.state}),
    jsx.jsx('span',{className:'min-w-0 flex-1 truncate text-text-muted',title:item.text,children:item.text.slice(0,100)}),
    item.canCancel&&jsx.jsx('button',{type:'button',disabled:cancelling!==null,onClick:()=>cancel(item),className:'shrink-0 text-accent-blue disabled:opacity-50',title:zh()?'撤回并将内容恢复到输入框，不影响正在运行的任务':'Withdraw and restore text without stopping the current task',children:zh()?(cancelling===item.id?'撤回中…':'撤回'):'Withdraw'}),
    !item.canCancel&&item.state==='interrupted'&&jsx.jsx('button',{type:'button',disabled:cancelling!==null,onClick:()=>resolve(item,'restore'),className:'shrink-0 text-accent-blue disabled:opacity-50',title:zh()?'只放回输入框，不会重新发送；若原请求已送达，再发可能重复':'Restore to the composer without sending; resending may duplicate a delivered request',children:zh()?(cancelling===item.id?'处理中…':'放回输入框'):'Restore'}),
    !item.canCancel&&item.state==='interrupted'&&jsx.jsx('button',{type:'button',disabled:cancelling!==null,onClick:()=>resolve(item,'dismiss'),className:'shrink-0 text-text-muted disabled:opacity-50',title:zh()?'隐藏这条待确认提醒，不会撤回可能已送达的请求':'Hide this reminder; this cannot withdraw a request that may already have arrived',children:zh()?'忽略':'Dismiss'}),
    ['failed','interrupted'].includes(item.state)&&jsx.jsx('button',{type:'button',disabled:retrying===item.id||cancelling!==null,onClick:()=>retry(item),className:'shrink-0 text-accent-blue disabled:opacity-50',title:item.state==='interrupted'?(zh()?'状态无法确认；重新发送可能造成重复':'Delivery is unknown; retry may duplicate the request'):undefined,children:zh()?(item.state==='interrupted'?'重新发送':'重试'):'Retry'})
   ]},item.id);
  return jsx.jsxs('div',{'data-testid':'input-flow-status',className:'px-4 py-1 text-xs text-text-secondary',role:'status','aria-live':'polite',children:[
   ...activeRows.map(renderRow),
   interruptedRows.length>0&&jsx.jsxs('details',{'data-testid':'input-flow-recovery',className:'py-0.5',children:[
    jsx.jsx('summary',{className:'cursor-pointer select-none text-text-muted',children:zh()?`有 ${interruptedRows.length} 条消息在上次关闭时未确认送达 · 查看`:`${interruptedRows.length} message${interruptedRows.length===1?'':'s'} had unconfirmed delivery when the app closed · View`}),
    jsx.jsxs('div',{className:'pt-1',children:[
     ...interruptedRows.map(renderRow),
     jsx.jsx('div',{className:'text-text-muted',children:zh()?'放回输入框不会发送；重新发送可能造成重复。':'Restoring does not send; retrying may duplicate the request.'})
    ]})
   ]}),
   error&&jsx.jsx('div',{role:'alert',children:error}),
   notice&&jsx.jsxs('div',{children:[notice,jsx.jsx('button',{type:'button',className:'ml-2 text-accent-blue',onClick:()=>setNotice(''),children:zh()?'关闭':'Dismiss'})]})
  ]});
 }
 return {InputFlowStatus,useInputFlow,pruneWithdrawnNotices};
}
