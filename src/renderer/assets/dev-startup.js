import {mountCinematic} from './vendor/startup-cinematic.mjs';
const bridge=window.development?.startup;
let running=null;
const day=()=>{const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
function theme(config){return config.theme==='system'?(document.documentElement.style.colorScheme|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')):config.theme;}
export function showStartup(snapshot,{preview=false,onClose}={}){
 running?.finish(true);
 const config=snapshot.config,previousFocus=document.activeElement,host=document.createElement('div');
 host.id='shine-startup';host.dataset.theme=theme(config);host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label',preview?'ShineAI 启动动画预览':'ShineAI 正在启动');
 const root=document.querySelector('#root'),wasInert=root?.inert;
 if(root)root.inert=true;
 document.body.append(host);
 let stopScene=()=>{};
 try{stopScene=mountCinematic(host,{theme:host.dataset.theme,speed:config.duration==='short'?1.65:1,facts:{...snapshot.facts,music:config.music==='silent'?'SILENT':config.music==='local'?'LOCAL':'STREAM'}},()=>finish());}catch(error){host.remove();if(root)root.inert=wasInert;console.warn('[ShineAI opening]',error);onClose?.();return()=>{};}
 const controls=document.createElement('div');controls.className='ss-controls';controls.innerHTML='<div class="ss-audio"><button type="button" data-ss="sound" hidden>开启音乐</button><p></p></div><button type="button" data-ss="skip">跳过 · Esc</button>';host.append(controls);
 const skip=host.querySelector('[data-ss=skip]'),sound=host.querySelector('[data-ss=sound]'),musicNote=host.querySelector('.ss-audio p');
 skip.focus({preventScroll:true});
 let stopped=false,finished=false,watchdog,removeTimer,audio=null,audioGeneration=0,audioAttempted=false;

 const cleanup=()=>{
  if(stopped)return;stopped=true;clearTimeout(watchdog);clearTimeout(removeTimer);stopScene();
  document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);
  if(audio){audioGeneration++;audio.pause();audio.removeAttribute('src');audio.load();audio=null;}
  if(root)root.inert=wasInert;
  host.remove();if(running?.host===host)running=null;
  if(previousFocus?.isConnected)previousFocus.focus?.({preventScroll:true});onClose?.();
 };
 const finish=(immediate=false)=>{if(finished){if(immediate)cleanup();return;}finished=true;if(!preview)try{localStorage.setItem('shineai-startup:day',day());}catch{}
  if(audio){audioGeneration++;audio.pause();}stopScene();host.classList.add('ss-leaving');if(immediate)cleanup();else removeTimer=setTimeout(cleanup,matchMedia('(prefers-reduced-motion: reduce)').matches?0:280);
 };
 function key(event){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish();}else if(event.key==='Tab'){event.preventDefault();const items=[skip,...(!sound.hidden?[sound]:[])];items[(items.indexOf(document.activeElement)+(event.shiftKey?-1:1)+items.length)%items.length].focus();}}
 function visibility(){if(document.hidden&&audio){audioGeneration++;audio.pause();sound.hidden=false;sound.textContent='继续音乐';}else if(!document.hidden&&audio&&!audioAttempted)void play();}
 document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);
 skip.addEventListener('click',()=>finish());
 const source=config.music==='preview'?snapshot.previewUrl:config.music==='local'?snapshot.audio?.url:null;
 async function play(){
  if(!audio||finished||document.hidden)return;
  audioAttempted=true;
  if(!audio.paused){audioGeneration++;audio.pause();sound.textContent='开启音乐';return;}
  const generation=++audioGeneration;
  try{await audio.play();if(finished||generation!==audioGeneration){audio?.pause();return;}sound.hidden=false;sound.textContent='关闭音乐';musicNote.textContent=config.music==='preview'?'In Cyberpunk · Alex Chernykh（联网试听片段）':snapshot.audio.name;}
  catch(error){if(finished||generation!==audioGeneration)return;sound.hidden=false;sound.textContent='开启音乐';musicNote.textContent=error.name==='NotAllowedError'?'点击开启音乐，或直接跳过':'音乐暂时无法播放，动画会继续';}
 }
 if(source){audio=new Audio();audio.volume=config.volume/100;audio.preload='none';audio.src=source;sound.hidden=false;sound.textContent='开启音乐';musicNote.textContent=config.music==='preview'?'In Cyberpunk · 联网试听':snapshot.audio.name;audio.addEventListener('error',()=>{if(!finished)musicNote.textContent='音乐暂时无法播放，动画会继续';});audio.addEventListener('ended',()=>{if(!finished)sound.textContent='重播音乐';});sound.addEventListener('click',play);}
 else musicNote.textContent=config.music==='local'?'本地音乐已丢失，当前静音':'静音';
 // The original full sequence finishes itself. A watchdog also releases the workbench after any unexpected scene failure.
 watchdog=setTimeout(()=>finish(),30000);
 running={host,finish};
 if(source)void play();
 return cleanup;
}
export function mountStartupPanel(host){
 if(!host||!bridge)return()=>{};
 host.className='shine-startup-settings';let snapshot,disposed=false,busy=false,closePreview;
 host.innerHTML=`<div class="ss-settings-head"><div><h3>启动动画</h3><p>完整开场：黑幕标识、扫描解码、环形光场与故障揭幕。</p></div><label class="ss-enable"><input type="checkbox" data-key="enabled">启用</label></div>
 <div class="ss-settings-grid"><label>显示频率<select data-key="frequency"><option value="always">每次启动</option><option value="daily">每天首次启动</option></select></label>
 <label>动画主题<select data-key="theme"><option value="system">跟随主题</option><option value="dark">深色</option><option value="light">浅色</option></select></label>
 <label>动画长度<select data-key="duration"><option value="short">快速 · 完整演出加速</option><option value="cinematic">完整 · 原速演出</option></select></label>
 <label>启动音乐<select data-key="music"><option value="silent">静音</option><option value="preview">In Cyberpunk · 联网试听片段</option><option value="local">本地音乐</option></select></label>
 <label>音乐音量 <output>20%</output><input type="range" min="0" max="100" step="1" data-key="volume" aria-label="启动音乐音量"></label>
 <div><p data-audio-name>未导入本地音乐</p><p>联网试听失败会静音继续；导入本地音乐后可离线播放。</p></div></div>
 <div class="ss-settings-actions"><button type="button" data-action="startup-preview">预览启动动画</button><button type="button" data-action="startup-import">导入本地音乐</button><button type="button" data-action="startup-remove">移除本地音乐</button><span role="status" aria-live="polite">正在读取…</span></div>`;
 const status=host.querySelector('[role=status]');
 function message(text,error=false){if(disposed)return;status.textContent=text;status.dataset.error=String(error);}
 function paint(){if(disposed)return;for(const e of host.querySelectorAll('[data-key]')){const value=snapshot.config[e.dataset.key];if(e.type==='checkbox')e.checked=value;else e.value=String(value);}
  host.querySelector('output').textContent=snapshot.config.volume+'%';host.querySelector('[data-audio-name]').textContent=snapshot.audio?.name||'未导入本地音乐';host.querySelector('option[value=local]').disabled=!snapshot.audio;
  for(const e of host.querySelectorAll('input,select,button'))e.disabled=busy;
  host.querySelector('[data-action=startup-remove]').disabled=busy||!snapshot.audio;
 }
 async function operation(fn){if(busy||!snapshot)return;busy=true;paint();try{const result=await fn();if(disposed)return;if(!result.success)throw Error(result.error||'保存失败');if(!result.canceled){snapshot=result;message('已保存到本机');}}catch(e){message(e.message,true);}finally{busy=false;if(snapshot)paint();}}
 const change=event=>{const key=event.target.dataset.key;if(!key||!snapshot)return;const value=event.target.type==='checkbox'?event.target.checked:key==='volume'?Number(event.target.value):event.target.value;operation(()=>bridge.save({...snapshot.config,[key]:value}));};
 const input=event=>{if(event.target.dataset.key==='volume')host.querySelector('output').textContent=event.target.value+'%';};
 const click=event=>{const action=event.target.closest('[data-action]')?.dataset.action;if(!snapshot||busy)return;
  if(action==='startup-preview')closePreview=showStartup(snapshot,{preview:true});
  if(action==='startup-import')operation(()=>bridge.importAudio());
  if(action==='startup-remove')operation(()=>bridge.removeAudio());
 };
 host.addEventListener('change',change);host.addEventListener('input',input);host.addEventListener('click',click);
 bridge.get().then(result=>{if(disposed)return;if(!result.success)throw Error(result.error);snapshot=result;paint();message('已保存到本机');}).catch(e=>message(e.message,true));
 return()=>{disposed=true;host.removeEventListener('change',change);host.removeEventListener('input',input);host.removeEventListener('click',click);closePreview?.();};
}
async function boot(){
 if(!bridge||/^#\/(session-chat-window|butler-float)/.test(location.hash))return;
 let launch;
 const complete=()=>bridge.completeLaunch?.().catch(()=>{});
 try{
  launch=await bridge.launchContext?.();
  // The early native window owns automatic playback. Workbench reloads and
  // settings previews must not run a second opening.
  if(!launch?.openingWindow)return;
  const snapshot=await bridge.get();
  if(!snapshot.success||!snapshot.config.enabled){await complete();return;}
  if(snapshot.config.frequency==='daily')try{if(localStorage.getItem('shineai-startup:day')===day()){await complete();return;}}catch{}
  showStartup(snapshot,{onClose:complete});
  await bridge.beginLaunch();
 }catch{if(launch?.openingWindow)await complete(); /* Native watchdog also releases the workbench. */ }
}
void boot();
