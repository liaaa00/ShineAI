import test from 'node:test';
import assert from 'node:assert/strict';
import {createSendPreviewStore} from '../src/renderer/assets/dev-send-preview.mjs';
const message=(id,content)=>({id,role:'user',content,timestamp:new Date().toISOString()});

test('withdrawn inputs remove only their own preview, including cancellation before send acknowledgement',()=>{
 const s=createSendPreviewStore(),a=s.begin('s','same',[]),b=s.begin('s','same',[]);
 s.settle('s',a,{inputId:'one',scheduled:true});s.settle('s',b,{inputId:'two',scheduled:true});
 s.withdraw('s',[{id:'one',state:'cancelled'},{id:'two',state:'submitted'}]);
 assert.deepEqual(s.read('s').map(i=>i.inputId),['two']);
 const c=s.begin('s','cancel during send',[]);s.withdraw('s',[{id:'three',state:'cancelled'}]);
 s.settle('s',c,{inputId:'three',scheduled:true});assert.deepEqual(s.read('s').map(i=>i.inputId),['two']);
});
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
test('a numeric timestamp echo settles the preview just like an ISO timestamp',()=>{
 const s=createSendPreviewStore();s.begin('a','继续',[]);
 assert.equal(s.visible('a',[{...message('echo','继续'),timestamp:Date.now()}]).length,0);
});
test('a duplicate acknowledgement for the same local input has one preview',()=>{
 const s=createSendPreviewStore(),a=s.begin('s','继续',[]),b=s.begin('s','继续',[]);
 s.settle('s',a,{scheduled:true,inputId:'same'});s.settle('s',b,{scheduled:true,inputId:'same'});
 assert.equal(s.read('s').length,1);
});
test('input ID evidence settles its own preview independently of display timestamp or text wrappers',()=>{
 const s=createSendPreviewStore(),id=s.begin('s','继续',[]);
 s.settle('s',id,{scheduled:true,inputId:'target'});
 const marker=value=>`<context-reminder data-shine-input="${value}" revision="1">policy</context-reminder>\n继续`;
 assert.equal(s.visible('s',[message('other',marker('other'))]).length,1);
 assert.equal(s.visible('s',[{...message('target',marker('target')),timestamp:1}]).length,0);
});
test('SDK handoff stops claiming queued; real transport receipt removes preview',()=>{
 const s=createSendPreviewStore(),id=s.begin('s','继续',[]);
 s.settle('s',id,{scheduled:true,inputId:'target'});
 s.updateInputs('s',[{id:'target',state:'submitted',canCancel:true}]);assert.equal(s.read('s')[0].state,'queued');
 s.updateInputs('s',[{id:'target',state:'submitted',canCancel:false}]);assert.equal(s.read('s')[0].state,'confirming');
 s.updateInputs('s',[{id:'target',state:'sent'}]);assert.equal(s.read('s').length,0);
});
