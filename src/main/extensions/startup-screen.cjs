'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {Readable}=require('node:stream');
const {rangeFor}=require('./appearance.cjs');
const SCHEME='shineai-startup';
const PREVIEW='https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f1/46/4b/f1464b16-811a-06a2-ea7e-3e4d323a39f0/mzaf_7567213402739821401.plus.aac.p.m4a';
const TYPES={'.mp3':'audio/mpeg','.m4a':'audio/mp4','.wav':'audio/wav','.ogg':'audio/ogg'};
const validId=id=>typeof id==='string'&&/^[a-f0-9]{32}\.(mp3|m4a|wav|ogg)$/.test(id);
const defaults=()=>({version:1,enabled:true,frequency:'always',theme:'system',duration:'cinematic',music:'silent',volume:20,audioId:null});
function normalize(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||typeof input.enabled!=='boolean')throw Error('启动动画设置无效');
 const out=defaults();out.enabled=input.enabled;
 for(const [key,values] of Object.entries({frequency:['always','daily'],theme:['system','dark','light'],duration:['short','cinematic'],music:['silent','preview','local']})){
  if(!values.includes(input[key]))throw Error('启动动画选项无效');out[key]=input[key];
 }
 if(!Number.isFinite(input.volume)||input.volume<0||input.volume>100)throw Error('音乐音量无效');out.volume=Math.round(input.volume);
 if(input.audioId!==null&&!validId(input.audioId))throw Error('音乐文件标识无效');out.audioId=input.audioId;
 if(out.music==='local'&&!out.audioId)throw Error('请先导入本地音乐');return out;
}
function sniff(header,extension){
 const okay=extension==='.mp3'?(header.subarray(0,3).toString()==='ID3'||(header[0]===255&&(header[1]&224)===224)):
 extension==='.m4a'?header.subarray(4,8).toString()==='ftyp':
 extension==='.wav'?header.subarray(0,4).toString()==='RIFF'&&header.subarray(8,12).toString()==='WAVE':
 extension==='.ogg'?header.subarray(0,4).toString()==='OggS':false;
 if(!okay)throw Error('请选择有效的 MP3、M4A、WAV 或 OGG 音乐文件');
}
function registerStartupScreen({app,ipcMain,protocol,dialog,BrowserWindow,config}){
 protocol.registerSchemesAsPrivileged([{scheme:SCHEME,privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);
 const directory=path.join(config.userData,'startup-screen'),mediaRoot=path.join(directory,'media'),settings=path.join(directory,'settings.json');
 let state=defaults(),queue=Promise.resolve();
 const ready=(async()=>{await fs.mkdir(mediaRoot,{recursive:true});try{state=normalize(JSON.parse(await fs.readFile(settings,'utf8')));}catch(error){if(error.code!=='ENOENT')console.warn('[Startup] Invalid settings; using defaults');}})();
 const metadata=async id=>{
  if(!validId(id))throw Error('音乐文件标识无效');
  const file=path.join(mediaRoot,id),stat=await fs.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('音乐文件不可用');
  const record=JSON.parse(await fs.readFile(file+'.json','utf8'));
  return {id,name:String(record.name).slice(0,255),size:stat.size,type:TYPES[path.extname(id)],url:SCHEME+'://audio/'+id};
 };
 const snapshot=async()=>({config:{...state},audio:state.audioId?await metadata(state.audioId).catch(()=>null):null,previewUrl:PREVIEW,facts:{version:typeof app.getVersion==='function'?app.getVersion():'—',profile:'DESKTOP',sandbox:'ENABLED',platform:process.platform.toUpperCase()}});
 const write=async next=>{
  const temporary=settings+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
  try{await fs.writeFile(temporary,JSON.stringify(next,null,2)+'\n');await fs.rename(temporary,settings);}finally{await fs.rm(temporary,{force:true});}
  state=next;return snapshot();
 };
 const enqueue=fn=>{const current=queue.then(fn);queue=current.catch(()=>{});return current;};
 const handle=fn=>async(...args)=>{try{await ready;return {success:true,...await fn(...args)};}catch(e){return {success:false,error:e.code==='ENOENT'?'音乐文件已丢失，请重新导入':e.message};}};
 ipcMain.handle('dev:startup:get',handle(snapshot));
 ipcMain.handle('dev:startup:save',handle(async(_event,value)=>{const next=normalize(value);return enqueue(async()=>{if(next.audioId)await metadata(next.audioId);return write(next);});}));
 ipcMain.handle('dev:startup:import-audio',handle(async event=>{
  const chosen=await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender),{title:'选择启动音乐',properties:['openFile'],filters:[{name:'音频',extensions:['mp3','m4a','wav','ogg']}]});
  if(chosen.canceled||!chosen.filePaths.length)return {canceled:true};
  const source=chosen.filePaths[0],extension=path.extname(source).toLowerCase();if(!TYPES[extension])throw Error('音乐格式不支持');
  const file=await fs.open(source,'r');let destination;
  try{
   const stat=await file.stat();if(!stat.isFile()||stat.size<12||stat.size>30*1024*1024)throw Error('音乐文件需要在 30 MB 以内');
   const header=Buffer.alloc(32);await file.read(header,0,32,0);sniff(header,extension);
   const id=crypto.randomBytes(16).toString('hex')+extension;destination=path.join(mediaRoot,id);
   await fs.copyFile(source,destination);const copied=await fs.stat(destination);if(copied.size!==stat.size||copied.size>30*1024*1024)throw Error('音乐文件在导入时发生变化，请重试');
   await fs.writeFile(destination+'.json',JSON.stringify({name:path.basename(source)}));
   return await enqueue(async()=>{const previous=state.audioId;const saved=await write({...state,audioId:id,music:'local'});if(previous&&previous!==id)for(const suffix of ['', '.json'])await fs.rm(path.join(mediaRoot,previous+suffix),{force:true}).catch(()=>{});return saved;});
  }catch(e){if(destination)for(const suffix of ['', '.json'])await fs.rm(destination+suffix,{force:true}).catch(()=>{});throw e;}finally{await file.close();}
 }));
 ipcMain.handle('dev:startup:remove-audio',handle(()=>enqueue(async()=>{
  const previous=state.audioId;const saved=await write({...state,audioId:null,music:state.music==='local'?'silent':state.music});
  if(previous)for(const suffix of ['', '.json'])await fs.rm(path.join(mediaRoot,previous+suffix),{force:true}).catch(()=>{});return saved;
 })));
 app.whenReady().then(()=>protocol.handle(SCHEME,async request=>{
  await ready;try{
   const url=new URL(request.url);if(url.hostname!=='audio'||url.search||url.hash||!['GET','HEAD'].includes(request.method))return new Response(null,{status:404});
   const meta=await metadata(url.pathname.slice(1)),range=rangeFor(request.headers.get('range'),meta.size);
   if(!range)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+meta.size}});
   const headers={'Content-Type':meta.type,'Content-Length':String(range.end-range.start+1),'Accept-Ranges':'bytes','Cache-Control':'private, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'};
   if(range.status===206)headers['Content-Range']=`bytes ${range.start}-${range.end}/${meta.size}`;
   const body=request.method==='HEAD'?null:Readable.toWeb(require('node:fs').createReadStream(path.join(mediaRoot,meta.id),{start:range.start,end:range.end}));
   return new Response(body,{status:range.status,headers});
  }catch{return new Response(null,{status:404});}
 })).catch(e=>console.error('[Startup] Audio protocol failed',e.message));
}
module.exports={registerStartupScreen,defaults,normalize,sniff,validId};
