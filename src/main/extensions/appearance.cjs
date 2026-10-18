'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {Readable} = require('node:stream');

const SCHEME='shineai-media';
const TYPES={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm'};
const textDefaults=mode=>({enabled:false,color:null,outlineWidth:0.5,outlineOpacity:60,outlineColor:mode==='dark'?'#000000':'#ffffff'});
const defaults=()=>({version:1,enabled:false,media:null,fit:'cover',positionX:50,positionY:50,motion:true,light:{strength:80,mask:30,transparency:35,blur:0,panelBlur:16,text:textDefaults('light')},dark:{strength:85,mask:30,transparency:45,blur:0,panelBlur:16,text:textDefaults('dark')}});
function normalize(input) {
  if(!input || typeof input!=='object' || Array.isArray(input))throw Error('外观配置无效');
  const out=defaults();
  for(const key of ['enabled','motion']) {if(typeof input[key]!=='boolean')throw Error('外观开关无效');out[key]=input[key];}
  if(input.media!==null && (typeof input.media!=='string' || !/^[a-f0-9]{32}\.(png|jpe?g|webp|gif|mp4|webm)$/.test(input.media)))throw Error('背景标识无效');
  out.media=input.media;
  if(!['cover','contain'].includes(input.fit))throw Error('背景显示方式无效');out.fit=input.fit;
  const number=(value,max)=>{if(!Number.isFinite(value)||value<0||value>max)throw Error('外观参数超出范围');return Math.round(value*10)/10;};
  for(const key of ['positionX','positionY'])out[key]=number(input[key],100);
  for(const mode of ['light','dark'])for(const key of ['strength','mask','transparency','blur'])out[mode][key]=number(input[mode]?.[key],key==='blur'?24:100);
  // Old profiles had a fixed 16 px glass blur. Keep that value until changed.
  for(const mode of ['light','dark'])if(input[mode]?.panelBlur!==undefined)out[mode].panelBlur=number(input[mode].panelBlur,24);
  // Missing fields in existing profiles opt out of every new text effect.
  for(const mode of ['light','dark']) {
    const text=input[mode]?.text;if(text===undefined)continue;
    if(!text||typeof text!=='object'||Array.isArray(text)||typeof text.enabled!=='boolean')throw Error('文字配置无效');
    const color=value=>{if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw Error('文字颜色无效');return value.toLowerCase();};
    out[mode].text={enabled:text.enabled,color:text.color===null?null:color(text.color),outlineWidth:number(text.outlineWidth,1),outlineOpacity:number(text.outlineOpacity,100),outlineColor:color(text.outlineColor)};
  }
  return out;
}
function sniff(header,extension) {
  const valid=extension==='.png'?header.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
    ['.jpg','.jpeg'].includes(extension)?header[0]===255&&header[1]===216&&header[2]===255:
    extension==='.gif'?/^GIF8[79]a/.test(header.subarray(0,6).toString()):
    extension==='.webp'?header.subarray(0,4).toString()==='RIFF'&&header.subarray(8,12).toString()==='WEBP':
    extension==='.mp4'?header.subarray(4,8).toString()==='ftyp':
    extension==='.webm'?header.subarray(0,4).equals(Buffer.from([26,69,223,163])):false;
  if(!valid)throw Error('文件内容与格式不符，请选择有效的图片或视频');
}
function rangeFor(header,size) {
  if(!header)return {start:0,end:size-1,status:200};
  const match=/^bytes=(\d*)-(\d*)$/.exec(header);
  if(!match || (!match[1]&&!match[2]))return null;
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return null;
  return {start,end,status:206};
}
function registerAppearance({app,ipcMain,protocol,dialog,BrowserWindow,config}) {
  protocol.registerSchemesAsPrivileged([{scheme:SCHEME,privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);
  const directory=path.join(config.userData,'appearance'),mediaRoot=path.join(directory,'media'),settingsFile=path.join(directory,'settings.json');
  let queue=Promise.resolve(),state=defaults();
  const ready=(async()=>{
    await fs.mkdir(mediaRoot,{recursive:true});
    try {state=normalize(JSON.parse(await fs.readFile(settingsFile,'utf8')));}catch(error){if(error.code!=='ENOENT')console.warn('[Appearance] Invalid preferences; using defaults');}
  })();
  const refreshWindowMaterial=require('./appearance-window-material.cjs').registerWindowMaterial({app,BrowserWindow,ready,isEnabled:()=>state.enabled&&!!state.media});
  const metadata=async(id)=>{
    if(!/^[a-f0-9]{32}\.(png|jpe?g|webp|gif|mp4|webm)$/.test(id))throw Error('背景标识无效');
    const record=JSON.parse(await fs.readFile(path.join(mediaRoot,id+'.json'),'utf8'));
    const stat=await fs.lstat(path.join(mediaRoot,id));if(!stat.isFile()||stat.isSymbolicLink())throw Error('背景文件不可用');
    return {id,name:String(record.name).slice(0,255),type:TYPES[path.extname(id)],url:SCHEME+'://background/'+id,size:stat.size};
  };
  const snapshot=async()=>({config:state,media:state.media?await metadata(state.media).catch(()=>null):null});
  const respond=handler=>async(...args)=>{try{await ready;return {success:true,...await handler(...args)};}catch(error){return {success:false,error:error.code==='ENOENT'?'背景文件已丢失，请重新导入':error.message};}};
  ipcMain.handle('dev:appearance:get',respond(async()=>snapshot()));
  ipcMain.handle('dev:appearance:discard',respond(async(_event,id)=>{
    if(id===state.media)throw Error('正在使用的背景不能丢弃');
    await metadata(id);
    await fs.rm(path.join(mediaRoot,id),{force:true});
    await fs.rm(path.join(mediaRoot,id+'.json'),{force:true});
    return {};
  }));
  ipcMain.handle('dev:appearance:import',respond(async(event)=>{
    const result=await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender),{title:'选择背景图片或视频',properties:['openFile'],filters:[{name:'图片或视频',extensions:['png','jpg','jpeg','webp','gif','mp4','webm']}]});
    if(result.canceled||!result.filePaths.length)return {canceled:true};
    const source=result.filePaths[0],extension=path.extname(source).toLowerCase(),type=TYPES[extension];
    if(!type)throw Error('请选择 PNG/JPG/WebP/GIF 图片或 MP4/WebM 视频');
    const handle=await fs.open(source,'r');let destination;
    try {
      const stat=await handle.stat(),limit=type.startsWith('video/')?150*1024*1024:20*1024*1024;
      if(!stat.isFile()||stat.size===0||stat.size>limit)throw Error(type.startsWith('video/')?'视频需要在 150 MB 以内':'图片需要在 20 MB 以内');
      const header=Buffer.alloc(32);await handle.read(header,0,32,0);sniff(header,extension);
      const id=crypto.randomBytes(16).toString('hex')+extension;destination=path.join(mediaRoot,id);
      // The file dialog grants access only to this chosen file. Copying it keeps
      // the background independent of later changes to the original path.
      await fs.copyFile(source,destination);
      const copied=await fs.stat(destination);if(copied.size!==stat.size||copied.size>limit)throw Error('文件在导入时发生变化，请重试');
      await fs.writeFile(destination+'.json',JSON.stringify({name:path.basename(source),type}),'utf8');
      return {media:await metadata(id)};
    }catch(error){if(destination){await fs.rm(destination,{force:true});await fs.rm(destination+'.json',{force:true});}throw error;}
    finally {await handle.close();}
  }));
  ipcMain.handle('dev:appearance:save',respond(async(_event,input)=>{
    const next=normalize(input);
    const operation=queue.then(async()=>{
      if(next.media)await metadata(next.media);
      const temp=settingsFile+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
      try {await fs.writeFile(temp,JSON.stringify(next,null,2)+'\n','utf8');await fs.rename(temp,settingsFile);}finally{await fs.rm(temp,{force:true});}
      state=next;const saved=await snapshot();
      for(const window of BrowserWindow.getAllWindows())if(!window.isDestroyed())window.webContents.send('dev:appearance:changed',saved);
      refreshWindowMaterial();return saved;
    });queue=operation.catch(()=>{});return operation;
  }));
  app.whenReady().then(()=>protocol.handle(SCHEME,async request=>{
    await ready;
    try {
      const url=new URL(request.url),id=url.pathname.slice(1);
      if(url.hostname!=='background'||url.search||!['GET','HEAD'].includes(request.method))return new Response(null,{status:404});
      const meta=await metadata(id),range=rangeFor(request.headers.get('range'),meta.size);
      if(!range)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+meta.size}});
      const headers={'Content-Type':meta.type,'Content-Length':String(range.end-range.start+1),'Accept-Ranges':'bytes','Cache-Control':'private, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'};
      if(range.status===206)headers['Content-Range']=`bytes ${range.start}-${range.end}/${meta.size}`;
      const stream=request.method==='HEAD'?null:Readable.toWeb(require('node:fs').createReadStream(path.join(mediaRoot,id),{start:range.start,end:range.end}));
      return new Response(stream,{status:range.status,headers});
    }catch{return new Response(null,{status:404});}
  })).catch(error=>console.error('[Appearance] Media protocol registration failed',error.message));
}
module.exports={registerAppearance,defaults,normalize,sniff,rangeFor,textDefaults};
