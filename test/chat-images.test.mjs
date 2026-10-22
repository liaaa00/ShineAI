import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fromMarkdown} from 'mdast-util-from-markdown';
import {extractChatImagePaths,chatImageError} from '../src/renderer/assets/dev-chat-images.mjs';
import {patchChatImagesMain,patchChatImagesPreload,patchChatImagesRenderer} from '../scripts/patch-chat-images.mjs';
import {patchFileLinksMain,patchFileLinksPreload} from '../scripts/patch-file-links.mjs';
const require=createRequire(import.meta.url);
const {wrapReadFile,removeSessionCopies}=require('../src/main/extensions/chat-image-cache.cjs');

test('actual incident extracts the screenshot without project and commit prose',()=>{
  const raw='- 产出：`d:/AI/中转站/_toonflow`（提交 `0375042`，前有 `3d91c16`、`8cede57`）；截图 `d:/AI/中转站/_login_shot.png`';
  assert.deepEqual(extractChatImagePaths(raw,fromMarkdown),['d:/AI/中转站/_login_shot.png']);
  assert.deepEqual(extractChatImagePaths('截图：D:/中文 项目/登录 (1).png',fromMarkdown),['D:/中文 项目/登录 (1).png']);
  assert.deepEqual(extractChatImagePaths('`D:/a.png` 和 `D:/b.png`\n\n`D:/a.png`',fromMarkdown),['D:/a.png','D:/b.png']);
  assert.deepEqual(extractChatImagePaths('```text\nD:/example.png\n```\n\n[下载](D:/file.png)\n\n![截图](D:/inline.png)\n\n普通说明 D:/not-a-picture.png',fromMarkdown),[]);
  assert.deepEqual(extractChatImagePaths('D:/project；截图 D:/shot.png',fromMarkdown),[]);
  assert.deepEqual(extractChatImagePaths('D:/图.png',fromMarkdown,new Set(['D:/图.png'])),[]);
});

test('bundled message parser uses Markdown boundaries and all patches are repeatable',()=>{
  const read=file=>fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  const renderer=read('renderer/assets/index-0LVJEr5c.js');
  for(const [source,patch] of [[renderer,patchChatImagesRenderer],[read('main/index.js'),patchChatImagesMain],[read('preload/index.js'),patchChatImagesPreload]]) assert.equal(patch(source),source);
  assert.equal(patchFileLinksMain(read('main/index.js')),read('main/index.js'));
  assert.equal(patchFileLinksPreload(read('preload/index.js')),read('preload/index.js'));
  const a=renderer.indexOf('const IMAGE_TAG_RE ='),b=renderer.indexOf('const AUTO_COMPACT_NOTIFICATION_TEXT',a);
  const parse=vm.runInNewContext(renderer.slice(a,b)+';parseMessageContentWithImages',{extractChatImagePaths,fromMarkdown});
  const parsed=parse('- 产出：`D:/project`（提交 `abc`）；截图 `D:/shot.png`\n\n[图片:D:/tag.png]');
  assert.equal(JSON.stringify(parsed.imageTags.map(i=>i.path)),JSON.stringify(['D:/tag.png','D:/shot.png']));
  assert.ok(parsed.textContent.includes('（提交 `abc`）'));
  assert.match(chatImageError('ENOENT'),/不存在/);
  assert.equal(chatImageError('outside scope'),'图片加载失败');
});

test('session copy survives missing source, but cannot cross sessions, permissions or replace live files',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'shineai-chat-image-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const file=path.join(root,'登录.png'),data=path.join(root,'profile');fs.mkdirSync(data);
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=','base64');
  fs.writeFileSync(file,image);let allowed=true,blocked=false;
  const guard={readSession:id=>id!=='deleted',validate:()=>({allowed}),checkBlacklist:()=>blocked?'blocked':null};
  const original=async(_event,p)=>{if(!allowed||blocked)return {kind:'error',error:'denied'};try{const bytes=fs.readFileSync(p.path);return {kind:'image',size:bytes.length,dataUrl:'data:image/png;base64,'+bytes.toString('base64')};}catch(e){return {kind:'error',error:e.message};}};
  const make=()=>wrapReadFile(guard,{getPath:()=>data},original);
  const payload={path:file,context:{sessionId:'session-a'},includeImageData:true,cacheChatImage:true};
  assert.equal((await make()({},payload)).kind,'image');fs.unlinkSync(file);
  const cached=await make()({},payload);assert.equal(cached.fromCache,true);assert.equal(cached.dataUrl,'data:image/png;base64,'+image.toString('base64'));
  assert.equal((await make()({}, {...payload,context:{sessionId:'session-b'}})).kind,'error');
  assert.equal((await make()({}, {...payload,context:{sessionId:'deleted'}})).kind,'error');
  assert.equal((await make()({}, {...payload,cacheChatImage:false})).kind,'error');
  allowed=false;assert.equal((await make()({},payload)).error,'denied');allowed=true;blocked=true;assert.equal((await make()({},payload)).error,'denied');blocked=false;
  fs.writeFileSync(file,'changed');assert.notEqual((await make()({},payload)).fromCache,true);
  await make()({}, {...payload,context:{sessionId:'session-b'}});
  await removeSessionCopies(data,'session-a');
  assert.equal(fs.readdirSync(path.join(data,'chat-images')).length,1,'deleting one session keeps the other session copy');
});

test('cached image cannot follow redirected junctions or tampered cache contents',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'shineai-chat-image-links-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const safe=path.join(root,'safe'),other=path.join(root,'other'),link=path.join(root,'link'),data=path.join(root,'profile');
  for(const p of [safe,other,data])fs.mkdirSync(p);fs.symlinkSync(safe,link,'junction');
  const file=path.join(link,'pic.png');fs.writeFileSync(file,'image');
  const guard={readSession:()=>({}),validate:()=>({allowed:true}),checkBlacklist:()=>null};
  const read=wrapReadFile(guard,{getPath:()=>data},async()=>fs.existsSync(file)?{kind:'image',size:5,dataUrl:'data:image/png;base64,aW1hZ2U='}:{kind:'error',error:'ENOENT'});
  const payload={path:file,context:{sessionId:'s'},includeImageData:true,cacheChatImage:true};await read({},payload);
  fs.unlinkSync(path.join(safe,'pic.png'));fs.unlinkSync(link);fs.symlinkSync(other,link,'junction');
  assert.equal((await read({},payload)).kind,'error');
  fs.unlinkSync(link);fs.symlinkSync(safe,link,'junction');assert.equal((await read({},payload)).fromCache,true);
  const folder=path.join(data,'chat-images',fs.readdirSync(path.join(data,'chat-images'))[0]),cache=path.join(folder,fs.readdirSync(folder)[0]);
  const record=JSON.parse(fs.readFileSync(cache));record.image.dataUrl='data:image/png;base64,dGFtcGVyZWQ=';fs.writeFileSync(cache,JSON.stringify(record));
  assert.equal((await read({},payload)).kind,'error');
});
