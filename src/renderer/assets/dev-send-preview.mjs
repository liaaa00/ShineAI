// Local display only. A preview never proves transport delivery or model receipt.
export function createSendPreviewStore() {
 const sessions=new Map(),listeners=new Map(),claimed=new Map(),withdrawn=new Map(),inputSnapshots=new Map();let sequence=0;
 const notify=id=>listeners.get(id)?.forEach(fn=>fn());
 const clean=text=>String(text??'').replace(/<context-reminder data-shine-input="[^"]+" revision="\d+">[\s\S]*?<\/context-reminder>\s*/g,'').trim().replace(/\r\n/g,'\n');
 function read(id){return sessions.get(id)||[];}
 const time=value=>typeof value==='number'?value:typeof value==='string'?Date.parse(value):NaN;
 const inputIds=content=>typeof content==='string'?[...content.matchAll(/<context-reminder data-shine-input="([^"]+)" revision="\d+">/g)].map(m=>m[1]):[];
 function match(id,messages){
  const used=new Set(claimed.get(id));
  const remaining=read(id).filter(item=>{
   const hit=messages.find(m=>{
    if(m.role!=='user'||used.has(m.id)||item.before.has(m.id))return false;
    const ids=inputIds(m.content);
    if(item.inputId&&ids.length)return ids.includes(item.inputId);
    return time(m.timestamp)>=item.createdAt-2000&&clean(m.content)===clean(item.text);
   });
   if(!hit)return true;used.add(hit.id);return false;
  });
  return {remaining,used};
 }
 const visible=(id,messages)=>match(id,messages).remaining;
 return {
  read,visible,
  subscribe(id,fn){if(!listeners.has(id))listeners.set(id,new Set());listeners.get(id).add(fn);return()=>{listeners.get(id)?.delete(fn);if(!listeners.get(id)?.size)listeners.delete(id);};},
  begin(id,text,messages){
   if(read(id).filter(i=>i.state!=='failed').length>=30)throw Error('仍有过多消息等待确认，请先检查会话状态');
   const item={id:'send-preview-'+(++sequence),text,state:'sending',createdAt:Date.now(),before:new Set(messages.map(m=>m.id))};
   sessions.set(id,[...read(id).filter(i=>i.state!=='failed'),item]);notify(id);return item.id;
  },
  settle(id,key,result){const item=read(id).find(i=>i.id===key);if(!item)return;item.inputId=result?.inputId;item.state=result?.scheduled?'queued':'confirming';if(withdrawn.get(id)?.has(item.inputId)||item.inputId&&read(id).some(i=>i!==item&&i.inputId===item.inputId))sessions.set(id,read(id).filter(i=>i!==item));this.updateInputs(id,inputSnapshots.get(id)||[]);notify(id);},
  updateInputs(id,inputs){
   inputSnapshots.set(id,inputs);while(inputSnapshots.size>128)inputSnapshots.delete(inputSnapshots.keys().next().value);
   let changed=false;
   const rows=read(id).filter(item=>{
    const input=item.inputId&&inputs.find(i=>i.id===item.inputId);if(!input)return true;
    if(input.state==='cancelled'||input.state==='sent'||input.sentAt){changed=true;return false;}
    const next=input.state==='failed'?'failed':input.state==='interrupted'?'interrupted':input.state==='submitted'&&!input.canCancel?'confirming':item.state;
    if(next!==item.state){item.state=next;changed=true;}return true;
   });
   if(changed){sessions.set(id,rows);notify(id);}
  },
  withdraw(id,inputs){const ids=new Set(inputs.filter(i=>i.state==='cancelled').map(i=>i.id));withdrawn.set(id,ids);while(withdrawn.size>128)withdrawn.delete(withdrawn.keys().next().value);const remaining=read(id).filter(i=>!ids.has(i.inputId));if(remaining.length!==read(id).length){sessions.set(id,remaining);notify(id);}},
  fail(id,key){const item=read(id).find(i=>i.id===key);if(!item)return;item.state='failed';notify(id);},
  remove(id,key){sessions.set(id,read(id).filter(i=>i.id!==key));notify(id);},
  reconcile(id,messages){const {remaining,used}=match(id,messages);if(remaining.length!==read(id).length){if(remaining.length)claimed.set(id,used);else claimed.delete(id);sessions.set(id,remaining);notify(id);}}
 };
}
export function createSendPreviewUI({React,jsx,language}) {
 const store=createSendPreviewStore();
 function useSendPreview(sessionId,messages){
  const [,refresh]=React.useState(0),latest=React.useRef(messages);latest.current=messages;
  React.useEffect(()=>store.subscribe(sessionId,()=>refresh(n=>n+1)),[sessionId]);
  React.useEffect(()=>{
   const api=window.development?.inputFlow;if(!api)return;let live=true;
   const accept=state=>{if(live&&state?.sessionId===sessionId){store.withdraw(sessionId,state.inputs);store.updateInputs(sessionId,state.inputs);}};
   const off=api.onChanged(accept);
   const refresh=()=>api.get(sessionId).then(accept).catch(()=>{});refresh();
   const timer=setInterval(()=>{if(store.read(sessionId).some(i=>i.inputId))refresh();},1000);
   return()=>{live=false;clearInterval(timer);off?.();};
  },[sessionId]);
  React.useEffect(()=>store.reconcile(sessionId,messages),[sessionId,messages]);
  const run=React.useCallback(async(text,options,send)=>{
   if(text.trimStart().startsWith('/'))return send();
   const key=store.begin(sessionId,text,latest.current);
   try{const result=await send();if(!result||result.dispatched===false&&result.scheduled===false)throw Error('消息未进入发送流程');store.settle(sessionId,key,result);return result;}
   catch(error){store.fail(sessionId,key);throw error;}
  },[sessionId]);
  return {run,items:store.visible(sessionId,messages)};
 }
 function SendPreview({flow,sessionId}){
  const zh=language().startsWith('zh'),labels=zh?{sending:'正在发送',queued:'排队中',confirming:'已提交，等待会话显示',interrupted:'送达未确认，请检查会话',failed:'发送失败，内容已保留'}:{sending:'Sending',queued:'Queued',confirming:'Submitted; awaiting conversation display',interrupted:'Delivery unconfirmed; check conversation',failed:'Send failed; text retained'};
  return flow.items.map(item=>jsx.jsx('div',{'data-testid':'send-preview','data-send-state':item.state,className:'my-3 flex justify-end px-4 text-sm text-text-primary',children:jsx.jsxs('div',{className:'min-w-0 max-w-[85%]',children:[
   jsx.jsx('div',{className:'whitespace-pre-wrap break-words',children:item.text}),
   jsx.jsxs('div',{className:'mt-1 flex items-center gap-2 text-xs text-text-muted',role:'status',children:[labels[item.state],item.state==='failed'&&jsx.jsx('button',{type:'button',onClick:()=>store.remove(sessionId,item.id),children:zh?'关闭提示':'Dismiss'})]})
  ]})},item.id));
 }
 return {useSendPreview,SendPreview};
}
