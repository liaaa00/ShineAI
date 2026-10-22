import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {patchStartupPreload,patchStartupRenderer,patchStartupMain} from '../scripts/patch-startup-screen.mjs';
const {defaults,normalize,sniff,validId,registerStartupScreen}=createRequire(import.meta.url)('../src/main/extensions/startup-screen.cjs');
test('startup defaults are silent; config rejects arbitrary music URLs and paths',()=>{
 assert.equal(defaults().music,'silent');assert.equal(defaults().enabled,true);
 assert.deepEqual(normalize(defaults()),defaults());
 for(const value of [{music:'https://attacker.invalid/x.mp3'},{volume:NaN},{volume:101},{audioId:'../x.mp3'},{music:'local'},{enabled:'true'},{theme:'automatic'}])assert.throws(()=>normalize({...defaults(),...value}));
 assert.equal(validId('a'.repeat(32)+'.mp3'),true);assert.equal(validId('a'.repeat(32)+'.mp3/../settings.json'),false);
});
test('audio content validation requires matching signatures',()=>{
 sniff(Buffer.from('ID3'+' '.repeat(29)),'.mp3');sniff(Buffer.from('0000ftypM4A '+' '.repeat(20)),'.m4a');sniff(Buffer.from('RIFF0000WAVE'+' '.repeat(20)),'.wav');sniff(Buffer.from('OggS'+' '.repeat(28)),'.ogg');
 assert.throws(()=>sniff(Buffer.from('<html>not audio</html>'),'.mp3'));
 assert.throws(()=>sniff(Buffer.from('RIFF0000AVI '+' '.repeat(20)),'.wav'));
});
test('local audio copies into profile, serves ranges, persists, and failed import preserves state',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'shine-startup-'));
 try{
  const source=path.join(directory,'sample.wav'),bytes=Buffer.concat([Buffer.from('RIFF0000WAVE'),Buffer.alloc(60,2)]);await fs.writeFile(source,bytes);
  let chosen=source;
  function register(){const handlers=new Map(),routes=new Map();registerStartupScreen({app:{whenReady:()=>Promise.resolve()},config:{userData:path.join(directory,'profile')},ipcMain:{handle:(k,v)=>handlers.set(k,v)},protocol:{registerSchemesAsPrivileged(){},handle:(k,v)=>routes.set(k,v)},dialog:{showOpenDialog:async()=>({canceled:!chosen,filePaths:chosen?[chosen]:[]})},BrowserWindow:{fromWebContents:()=>null}});return {call:(name,...args)=>handlers.get('dev:startup:'+name)({sender:{}},...args),routes};}
  const runtime=register();assert.equal((await runtime.call('get')).config.music,'silent');
  const imported=await runtime.call('import-audio');assert.equal(imported.success,true);assert.equal(imported.config.music,'local');assert.equal(imported.audio.name,'sample.wav');
  await fs.rename(source,source+'.moved');const route=runtime.routes.get('shineai-startup');
  const response=await route(new Request(imported.audio.url,{headers:{Range:'bytes=0-11'}}));assert.equal(response.status,206);assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes.subarray(0,12));
  assert.equal((await route(new Request('shineai-startup://audio/../../settings.json'))).status,404);
  assert.equal((await route(new Request(imported.audio.url,{headers:{Range:'bytes=9999-'}}))).status,416);
  chosen=path.join(directory,'bad.mp3');await fs.writeFile(chosen,'This is not an audio file');assert.equal((await runtime.call('import-audio')).success,false);assert.equal((await runtime.call('get')).config.audioId,imported.config.audioId);
  chosen=null;assert.equal((await runtime.call('import-audio')).canceled,true);
  const restarted=register();assert.equal((await restarted.call('get')).config.audioId,imported.config.audioId);
  assert.equal((await runtime.call('save',{...imported.config,music:'silent'})).success,true);
  assert.equal((await runtime.call('remove-audio')).config.audioId,null);assert.equal((await route(new Request(imported.audio.url))).status,404);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
test('startup reconstruction patches are idempotent',async()=>{
 for(const [file,patch]of [['../src/main/index.js',patchStartupMain],['../src/preload/index.js',patchStartupPreload],['../src/renderer/assets/index-0LVJEr5c.js',patchStartupRenderer]]){const source=await fs.readFile(new URL(file,import.meta.url),'utf8');assert.equal(patch(patch(source)),source);}
 const fixture='prefix (function(){const hM4=hM3;if(JVt&&!JVt["isDestroyed"]())return; OLD_SPLASH }()),function(){const hM7=hM3,tail; sYt(),JVt&&!JVt["isDestroyed"]()&&(JVt["close"](),JVt=null)';
 const patched=patchStartupMain(fixture);assert.ok(patched.includes('createStartupWindow();}()),function(){'));assert.ok(!patched.includes('OLD_SPLASH'));assert.equal(patchStartupMain(patched),patched);
});
