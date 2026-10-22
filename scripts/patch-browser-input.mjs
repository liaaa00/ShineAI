import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export function patchBrowserInput(source) {
  source=source.replace('createInputFocusBridge({send:', 'createInputFocusBridge({checkWrite:data=>this.blockPageWrite(a07,data),send:');
  if(source.includes('const inputFocusBridge='))return source;
  const start=source.indexOf('async["bridgeSession"]('), end=source.indexOf('["blockPageWrite"](a02,a03)',start);
  if(start<0||end<start)throw Error('Browser facade bridge layout changed');
  let code=source.slice(start,end);
  const once=(from,to)=>{if(code.split(from).length!==2)throw Error('Browser input anchor changed: '+from);code=code.replace(from,to);};
  once("let a07='',a08=!0x1,a09=null,a0a=!0x1;","let a07='',a08=!0x1,a09=null,a0a=!0x1;const inputFocusBridge=a05?require(\"./extensions/browser-input-focus.cjs\").createInputFocusBridge({send:(data,options)=>a09.send(data,options),reply:data=>{if(a02.readyState===h.WebSocket.OPEN)a02.send(data);}}):null;");
  once('try{a09["send"](a0i["data"],', 'if(inputFocusBridge?.forward(a0i.data,a0i.isBinary))continue;try{a09["send"](a0i["data"],');
  once('try{a09["send"](a0i,{', 'if(inputFocusBridge?.forward(a0i,a0j))return;try{a09["send"](a0i,{');
  once('let a0k=a0i;if(!a05&&!a0j)', 'if(inputFocusBridge?.receive(a0i,a0j))return;let a0k=a0i;if(!a05&&!a0j)');
  once('const a0h=()=>{const gFY=gFU;', 'const a0h=()=>{const gFY=gFU;inputFocusBridge?.close();');
  return (source.slice(0,start)+code+source.slice(end)).replace('createInputFocusBridge({send:', 'createInputFocusBridge({checkWrite:data=>this.blockPageWrite(a07,data),send:');
}
export function patchBrowserInputFiles(){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), file=path.join(root,'src/main/index.js');fs.writeFileSync(file,patchBrowserInput(fs.readFileSync(file,'utf8')));}
