import test from 'node:test';
import assert from 'node:assert/strict';
import {createSendPreviewStore} from '../src/renderer/assets/dev-send-preview.mjs';
const message=(id,content)=>({id,role:'user',content,timestamp:new Date().toISOString()});
test('preview shows before dispatch, survives a remount, and only a new matching user echo replaces it',()=>{
 const s=createSendPreviewStore(),old=message('old','same'),id=s.begin('a','same',[old]);
 assert.equal(s.visible('a',[old])[0].state,'sending');
 s.settle('a',id,{dispatched:true,scheduled:false});
 assert.equal(s.read('a')[0].state,'confirming');assert.equal(s.visible('b',[]).length,0);
 assert.equal(s.visible('a',[old,{...message('assistant','same'),role:'assistant'}]).length,1);
 assert.equal(s.visible('a',[old,message('new','same')]).length,0);
 s.reconcile('a',[old,message('new','same')]);assert.equal(s.read('a').length,0);
});
test('two identical pending messages require two distinct echoes across reconciliation passes',()=>{
 const s=createSendPreviewStore();s.begin('a','same',[]);s.begin('a','same',[]);
 const one=message('one','same');s.reconcile('a',[one]);assert.equal(s.read('a').length,1);
 s.reconcile('a',[one]);assert.equal(s.visible('a',[one]).length,1);
 s.reconcile('a',[one,message('two','same')]);assert.equal(s.read('a').length,0);
});
test('queueing, failure and late acceptance retain content without inventing delivery',()=>{
 const s=createSendPreviewStore(),id=s.begin('a','keep file [文件: D:/test.md]',[]);
 s.settle('a',id,{scheduled:true});assert.equal(s.read('a')[0].state,'queued');
 s.fail('a',id);assert.equal(s.read('a')[0].state,'failed');assert.match(s.read('a')[0].text,/test.md/);
 s.reconcile('a',[message('actual','keep file [文件: D:/test.md]')]);assert.equal(s.read('a').length,0);
});
test('a delayed history reload cannot acknowledge the current message with an old identical message',()=>{
 const s=createSendPreviewStore();s.begin('a','again',[]);
 const old={...message('history','again'),timestamp:new Date(Date.now()-60000).toISOString()};
 assert.equal(s.visible('a',[old]).length,1);
});
